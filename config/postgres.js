const { Pool } = require('pg');
require('dotenv').config();

let pgPool = null;

/**
 * Returns or initializes the PostgreSQL (Neon DB) connection pool.
 */
function getPostgresPool() {
  if (pgPool) return pgPool;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_DB_URL;

  if (!connectionString) {
    throw new Error(
      'PostgreSQL connection string is missing. Please set DATABASE_URL or POSTGRES_URL in your .env file.'
    );
  }

  // Sanitize connection string (remove channel_binding and sslmode to avoid warnings and conflicts with explicit SSL object)
  const cleanConnectionString = connectionString
    .replace(/([?&])channel_binding=[^&]+(&|$)/i, (m, p1, p2) => (p2 === '&' ? p1 : ''))
    .replace(/([?&])sslmode=[^&]+(&|$)/i, (m, p1, p2) => (p2 === '&' ? p1 : ''))
    .replace(/\?$/, '');

  // Neon DB and cloud Postgres require SSL
  const isNeonOrCloud =
    cleanConnectionString.includes('neon.tech') ||
    connectionString.includes('sslmode=') ||
    process.env.NODE_ENV === 'production';

  pgPool = new Pool({
    connectionString: cleanConnectionString,
    ssl: isNeonOrCloud ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 45000, // 45s to allow Neon serverless compute cold-starts
    keepAlive: true,
  });

  pgPool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL pool error:', err.message);
  });

  return pgPool;
}

/**
 * Safely acquires a PostgreSQL client from the pool with automatic retries,
 * accommodating Neon serverless cold starts (compute wake-ups).
 */
async function getClientWithRetry(pool, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 [Postgres] Retrying connection to Neon DB (attempt ${attempt}/${maxRetries})...`);
      }
      return await pool.connect();
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [Postgres] Connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        // Wait 3 seconds before next attempt to allow Neon compute instance to wake up
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
  throw lastError;
}

/**
 * Tests direct connection to PostgreSQL (Neon DB)
 */
async function testPostgresConnection() {
  const pool = getPostgresPool();
  const client = await getClientWithRetry(pool);
  try {
    const res = await client.query('SELECT current_database() AS db, version() AS ver');
    return {
      connected: true,
      database: res.rows[0].db,
      version: res.rows[0].ver,
    };
  } finally {
    client.release();
  }
}

/**
 * Safely clears existing records and inserts new rows within a single transaction.
 *
 * Rules strictly followed:
 * - Does NOT drop or recreate table
 * - Uses DELETE FROM <table> (clears records only)
 * - Preserves table structure, constraints, and data types
 * - Transactional (atomic: rollback on any error so data is not lost)
 *
 * @param {string} targetTableName - Name of table to update
 * @param {Array<Object>} rows - Data rows to insert
 * @returns {Promise<{success: boolean, rowCount: number, durationMs: number}>}
 */
async function syncTableData(targetTableName, rows) {
  if (!rows || !Array.isArray(rows)) {
    throw new Error('Rows must be an array of records.');
  }

  const pool = getPostgresPool();
  const client = await getClientWithRetry(pool);
  const startTime = Date.now();

  try {
    // 1. Resolve exact table name in current schema
    const tableLookup = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = current_schema() 
         AND LOWER(table_name) = LOWER($1)
       LIMIT 1`,
      [targetTableName]
    );

    let resolvedTableName = targetTableName;
    if (tableLookup.rows.length > 0) {
      resolvedTableName = tableLookup.rows[0].table_name;
    } else {
      // Check if table exists with common variants (e.g., bom_explosion vs bom_hierarchy_explosion)
      const altLookup = await client.query(
        `SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = current_schema() 
           AND (LOWER(table_name) LIKE '%bom%' OR LOWER(table_name) LIKE LOWER($1))
         ORDER BY LENGTH(table_name) ASC
         LIMIT 1`,
        [`%${targetTableName.replace(/_/g, '%')}%`]
      );
      if (altLookup.rows.length > 0) {
        resolvedTableName = altLookup.rows[0].table_name;
        console.log(`ℹ️  Resolved target table to '${resolvedTableName}' in PostgreSQL.`);
      }
    }

    // 2. Fetch table column definitions
    const colLookup = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema = current_schema() 
         AND table_name = $1`,
      [resolvedTableName]
    );

    if (colLookup.rows.length === 0) {
      throw new Error(
        `Target table '${resolvedTableName}' was not found in PostgreSQL. Please verify the table exists in your Neon database.`
      );
    }

    const pgColumns = colLookup.rows.map((c) => c.column_name);
    const pgColMap = {};
    pgColumns.forEach((col) => {
      pgColMap[col.toLowerCase()] = col;
    });

    // 3. Begin Transaction
    await client.query('BEGIN');
    console.log(`🔄 Transaction started: Updating table "${resolvedTableName}"...`);

    // 4. Clear ONLY existing records (preserve structure, columns, constraints)
    await client.query(`DELETE FROM "${resolvedTableName}"`);
    console.log(`🧹 Cleared existing records from "${resolvedTableName}".`);

    // 5. Insert new records if any
    let insertedCount = 0;

    if (rows.length > 0) {
      // Map columns from Oracle result (uppercase or lowercase) to Postgres columns
      const oracleSample = rows[0];
      const matchedColumns = [];

      // Smart column aliases for resilience across spelling variations
      const columnAliases = {
        remaning_qty: ['remaining_qty', 'pending_qty', 'balance_qty', 'rem_qty'],
        remaining_qty: ['remaning_qty', 'pending_qty', 'balance_qty', 'rem_qty'],
        po_num: ['po_number', 'ponum', 'purchase_order_num', 'purchase_order_number'],
        po_number: ['po_num', 'ponum'],
        po_qty: ['quantity', 'qty', 'order_qty'],
        item_description: ['description', 'item_desc'],
        unit_price: ['price', 'rate'],
        rel_num: ['release_num', 'release_number', 'rel_no'],
        gate_entry_number: ['gate_entry_no', 'gate_no', 'entry_number', 'gate_number'],
        gate_entry_no: ['gate_entry_number', 'gate_no'],
        vehicle_number: ['vehicle_no', 'veh_no'],
        vehicle_no: ['vehicle_number'],
        transporter_name: ['transporter', 'transporter_nm'],
        challan: ['challan_no', 'challan_number'],
        grn: ['grn_no', 'grn_number'],
        vendor_name: ['vendor', 'supplier_name', 'supplier'],
        receipt_num: ['receipt_no', 'receipt_number'],
        ex_invoice_no: ['invoice_no', 'invoice_number', 'ex_invoice_number', 'invoice_num'],
        ex_invoice_date: ['invoice_date'],
        customer: ['customer_name'],
        act_catagory: ['act_category', 'category'],
        act_category: ['act_catagory', 'category'],
        level_pos: ['level', 'bom_level', 'pos_level'],
        current_parent: ['parent_item', 'parent'],
        child_item: ['component_item', 'child'],
        current_parent_desc: ['parent_desc', 'parent_description'],
        child_item_desc: ['child_desc', 'child_description', 'component_desc'],
        parent_qty: ['parent_quantity'],
        child_qty: ['child_quantity'],
        component_quantity: ['comp_quantity', 'comp_qty'],
      };

      Object.keys(oracleSample).forEach((oracleKey) => {
        const lower = oracleKey.toLowerCase();
        if (pgColMap[lower]) {
          matchedColumns.push({
            oracleKey,
            pgCol: pgColMap[lower],
          });
        } else if (columnAliases[lower]) {
          const matchedAlias = columnAliases[lower].find((alias) => pgColMap[alias]);
          if (matchedAlias) {
            matchedColumns.push({
              oracleKey,
              pgCol: pgColMap[matchedAlias],
            });
            console.log(`ℹ️ [Column Mapping] Matched Oracle column '${oracleKey}' to Postgres column '${pgColMap[matchedAlias]}' via alias.`);
          }
        }
      });

      if (matchedColumns.length === 0) {
        throw new Error(
          `No matching columns found between query output and PostgreSQL table "${resolvedTableName}". Output keys: ${Object.keys(
            oracleSample
          ).join(', ')}`
        );
      }

      const colNamesStr = matchedColumns.map((m) => `"${m.pgCol}"`).join(', ');

      // Insert in batches of 250 rows to optimize network I/O
      const batchSize = 250;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const valuePlaceholders = [];
        const paramValues = [];
        let paramIdx = 1;

        chunk.forEach((row) => {
          const rowParams = [];
          matchedColumns.forEach((m) => {
            let val = row[m.oracleKey];
            // Format undefined to null
            if (val === undefined) val = null;
            rowParams.push(`$${paramIdx++}`);
            paramValues.push(val);
          });
          valuePlaceholders.push(`(${rowParams.join(', ')})`);
        });

        const insertSql = `INSERT INTO "${resolvedTableName}" (${colNamesStr}) VALUES ${valuePlaceholders.join(', ')}`;
        await client.query(insertSql, paramValues);
        insertedCount += chunk.length;
        if (insertedCount % 1000 === 0 || insertedCount === rows.length) {
          console.log(`📦 [Postgres] Inserted ${insertedCount}/${rows.length} rows into "${resolvedTableName}"...`);
        }
      }
    }

    // 6. Commit Transaction
    await client.query('COMMIT');
    const elapsed = Date.now() - startTime;
    console.log(`✅ Successfully updated "${resolvedTableName}" with ${insertedCount} record(s) in ${elapsed} ms.`);

    return {
      success: true,
      tableName: resolvedTableName,
      rowCount: insertedCount,
      durationMs: elapsed,
    };
  } catch (error) {
    // 7. Rollback Transaction on error (existing data is preserved)
    await client.query('ROLLBACK');
    console.error(`❌ Transaction rolled back for "${targetTableName}":`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPostgresPool,
  testPostgresConnection,
  syncTableData,
};


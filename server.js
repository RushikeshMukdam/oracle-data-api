require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');
const postgres = require('./config/postgres');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse JSON, URL-encoded, and raw text payloads (up to 20MB for long queries)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.text({ limit: '20mb' }));

// Request logging
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Serve frontend assets and query files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/queries', express.static(path.join(__dirname, 'queries')));

/**
 * -------------------------------------------------------------
 * All 4 Enterprise Queries Configuration Registry
 * -------------------------------------------------------------
 */
const QUERIES_CONFIG = {
  pending_po: {
    id: 'pending_po',
    number: 1,
    title: 'Pending Purchase Orders',
    domain: 'Supply Chain & Purchasing',
    description: 'Approved POs and blanket releases where remaining balance quantity > 0.',
    targetTable: process.env.POSTGRES_PO_TABLE || 'pending_purchase_orders',
    canUpdate: true, // Query 1 update functionality is active
    getSql: () => {
      const sqlPath = path.join(__dirname, 'queries', 'pending_po_test.sql');
      return fs.readFileSync(sqlPath, 'utf8').replace(/;+\s*$/, '').trim();
    },
    defaultBinds: {},
  },
  inward_gate: {
    id: 'inward_gate',
    number: 2,
    title: 'Inward Gate Entry & GRN Reconciliation',
    domain: 'Procurement & Logistics',
    description: 'Vendor shipments entering factory, vehicle numbers, challans, and GRN receipts.',
    targetTable: process.env.POSTGRES_INWARD_TABLE || 'gate_inward_entries',
    canUpdate: true, // Query 2 update functionality is active
    getSql: () => {
      const sqlPath = path.join(__dirname, 'queries', 'gate_inward_test.sql');
      return fs.readFileSync(sqlPath, 'utf8').replace(/;+\s*$/, '').trim();
    },
    defaultBinds: {},
  },
  outward_gate: {
    id: 'outward_gate',
    number: 3,
    title: 'Outward Gate Entry & Customer Dispatch',
    domain: 'Sales & Dispatch',
    description: 'Finished goods dispatches, transporters, customers, and excise invoices.',
    targetTable: process.env.POSTGRES_OUTWARD_TABLE || 'gate_outward_entries',
    canUpdate: true, // Query 3 update functionality is active
    getSql: () => {
      const sqlPath = path.join(__dirname, 'queries', 'gate_outward_test.sql');
      return fs.readFileSync(sqlPath, 'utf8').replace(/;+\s*$/, '').trim();
    },
    defaultBinds: {},
  },
  bom: {
    id: 'bom',
    number: 4,
    title: 'BOM Hierarchy Explosion',
    domain: 'Engineering & Manufacturing',
    description: 'Multi-level BOM explosion for assembly item with child quantities and inventory balances (RM, MFG, On-hand).',
    targetTable: process.env.POSTGRES_BOM_TABLE || 'bill_of_materials',
    canUpdate: true, // Query 4 update functionality is active
    getSql: () => {
      const sqlPath = path.join(__dirname, 'queries', 'bom_test.sql');
      return fs.readFileSync(sqlPath, 'utf8').replace(/;+\s*$/, '').trim();
    },
    defaultBinds: {},
  },
};

/**
 * -------------------------------------------------------------
 * Existing Query Execution Engine (UNCHANGED & PRESERVED)
 * -------------------------------------------------------------
 */
async function handleQueryExecution(req, res) {
  let rawQuery = '';

  if (typeof req.body === 'string') {
    rawQuery = req.body;
  } else if (req.body && typeof req.body === 'object') {
    rawQuery = req.body.query || req.body.sql || req.body.statement || '';
  }

  if (!rawQuery && req.query.sql) {
    rawQuery = req.query.sql;
  }

  // Normalize line endings and trim trailing semicolons or slashes
  const cleanSql = (rawQuery || '')
    .replace(/\r\n/g, '\n')
    .replace(/;+\s*$/, '')
    .trim();

  if (!cleanSql) {
    return res.status(400).json({
      success: false,
      message: 'Input box is empty. Please enter a SQL query to execute.',
    });
  }

  const firstWord = (cleanSql.match(/^\s*([A-Za-z]+)/) || [])[1] || 'UNKNOWN';
  const queryType = firstWord.toUpperCase();
  const queryPreview = cleanSql.slice(0, 100).replace(/\s+/g, ' ');

  console.log(`⚡ Analyzing and executing [${queryType}] query: "${queryPreview}..."`);

  const startTime = Date.now();
  let connection;

  try {
    connection = await db.getConnection();

    const maxRows = parseInt(req.body?.maxRows || req.query?.maxRows, 10) || 2000;
    const result = await connection.execute(cleanSql, [], {
      outFormat: db.oracledb.OUT_FORMAT_OBJECT,
      maxRows: maxRows,
    });

    const elapsed = Date.now() - startTime;
    const rows = result.rows || [];
    const columns = result.metaData ? result.metaData.map((m) => m.name) : (rows[0] ? Object.keys(rows[0]) : []);

    console.log(`✅ Success: ${rows.length} row(s) returned in ${elapsed} ms.`);

    return res.json({
      success: true,
      analysis: {
        queryType,
        characterCount: cleanSql.length,
        executionTimeMs: elapsed,
        rowCount: rows.length,
        rowsAffected: result.rowsAffected,
        columnCount: columns.length,
        columns,
      },
      data: rows,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ Execution Error (${elapsed} ms):`, error.message);

    let friendlyHint = '';
    if (error.message.includes('ORA-00936')) {
      friendlyHint = 'Missing expression. Check for missing commas, spaces between keywords, or incomplete SELECT clauses.';
    } else if (error.message.includes('ORA-00942')) {
      friendlyHint = 'Table or view does not exist. Check table name spelling or schema prefix (e.g. apps.table_name).';
    } else if (error.message.includes('ORA-01008')) {
      friendlyHint = 'Not all variables bound. Your query has bind variables (like :orgId). Replace them with literal values.';
    } else if (error.message.includes('ORA-00904')) {
      friendlyHint = 'Invalid column name. One of the column names does not exist in the specified table.';
    }

    return res.status(400).json({
      success: false,
      message: error.message,
      offset: error.offset,
      hint: friendlyHint,
      executionTimeMs: elapsed,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) { }
    }
  }
}

// Universal query runner endpoints (backward-compatible)
app.post('/', handleQueryExecution);
app.post('/query', handleQueryExecution);
app.post('/api/query', handleQueryExecution);
app.get('/api/query', handleQueryExecution);

/**
 * -------------------------------------------------------------
 * New API: List all 4 queries for the UI
 * -------------------------------------------------------------
 */
app.get('/api/queries', (req, res) => {
  const list = Object.values(QUERIES_CONFIG).map((q) => ({
    id: q.id,
    number: q.number,
    title: q.title,
    domain: q.domain,
    description: q.description,
    targetTable: q.targetTable,
    canUpdate: q.canUpdate,
    sql: q.getSql(),
  }));
  res.json({ success: true, queries: list });
});

/**
 * -------------------------------------------------------------
 * Dynamic Query Sync: Update PostgreSQL with custom/modified query results
 * (Takes the currently executed/displayed rows or live query, clears the
 * target table in PostgreSQL, and inserts the latest records in a transaction)
 * -------------------------------------------------------------
 */
async function handleCustomSync(req, res) {
  const { tableName, rows, query } = req.body || {};

  if (!tableName) {
    return res.status(400).json({
      success: false,
      message: 'target tableName is required.',
    });
  }

  const startTime = Date.now();
  let recordsToSync = rows;
  let oracleDurationMs = 0;

  try {
    // If rows were not provided, or query is provided without rows, execute query live on Oracle
    if ((!recordsToSync || !Array.isArray(recordsToSync) || recordsToSync.length === 0) && query) {
      console.log(`🔌 [Custom Sync] Executing custom query on Oracle for table '${tableName}'...`);
      const oracleConn = await db.getConnection();
      try {
        const oracleStart = Date.now();
        const cleanQuery = query.replace(/;+\s*$/, '').trim();
        const result = await oracleConn.execute(cleanQuery, {}, {
          outFormat: db.oracledb.OUT_FORMAT_OBJECT,
          maxRows: 50000,
        });
        oracleDurationMs = Date.now() - oracleStart;
        recordsToSync = result.rows || [];
        console.log(`✅ [Custom Sync] Oracle returned ${recordsToSync.length} record(s) in ${oracleDurationMs} ms.`);
      } finally {
        try { await oracleConn.close(); } catch (e) {}
      }
    }

    if (!recordsToSync || !Array.isArray(recordsToSync)) {
      return res.status(400).json({
        success: false,
        message: 'No query records found to sync. Please execute a query first.',
      });
    }

    console.log(`🔌 [Custom Sync] Updating PostgreSQL table '${tableName}' with ${recordsToSync.length} record(s)...`);
    const pgResult = await postgres.syncTableData(tableName, recordsToSync);

    const totalDurationMs = Date.now() - startTime;
    const successMsg = `Successfully updated PostgreSQL table '${pgResult.tableName}' with ${pgResult.rowCount} record(s) in ${totalDurationMs} ms.`;

    console.log(`🎉 [Custom Sync] Complete! ${successMsg}`);

    return res.json({
      success: true,
      tableName: pgResult.tableName,
      rowCount: pgResult.rowCount,
      oracleDurationMs,
      postgresDurationMs: pgResult.durationMs,
      totalDurationMs,
      message: successMsg,
      data: recordsToSync,
    });
  } catch (error) {
    const totalDurationMs = Date.now() - startTime;
    console.error(`❌ [Custom Sync] Failed for table '${tableName}':`, error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      totalDurationMs,
    });
  }
}

app.post('/api/sync/custom', handleCustomSync);
app.post('/api/sync-custom', handleCustomSync);

/**
 * -------------------------------------------------------------
 * Predefined Enterprise Query Sync
 * -------------------------------------------------------------
 */
app.post('/api/sync/:queryId', async (req, res) => {
  const { queryId } = req.params;

  if (queryId === 'custom') {
    return handleCustomSync(req, res);
  }

  const config = QUERIES_CONFIG[queryId];

  if (!config) {
    return res.status(404).json({
      success: false,
      message: `Unknown query '${queryId}'. Available queries: ${Object.keys(QUERIES_CONFIG).join(', ')}`,
    });
  }

  if (!config.canUpdate) {
    return res.status(400).json({
      success: false,
      message: `Database update functionality for '${config.title}' will be enabled in a future phase.`,
    });
  }

  const startTime = Date.now();
  let oracleConn;

  try {
    // Step 1: Execute query on Oracle Database and get latest output
    console.log(`🔌 [Sync] Step 1/2: Executing '${config.title}' on Oracle...`);
    const sql = config.getSql();
    oracleConn = await db.getConnection();

    const binds = config.defaultBinds || {};
    const oracleStart = Date.now();
    const result = await oracleConn.execute(sql, binds, {
      outFormat: db.oracledb.OUT_FORMAT_OBJECT,
      maxRows: 50000,
    });
    const oracleDurationMs = Date.now() - oracleStart;
    const rows = result.rows || [];

    console.log(`✅ [Sync] Oracle returned ${rows.length} record(s) in ${oracleDurationMs} ms.`);

    // Step 2: Connect to PostgreSQL (Neon DB), clear existing records, insert new output in transaction
    console.log(`🔌 [Sync] Step 2/2: Updating PostgreSQL (Neon DB) table '${config.targetTable}'...`);
    const pgResult = await postgres.syncTableData(config.targetTable, rows);

    const totalDurationMs = Date.now() - startTime;
    const successMsg = `Successfully updated PostgreSQL table '${pgResult.tableName}' with ${pgResult.rowCount} record(s) in ${totalDurationMs} ms.`;

    console.log(`🎉 [Sync] Complete! ${successMsg}`);

    return res.json({
      success: true,
      queryId: config.id,
      queryTitle: config.title,
      tableName: pgResult.tableName,
      rowCount: pgResult.rowCount,
      oracleDurationMs,
      postgresDurationMs: pgResult.durationMs,
      totalDurationMs,
      message: successMsg,
      data: rows,
      dataPreview: rows.slice(0, 50),
    });
  } catch (error) {
    const totalDurationMs = Date.now() - startTime;
    console.error(`❌ [Sync] Update Failed for '${config.title}':`, error.message);
    return res.status(500).json({
      success: false,
      queryId: config.id,
      message: error.message,
      totalDurationMs,
    });
  } finally {
    if (oracleConn) {
      try {
        await oracleConn.close();
      } catch (e) { }
    }
  }
});

/**
 * -------------------------------------------------------------
 * PostgreSQL Diagnostic Status Route
 * -------------------------------------------------------------
 */
app.get('/api/postgres/status', async (req, res) => {
  try {
    const status = await postgres.testPostgresConnection();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Serve Web Page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/query', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Simple Health Ping
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    databaseConnected: db.isPoolActive(),
    timestamp: new Date().toISOString(),
  });
});

let serverInstance;

function startListening(port) {
  serverInstance = app.listen(port, () => {
    console.log('====================================================');
    console.log(`🚀 Saksham AI - Query Engine Running on Port ${port}`);
    console.log(`🌐 Open in Browser: http://localhost:${port}`);
    console.log('====================================================');
  });

  serverInstance.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`⚠️  Port ${port} is occupied by another process. Automatically switching to http://localhost:${nextPort}...`);
      startListening(nextPort);
    } else {
      console.error('❌ Server startup error:', err.message);
    }
  });
}

async function startServer() {
  try {
    await db.initializePool();
    startListening(PORT);
  } catch (error) {
    console.error('❌ Failed to initialize database pool:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (serverInstance) serverInstance.close();
  await db.closePool();
  process.exit(0);
});

startServer();

module.exports = app;

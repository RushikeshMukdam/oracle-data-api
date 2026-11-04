#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runBomQuery() {
  console.log('====================================================');
  console.log('🚀 Executing BOM Hierarchy Explosion Query');
  console.log('   Target DB: ', process.env.DB_CONNECT_STRING);
  console.log('   User:      ', process.env.DB_USER);
  console.log('   Item No:   22305174 | Org ID: 82');
  console.log('====================================================\n');

  const sqlFilePath = path.join(__dirname, 'queries', 'bom_test.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf8').replace(/;+\s*$/, '').trim();

  let connection;
  const startTime = Date.now();

  try {
    console.log('⏳ Connecting to Oracle Database...');
    connection = await db.getConnection().catch(async () => {
      return await db.oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING,
      });
    });

    console.log('⏳ Running query on Oracle...');
    const result = await connection.execute(sql, [], {
      outFormat: db.oracledb.OUT_FORMAT_OBJECT,
      maxRows: 500,
    });

    const elapsed = Date.now() - startTime;
    const rows = result.rows || [];

    console.log(`\n✅ Query executed successfully in ${elapsed} ms!`);
    console.log(`📊 Total Rows Returned: ${rows.length}\n`);

    if (rows.length > 0) {
      console.log('📋 First 10 Rows Preview:');
      console.table(
        rows.slice(0, 10).map((r) => ({
          LEVEL: r.LEVEL_POS,
          PARENT: r.CURRENT_PARENT,
          CHILD: r.CHILD_ITEM,
          CHILD_QTY: r.CHILD_QTY,
          RM_QTY: r.RM_QUANTITY,
          ONHAND: r.ONHAND_QUANTITY,
        }))
      );

      // Save complete output to bom_output.json
      const outputPath = path.join(__dirname, 'bom_output.json');
      fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf8');
      console.log(`\n💾 Full result (${rows.length} rows) saved to: ${outputPath}`);
    } else {
      console.log('ℹ️  0 rows returned for item 22305174 in Org 82.');
    }
  } catch (err) {
    console.error('\n❌ SQL Execution Failed:');
    console.error(`   Message: ${err.message}`);
    if (err.offset) {
      console.error(`   Error at character position: ${err.offset}`);
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {}
    }
    process.exit(0);
  }
}

db.initializePool()
  .catch(() => {})
  .finally(() => {
    runBomQuery();
  });


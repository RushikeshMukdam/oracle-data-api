#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const db = require('./config/db');

/**
 * Executes a single SQL query against Oracle Database
 */
async function executeQuery(sql) {
  const cleanSql = sql.replace(/;+\s*$/, '').trim();
  if (!cleanSql) return;

  const startTime = Date.now();
  let connection;

  try {
    connection = await db.getConnection().catch(async () => {
      return await db.oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING,
      });
    });

    const result = await connection.execute(cleanSql, [], {
      outFormat: db.oracledb.OUT_FORMAT_OBJECT,
      maxRows: 500,
    });

    const elapsed = Date.now() - startTime;
    const rows = result.rows || [];

    console.log('');
    if (rows.length === 0) {
      if (result.rowsAffected !== undefined) {
        console.log(`✅ Statement executed successfully (${result.rowsAffected} row(s) affected in ${elapsed} ms).`);
      } else {
        console.log(`ℹ️  Query executed successfully. 0 rows returned (${elapsed} ms).`);
      }
    } else {
      console.table(rows.slice(0, 50));
      if (rows.length > 50) {
        console.log(`... and ${rows.length - 50} more rows.`);
      }
      console.log(`\n📊 Returned ${rows.length} row(s) in ${elapsed} ms.`);
    }
    console.log('');
  } catch (err) {
    console.error('\n❌ SQL Error:', err.message);
    if (err.offset) {
      console.error(`   Error at character position ${err.offset}\n`);
    } else {
      console.error('');
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {}
    }
  }
}

/**
 * Main Runner
 */
async function startCli() {
  // If argument is passed (either a .sql file or a raw SQL string)
  const arg = process.argv.slice(2).join(' ').trim();
  if (arg) {
    let sqlToRun = arg;
    if (fs.existsSync(arg)) {
      console.log(`📖 Reading SQL from file: ${arg}`);
      sqlToRun = fs.readFileSync(arg, 'utf8');
    }
    await executeQuery(sqlToRun);
    process.exit(0);
  }

  console.log('====================================================');
  console.log('⚡ Oracle SQL Interactive Query Runner');
  console.log('   Target DB: ', process.env.DB_CONNECT_STRING);
  console.log('   User:      ', process.env.DB_USER);
  console.log('----------------------------------------------------');
  console.log('   Type your SQL statement.');
  console.log('   End your query with a semicolon (;) or type / to execute.');
  console.log('   Type "exit" to quit, "clear" to clear screen.');
  console.log('====================================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'SQL> ',
  });

  rl.prompt();

  let sqlBuffer = '';

  rl.on('line', async (line) => {
    const trimmed = line.trim();

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      console.log('\n👋 Disconnected.');
      process.exit(0);
    }

    if (trimmed.toLowerCase() === 'clear' || trimmed.toLowerCase() === 'cls') {
      console.clear();
      sqlBuffer = '';
      rl.setPrompt('SQL> ');
      rl.prompt();
      return;
    }

    // Single line execution trigger: "/" on its own line
    if (trimmed === '/' && sqlBuffer.trim()) {
      rl.pause();
      const runSql = sqlBuffer;
      sqlBuffer = '';
      await executeQuery(runSql);
      rl.setPrompt('SQL> ');
      rl.prompt();
      rl.resume();
      return;
    }

    // Append line with newline to preserve spacing
    sqlBuffer += (sqlBuffer ? '\n' : '') + line;

    // Check if the query ends with a semicolon
    if (trimmed.endsWith(';')) {
      rl.pause();
      const runSql = sqlBuffer;
      sqlBuffer = '';
      await executeQuery(runSql);
      rl.setPrompt('SQL> ');
      rl.prompt();
      rl.resume();
      return;
    }

    // Multiline continuation prompt
    rl.setPrompt('  ... ');
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n👋 Session closed.');
    process.exit(0);
  });
}

db.initializePool()
  .catch(() => {})
  .finally(() => {
    startCli();
  });

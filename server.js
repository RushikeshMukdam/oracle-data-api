require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

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
    console.log(`[${timestamp}] Incoming Query Request`);
  }
  next();
});

// Serve frontend assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/queries', express.static(path.join(__dirname, 'queries')));

/**
 * Query Analyzer & Execution Engine
 * Receives short or long queries, executes them against Oracle DB,
 * and returns analyzed results with columns, row counts, and timings.
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

  // Query analysis
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

// API Endpoints
app.post('/', handleQueryExecution);
app.post('/query', handleQueryExecution);
app.post('/api/query', handleQueryExecution);
app.get('/api/query', handleQueryExecution);

// Serve Web Page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/query', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Server Ping
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

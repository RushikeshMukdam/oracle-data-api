const oracledb = require('oracledb');
require('dotenv').config();

// Default output format to JavaScript Objects (key-value pairs)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Automatically convert DATE and TIMESTAMP to strings for easy JSON serialization
oracledb.fetchAsString = [oracledb.DATE, oracledb.CLOB];

let poolInstance = null;

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  poolIncrement: parseInt(process.env.DB_POOL_INCREMENT, 10) || 2,
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT, 10) || 60,
};

/**
 * Initializes the Oracle connection pool.
 * Gracefully skips pool creation if running in mock mode and credentials are not yet supplied.
 */
async function initializePool() {
  const isMock = process.env.USE_MOCK_DATA === 'true';

  if (!dbConfig.user || !dbConfig.connectString) {
    if (isMock) {
      console.log('ℹ️  Oracle credentials not provided. Running in MOCK DATA mode.');
      return null;
    }
    throw new Error('Database credentials (DB_USER, DB_PASSWORD, DB_CONNECT_STRING) must be provided in .env');
  }

  try {
    console.log(`🔌 Initializing Oracle connection pool to ${dbConfig.connectString}...`);
    poolInstance = await oracledb.createPool(dbConfig);
    console.log('✅ Oracle connection pool initialized successfully.');
    return poolInstance;
  } catch (error) {
    if (isMock) {
      console.warn('⚠️  Could not connect to Oracle database. Falling back to MOCK DATA mode.');
      console.warn(`   Reason: ${error.message}`);
      return null;
    }
    console.error('❌ Failed to initialize Oracle connection pool:', error.message);
    throw error;
  }
}

/**
 * Gets a dedicated connection from the connection pool.
 */
async function getConnection() {
  if (!poolInstance) {
    throw new Error('Database connection pool is not initialized.');
  }
  return await poolInstance.getConnection();
}

/**
 * Closes the Oracle connection pool cleanly (used during server shutdown).
 */
async function closePool() {
  if (poolInstance) {
    try {
      await poolInstance.close(10); // 10-second drain time
      poolInstance = null;
      console.log('🛑 Oracle connection pool closed cleanly.');
    } catch (error) {
      console.error('❌ Error closing Oracle connection pool:', error.message);
    }
  }
}

/**
 * Checks if the Oracle connection pool is active.
 */
function isPoolActive() {
  return poolInstance !== null;
}

module.exports = {
  initializePool,
  getConnection,
  closePool,
  isPoolActive,
  oracledb,
};


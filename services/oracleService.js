const db = require('../config/db');

/**
 * Generic query executor for Oracle Database.
 * Automatically acquires a connection from the pool, executes the query with bind parameters,
 * and guarantees the connection is released back to the pool in the finally block.
 *
 * @param {string} sql - The SQL statement with optional bind variables (e.g. :startDate)
 * @param {object|array} binds - Bind parameters
 * @param {object} options - Execution options (e.g. maxRows, fetchArraySize)
 * @returns {Promise<Array>} Query result rows as an array of objects
 */
async function executeQuery(sql, binds = {}, options = {}) {
  let connection;

  try {
    connection = await db.getConnection();

    const defaultOptions = {
      autoCommit: false,
      outFormat: db.oracledb.OUT_FORMAT_OBJECT,
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const result = await connection.execute(sql, binds, mergedOptions);

    return result.rows || [];
  } catch (error) {
    console.error('❌ Oracle SQL Execution Error:', error.message);
    console.error('   Query:', sql);
    console.error('   Binds:', binds);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close(); // Return connection back to the pool
      } catch (closeError) {
        console.error('❌ Error releasing Oracle connection:', closeError.message);
      }
    }
  }
}

module.exports = {
  executeQuery,
};


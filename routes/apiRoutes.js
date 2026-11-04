const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const db = require('../config/db');

/**
 * -------------------------------------------------------------
 * Query 1: BOM Hierarchy Explosion
 * -------------------------------------------------------------
 * @route   GET /api/bom/explosion
 * @desc    Fetch BOM hierarchy with RM/MFG/on-hand inventory
 * @params  itemNumber, orgId, childItem, supplyType, limit
 */
router.get('/bom/explosion', reportController.handleBomExplosion);

/**
 * -------------------------------------------------------------
 * Query 2: Inward Gate Entry (Vendors / Raw Materials / GRN)
 * -------------------------------------------------------------
 * @route   GET /api/gate-entry/inward
 * @route   GET /api/gate-entry (default alias)
 * @desc    Fetch inward gate entries with vehicle, transporter, challan, vendor, and GRN
 * @params  startDate, endDate, locationId, status, gateEntryNumber, vehicleNumber, vendorName, grn, limit
 */
router.get('/gate-entry/inward', reportController.handleGateEntryInward);
router.get('/gate-entry', reportController.handleGateEntryInward);

/**
 * -------------------------------------------------------------
 * Query 3: Outward Gate Entry (Customers / Finished Goods / Invoices)
 * -------------------------------------------------------------
 * @route   GET /api/gate-entry/outward
 * @desc    Fetch outward gate entries with vehicle, transporter, customer, and excise invoices
 * @params  startDate, endDate, locationId, customer, vehicleNumber, gateEntryNumber, invoiceNo, flag, limit
 */
router.get('/gate-entry/outward', reportController.handleGateEntryOutward);

/**
 * -------------------------------------------------------------
 * Query 4: Pending Purchase Orders (Standard POs & Blanket Releases)
 * -------------------------------------------------------------
 * @route   GET /api/purchase-orders/pending
 * @route   GET /api/pending-po (short alias)
 * @desc    Fetch approved POs and releases with remaining balance quantity > 0
 * @params  orgId, operatingUnitId, itemNumber, poNum, supplier, limit
 */
router.get('/purchase-orders/pending', reportController.handlePendingPurchaseOrders);
router.get('/pending-po', reportController.handlePendingPurchaseOrders);

/**
 * -------------------------------------------------------------
 * Dynamic SQL Query Runner (Saksham AI & User Direct Query)
 * -------------------------------------------------------------
 * @route   POST /api/query
 * @route   POST /api/sql
 * @desc    Executes arbitrary SQL queries on Oracle DB and returns JSON results
 * @body    { query: "SELECT ...", sql: "SELECT ...", maxRows: 500 }
 */
router.post('/query', executeDynamicSql);
router.post('/sql', executeDynamicSql);

async function executeDynamicSql(req, res) {
  const { query, sql, maxRows = 500 } = req.body;
  const sqlToExecute = (sql || query || '').replace(/;+\s*$/, '').trim();

  if (!sqlToExecute) {
    return res.status(400).json({
      success: false,
      message: 'SQL query is required. Provide {"sql": "SELECT ..."} or {"query": "SELECT ..."} in request body.',
    });
  }

  // Safety check: block destructive DDL statements
  if (/^\s*(DROP|TRUNCATE)\b/i.test(sqlToExecute)) {
    return res.status(403).json({
      success: false,
      message: 'Destructive DDL statements (DROP, TRUNCATE) are disabled.',
    });
  }

  const startTime = Date.now();
  let connection;

  try {
    connection = await db.getConnection();
    const result = await connection.execute(sqlToExecute, [], {
      outFormat: db.oracledb.OUT_FORMAT_OBJECT,
      maxRows: Math.min(parseInt(maxRows, 10) || 500, 5000),
    });

    const elapsed = Date.now() - startTime;
    const rows = result.rows || [];

    return res.json({
      success: true,
      rowCount: rows.length,
      rowsAffected: result.rowsAffected,
      executionTimeMs: elapsed,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      offset: error.offset,
      executionTimeMs: Date.now() - startTime,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        // ignore
      }
    }
  }
}

module.exports = router;

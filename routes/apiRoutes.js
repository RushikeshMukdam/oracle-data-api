const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

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

module.exports = router;

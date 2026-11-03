const reportService = require('../services/reportService');

/**
 * Validates date format (YYYY-MM-DD)
 */
function isValidDateString(dateStr) {
  if (!dateStr) return true;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Controller: Handles BOM Hierarchy Explosion (Query 1)
 * Endpoint: GET /api/bom/explosion
 */
async function handleBomExplosion(req, res, next) {
  try {
    const { itemNumber, orgId, childItem, supplyType, limit } = req.query;

    if (orgId && isNaN(parseInt(orgId, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid orgId format. Must be an integer (e.g. 82).',
      });
    }

    const result = await reportService.getBomExplosionData({
      itemNumber,
      orgId,
      childItem,
      supplyType,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: 'BOM hierarchy explosion data fetched successfully',
      meta: {
        itemNumber: itemNumber || '22305174',
        orgId: parseInt(orgId, 10) || 82,
        count: result.data.length,
        isMock: result.isMock,
        timestamp: new Date().toISOString(),
      },
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Handles Inward Gate Entry & GRN Reconciliation (Query 2)
 * Endpoint: GET /api/gate-entry/inward
 */
async function handleGateEntryInward(req, res, next) {
  try {
    const {
      startDate,
      endDate,
      locationId,
      status,
      gateEntryNumber,
      vehicleNumber,
      vendorName,
      grn,
      limit,
    } = req.query;

    if (startDate && !isValidDateString(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate format. Expected YYYY-MM-DD (e.g. 2026-07-01).',
      });
    }

    if (endDate && !isValidDateString(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDate format. Expected YYYY-MM-DD (e.g. 2026-08-01).',
      });
    }

    if (locationId && isNaN(parseInt(locationId, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid locationId format. Must be an integer (e.g. 82).',
      });
    }

    const result = await reportService.getGateEntryInwardData({
      startDate,
      endDate,
      locationId,
      status,
      gateEntryNumber,
      vehicleNumber,
      vendorName,
      grn,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: 'Inward gate entry records fetched successfully',
      meta: {
        type: 'INWARD',
        dateRange: {
          startDate: startDate || '2026-07-01',
          endDate: endDate || '2026-08-01',
        },
        locationId: parseInt(locationId, 10) || 82,
        filtersApplied: {
          gateEntryNumber: gateEntryNumber || null,
          vehicleNumber: vehicleNumber || null,
          vendorName: vendorName || null,
          grn: grn || null,
          status: status || 'Active',
        },
        count: result.data.length,
        isMock: result.isMock,
        timestamp: new Date().toISOString(),
      },
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Handles Outward Gate Entry & Customer Dispatch Reconciliation (Query 3)
 * Endpoint: GET /api/gate-entry/outward
 */
async function handleGateEntryOutward(req, res, next) {
  try {
    const {
      startDate,
      endDate,
      locationId,
      customer,
      vehicleNumber,
      gateEntryNumber,
      invoiceNo,
      flag,
      limit,
    } = req.query;

    if (startDate && !isValidDateString(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate format. Expected YYYY-MM-DD (e.g. 2026-08-01).',
      });
    }

    if (endDate && !isValidDateString(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDate format. Expected YYYY-MM-DD (e.g. 2026-09-01).',
      });
    }

    if (locationId && isNaN(parseInt(locationId, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid locationId format. Must be an integer (e.g. 82).',
      });
    }

    const result = await reportService.getGateEntryOutwardData({
      startDate,
      endDate,
      locationId,
      customer,
      vehicleNumber,
      gateEntryNumber,
      invoiceNo,
      flag,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: 'Outward gate entry records fetched successfully',
      meta: {
        type: 'OUTWARD',
        dateRange: {
          startDate: startDate || '2026-08-01',
          endDate: endDate || '2026-09-01',
        },
        locationId: parseInt(locationId, 10) || 82,
        filtersApplied: {
          customer: customer || null,
          vehicleNumber: vehicleNumber || null,
          gateEntryNumber: gateEntryNumber || null,
          invoiceNo: invoiceNo || null,
          flag: flag || null,
        },
        count: result.data.length,
        isMock: result.isMock,
        timestamp: new Date().toISOString(),
      },
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Handles Pending Purchase Orders (Query 4)
 * Endpoint: GET /api/purchase-orders/pending
 */
async function handlePendingPurchaseOrders(req, res, next) {
  try {
    const { orgId, operatingUnitId, itemNumber, poNum, supplier, limit } = req.query;

    if (orgId && isNaN(parseInt(orgId, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid orgId format. Must be an integer (e.g. 82).',
      });
    }

    if (operatingUnitId && isNaN(parseInt(operatingUnitId, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operatingUnitId format. Must be an integer (e.g. 81).',
      });
    }

    const result = await reportService.getPendingPurchaseOrdersData({
      orgId,
      operatingUnitId,
      itemNumber,
      poNum,
      supplier,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: 'Pending purchase orders fetched successfully',
      meta: {
        orgId: parseInt(orgId, 10) || 82,
        operatingUnitId: parseInt(operatingUnitId, 10) || 81,
        filtersApplied: {
          itemNumber: itemNumber || null,
          poNum: poNum || null,
          supplier: supplier || null,
        },
        count: result.data.length,
        isMock: result.isMock,
        timestamp: new Date().toISOString(),
      },
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleBomExplosion,
  handleGateEntryInward,
  handleGateEntryOutward,
  handlePendingPurchaseOrders,
  // Aliases
  handleGateEntry: handleGateEntryInward,
  handlePendingPo: handlePendingPurchaseOrders,
};

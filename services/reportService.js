const db = require('../config/db');
const oracleService = require('./oracleService');
const queries = require('../queries');
const { getMockData } = require('../data/mockData');

/**
 * Checks whether live Oracle execution should occur or fallback to mock data.
 */
function shouldServeMockData() {
  return process.env.USE_MOCK_DATA === 'true' || !db.isPoolActive();
}

/**
 * BOM Hierarchy Explosion Service (Query 1)
 * @param {object} filters - itemNumber, orgId, childItem, supplyType, limit
 */
async function getBomExplosionData(filters = {}) {
  const isMock = shouldServeMockData();

  if (isMock) {
    return {
      isMock: true,
      data: getMockData('bomExplosion', filters),
    };
  }

  const defaultBinds = queries.bomExplosion.defaultBinds;
  const binds = {
    itemNumber: filters.itemNumber ? String(filters.itemNumber).trim() : defaultBinds.itemNumber,
    orgId: parseInt(filters.orgId, 10) || defaultBinds.orgId,
  };

  const rows = await oracleService.executeQuery(queries.bomExplosion.sql, binds);

  return {
    isMock: false,
    data: rows,
  };
}

/**
 * Inward Gate Entry & GRN Reconciliation Service (Query 2)
 * @param {object} filters - startDate, endDate, locationId, status, gateEntryNumber, vehicleNumber, vendorName, grn, limit
 */
async function getGateEntryInwardData(filters = {}) {
  const isMock = shouldServeMockData();

  if (isMock) {
    return {
      isMock: true,
      data: getMockData('gateEntryInward', filters),
    };
  }

  const defaultBinds = queries.gateEntryInward.defaultBinds;
  const binds = {
    startDate: filters.startDate ? String(filters.startDate) : defaultBinds.startDate,
    endDate: filters.endDate ? String(filters.endDate) : defaultBinds.endDate,
    locationId: parseInt(filters.locationId, 10) || defaultBinds.locationId,
    status: filters.status ? String(filters.status) : defaultBinds.status,
    gateEntryNumber: filters.gateEntryNumber ? String(filters.gateEntryNumber).trim() : null,
    vehicleNumber: filters.vehicleNumber ? String(filters.vehicleNumber).trim() : null,
    vendorName: filters.vendorName ? String(filters.vendorName).trim() : null,
    grn: filters.grn ? String(filters.grn).trim() : null,
    limit: parseInt(filters.limit, 10) || defaultBinds.limit,
  };

  const rows = await oracleService.executeQuery(queries.gateEntryInward.sql, binds);

  return {
    isMock: false,
    data: rows,
  };
}

/**
 * Outward Gate Entry & Customer Dispatch Reconciliation Service (Query 3)
 * @param {object} filters - startDate, endDate, locationId, customer, vehicleNumber, gateEntryNumber, invoiceNo, flag, limit
 */
async function getGateEntryOutwardData(filters = {}) {
  const isMock = shouldServeMockData();

  if (isMock) {
    return {
      isMock: true,
      data: getMockData('gateEntryOutward', filters),
    };
  }

  const defaultBinds = queries.gateEntryOutward.defaultBinds;
  const binds = {
    startDate: filters.startDate ? String(filters.startDate) : defaultBinds.startDate,
    endDate: filters.endDate ? String(filters.endDate) : defaultBinds.endDate,
    locationId: parseInt(filters.locationId, 10) || defaultBinds.locationId,
    customer: filters.customer ? String(filters.customer).trim() : null,
    vehicleNumber: filters.vehicleNumber ? String(filters.vehicleNumber).trim() : null,
    gateEntryNumber: filters.gateEntryNumber ? String(filters.gateEntryNumber).trim() : null,
    invoiceNo: filters.invoiceNo ? String(filters.invoiceNo).trim() : null,
    flag: filters.flag ? String(filters.flag).trim() : null,
    limit: parseInt(filters.limit, 10) || defaultBinds.limit,
  };

  const rows = await oracleService.executeQuery(queries.gateEntryOutward.sql, binds);

  return {
    isMock: false,
    data: rows,
  };
}

/**
 * Pending Purchase Orders Service (Query 4)
 * @param {object} filters - orgId, operatingUnitId, itemNumber, poNum, supplier, limit
 */
async function getPendingPurchaseOrdersData(filters = {}) {
  const isMock = shouldServeMockData();

  if (isMock) {
    return {
      isMock: true,
      data: getMockData('pendingPurchaseOrders', filters),
    };
  }

  const defaultBinds = queries.pendingPurchaseOrders.defaultBinds;
  const binds = {
    orgId: parseInt(filters.orgId, 10) || defaultBinds.orgId,
    operatingUnitId: parseInt(filters.operatingUnitId, 10) || defaultBinds.operatingUnitId,
    itemNumber: filters.itemNumber ? String(filters.itemNumber).trim() : null,
    poNum: filters.poNum ? String(filters.poNum).trim() : null,
    supplier: filters.supplier ? String(filters.supplier).trim() : null,
    limit: parseInt(filters.limit, 10) || defaultBinds.limit,
  };

  const rows = await oracleService.executeQuery(queries.pendingPurchaseOrders.sql, binds);

  return {
    isMock: false,
    data: rows,
  };
}

module.exports = {
  getBomExplosionData,
  getGateEntryInwardData,
  getGateEntryOutwardData,
  getPendingPurchaseOrdersData,
  // Aliases
  getGateEntryData: getGateEntryInwardData,
  getPendingPoData: getPendingPurchaseOrdersData,
};

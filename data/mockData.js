/**
 * Mock data fixtures for development and testing without an active Oracle DB connection.
 */

// BOM Hierarchy Explosion Mock Data (Query 1)
const mockBomData = [
  {
    LEVEL_POS: 1,
    CURRENT_PARENT: '22305174',
    CHILD_ITEM: 'SUB-ASSY-901',
    PATH_AND_QTY: ' / 22305174 -(1) / SUB-ASSY-901 -(1)',
    FINAL222: '1',
    PARENT_QTY: 1,
    COMPONENT_QUANTITY: 1.0,
    CHILD_QTY: 1.0,
    ITEM_TYPE: 'ATO',
    ACT_CATAGORY: 'MECHANICAL',
    CREATION_DATE: '2025-04-12 08:30:00',
    EFFECTIVITY_DATE: '2025-04-12 08:30:00',
    DISABLE_DATE: null,
    GROSS_QUANTITY: null,
    RM_QUANTITY: 120,
    MFG_QUANTITY: 45,
    ONHAND_QUANTITY: 165,
    SUPPLY_TYPE: 'Assembly Pull',
    ASSEMBLY_TYPE: 1,
    CURRENT_PARENT_DESC: 'Electric Motor Assembly 500W',
    CHILD_ITEM_DESC: 'Rotor & Shaft Sub-Assembly',
  },
  {
    LEVEL_POS: 2,
    CURRENT_PARENT: 'SUB-ASSY-901',
    CHILD_ITEM: 'RAW-STL-402',
    PATH_AND_QTY: ' / 22305174 -(1) / SUB-ASSY-901 -(1) / RAW-STL-402 -(2)',
    FINAL222: '2',
    PARENT_QTY: 1,
    COMPONENT_QUANTITY: 2.0,
    CHILD_QTY: 2.0,
    ITEM_TYPE: 'STANDARD',
    ACT_CATAGORY: 'RAW_MATERIAL',
    CREATION_DATE: '2025-03-01 11:15:00',
    EFFECTIVITY_DATE: '2025-03-01 11:15:00',
    DISABLE_DATE: null,
    GROSS_QUANTITY: null,
    RM_QUANTITY: 850,
    MFG_QUANTITY: 0,
    ONHAND_QUANTITY: 850,
    SUPPLY_TYPE: 'Assembly Pull',
    ASSEMBLY_TYPE: 1,
    CURRENT_PARENT_DESC: 'Rotor & Shaft Sub-Assembly',
    CHILD_ITEM_DESC: 'Hardened Steel Rod 15mm x 200mm',
  },
  {
    LEVEL_POS: 2,
    CURRENT_PARENT: 'SUB-ASSY-901',
    CHILD_ITEM: 'HDW-BRG-6202',
    PATH_AND_QTY: ' / 22305174 -(1) / SUB-ASSY-901 -(1) / HDW-BRG-6202 -(2)',
    FINAL222: '2',
    PARENT_QTY: 1,
    COMPONENT_QUANTITY: 2.0,
    CHILD_QTY: 2.0,
    ITEM_TYPE: 'STANDARD',
    ACT_CATAGORY: 'BEARINGS',
    CREATION_DATE: '2025-02-18 14:00:00',
    EFFECTIVITY_DATE: '2025-02-18 14:00:00',
    DISABLE_DATE: null,
    GROSS_QUANTITY: null,
    RM_QUANTITY: 450,
    MFG_QUANTITY: 0,
    ONHAND_QUANTITY: 450,
    SUPPLY_TYPE: 'Operation Pull',
    ASSEMBLY_TYPE: 1,
    CURRENT_PARENT_DESC: 'Rotor & Shaft Sub-Assembly',
    CHILD_ITEM_DESC: 'Deep Groove Ball Bearing 6202-2RS',
  },
  {
    LEVEL_POS: 1,
    CURRENT_PARENT: '22305174',
    CHILD_ITEM: 'ELEC-STTR-105',
    PATH_AND_QTY: ' / 22305174 -(1) / ELEC-STTR-105 -(1)',
    FINAL222: '1',
    PARENT_QTY: 1,
    COMPONENT_QUANTITY: 1.0,
    CHILD_QTY: 1.0,
    ITEM_TYPE: 'ATO',
    ACT_CATAGORY: 'ELECTRICAL',
    CREATION_DATE: '2025-05-20 09:45:00',
    EFFECTIVITY_DATE: '2025-05-20 09:45:00',
    DISABLE_DATE: null,
    GROSS_QUANTITY: null,
    RM_QUANTITY: 65,
    MFG_QUANTITY: 20,
    ONHAND_QUANTITY: 85,
    SUPPLY_TYPE: 'Assembly Pull',
    ASSEMBLY_TYPE: 1,
    CURRENT_PARENT_DESC: 'Electric Motor Assembly 500W',
    CHILD_ITEM_DESC: 'Stator Core with Copper Winding',
  },
  {
    LEVEL_POS: 2,
    CURRENT_PARENT: 'ELEC-STTR-105',
    CHILD_ITEM: 'RAW-CPR-WRE',
    PATH_AND_QTY: ' / 22305174 -(1) / ELEC-STTR-105 -(1) / RAW-CPR-WRE -(4.5)',
    FINAL222: '4.5',
    PARENT_QTY: 1,
    COMPONENT_QUANTITY: 4.5,
    CHILD_QTY: 4.5,
    ITEM_TYPE: 'STANDARD',
    ACT_CATAGORY: 'RAW_MATERIAL',
    CREATION_DATE: '2025-01-15 10:20:00',
    EFFECTIVITY_DATE: '2025-01-15 10:20:00',
    DISABLE_DATE: null,
    GROSS_QUANTITY: null,
    RM_QUANTITY: 2400,
    MFG_QUANTITY: 0,
    ONHAND_QUANTITY: 2400,
    SUPPLY_TYPE: 'PHANTOM',
    ASSEMBLY_TYPE: 1,
    CURRENT_PARENT_DESC: 'Stator Core with Copper Winding',
    CHILD_ITEM_DESC: 'Enamelled Copper Magnet Wire 0.8mm (Meters)',
  },
  {
    LEVEL_POS: 1,
    CURRENT_PARENT: '22305174',
    CHILD_ITEM: 'HDW-SCR-M4',
    PATH_AND_QTY: ' / 22305174 -(1) / HDW-SCR-M4 -(8)',
    FINAL222: '8',
    PARENT_QTY: 1,
    COMPONENT_QUANTITY: 8.0,
    CHILD_QTY: 8.0,
    ITEM_TYPE: 'STANDARD',
    ACT_CATAGORY: 'FASTENERS',
    CREATION_DATE: '2025-01-05 08:00:00',
    EFFECTIVITY_DATE: '2025-01-05 08:00:00',
    DISABLE_DATE: null,
    GROSS_QUANTITY: null,
    RM_QUANTITY: 15000,
    MFG_QUANTITY: 0,
    ONHAND_QUANTITY: 15000,
    SUPPLY_TYPE: 'Operation Pull',
    ASSEMBLY_TYPE: 1,
    CURRENT_PARENT_DESC: 'Electric Motor Assembly 500W',
    CHILD_ITEM_DESC: 'Stainless Steel Hex Screw M4x16mm',
  },
];

// Inward Gate Entry Mock Data (Query 2)
const mockInwardGateEntryData = [
  {
    GATE_ENTRY_NUMBER: 'GE-2026-0701',
    VEHICLE_NUMBER: 'MH-12-RN-4821',
    ENTRY_DATE: '2026-07-02 09:15:30',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'VRL Logistics Ltd',
    CHALLAN: 'CH-99214',
    CHALLAN_DATE: '2026-07-01',
    GRN: '5001284',
    VENDOR_NAME: 'Bharat Forge Limited',
    STATUS: 'Active',
    CUST_VEN_FLAG: 'V',
    CHALLAN_WAY_FLAG: '3 Way',
    RECEIPT_NUM: '5001284',
  },
  {
    GATE_ENTRY_NUMBER: 'GE-2026-0705',
    VEHICLE_NUMBER: 'MH-14-BT-9102',
    ENTRY_DATE: '2026-07-06 14:20:00',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'SafeXpress Pvt Ltd',
    CHALLAN: 'CH-10482',
    CHALLAN_DATE: '2026-07-05',
    GRN: '5001390',
    VENDOR_NAME: 'SKF India Limited',
    STATUS: 'Active',
    CUST_VEN_FLAG: 'V',
    CHALLAN_WAY_FLAG: '3 Way',
    RECEIPT_NUM: '5001390',
  },
  {
    GATE_ENTRY_NUMBER: 'GE-2026-0712',
    VEHICLE_NUMBER: 'GJ-06-AX-3319',
    ENTRY_DATE: '2026-07-14 11:45:15',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'TCI Freight Logistics',
    CHALLAN: 'CH-88412',
    CHALLAN_DATE: '2026-07-12',
    GRN: '5001552',
    VENDOR_NAME: 'Tata Steel Processing and Distribution Ltd',
    STATUS: 'Active',
    CUST_VEN_FLAG: 'V',
    CHALLAN_WAY_FLAG: '3 Way',
    RECEIPT_NUM: '5001552',
  },
  {
    GATE_ENTRY_NUMBER: 'GE-2026-0720',
    VEHICLE_NUMBER: 'MH-04-DE-1188',
    ENTRY_DATE: '2026-07-22 16:30:40',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'Delhivery Supply Chain',
    CHALLAN: 'CH-55109',
    CHALLAN_DATE: '2026-07-21',
    GRN: '5001740',
    VENDOR_NAME: 'Polycab India Limited',
    STATUS: 'Active',
    CUST_VEN_FLAG: 'V',
    CHALLAN_WAY_FLAG: '3 Way',
    RECEIPT_NUM: '5001740',
  },
  {
    GATE_ENTRY_NUMBER: 'GE-2026-0728',
    VEHICLE_NUMBER: 'MH-12-QQ-7744',
    ENTRY_DATE: '2026-07-29 10:10:00',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'Associated Road Carriers Ltd (ARC)',
    CHALLAN: 'CH-70021',
    CHALLAN_DATE: '2026-07-28',
    GRN: '5001920',
    VENDOR_NAME: 'Sundram Fasteners Limited',
    STATUS: 'Active',
    CUST_VEN_FLAG: 'V',
    CHALLAN_WAY_FLAG: 'N/A',
    RECEIPT_NUM: '5001920',
  },
];

// Outward Gate Entry Mock Data (Query 3)
const mockOutwardGateEntryData = [
  {
    GATE_ENTRY_NUMBER: 'GEO-2026-0801',
    VEHICLE_NUMBER: 'MH-12-PQ-9988',
    ENTRY_DATE: '2026-08-02 10:30:00',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'Blue Dart Express Ltd',
    CUSTOMER: 'Bajaj Auto Ltd (Akurdi)',
    EX_INVOICE_NO: 'INV-26-8801',
    EX_INVOICE_DATE: '2026-08-02',
    FLAG: 'Y',
  },
  {
    GATE_ENTRY_NUMBER: 'GEO-2026-0805',
    VEHICLE_NUMBER: 'MH-14-GH-4411',
    ENTRY_DATE: '2026-08-06 15:45:20',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'GATI KWE Cargo',
    CUSTOMER: 'Mahindra & Mahindra Ltd (Chakan)',
    EX_INVOICE_NO: 'INV-26-8845',
    EX_INVOICE_DATE: '2026-08-06',
    FLAG: 'Y',
  },
  {
    GATE_ENTRY_NUMBER: 'GEO-2026-0814',
    VEHICLE_NUMBER: 'KA-01-EE-7230',
    ENTRY_DATE: '2026-08-15 11:10:00',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'VRL Logistics Ltd',
    CUSTOMER: 'Tata Motors Commercial Vehicles',
    EX_INVOICE_NO: 'INV-26-8912',
    EX_INVOICE_DATE: '2026-08-15',
    FLAG: 'Y',
  },
  {
    GATE_ENTRY_NUMBER: 'GEO-2026-0820',
    VEHICLE_NUMBER: 'MH-12-KL-3300',
    ENTRY_DATE: '2026-08-22 17:00:10',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'SafeXpress Logistics',
    CUSTOMER: 'Hero MotoCorp Limited',
    EX_INVOICE_NO: 'INV-26-8980',
    EX_INVOICE_DATE: '2026-08-22',
    FLAG: 'Y',
  },
  {
    GATE_ENTRY_NUMBER: 'GEO-2026-0827',
    VEHICLE_NUMBER: 'MH-09-CV-5522',
    ENTRY_DATE: '2026-08-28 09:20:00',
    LOCATION_ID: 82,
    TRANSPORTER_NAME: 'TCI Freight Logistics',
    CUSTOMER: 'TVS Motor Company Limited',
    EX_INVOICE_NO: 'INV-26-9045',
    EX_INVOICE_DATE: '2026-08-28',
    FLAG: 'N',
  },
];

// Pending Purchase Orders Mock Data (Query 4)
const mockPendingPoData = [
  {
    PO_NUM: 'PO-2026-4401',
    REL_NUM: null,
    SEGMENT1: '22305174',
    UNIT_PRICE: 450.00,
    PO_QTY: 500,
    REMANING_QTY: 250,
    QUANTITY_RECEIVED: 250,
    ITEM_DESCRIPTION: 'Electric Motor Assembly 500W',
    SUPPLIER: 'Bharat Forge Limited',
    PO_DATE: '2026-06-15',
  },
  {
    PO_NUM: 'PO-2026-4412',
    REL_NUM: null,
    SEGMENT1: 'RAW-STL-402',
    UNIT_PRICE: 12.50,
    PO_QTY: 2000,
    REMANING_QTY: 1150,
    QUANTITY_RECEIVED: 850,
    ITEM_DESCRIPTION: 'Hardened Steel Rod 15mm x 200mm',
    SUPPLIER: 'Tata Steel Processing and Distribution Ltd',
    PO_DATE: '2026-06-20',
  },
  {
    PO_NUM: 'PO-2026-4425',
    REL_NUM: null,
    SEGMENT1: 'HDW-BRG-6202',
    UNIT_PRICE: 85.00,
    PO_QTY: 1000,
    REMANING_QTY: 550,
    QUANTITY_RECEIVED: 450,
    ITEM_DESCRIPTION: 'Deep Groove Ball Bearing 6202-2RS',
    SUPPLIER: 'SKF India Limited',
    PO_DATE: '2026-07-01',
  },
  {
    PO_NUM: 'BPO-2026-102',
    REL_NUM: 1,
    SEGMENT1: 'RAW-CPR-WRE',
    UNIT_PRICE: 6.20,
    PO_QTY: 5000,
    REMANING_QTY: 2600,
    QUANTITY_RECEIVED: 2400,
    ITEM_DESCRIPTION: 'Enamelled Copper Magnet Wire 0.8mm (Meters)',
    SUPPLIER: 'Polycab India Limited',
    PO_DATE: '2026-07-10',
  },
  {
    PO_NUM: 'PO-2026-4450',
    REL_NUM: null,
    SEGMENT1: 'HDW-SCR-M4',
    UNIT_PRICE: 0.45,
    PO_QTY: 25000,
    REMANING_QTY: 10000,
    QUANTITY_RECEIVED: 15000,
    ITEM_DESCRIPTION: 'Stainless Steel Hex Screw M4x16mm',
    SUPPLIER: 'Sundram Fasteners Limited',
    PO_DATE: '2026-07-18',
  },
];

function getMockData(queryKey, filters = {}) {
  let data = [];

  switch (queryKey) {
    case 'bomExplosion':
      data = mockBomData;
      if (filters.childItem) {
        data = data.filter((item) =>
          item.CHILD_ITEM.toLowerCase().includes(String(filters.childItem).toLowerCase())
        );
      }
      if (filters.supplyType) {
        data = data.filter(
          (item) => item.SUPPLY_TYPE.toLowerCase() === String(filters.supplyType).toLowerCase()
        );
      }
      break;

    case 'gateEntryInward':
    case 'gateEntry':
      data = mockInwardGateEntryData;
      if (filters.vehicleNumber) {
        const cleanFilter = String(filters.vehicleNumber).toLowerCase().replace(/[^a-z0-9]/g, '');
        data = data.filter((item) =>
          item.VEHICLE_NUMBER.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanFilter)
        );
      }
      if (filters.vendorName) {
        data = data.filter((item) =>
          item.VENDOR_NAME.toLowerCase().includes(String(filters.vendorName).toLowerCase())
        );
      }
      if (filters.gateEntryNumber) {
        data = data.filter((item) =>
          item.GATE_ENTRY_NUMBER.toLowerCase() === String(filters.gateEntryNumber).toLowerCase()
        );
      }
      if (filters.grn) {
        data = data.filter((item) => String(item.GRN) === String(filters.grn));
      }
      if (filters.status) {
        data = data.filter((item) => item.STATUS.toLowerCase() === String(filters.status).toLowerCase());
      }
      break;

    case 'gateEntryOutward':
      data = mockOutwardGateEntryData;
      if (filters.customer) {
        data = data.filter((item) =>
          item.CUSTOMER.toLowerCase().includes(String(filters.customer).toLowerCase())
        );
      }
      if (filters.vehicleNumber) {
        const cleanFilter = String(filters.vehicleNumber).toLowerCase().replace(/[^a-z0-9]/g, '');
        data = data.filter((item) =>
          item.VEHICLE_NUMBER.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanFilter)
        );
      }
      if (filters.gateEntryNumber) {
        data = data.filter((item) =>
          item.GATE_ENTRY_NUMBER.toLowerCase() === String(filters.gateEntryNumber).toLowerCase()
        );
      }
      if (filters.invoiceNo) {
        data = data.filter((item) =>
          item.EX_INVOICE_NO.toLowerCase().includes(String(filters.invoiceNo).toLowerCase())
        );
      }
      if (filters.flag) {
        data = data.filter((item) => item.FLAG.toUpperCase() === String(filters.flag).toUpperCase());
      }
      break;

    case 'pendingPurchaseOrders':
    case 'pendingPo':
      data = mockPendingPoData;
      if (filters.itemNumber) {
        data = data.filter((item) =>
          item.SEGMENT1.toLowerCase() === String(filters.itemNumber).toLowerCase()
        );
      }
      if (filters.poNum) {
        data = data.filter((item) =>
          item.PO_NUM.toLowerCase().includes(String(filters.poNum).toLowerCase())
        );
      }
      if (filters.supplier) {
        data = data.filter((item) =>
          item.SUPPLIER.toLowerCase().includes(String(filters.supplier).toLowerCase())
        );
      }
      break;

    default:
      data = [];
  }

  const limit = parseInt(filters.limit, 10);
  if (!isNaN(limit) && limit > 0) {
    return data.slice(0, limit);
  }
  return data;
}

module.exports = {
  getMockData,
};

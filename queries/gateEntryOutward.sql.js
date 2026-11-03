/**
 * Query 3: Outward Gate Entry & Customer Dispatch Reconciliation
 *
 * Fetches outward gate pass records with vehicle, transporter, customer,
 * excise invoice numbers, and dispatch flags from Oracle EBS.
 */

const QUERY_NAME = 'OUTWARD_GATE_ENTRY';

const SQL = `
SELECT
    h.GATE_ENTRY_NUMBER,
    h.VEHICLE_NUMBER,
    TO_CHAR(h.ENTRY_DATE, 'YYYY-MM-DD HH24:MI:SS') AS ENTRY_DATE,
    :locationId AS LOCATION_ID,
    h.TRANSPORTER_NAME,
    l.CUSTOMER,
    l.EX_INVOICE_NO,
    TO_CHAR(l.EX_INVOICE_DATE, 'YYYY-MM-DD') AS EX_INVOICE_DATE,
    l.FLAG
FROM APPS.XXHHL_GATE_ENTRY_OUT_HEADER h
JOIN APPS.XXHHL_GATE_ENTRY_OUT_LINES l
    ON l.GATE_ENTRY_NUMBER = h.GATE_ENTRY_NUMBER
WHERE h.ENTRY_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')
  AND h.ENTRY_DATE <  TO_DATE(:endDate, 'YYYY-MM-DD')
  AND (:customer IS NULL OR UPPER(l.CUSTOMER) LIKE '%' || UPPER(:customer) || '%')
  AND (:vehicleNumber IS NULL OR UPPER(h.VEHICLE_NUMBER) LIKE '%' || UPPER(:vehicleNumber) || '%')
  AND (:gateEntryNumber IS NULL OR h.GATE_ENTRY_NUMBER = :gateEntryNumber)
  AND (:invoiceNo IS NULL OR l.EX_INVOICE_NO = :invoiceNo)
  AND (:flag IS NULL OR l.FLAG = :flag)
ORDER BY
    h.GATE_ENTRY_NUMBER,
    l.EX_INVOICE_DATE
FETCH FIRST :limit ROWS ONLY
`;

module.exports = {
  name: QUERY_NAME,
  description: 'Outward gate entry and customer dispatch reconciliation',
  sql: SQL,
  defaultBinds: {
    startDate: '2026-08-01',
    endDate: '2026-09-01',
    locationId: 82,
    customer: null,
    vehicleNumber: null,
    gateEntryNumber: null,
    invoiceNo: null,
    flag: null,
    limit: 100,
  },
};


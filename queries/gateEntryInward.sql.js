/**
 * Query 2: Inward Gate Entry & GRN Receipt Reconciliation
 *
 * Fetches inward gate entry records with vehicle, transporter, challan,
 * vendor, and receiving shipment details from Oracle EBS.
 */

const QUERY_NAME = 'INWARD_GATE_ENTRY';

const SQL = `
SELECT
    h.GATE_ENTRY_NUMBER,
    h.VEHICLE_NUMBER,
    TO_CHAR(h.ENTRY_DATE, 'YYYY-MM-DD HH24:MI:SS') AS ENTRY_DATE,
    :locationId AS LOCATION_ID,
    h.TRANSPORTER_NAME,
    l.CHALLAN,
    TO_CHAR(l.CHALLAN_DATE, 'YYYY-MM-DD') AS CHALLAN_DATE,
    l.GRN,
    l.VENDOR_NAME,
    l.STATUS,
    l.CUST_VEN_FLAG,
    l.CHALLAN_WAY_FLAG,
    rsh.RECEIPT_NUM
FROM APPS.XXHHL_GATE_ENTRY_IN_HEADER h
JOIN APPS.XXHHL_GATE_ENTRY_IN_LINES l
    ON l.GATE_ENTRY_NUMBER = h.GATE_ENTRY_NUMBER
LEFT JOIN APPS.RCV_SHIPMENT_HEADERS rsh
    ON TRIM(TO_CHAR(rsh.RECEIPT_NUM)) = TRIM(l.GRN)
LEFT JOIN (
    SELECT
        SHIPMENT_HEADER_ID,
        TRANSACTION_TYPE,
        TRANSACTION_DATE,
        ROW_NUMBER() OVER (
            PARTITION BY SHIPMENT_HEADER_ID
            ORDER BY TRANSACTION_DATE DESC, TRANSACTION_ID DESC
        ) AS RN
    FROM APPS.RCV_TRANSACTIONS
) rt
    ON rt.SHIPMENT_HEADER_ID = rsh.SHIPMENT_HEADER_ID
   AND rt.RN = 1
WHERE h.ENTRY_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')
  AND h.ENTRY_DATE < TO_DATE(:endDate, 'YYYY-MM-DD')
  AND (:status IS NULL OR l.STATUS = :status)
  AND (:gateEntryNumber IS NULL OR h.GATE_ENTRY_NUMBER = :gateEntryNumber)
  AND (:vehicleNumber IS NULL OR UPPER(h.VEHICLE_NUMBER) LIKE '%' || UPPER(:vehicleNumber) || '%')
  AND (:vendorName IS NULL OR UPPER(l.VENDOR_NAME) LIKE '%' || UPPER(:vendorName) || '%')
  AND (:grn IS NULL OR TRIM(l.GRN) = TRIM(:grn))
  AND l.CHALLAN_WAY_FLAG IN ('3 Way', 'N/A')
ORDER BY
    h.GATE_ENTRY_NUMBER,
    l.CHALLAN_DATE,
    l.GRN
FETCH FIRST :limit ROWS ONLY
`;

module.exports = {
  name: QUERY_NAME,
  description: 'Inward gate entry and GRN receipt reconciliation',
  sql: SQL,
  defaultBinds: {
    startDate: '2026-07-01',
    endDate: '2026-08-01',
    locationId: 82,
    status: 'Active',
    gateEntryNumber: null,
    vehicleNumber: null,
    vendorName: null,
    grn: null,
    limit: 100,
  },
};


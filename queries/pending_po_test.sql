SELECT
    po_num,
    rel_num,
    segment1,
    unit_price,
    po_qty,
    remaning_qty,
    item_description
FROM (
    SELECT
        pds.line_location_id,
        cc.action_code authorization_status,
        pv.segment1 vendor_num,
        ph.segment1 po_num,
        ph.revision_num,
        NULL rel_num,
        NULL rel_rev_no,
        msi.segment1,
        pol.item_description,
        pol.unit_meas_lookup_code,
        pol.unit_price,
        igst.tax_name igst_name,
        igst.igst_rate,
        sgst.tax_name sgst_name,
        sgst.sgst_rate,
        cgst.tax_name cgst_name,
        cgst.cgst_rate,
        pds.quantity po_qty,
        (NVL(pds.quantity_received, 0)
         - NVL(pds.quantity_cancelled, 0)
         - NVL(pds.quantity_rejected, 0)) quantity_received,
        (pds.quantity
         - NVL(pds.quantity_received, 0)
         - NVL(pds.quantity_cancelled, 0)
         - NVL(pds.quantity_rejected, 0)) remaning_qty,
        pv.vendor_name supplier,
        ph.creation_date po_date,
        ph.po_header_id,
        ph.vendor_id,
        ph.vendor_site_id,
        pvs.vendor_site_code,
        msi.inventory_item_id,
        NULL po_release_id,
        pd.po_distribution_id,
        NVL(msi.receiving_routing_id, 3) routing_id,
        (SELECT inventory_organization_id
           FROM APPS.hr_locations_all
          WHERE location_id = ph.ship_to_location_id) organization_id,
        msi.attribute24,
        msi.outside_operation_flag,
        pol.item_revision po_revision,
        (SELECT MAX(revision)
           FROM APPS.mtl_item_revisions_b
          WHERE inventory_item_id = msi.inventory_item_id
            AND organization_id = msi.organization_id) item_revision,
        pd.po_line_id
    FROM APPS.po_headers_all ph,
         APPS.po_lines_all pol,
         APPS.po_line_locations_all pds,
         (
             SELECT po_header_id,
                    po_line_id,
                    line_location_id,
                    MAX(po_distribution_id) po_distribution_id
               FROM APPS.po_distributions_all
              GROUP BY po_header_id, po_line_id, line_location_id
         ) pd,
         APPS.po_vendors pv,
         APPS.po_vendor_sites_all pvs,
         APPS.mtl_system_items msi,
         (
             SELECT jtl.trx_id po_header_id,
                    jtl.trx_line_id po_line_id,
                    jtl.trx_loc_line_id po_line_location_id,
                    jtl.tax_rate_code tax_name,
                    SUM(jtl.tax_rate_percentage) igst_rate,
                    SUM(jtl.rounded_tax_amt_fun_curr) igst_amt
               FROM APPS.jai_tax_lines jtl
              WHERE jtl.tax_rate_code LIKE 'IGST%'
              GROUP BY jtl.trx_id, jtl.trx_line_id,
                       jtl.trx_loc_line_id, jtl.tax_rate_code
         ) igst,
         (
             SELECT jtl.trx_id po_header_id,
                    jtl.trx_line_id po_line_id,
                    jtl.trx_loc_line_id po_line_location_id,
                    jtl.tax_rate_code tax_name,
                    SUM(jtl.tax_rate_percentage) sgst_rate,
                    SUM(jtl.rounded_tax_amt_fun_curr) sgst_amt
               FROM APPS.jai_tax_lines jtl
              WHERE jtl.tax_rate_code LIKE 'SGST%'
              GROUP BY jtl.trx_id, jtl.trx_line_id,
                       jtl.trx_loc_line_id, jtl.tax_rate_code
         ) sgst,
         (
             SELECT jtl.trx_id po_header_id,
                    jtl.trx_line_id po_line_id,
                    jtl.trx_loc_line_id po_line_location_id,
                    jtl.tax_rate_code tax_name,
                    SUM(jtl.tax_rate_percentage) cgst_rate,
                    SUM(jtl.rounded_tax_amt_fun_curr) cgst_amt
               FROM APPS.jai_tax_lines jtl
              WHERE jtl.tax_rate_code LIKE 'CGST%'
              GROUP BY jtl.trx_id, jtl.trx_line_id,
                       jtl.trx_loc_line_id, jtl.tax_rate_code
         ) cgst,
         (
             SELECT jtl.trx_id po_header_id,
                    jtl.trx_line_id po_line_id,
                    jtl.trx_loc_line_id po_line_location_id,
                    jtl.tax_rate_code tax_name,
                    SUM(jtl.tax_rate_percentage) ngst_rate,
                    SUM(jtl.rounded_tax_amt_fun_curr) ngst_amt
               FROM APPS.jai_tax_lines jtl
              WHERE jtl.tax_rate_code LIKE 'NIL%'
              GROUP BY jtl.trx_id, jtl.trx_line_id,
                       jtl.trx_loc_line_id, jtl.tax_rate_code
         ) ngst,
         (
             SELECT qq.*
               FROM (
                   SELECT object_id, action_code, sequence_num
                     FROM APPS.po_action_history
               ) qq
               JOIN (
                   SELECT object_id, MAX(sequence_num) sequence_num
                     FROM APPS.po_action_history
                    GROUP BY object_id
               ) ww
                 ON qq.sequence_num = ww.sequence_num
                AND qq.object_id = ww.object_id
              WHERE qq.action_code != 'IMPORT'
                 OR qq.action_code IS NULL
         ) cc
    WHERE ph.po_header_id = pol.po_header_id
      AND ph.po_header_id = pds.po_header_id
      AND pol.po_line_id = pds.po_line_id
      AND msi.organization_id = 82
      AND pd.po_header_id = pds.po_header_id
      AND pd.po_line_id = pds.po_line_id
      AND pd.line_location_id = pds.line_location_id
      AND pol.item_id = msi.inventory_item_id
      AND ph.vendor_id = pv.vendor_id
      AND ph.vendor_site_id = pvs.vendor_site_id(+)
      AND pds.po_header_id = ngst.po_header_id(+)
      AND pds.po_line_id = ngst.po_line_id(+)
      AND pds.line_location_id = ngst.po_line_location_id(+)
      AND pds.po_header_id = igst.po_header_id(+)
      AND pds.po_line_id = igst.po_line_id(+)
      AND pds.line_location_id = igst.po_line_location_id(+)
      AND pds.po_header_id = sgst.po_header_id(+)
      AND pds.po_line_id = sgst.po_line_id(+)
      AND pds.line_location_id = sgst.po_line_location_id(+)
      AND pds.po_header_id = cgst.po_header_id(+)
      AND pds.po_line_id = cgst.po_line_id(+)
      AND pds.line_location_id = cgst.po_line_location_id(+)
      AND ph.type_lookup_code NOT IN ('RFQ', 'QUOTATION', 'BLANKET')
      AND ph.authorization_status = 'APPROVED'
      AND pol.closed_date IS NULL
      AND pds.closed_code IN ('OPEN', 'CLOSED FOR INVOICE')
      AND NVL(pol.cancel_flag, 'N') <> 'Y'
      AND pds.receipt_required_flag = 'Y'
      AND msi.inventory_item_flag = 'Y'
      AND pds.org_id = 81
      AND (pds.quantity
           - NVL(pds.quantity_received, 0)
           - NVL(pds.quantity_cancelled, 0)
           - NVL(pds.quantity_rejected, 0)) > 0
      AND ph.po_header_id = cc.object_id(+)
      AND (cc.action_code NOT IN ('CANCEL', 'CLOSE', 'HOLD')
           OR cc.action_code IS NULL)

    UNION

    SELECT
        pds.line_location_id,
        cc.action_code authorization_status,
        pv.segment1 vendor_num,
        ph.segment1 po_num,
        ph.revision_num,
        pra.release_num rel_num,
        pra.revision_num rel_rev_no,
        msi.segment1,
        pol.item_description,
        pol.unit_meas_lookup_code,
        pol.unit_price,
        igst.tax_name igst_name,
        igst.igst_rate,
        sgst.tax_name sgst_name,
        sgst.sgst_rate,
        cgst.tax_name cgst_name,
        cgst.cgst_rate,
        pds.quantity po_qty,
        (NVL(pds.quantity_received, 0)
         - NVL(pds.quantity_cancelled, 0)
         - NVL(pds.quantity_rejected, 0)) quantity_received,
        (pds.quantity
         - NVL(pds.quantity_received, 0)
         - NVL(pds.quantity_cancelled, 0)
         - NVL(pds.quantity_rejected, 0)) remaning_qty,
        pv.vendor_name supplier,
        ph.creation_date po_date,
        ph.po_header_id,
        ph.vendor_id,
        ph.vendor_site_id,
        pvs.vendor_site_code,
        msi.inventory_item_id,
        pra.po_release_id,
        (
            SELECT MAX(pd.po_distribution_id)
              FROM APPS.po_distributions_all pd
             WHERE pd.po_line_id = pds.po_line_id
               AND pd.line_location_id = pds.line_location_id
               AND pd.po_header_id = pds.po_header_id
        ) po_distribution_id,
        NVL(msi.receiving_routing_id, 3) routing_id,
        (SELECT inventory_organization_id
           FROM APPS.hr_locations_all
          WHERE location_id = ph.ship_to_location_id) organization_id,
        msi.attribute24,
        msi.outside_operation_flag,
        pol.item_revision po_revision,
        (SELECT MAX(revision)
           FROM APPS.mtl_item_revisions_b
          WHERE inventory_item_id = msi.inventory_item_id
            AND organization_id = msi.organization_id) item_revision,
        pds.po_line_id
    FROM APPS.po_headers_all ph,
         APPS.po_lines_all pol,
         APPS.po_line_locations_all pds,
         APPS.po_vendors pv,
         APPS.po_vendor_sites_all pvs,
         APPS.po_releases_all pra,
         APPS.mtl_system_items msi,
         (
             SELECT jtl.trx_id po_header_id,
                    jtl.trx_line_id po_line_id,
                    jtl.trx_loc_line_id po_line_location_id,
                    jtl.tax_rate_code tax_name,
                    SUM(jtl.tax_rate_percentage) igst_rate,
                    SUM(jtl.rounded_tax_amt_fun_curr) igst_amt
               FROM APPS.jai_tax_lines jtl
              WHERE jtl.tax_rate_code LIKE 'IGST%'
              GROUP BY jtl.trx_id, jtl.trx_line_id,
                       jtl.trx_loc_line_id, jtl.tax_rate_code
         ) igst,
         (
             SELECT jtl.trx_id po_header_id,
                    jtl.trx_line_id po_line_id,
                    jtl.trx_loc_line_id po_line_location_id,
                    jtl.tax_rate_code tax_name,
                    SUM(jtl.tax_rate_percentage) sgst_rate,
                    SUM(jtl.rounded_tax_amt_fun_curr) sgst_amt
               FROM APPS.jai_tax_lines jtl
              WHERE jtl.tax_rate_code LIKE 'SGST%'
              GROUP BY jtl.trx_id, jtl.trx_line_id,
                       jtl.trx_loc_line_id, jtl.tax_rate_code
         ) sgst,
         (
             SELECT jtl.trx_id po_header_id,
                    jtl.trx_line_id po_line_id,
                    jtl.trx_loc_line_id po_line_location_id,
                    jtl.tax_rate_code tax_name,
                    SUM(jtl.tax_rate_percentage) cgst_rate,
                    SUM(jtl.rounded_tax_amt_fun_curr) cgst_amt
               FROM APPS.jai_tax_lines jtl
              WHERE jtl.tax_rate_code LIKE 'CGST%'
              GROUP BY jtl.trx_id, jtl.trx_line_id,
                       jtl.trx_loc_line_id, jtl.tax_rate_code
         ) cgst,
         (
             SELECT jtl.trx_id po_header_id,
                    jtl.trx_line_id po_line_id,
                    jtl.trx_loc_line_id po_line_location_id,
                    jtl.tax_rate_code tax_name,
                    SUM(jtl.tax_rate_percentage) ngst_rate,
                    SUM(jtl.rounded_tax_amt_fun_curr) ngst_amt
               FROM APPS.jai_tax_lines jtl
              WHERE jtl.tax_rate_code LIKE 'NIL%'
              GROUP BY jtl.trx_id, jtl.trx_line_id,
                       jtl.trx_loc_line_id, jtl.tax_rate_code
         ) ngst,
         (
             SELECT qq.*
               FROM (
                   SELECT object_id, action_code, sequence_num
                     FROM APPS.po_action_history
               ) qq
               JOIN (
                   SELECT object_id, MAX(sequence_num) sequence_num
                     FROM APPS.po_action_history
                    GROUP BY object_id
               ) ww
                 ON qq.sequence_num = ww.sequence_num
                AND qq.object_id = ww.object_id
              WHERE qq.action_code != 'IMPORT'
                 OR qq.action_code IS NULL
         ) cc
    WHERE ph.po_header_id = pol.po_header_id
      AND ph.po_header_id = pds.po_header_id
      AND pol.po_line_id = pds.po_line_id
      AND ph.vendor_id = pv.vendor_id
      AND pds.po_release_id = pra.po_release_id
      AND msi.organization_id = 82
      AND ph.vendor_site_id = pvs.vendor_site_id
      AND pol.item_id = msi.inventory_item_id
      AND (igst.tax_name IS NOT NULL
           OR cgst.tax_name IS NOT NULL
           OR sgst.tax_name IS NOT NULL
           OR ngst.tax_name IS NOT NULL)
      AND pds.po_release_id = ngst.po_header_id(+)
      AND pds.po_line_id = ngst.po_line_id(+)
      AND pds.line_location_id = ngst.po_line_location_id(+)
      AND pds.po_release_id = igst.po_header_id(+)
      AND pds.po_line_id = igst.po_line_id(+)
      AND pds.line_location_id = igst.po_line_location_id(+)
      AND pds.po_release_id = sgst.po_header_id(+)
      AND pds.po_line_id = sgst.po_line_id(+)
      AND pds.line_location_id = sgst.po_line_location_id(+)
      AND pds.po_release_id = cgst.po_header_id(+)
      AND pds.po_line_id = cgst.po_line_id(+)
      AND pds.line_location_id = cgst.po_line_location_id(+)
      AND ph.type_lookup_code = 'BLANKET'
      AND ph.authorization_status = 'APPROVED'
      AND (pra.closed_code IS NULL OR pra.closed_code = 'OPEN')
      AND pol.closed_date IS NULL
      AND pds.receipt_required_flag = 'Y'
      AND msi.inventory_item_flag = 'Y'
      AND pds.org_id = 81
      AND (pds.quantity
           - NVL(pds.quantity_received, 0)
           - NVL(pds.quantity_cancelled, 0)
           - NVL(pds.quantity_rejected, 0)) > 0
      AND pra.po_release_id = cc.object_id(+)
      AND (cc.action_code NOT IN ('CANCEL', 'CLOSE', 'HOLD')
           OR cc.action_code IS NULL)
      AND pds.closed_code IN ('OPEN', 'CLOSED FOR INVOICE')
      AND NVL(pol.cancel_flag, 'N') <> 'Y'
) xx
ORDER BY 3, 4, 5, 6, 7

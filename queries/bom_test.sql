SELECT
    x.level_pos,
    x.current_parent,
    x.child_item,
    x.path_and_qty,
    SUBSTR(
        x.path_and_qty,
        INSTR(x.path_and_qty, '(', 1,
            DECODE(x.level_pos2, 0, 1, x.level_pos2)
        ) + 1,
        INSTR(x.path_and_qty, ')', 1,
            DECODE(x.level_pos2, 0, 1, x.level_pos2)
        )
        - INSTR(x.path_and_qty, '(', 1,
            DECODE(x.level_pos2, 0, 1, x.level_pos2)
        ) - 1
    ) AS final222,
    DECODE(
        x.level_pos,
        1, 1,
        SUBSTR(
            x.path_and_qty,
            INSTR(x.path_and_qty, '(', 1,
                DECODE(x.level_pos2, 0, 1, x.level_pos2)
            ) + 1,
            INSTR(x.path_and_qty, ')', 1,
                DECODE(x.level_pos2, 0, 1, x.level_pos2)
            )
            - INSTR(x.path_and_qty, '(', 1,
                DECODE(x.level_pos2, 0, 1, x.level_pos2)
            ) - 1
        )
    ) AS parent_qty,
    (
        SELECT ROUND(
            EXP(
                SUM(
                    LN(
                        REPLACE(
                            SUBSTR(
                                t2.column_value,
                                INSTR(t2.column_value, '(') + 1
                            ),
                            ')',
                            ''
                        )
                    )
                )
            ),
            4
        )
        FROM DUAL,
             TABLE(apps.xxhhl_str2tbl(x.path_and_qty)) t2
        WHERE t2.column_value IS NOT NULL
    ) AS component_quantity,
    x.child_qty,
    x.item_type,
    x.act_catagory,
    x.creation_date,
    x.effectivity_date,
    x.disable_date,
    x.gross_quantity,
    x.rm_quantity,
    x.mfg_quantity,
    x.onhand_quantity,
    x.supply_type,
    x.assembly_type,
    x.current_parent_desc,
    x.child_item_desc
FROM (
    SELECT
        LEVEL AS level_pos,
        LEVEL - 1 AS level_pos2,
        (
            SELECT msi.segment1
            FROM apps.mtl_system_items_b msi
            WHERE msi.inventory_item_id = bom.assembly_item_id
              AND msi.organization_id = bom.organization_id
        ) AS current_parent,
        (
            SELECT msi.segment1
            FROM apps.mtl_system_items_b msi
            WHERE msi.inventory_item_id = bic.component_item_id
              AND msi.organization_id = bom.organization_id
        ) AS child_item,
        SYS_CONNECT_BY_PATH(
            (
                SELECT REPLACE(msi.segment1, '/', '|')
                FROM apps.mtl_system_items_b msi
                WHERE msi.inventory_item_id = bic.component_item_id
                  AND msi.organization_id = bom.organization_id
            ) || ' -(' || bic.component_quantity || ')',
            ' / '
        ) AS path_and_qty,
        (
            SELECT msi.item_type
            FROM apps.mtl_system_items_b msi
            WHERE msi.inventory_item_id = bic.component_item_id
              AND msi.organization_id = bom.organization_id
        ) AS item_type,
        (
            SELECT msi.attribute22
            FROM apps.mtl_system_items_b msi
            WHERE msi.inventory_item_id = bic.component_item_id
              AND msi.organization_id = bom.organization_id
        ) AS act_catagory,
        bic.creation_date,
        bic.effectivity_date,
        bic.disable_date,
        bic.component_quantity AS child_qty,
        NULL AS gross_quantity,
        (
            SELECT SUM(NVL(mmt.primary_quantity, 0))
            FROM apps.mtl_material_transactions mmt
            WHERE mmt.inventory_item_id = bic.component_item_id
              AND mmt.subinventory_code IN ('RM', '468048')
              AND mmt.organization_id = bom.organization_id
        ) AS rm_quantity,
        (
            SELECT SUM(NVL(mmt.primary_quantity, 0))
            FROM apps.mtl_material_transactions mmt
            WHERE mmt.inventory_item_id = bic.component_item_id
              AND mmt.subinventory_code = 'MFG'
              AND mmt.organization_id = bom.organization_id
        ) AS mfg_quantity,
        (
            SELECT SUM(NVL(mmt.primary_quantity, 0))
            FROM apps.mtl_material_transactions mmt
            WHERE mmt.inventory_item_id = bic.component_item_id
              AND mmt.subinventory_code = 'MFG'
              AND mmt.organization_id = bom.organization_id
        ) AS onhand_quantity,
        bic.supply_type,
        bom.assembly_type,
        (
            SELECT msi.description
            FROM apps.mtl_system_items_b msi
            WHERE msi.inventory_item_id = bom.assembly_item_id
              AND msi.organization_id = bom.organization_id
        ) AS current_parent_desc,
        (
            SELECT msi.description
            FROM apps.mtl_system_items_b msi
            WHERE msi.inventory_item_id = bic.component_item_id
              AND msi.organization_id = bom.organization_id
        ) AS child_item_desc
    FROM (
        SELECT
            assembly_item_id,
            organization_id,
            bill_sequence_id,
            assembly_type
        FROM apps.bom_bill_of_materials
        WHERE organization_id = 82
          AND alternate_bom_designator IS NULL
          AND assembly_type = 1
    ) bom,
    (
        SELECT
            component_item_id,
            creation_date,
            effectivity_date,
            disable_date,
            bill_sequence_id,
            component_quantity,
            DECODE(
                wip_supply_type,
                2, 'Assembly Pull',
                3, 'Operation Pull',
                6, 'PHANTOM',
                wip_supply_type
            ) AS supply_type
        FROM apps.bom_inventory_components
        WHERE TRUNC(effectivity_date) <= TRUNC(SYSDATE)
          AND disable_date IS NULL
    ) bic
    WHERE bom.bill_sequence_id = bic.bill_sequence_id
      AND bom.organization_id = 82
      AND bic.component_quantity > 0
    CONNECT BY PRIOR bic.component_item_id = bom.assembly_item_id
    START WITH bom.assembly_item_id IN (
        SELECT DISTINCT msi.inventory_item_id
        FROM apps.mtl_system_items_b msi
        WHERE msi.organization_id = 82
          AND msi.segment1 = '22305174'
    )
) x
ORDER BY x.path_and_qty;


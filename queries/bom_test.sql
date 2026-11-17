SELECT
    (
        SELECT
            segment1
        FROM
            apps.mtl_system_items_b
        WHERE
                inventory_item_id = x.top_assembly_id
            AND
                organization_id = x.organization_id
    ) top_assembly,
    x.level_pos,
    x.current_parent,
    x.child_item item,
    x.path_and_qty,
    substr(
        x.path_and_qty,
        to_number(instr(
            x.path_and_qty,
            '(',
            1,
            DECODE(
                x.level_pos2,
                0,
                1,
                x.level_pos2
            )
        ) + 1),
        to_number( (instr(
            x.path_and_qty,
            ')',
            1,
            DECODE(
                x.level_pos2,
                0,
                1,
                x.level_pos2
            )
        ) - 1) - instr(
            x.path_and_qty,
            '(',
            1,
            DECODE(
                x.level_pos2,
                0,
                1,
                x.level_pos2
            )
        ) )
    ) final222,
    DECODE(
        x.level_pos,
        1,
        1,
        (substr(
            x.path_and_qty,
            to_number(instr(
                x.path_and_qty,
                '(',
                1,
                DECODE(
                    x.level_pos2,
                    0,
                    1,
                    x.level_pos2
                )
            ) + 1),
            to_number( (instr(
                x.path_and_qty,
                ')',
                1,
                DECODE(
                    x.level_pos2,
                    0,
                    1,
                    x.level_pos2
                )
            ) - 1) - instr(
                x.path_and_qty,
                '(',
                1,
                DECODE(
                    x.level_pos2,
                    0,
                    1,
                    x.level_pos2
                )
            ) )
        ) )
    ) parent_qty,
    (
        SELECT
            round(
                exp(SUM(ln(replace(
                    substr(
                        t2.column_value,
                        instr(
                            t2.column_value,
                            '(',
                            1,
                            1
                        ) + 1
                    ),
                    ')',
                    ''
                ) ) ) ),
                4
            )
        FROM
            dual,
            TABLE (apps.xxhhl_str2tbl(x.path_and_qty) ) t2
        WHERE
            t2.column_value IS NOT NULL
    ) component_quantity,
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
    x.child_item_desc description
FROM
    (
        SELECT
            CONNECT_BY_ROOT bom.assembly_item_id AS top_assembly_id,
            bom.organization_id,
            level level_pos,
            level - 1 level_pos2,
            (
                SELECT
                    segment1
                FROM
                    apps.mtl_system_items_b
                WHERE
                        inventory_item_id = bom.assembly_item_id
                    AND
                        organization_id = bom.organization_id
            ) current_parent,
            (
                SELECT
                    segment1
                FROM
                    apps.mtl_system_items_b
                WHERE
                        inventory_item_id = bic.component_item_id
                    AND
                        organization_id = bom.organization_id
            ) child_item,
            sys_connect_by_path(
                (
                    SELECT
                        replace(
                            segment1,
                            '/',
                            '|'
                        )
                    FROM
                        apps.mtl_system_items_b
                    WHERE
                            inventory_item_id = bic.component_item_id
                        AND
                            organization_id = bom.organization_id
                )
                 || ' -('
                 || bic.component_quantity
                 || ')',
                ' / '
            ) path_and_qty,
            (
                SELECT
                    msi.item_type item_type
                FROM
                    apps.mtl_system_items_b msi
                WHERE
                        msi.inventory_item_id = bic.component_item_id
                    AND
                        msi.organization_id = bom.organization_id
            ) item_type,
            (
                SELECT
                    attribute22 act_catagory
                FROM
                    apps.mtl_system_items_b msi
                WHERE
                        msi.inventory_item_id = bic.component_item_id
                    AND
                        msi.organization_id = bom.organization_id
            ) act_catagory,
            bic.creation_date,
            bic.effectivity_date,
            bic.disable_date,
            bic.component_quantity child_qty,
            NULL gross_quantity,
            (
                SELECT
                    SUM(nvl(
                        mmt.primary_quantity,
                        0
                    ) ) onhand_quantity
                FROM
                    apps.mtl_material_transactions mmt
                WHERE
                        mmt.inventory_item_id = bic.component_item_id
                    AND
                        mmt.subinventory_code IN (
                            'RM','468048'
                        )
                    AND
                        mmt.organization_id = bom.organization_id
            ) rm_quantity,
            (
                SELECT
                    SUM(nvl(
                        mmt.primary_quantity,
                        0
                    ) ) onhand_quantity
                FROM
                    apps.mtl_material_transactions mmt
                WHERE
                        mmt.inventory_item_id = bic.component_item_id
                    AND
                        mmt.subinventory_code = 'MFG'
                    AND
                        mmt.organization_id = bom.organization_id
            ) mfg_quantity,
            (
                SELECT
                    SUM(nvl(
                        mmt.primary_quantity,
                        0
                    ) ) onhand_quantity
                FROM
                    apps.mtl_material_transactions mmt
                WHERE
                        mmt.inventory_item_id = bic.component_item_id
                    AND
                        mmt.organization_id = bom.organization_id
            ) onhand_quantity,
            bic.supply_type,
            bom.assembly_type,
            (
                SELECT
                    description
                FROM
                    apps.mtl_system_items_b
                WHERE
                        inventory_item_id = bom.assembly_item_id
                    AND
                        organization_id = bom.organization_id
            ) current_parent_desc,
            (
                SELECT
                    description
                FROM
                    apps.mtl_system_items_b
                WHERE
                        inventory_item_id = bic.component_item_id
                    AND
                        organization_id = bom.organization_id
            ) child_item_desc
        FROM
            (
                SELECT
                    assembly_item_id,
                    organization_id,
                    bill_sequence_id,
                    assembly_type
                FROM
                    apps.bom_bill_of_materials
                WHERE
                        organization_id = 82
                    AND
                        alternate_bom_designator IS NULL
                    AND
                        assembly_type = 1
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
                        2,
                        'Assembly Pull',
                        3,
                        'Operation Pull',
                        6,
                        'PHANTOM',
                        wip_supply_type
                    ) supply_type
                FROM
                    apps.bom_inventory_components
                WHERE
                        trunc(effectivity_date) <= trunc(SYSDATE)
                    AND
                        disable_date IS NULL
            ) bic
        WHERE
                bom.bill_sequence_id = bic.bill_sequence_id
            AND
                bom.organization_id = 82
            AND
                component_quantity > 0
        CONNECT BY
            PRIOR bic.component_item_id = bom.assembly_item_id
        START WITH bom.assembly_item_id IN (
        select distinct inventory_item_id from apps.mtl_system_items_b where segment1 in(  '14705501','24805012','24705016'))
    ORDER BY 1,5
    ) x

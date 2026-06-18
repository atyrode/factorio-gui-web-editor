# Core Picker Contract

Entry condition: the opened turret has no installed Veteran Core.

Primary job: choose one exact Veteran Core and install it into this turret.

The Core Picker intentionally stays close to the best existing direction:
source controls, filter/sort controls, and a compact exact-core table. It does
not instantiate the installed workbench and does not show progression editing.

## Required Anchors

- `turret_xp_core_picker`
- `turret_xp_core_picker_header`
- `turret_xp_core_picker_source`
- `turret_xp_core_picker_filter_sort`
- `turret_xp_core_picker_table`
- `turret_xp_core_picker_empty_state`

## Layout Contract

```text
--------------------------------------------------------------+
| [Picker Header: slot, instruction, copied target if any]    |
+--------------------------------------------------------------+
| [Source] Inventory | Platform        [available count]      |
| [Filters] All Base Sniper Machine Gun Bulwark Brawler       |
| [Sort] Level Name Role HP Attack Range                      |
+--------------------------------------------------------------+
| [Core Table: capped rows before scrolling]                  |
| Slot | Level | Name | Role | HP | Attack | Range | Install |
+--------------------------------------------------------------+
```

## Rules

- Source controls are visible only when both inventory and platform sources can
  matter. Inventory remains the default.
- Filters are compact controls, not a separate sidebar.
- Sort state is visible in the active sort header.
- Preview stats are neutral text. They are not green deltas.
- Empty state appears inside the table body and names the active source/filter.
- Table height caps before scrolling, but short inventories do not leave a
  large empty slab.
- Install actions are row-local and exact to the represented core.

## Browser Prototype Fixtures

- `empty_no_cores`: shows the empty state.
- `empty_inventory_cores`: shows inventory rows and exact install buttons.
- `empty_platform_cores`: shows source switching and platform rows.

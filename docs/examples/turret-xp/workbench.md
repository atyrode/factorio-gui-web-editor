# Installed Workbench Contract

Entry condition: the opened turret has an installed Veteran Core.

Primary job: shape this core while seeing the consequences.

The workbench is not a tabbed dashboard. Progression editing and consequence
feedback are the main surface. Details, naming, label controls, and combat
history are secondary drawers.

## Required Anchors

- `turret_xp_installed_workbench`
- `turret_xp_workbench_header`
- `turret_xp_core_slot`
- `turret_xp_xp_bar`
- `turret_xp_mode_bar`
- `turret_xp_build_plan_toggle`
- `turret_xp_follow_build_toggle`
- `turret_xp_progression_editor`
- `turret_xp_progression_core_upgrades`
- `turret_xp_progression_role_path`
- `turret_xp_progression_elements`
- `turret_xp_progression_augments`
- `turret_xp_stat_inspector`
- `turret_xp_detail_drawer`
- `turret_xp_core_details_drawer`

## Layout Contract

```text
+------------------------------------------------------------------+
| [Workbench Header] slot, name, level, XP, budgets, actions       |
+------------------------------------------------------------------+
| [Mode Bar] Live | Build Plan   Follow build   target status      |
+------------------------------------------+-----------------------+
| [Scroll: Progression Editor]             | [Pinned: Stat         |
| Budget strip                             |  Inspector]           |
| Core upgrades                            | key stat values       |
| Role path                                | changed values        |
| Elements                                 | details action        |
| Augments                                 |                       |
+------------------------------------------+-----------------------+
| [Drawers open intentionally below or beside body when needed]    |
+------------------------------------------------------------------+
```

## Rules

- The header is persistent. It owns identity, XP, budgets, Extract, Bind, and
  Details entry points.
- The Mode Bar is persistent. It owns Live/Build Plan, Follow build, and copied
  target warnings.
- The Progression Editor is the primary scroll region.
- The Stat Inspector is pinned outside the editor scroll region.
- Rank controls update the inspector immediately in the browser prototype.
- Core Details owns name, label toggles, and color controls. It is closed by
  default.
- Detail Drawer owns full stats/history. It is closed by default.
- No Overview tab, Stats tab, Automation tab, or hidden Progression tab exists
  in the accepted workbench shape.

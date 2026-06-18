# Stat Inspector Contract

The Stat Inspector is the pinned consequence panel for the Installed Workbench.

Primary job: make progression changes legible while the player edits them.

## Required Anchors

- `turret_xp_stat_inspector`
- `turret_xp_stat_damage`
- `turret_xp_stat_dps`
- `turret_xp_stat_range`
- `turret_xp_stat_hp`
- `turret_xp_stat_resistance`
- `turret_xp_stat_crit`
- `turret_xp_stat_ammo`

## Rules

- The inspector is visible in live and Build Plan modes.
- It is outside the Progression Editor scroll pane.
- It does not own rank controls.
- It does not own long formulas or combat history.
- It shows numeric deltas in Build Plan mode.
- It reserves green for beneficial deltas and red for harmful deltas.
- It keeps unchanged values neutral.
- It exposes a Details action for full stat groups and history.

## Minimum Stat Set

The pinned set must include:

- damage or the best available damage proxy;
- estimated DPS or attack throughput;
- shooting speed;
- range;
- HP;
- shield when relevant;
- resistance;
- crit chance and crit damage when relevant;
- ammo/productivity state when relevant.

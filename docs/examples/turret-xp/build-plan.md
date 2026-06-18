# Build Plan Mode Contract

Build Plan is a mode of the Installed Workbench. It is not a separate screen,
tab, or isolated automation page.

Primary job: edit the intended target build while comparing current values to
planned values.

## Required Anchors

- `turret_xp_mode_bar`
- `turret_xp_build_plan_toggle`
- `turret_xp_follow_build_toggle`
- `turret_xp_progression_editor`
- `turret_xp_stat_inspector`
- `turret_xp_build_plan_delta`
- `turret_xp_build_conflict`

## Rules

- Switching to Build Plan keeps the Progression Editor and Stat Inspector in
  place.
- Rank steppers mutate planned ranks instead of live ranks.
- Rows show live and planned rank context where it reduces ambiguity.
- The Stat Inspector shows current -> planned values for changed stats.
- Follow build remains visible while editing the plan.
- Copied-target conflicts appear on the affected row or group.
- Compatible rows remain editable when one group has a conflict.

## Browser Prototype Fixtures

- `build_plan_unspent`: no conflict, stat deltas visible.
- `copied_target_conflict`: role conflict visible on Role Path, core upgrades
  remain editable.

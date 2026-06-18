# Browser Prototype Contract

The browser prototype is a design lab, not the shipped mod GUI. It exists so
the team can review visual direction before writing or rewriting Factorio Lua
GUI code.

Tool location: [../../../index.html](../../../index.html)

Longer-term builder and shared-renderer ideas are tracked in
[../../roadmap.md](../../roadmap.md). This prototype should
leave room for that direction without trying to implement it all at once.

## Purpose

- Render the split GUI spec with named fixtures.
- Use Factorio-inspired component tokens derived from public Factorio web,
  Mod Portal, API docs, and Factorio GUI constraints.
- Make progression edits update the pinned Stat Inspector immediately.
- Let reviewers check empty picker, live workbench, Build Plan, conflicts, and
  drawers without launching Factorio.
- Create a stable target that can later be translated into Factorio GUI
  primitives.

## Non-Goals

- It is not a no-code editor.
- It is not a production web app.
- It does not replace graphical in-game screenshot review.
- It does not copy Wube CSS or image assets into this repository.
- It does not implement Lua behavior in this branch.

## Builder Direction

A future no-code-adjacent builder is possible, but it MUST be constrained by a
Factorio-aware component model. The builder should edit a Factorio GUI layout
AST, not arbitrary HTML/CSS. Freeform pixel dragging is rejected as the first
builder direction because Factorio GUI is flow/table/style driven, not browser
absolute positioning.

Accepted future builder capabilities:

- reorder major spec components;
- choose approved layout variants;
- tune bounded widths, density, and drawer placement;
- edit fixture data;
- validate primitive constraints continuously;
- export a JSON and Markdown layout model;
- export a Lua skeleton with named anchors and TODO behavior hooks.

Rejected first-pass builder capabilities:

- arbitrary pixel positioning;
- arbitrary nested boxes without component contracts;
- CSS-only layout choices that cannot translate to Factorio GUI primitives;
- generated Lua that pretends behavior wiring is complete.

## Required Fixtures

- `empty_no_cores`
- `empty_inventory_cores`
- `empty_platform_cores`
- `installed_level_100_unspent`
- `build_plan_unspent`
- `copied_target_conflict`

## Required Prototype Behaviors

- Fixture picker changes the rendered screen.
- Core Picker source/filter/sort controls update the table.
- Live mode rank steppers update ranks, budgets, and Stat Inspector values.
- Build Plan rank steppers update planned ranks and current -> planned deltas.
- Role choices update the inspector so specialization tradeoffs are visible.
- Follow build can be toggled while progression remains visible.
- Detail and Core Details drawers open intentionally from the workbench.
- Prototype state can later be serialized into a constrained layout model.

## Validation Contract

The lightweight repository check must prove:

- prototype files exist;
- JavaScript parses;
- required anchors are present in source;
- required fixtures are present;
- the prototype does not vendor copied Factorio CSS/image payloads;
- `scripts/check.sh` runs the prototype check.

Human review must still judge taste, spacing, hierarchy, and resemblance to
Factorio's real GUI.

## Stop Conditions

Stop and revise the spec/prototype before Lua work if:

- the prototype resembles the old two-column dashboard;
- the prototype resembles the failed focused-tabs dashboard;
- editing progression hides the affected stats;
- Build Plan feels like a separate screen;
- the empty picker regresses from the table-first shape;
- controls or rows clip at normal review sizes;
- visual feedback relies on large blank panels or decorative cards.

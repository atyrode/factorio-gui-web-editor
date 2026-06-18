# Factorio GUI Web Editor

A browser-based lab for designing Factorio-style mod GUIs before writing Lua.

The current app is a static prototype seeded with the Turret XP GUI redesign as
the first example project. The longer-term goal is a constrained editor that
works with Factorio GUI primitives, validates layouts against Factorio-style
constraints, and can eventually export a layout model or Lua skeleton.

## Try It Locally

No build step is required.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/
```

Opening `index.html` directly also works in most browsers.

## What Exists Now

- Static browser renderer for the Turret XP example.
- Fixture picker for representative GUI states.
- Factorio-inspired local CSS token layer.
- Progression editing with immediate stat-inspector feedback.
- Build Plan mode with current-to-planned stat deltas.
- Empty Core Picker, installed Workbench, conflict, and drawer examples.
- Structural checks for required fixtures, anchors, source files, and forbidden
  copied Factorio asset payloads.

## Project Shape

```text
index.html                     Static app entry point
src/app.js                     Browser renderer and interactions
src/styles.css                 Factorio-inspired local token/style layer
examples/turret-xp/fixtures.js Default example data model
docs/spec-factory.md           Workflow for writing agent-readable GUI specs
docs/roadmap.md                Builder/shared-renderer roadmap
docs/factorio-style-sources.md Style/source research notes
docs/examples/turret-xp/       Current example product spec
scripts/check.sh               Local validation
```

## Design Direction

This should not become a freeform pixel editor. Factorio GUI layout is based on
flows, frames, tables, scroll panes, sprite buttons, labels, checkboxes, styles,
stretch flags, and fixed-size constraints. A useful editor must preserve those
constraints rather than letting the browser become the source of truth.

Accepted future directions:

- fixture editing;
- constrained layout variants;
- component reordering;
- density and bounded-size tuning;
- JSON layout-model export;
- Markdown spec diff export;
- Lua skeleton export with stable anchors and TODO behavior hooks;
- graphical Factorio style-dump imports for script-visible `LuaGuiElement` and
  `LuaStyle` fields;
- eventual shared model for browser preview, Lua structure, and read-only web
  demos where feasible.

Rejected first-pass directions:

- arbitrary x/y dragging;
- arbitrary nested boxes with no Factorio primitive equivalent;
- generated Lua that pretends behavior wiring is complete;
- vendoring Wube CSS, minified page styles, or Factorio image assets.

## Sources

Authoritative behavior should come from official Factorio documentation:

- <https://lua-api.factorio.com/latest/>
- <https://lua-api.factorio.com/latest/classes/LuaGuiElement.html>
- <https://lua-api.factorio.com/latest/classes/LuaStyle.html>
- <https://lua-api.factorio.com/latest/concepts/GuiElementType.html>

High-value style and architecture references:

- <https://man.sr.ht/~raiguard/factorio-gui-style-guide/>
- <https://mods.factorio.com/mod/flib>
- <https://mods.factorio.com/mod/EditorExtensions>
- <https://mods.factorio.com/mod/Krastorio2>
- <https://codeberg.org/raiguard>
- <https://github.com/ClaudeMetz/UntitledGuiGuide/wiki>
- <https://github.com/JanSharp/FactorioGUIEditor>

Use public references to derive local tokens and constraints. Do not copy
copyrighted Wube assets into this repository.

## Validation

```sh
scripts/check.sh
```

The check validates JavaScript syntax when `node` is available and then runs
structural source/fixture/anchor checks. It does not replace human visual
review.

## License

No license has been selected yet. Treat the repository as source-available
until a license is explicitly added.

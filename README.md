# Factorio GUI Web Editor

A browser-based lab for designing Factorio-style GUI layouts before writing Lua.

The current app is intentionally bare. It starts with an empty canvas and can
create one Factorio-like window shell with a title bar, drag-handle strip, and
empty body. There is no bundled example project or fixture data.

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

- Static browser app with an empty canvas.
- A minimal window creator with editable title text.
- Factorio-inspired local CSS token layer.
- Stable anchors for the editor canvas and generated window shell.
- Structural checks for required files, anchors, and forbidden copied Factorio
  asset payloads.

## Project Shape

```text
index.html                     Static app entry point
src/app.js                     Bare window editor interactions
src/styles.css                 Factorio-inspired local token/style layer
docs/spec-factory.md           Workflow for writing agent-readable GUI specs
docs/roadmap.md                Builder/shared-renderer roadmap
docs/factorio-style-sources.md Style/source research notes
scripts/check.sh               Local validation
```

## Design Direction

This should not become a freeform pixel editor. Factorio GUI layout is based on
frames, flows, tables, scroll panes, sprite buttons, labels, checkboxes, styles,
stretch flags, and fixed-size constraints. A useful editor must preserve those
constraints rather than letting browser CSS become the source of truth.

Accepted future directions:

- create and configure Factorio GUI primitives;
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
- vendoring Wube CSS, minified page styles, or Factorio image assets;
- bundled domain examples in the editor core.

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
structural source/anchor checks. It does not replace human visual review.

## License

No license has been selected yet. Treat the repository as source-available until
a license is explicitly added.

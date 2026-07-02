# Factorio GUI Web Editor

A browser-based lab for designing Factorio-style GUI layouts before writing Lua.

The current app is intentionally bare. It starts with an empty canvas and can
create one Factorio-like window shell with a title bar, drag-handle strip, and
empty body. There is no bundled example project or fixture data.

## Try It Locally

```sh
npm install
npx playwright install chromium
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

## What Exists Now

- React/Vite browser app with an empty canvas.
- A minimal window creator with editable title text.
- A structured seed GUI model shared by preview, inspector, and Lua output.
- A structured design-file download/import path for tool-authored layouts.
- A one-click local Factorio preview mod export from the same Lua output.
- A `/style-atlas` route that renders reusable GUI atoms for visual review.
- Header navigation with styled in-app pages rendered from the project
  Markdown docs, plus an Editor tab to return to the canvas.
- Factorio-inspired local CSS token layer split by base, layout, GUI atoms,
  editor, docs, and atlas surfaces.
- Stable anchors for the editor canvas and generated window shell.
- Structural checks for required files, anchors, and forbidden copied Factorio
  asset payloads.

## Project Shape

```text
index.html                     Vite app entry point
src/App.jsx                    Route orchestration
src/components/                Strictly scoped React components
src/docs.js                    Markdown-backed document route registry
src/factorioModel.js           Structured Factorio GUI seed model and inspector rows
src/factorioExport.js          Lua export projection from the GUI model
src/factorioDesignFile.js      Durable design-file import/export schema
src/factorioEditorApi.js       Script/test command API over the constrained model
src/factorioEditorApiDescription.js Machine-readable API command/atom contract
src/factorioEditorApiSummary.js Machine-readable API state summaries
src/factorioModExport.js       Factorio preview mod zip projection from the Lua export
src/main.jsx                   React mount and stylesheet import
src/styles.css                 Stylesheet entry point
src/styles/                    Split Factorio-inspired local style layers
docs/spec-factory.md           Workflow for writing agent-readable GUI specs
docs/model-schema.md           Shared GUI model and inspector projection notes
docs/scriptable-api.md         Browser and headless command API notes
docs/factorio-mod-export.md    Local Factorio preview mod export workflow
docs/roadmap.md                Builder/shared-renderer roadmap
docs/factorio-style-sources.md Style/source research notes
examples/api/                  Scriptable API command/design examples
scripts/check.sh               Local validation
scripts/editor-api.mjs         Headless command API runner
scripts/copy-static-docs.mjs   Copies Markdown docs into production builds
tests/browser/                 Browser geometry regression tests
```

## Public Dev Mode

The production compose file serves a static Caddy bundle. For development on
`labtorio.tyrode.dev`, run the Vite override:

```sh
docker compose -f compose.yaml -f compose.dev.yaml up -d
```

The override keeps the same internal `labtorio:8080` target used by the edge
proxy, but serves Vite with HMR configured for
`wss://labtorio.tyrode.dev/@vite-hmr`.
It stores container `node_modules` and Vite cache data in Docker named volumes
so hot reload does not leave host checkout files owned by the container user.
Public deployments are plain static-app deployments behind the shared edge
proxy; see [docs/hosting.md](docs/hosting.md) for the network boundary.

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
- structured design-file import/export for tool-authored layouts;
- local script/test command API for constrained layout generation;
- Markdown spec diff export;
- Lua skeleton export with stable anchors and TODO behavior hooks;
- local Factorio preview mod export for GUI parity checks;
- graphical Factorio style-dump imports for script-visible `LuaGuiElement` and
  `LuaStyle` fields;
- style-atlas review against official site references and in-game `Ctrl+F6`
  captures;
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
- <https://lua-api.factorio.com/latest/prototypes/GuiStyle.html>
- <https://lua-api.factorio.com/latest/types/StyleSpecification.html>

High-value style and architecture references:

- <https://github.com/wube/factorio-data>
- <https://github.com/wube/factorio-data/blob/master/core/prototypes/style.lua>
- <https://wiki.factorio.com/Data.raw>
- <https://wiki.factorio.com/Command_line_parameters>
- <https://man.sr.ht/~raiguard/factorio-gui-style-guide/>
- <https://mods.factorio.com/mod/flib>
- <https://mods.factorio.com/mod/EditorExtensions>
- <https://mods.factorio.com/mod/Krastorio2>
- <https://codeberg.org/raiguard>
- <https://github.com/ClaudeMetz/UntitledGuiGuide/wiki>
- <https://github.com/JanSharp/FactorioGUIEditor>

Use public references to derive local tokens and constraints. Do not vendor Wube
image assets or graphical sets into this repository.

## Validation

```sh
scripts/check.sh
```

The check builds the app, runs browser geometry regressions, verifies layout
tree behavior, and runs structural source/anchor checks. Browser tests protect
objective layout contracts; they do not replace human visual review.

## Scriptable API

For local scripts and test harnesses, the app exposes a constrained
`labtorio-editor-api.v0` command API. In the browser it is available as
`window.labtorioEditorApi`; from Node use:

```sh
npm run api:run -- --commands commands.json
```

Use `npm run api:run -- --describe --pretty` to inspect supported commands,
atoms, parent rules, output flags, and result envelopes. Checked-in examples in
`examples/api/` show both creating a layout from commands and revising an
existing design file.

It can create/edit layouts, return structured diagnostics and
machine-readable summaries, export design JSON or Lua, and leave browser-run
results in the normal editor UI for operator review. It is not a remote-control
server. See [docs/scriptable-api.md](docs/scriptable-api.md).

## Factorio Preview Mod

Use `Download design` in the export drawer to save the editable structured
layout as a `*.labtorio-gui.json` file. Use `Import` there to restore either
that raw design file or a tool-authored preview/mod zip containing
`labtorio-gui-package.json` and `design.labtorio-gui.json`. This is the
supported round-trip format; it can preserve validated hook/action metadata,
but it is not a Lua decompiler for arbitrary Factorio mods.

After creating a Window, use `Download mod` in the Lua Output panel to download
a local `labtorio_gui_preview_0.1.0.zip`. Copy it to the Factorio mods
directory and enable it to compare the current browser layout against the
in-game GUI. See [docs/factorio-mod-export.md](docs/factorio-mod-export.md).

## Hosting

The app can run as an internal Docker service behind a shared Caddy edge proxy.
The Docker image builds the React app and serves the static bundle through
Caddy. See [docs/hosting.md](docs/hosting.md) for the `labtorio.tyrode.dev`
deployment shape and the reason this repository does not bind host ports `80`
or `443`.

## License

No license has been selected yet. Treat the repository as source-available until
a license is explicitly added.

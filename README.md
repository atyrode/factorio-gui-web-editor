# Factorio GUI Web Editor

A browser-based lab for designing Factorio-style GUI layouts before writing Lua.

The current app is intentionally bare. It starts with an empty canvas and can
create one Factorio-like window shell with a title bar, drag-handle strip, and
empty body. There is no bundled example project or fixture data.

## Try It Locally

```sh
npm install
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
src/main.jsx                   React mount and stylesheet import
src/styles.css                 Stylesheet entry point
src/styles/                    Split Factorio-inspired local style layers
docs/spec-factory.md           Workflow for writing agent-readable GUI specs
docs/model-schema.md           Shared GUI model and inspector projection notes
docs/roadmap.md                Builder/shared-renderer roadmap
docs/factorio-style-sources.md Style/source research notes
scripts/check.sh               Local validation
scripts/copy-static-docs.mjs   Copies Markdown docs into production builds
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
Public deployments require Basic Auth credentials in a local `.env`; see
[docs/hosting.md](docs/hosting.md) for the hash generation and edge proxy
boundary.

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

## Hosting

The app can run as an internal Docker service behind a shared Caddy edge proxy.
The Docker image builds the React app and serves the static bundle through
Caddy. See [docs/hosting.md](docs/hosting.md) for the `labtorio.tyrode.dev`
deployment shape and the reason this repository does not bind host ports `80`
or `443`.

## License

No license has been selected yet. Treat the repository as source-available until
a license is explicitly added.

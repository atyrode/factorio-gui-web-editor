# Repository Instructions

These instructions apply to the Factorio GUI Web Editor repository. Global
agent behavior, source-control safety, generic secret handling, and baseline
validation discipline come from the global Codex AGENTS file.

## Project Context

- This project builds a browser tool for designing Factorio-style GUI layouts
  before writing Lua.
- The current app is a React/Vite static browser app with a constrained editor,
  style atlas, Markdown-backed docs pages, Lua output, and local Factorio
  preview mod export.
- Use Node.js 24.x. CI uses Node 24, and the public dev container uses
  `node:24-trixie-slim`.
- The source of truth is the structured Factorio GUI layout model, not browser
  CSS, arbitrary pixel dragging, or inspector text.
- The editor core should stay free of bundled domain examples. Future examples
  belong outside the core model and renderer.

## Repository Layout

- `README.md`: project overview, local dev commands, app shape, design
  direction, source references, validation, preview mod export, and hosting.
- `src/App.jsx`: route orchestration.
- `src/components/`: scoped React components for editor, docs, atlas, and site
  chrome.
- `src/factorioModel.js`: structured seed GUI model and inspector projection.
- `src/factorioExport.js`: Lua export projection from the GUI model.
- `src/factorioModExport.js`: local Factorio preview mod zip export.
- `src/factorioAtomModel.js` and `src/factorioAtomRegistry.js`: atom model and
  implementation-tracker source.
- `src/styles/`: split local style layers for base, layout, atoms, editor,
  docs, and atlas surfaces.
- `docs/`: spec factory, model schema, roadmap, atom specs, style-source notes,
  no-code builder spec, Factorio mod export notes, and hosting docs.
- `scripts/check.sh`: local validation entrypoint.
- `tests/browser/`: Playwright geometry and layout regression tests.
- `.github/workflows/ci.yml`: pull request and `main` CI.

## Local Rules

- Preserve Factorio GUI constraints. Do not turn the editor into a freeform
  pixel/CSS layout builder.
- Prefer model changes that can later project to browser DOM and Factorio Lua
  structure from the same source.
- Do not vendor Wube CSS, minified page styles, Factorio image assets, sprite
  sheets, or other copyrighted assets.
- Public references may guide architecture and styling, but turn observations
  into local tokens, constraints, and cited notes rather than copied assets.
- Keep stable anchors and IDs for elements that specs, structural checks,
  browser tests, Lua export, or future Factorio comparisons need to inspect.
- Keep browser code dependency-light until a dependency clearly earns its cost.
- Structural checks do not replace visual review for nuanced GUI work.

## Factorio GUI Research

- Official Factorio API docs are authoritative for runtime behavior.
- Public `wube/factorio-data` style definitions are the preferred public source
  for base GUI style names, inheritance, and declarative prototype fields.
- Raiguard's Factorio GUI style guide is a high-value community style reference
  for Factorio-like composition and inspection workflow.
- Cite exact inspected pages, repositories, files, captures, or docs before
  turning observations into durable project rules.
- Use graphical Factorio for visual inspection:
  - `Ctrl+F6`: GUI style inspector;
  - `Ctrl+F5`: bounding boxes;
  - `Ctrl+F7`: shadow toggle.
- Factorio headless cannot provide graphical style-inspector overlays. A
  graphical companion mod may dump script-visible GUI/style fields, but
  renderer-computed overlay fields still need graphical inspection.

## Visual Work

- For nuanced visual work with overlapping model, styling, shadow, or layout
  concerns, create or update an owning issue or doc section with acceptance
  criteria before implementation.
- Keep acceptance criteria tied to user-visible language, reference crops,
  named anchors, and measurable geometry rather than inferred abstractions only.
- Do not mark visual work complete without fresh screenshot evidence for the
  requested states, including shadow-disabled captures when Factorio `Ctrl+F7`
  behavior is part of the request.
- Inspection toggles and structural checks are aids; they are not completion
  unless the tracked criteria explicitly define them as the deliverable.

## Documentation

- `docs/spec-factory.md` owns the workflow for writing implementation-ready GUI
  specs before changing renderer, editor, or Lua-export code.
- `docs/model-schema.md` owns the shared GUI model and inspector projection
  rules.
- `docs/atom-specs.md` owns the evidence-to-model-to-renderer-to-Lua-export
  completion contract for each atom.
- `docs/roadmap.md` owns constrained builder, shared-renderer, export, and
  style-dump roadmap sequencing.
- `docs/factorio-style-sources.md` owns style/source research notes and
  inspection workflow.
- `docs/factorio-mod-export.md` owns the local Factorio preview mod export
  workflow.
- `docs/hosting.md` owns Docker/Caddy deployment boundaries for the static app
  behind a shared edge proxy.
- Update docs when changing architecture, workflows, validation, assumptions,
  model schemas, exported formats, hosting, or user-visible behavior.

## Verification

For current static app changes, run:

```sh
scripts/check.sh
```

That delegates to `npm run check`, which builds the app, runs layout-tree and
hover/drop geometry checks, runs `scripts/check-app.py`, and runs Playwright
browser tests.

Individual commands are:

```sh
npm run build
node scripts/check-layout-tree.mjs
node scripts/check-hover-drop-geometry.mjs
python3 scripts/check-app.py
npm run test:browser
```

CI installs npm dependencies, installs Chromium with Playwright dependencies,
and runs `scripts/check.sh`.

## Hosting

- The app is intended to be publicly reachable as a static app, without an
  application login, analytics, or telemetry layer.
- The app container serves the built React bundle on Docker-only port `8080`.
- Keep public host ports `80` and `443` owned by one neutral edge proxy, not by
  this app repository.
- Public deployment routes `labtorio.tyrode.dev` through the shared edge proxy
  to the internal app service.
- For visible styling work, the Vite dev override can serve HMR through the
  public HTTPS route; rebuild the static container before treating it as
  production again.

## Known Caveats

- Browser geometry tests protect objective layout contracts, but human visual
  review still owns Factorio-style parity.
- Vanilla GUI captures are internal reconstruction evidence, not user-facing
  presets for the current build-from-scratch editor direction.
- The repository has no selected license yet; treat it as source-available
  until a license is explicitly added.

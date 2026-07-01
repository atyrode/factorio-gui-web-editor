# Documentation

The primary app header renders the spec factory, roadmap, atom specs, model
schema, and style source notes as styled in-app pages. The Markdown files
remain the source of truth.

- [spec-factory.md](spec-factory.md): how to write implementation-ready GUI
  specs before changing renderer or export code.
- [no-code-layout-builder.md](no-code-layout-builder.md):
  product spec for constrained Frame and Flow insertion.
- [roadmap.md](roadmap.md): constrained builder, shared renderer, export, and
  graphical Factorio style-dump roadmap.
- [atom-specs.md](atom-specs.md): completion contract for reconstructing
  Factorio GUI atoms across evidence, model, renderer, inspector, Lua export,
  behavior, validation, and tracking.
- [model-schema.md](model-schema.md): structured GUI model shared by preview,
  inspector, and Lua export.
- [scriptable-api.md](scriptable-api.md): constrained browser and headless API
  for scripted layout generation.
  See `../examples/api/` for command/design files used by tests and docs.
- [factorio-mod-export.md](factorio-mod-export.md): local Factorio preview mod
  export loop for comparing the current editor model in-game.
- [factorio-style-sources.md](factorio-style-sources.md): source notes for
  Factorio-like styling, public references, and inspection workflows.
- [hosting.md](hosting.md): Docker and Caddy deployment boundary for hosting
  the static app behind a shared edge proxy.

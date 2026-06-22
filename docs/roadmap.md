# Browser Builder And Shared Renderer Roadmap

This roadmap captures the standalone editor direction. It is aspirational, but
concrete enough to split into future issues. The current static app does not
need to complete every phase.

## End State

The strongest long-term target is one shared Factorio GUI layout model that can
drive three surfaces:

1. a browser design and review tool for fast iteration;
2. a Factorio Lua GUI skeleton or implementation for a selected layout,
   including a quick local preview mod wrapper for in-game comparison;
3. a read-only or lightly interactive web demo for a selected layout.

The ideal is not just visual similarity. The ideal is that browser and in-game
UI are generated from the same constrained model, with explicit places where
Factorio and browser behavior cannot be perfectly identical.

Per-atom reconstruction work follows [atom-specs.md](atom-specs.md). That
document owns the evidence-to-model-to-renderer-to-Lua-export completion
contract for each atom.

## Core Principle

The builder must edit a Factorio GUI layout model, not arbitrary browser layout.

Factorio GUI is based on primitives such as frames, flows, tables, scroll panes,
sprite buttons, labels, checkboxes, text fields, and styles. Browser CSS can
emulate many of those, but browser CSS should not become the source of truth. The
model should be closer to Factorio's GUI API than to Figma,
absolute-positioned DOM, or a general web page builder.

## Why Freeform Dragging Is Rejected First

Freeform pixel dragging is likely to produce layouts that look acceptable in a
browser but translate poorly to Factorio. Known risks:

- Factorio layout is flow/table/style driven, not absolute-position driven.
- Stretch flags and fixed sizes can interact in surprising ways.
- Scroll panes can clip differently from browser overflow containers.
- Some compound elements expose click events differently than their visual child
  structure suggests.
- Native Factorio styles carry behavior and sizing assumptions that CSS can only
  approximate.

This does not mean a no-code-like tool is impossible. It means the tool must
offer constrained operations that preserve translatability.

## Accepted Builder Operations

The first implemented no-code slice is the constrained layout builder described
in [no-code-layout-builder.md](no-code-layout-builder.md). It
adds a Builder panel, draggable Frame, Horizontal Flow, and Filler palette
items, ordered body/nested insertion, subtree removal, Headless Tree-backed
component-tree drag/drop, canvas ghost previews, recursive preview, inspector
projection, authored layout settings with reset, and Lua export. It still edits
only the constrained Factorio GUI model. Browser geometry regressions are part
of this slice's acceptance gate: objective hover/drop layout bugs become
Playwright checks run by `scripts/check.sh` and CI.

Future builder operations SHOULD include:

- create a top-level window shell;
- edit frame title text;
- add approved Factorio GUI primitives;
- reorder major spec components;
- choose approved layout variants;
- toggle density modes;
- tune bounded widths, min/max sizes, and column counts;
- choose drawer, popup, or modal placement from approved positions;
- mark components pinned, scrollable, hidden, or drawer-owned;
- select local style tokens;
- validate constraints continuously;
- export a JSON layout model;
- export a Markdown spec diff;
- export a Lua skeleton with stable anchors and TODO behavior hooks;
- export a prompt pack an agent can use to implement the Lua slice.

Future builder operations SHOULD NOT include, at least initially:

- arbitrary x/y positioning;
- arbitrary nested boxes without component contracts;
- arbitrary CSS values with no Factorio equivalent;
- direct behavior generation beyond structural event hook placeholders;
- bundled domain examples as editor defaults.

## Shared Model Sketch

The shared model can start small. The first useful model is a top-level frame
with a title bar, reserved drag handle, and empty body.

```json
{
  "schema": "factorio-gui-layout.v0",
  "root": {
    "id": "gui_window",
    "primitive": "frame",
    "className": "agui::Window",
    "style": "inset_frame_container_frame",
    "derivedFrom": "frame",
    "direction": "vertical",
    "location": null,
    "referenceSize": {
      "width": 680,
      "height": 480,
      "contentWidth": 644,
      "contentHeight": 450
    },
    "styleReference": {
      "topPadding": 6,
      "rightPadding": 12,
      "bottomPadding": 12,
      "leftPadding": 12,
      "graphicalBorder": 6,
      "useHeaderFiller": true
    },
    "children": [
      {
        "id": "gui_window_titlebar",
        "primitive": "flow",
        "style": "frame_header_flow",
        "direction": "horizontal",
        "referenceSize": { "height": 48 },
        "styleReference": {
          "bottomPadding": 6,
          "horizontalSpacing": 12,
          "horizontallyStretchable": true,
          "verticallyStretchable": false
        },
        "children": [
          {
            "id": "gui_window_title",
            "primitive": "label",
            "style": "frame_title",
            "caption": "Untitled window",
            "addOptions": {
              "ignoredByInteraction": true
            }
          },
          {
            "id": "gui_window_drag_handle",
            "primitive": "empty-widget",
            "style": "draggable_space_header",
            "role": "header-filler"
          }
        ]
      },
      {
        "id": "gui_window_body",
        "primitive": "flow",
        "style": "inset_frame_container_horizontal_flow",
        "direction": "horizontal",
        "styleReference": {
          "horizontalSpacing": 18,
          "inheritedHorizontalSpacing": 6,
          "verticalSpacing": null,
          "maximumVerticalSquashSize": 540
        },
        "children": []
      }
    ]
  },
  "constraints": [
    "no_absolute_positioning",
    "titlebar_has_drag_handle",
    "header_filler_stretches",
    "body_is_window_content_flow",
    "no_bundled_domain_example"
  ]
}
```

The initial `680 x 480` reference size is an authored editor default, not a
vanilla GUI capture. The Window editor exposes width and height controls in the
New Window section while keeping vanilla captures as internal evidence, not
user-facing presets.

The first model does not need to represent all Factorio style fields. It should
represent the captured top-level `frame`, `frame_header_flow`,
`draggable_space_header`, and `inset_frame_container_horizontal_flow`
constraints well enough that
browser rendering, Lua skeleton generation, and agent-readable specs can stay in
sync.

## Constraint Catalog To Build

The builder needs a catalog of Factorio GUI constraints. Official Factorio API
docs are the authoritative source for engine behavior. Raiguard's Factorio GUI
style guide is the preferred community source for Factorio-like composition,
style naming, and inspection workflow. Older community documentation, including
`ClaudeMetz/UntitledGuiGuide`, may be used cautiously as supporting context when
it helps explain practical custom-GUI workflows. Raiguard's public Codeberg
repositories, especially `flib`, Editor Extensions, Krastorio 2, and GUI-heavy
utility mods, are a lead list for deeper architecture/style research; record
concrete conclusions only after inspecting the specific repository/file.

Initial entries:

- valid primitive types and their child rules;
- direction support for frames and flows;
- table column count and row-building rules;
- scroll-pane policy and maximum-size rules;
- stretchable versus fixed-size interaction risks;
- stable anchor and action-name requirements;
- style token mapping to Factorio style definitions, `flib`, or local styles;
- event-surface notes for frames, scroll panes, and compound controls;
- portability warnings where browser behavior cannot match Factorio exactly.

This catalog should be written before trying a sophisticated builder UI.

The in-game style tools belong in this catalog workflow. `Ctrl+F6` opens the GUI
style inspector in graphical Factorio and should be used to capture style names
and properties from vanilla and high-quality mod GUIs. `Ctrl+F5` shows bounding
boxes and `Ctrl+F7` toggles shadows; these are visual review aids, not headless
test inputs. Factorio headless cannot provide the style-inspector hover overlay
because it has no rendered GUI surface.

Automated text extraction is still possible in graphical Factorio. A companion
mod or debug remote can traverse an owned GUI tree and write a JSON dump with
`LuaGuiElement` data such as element type, name, caption, children, tags, root,
and assigned style plus readable `LuaStyle` fields such as style name,
width/height, natural/min/max dimensions, margins, padding, spacing, font,
colors, alignment, and stretch/squash flags. That dump should be captured next
to screenshot artifacts.

Do not mistake that dump for the full `Ctrl+F6` inspector. The inspector also
shows renderer-computed data such as hovered relative position, rendered size,
content size, clip size, size before stretching, derived-style resolution, and
child class/rendered-size summaries. Those computed overlay fields are not
documented `LuaGuiElement`/`LuaStyle` members and cannot be extracted from
Factorio headless through the normal mod API.

## Sequential Spike Plan

### Phase 0: Bare Window Shell

Status: current seed scope.

- Start with an empty canvas.
- Create one Factorio-like window shell on command with a chosen Horizontal
  Flow or Vertical Flow body.
- Render a title bar, drag-handle strip, and empty body.
- Use Factorio-inspired local tokens without copying Wube assets.
- Validate that no bundled domain example is required by the app.
- Maintain a style atlas route for atom-by-atom visual review before expanding
  editor features.

### Phase 1: Layout Model Export

Status: started. The editor now builds a small browser-cached window model with
anchors, primitives, captured frame constraints, style references, and optional
top-level screen location from header dragging.

- Serialize the current window shell into a JSON layout model.
- Include anchors, primitives, component ownership, and constraints.
- Add a Markdown export that explains the selected layout.
- Add validation that required anchors exist in the model.

### Phase 2: Lua Skeleton Export

Status: started. The editor shows a read-only generated `gui.lua` preview for
the current window shell and can download a local Factorio preview mod zip that
wraps that exact Lua output for manual in-game comparison. This is a quick
parity loop, not an automated screenshot harness.

- Generate structural Lua with named anchors.
- Emit TODO action hooks instead of pretending behavior is complete.
- Keep generated Lua and preview mods in scratch/export surfaces until reviewed.
- Document which parts are generated and which must be hand-authored.

### Phase 3: Constrained Builder UI

- Add controls for adding primitives, component reordering, layout variants,
  density, widths, and drawer placement.
- Validate every change against the constraint catalog.
- Reject or warn on combinations known to translate poorly to Factorio.

### Phase 4: Dual Renderer

- Render the same JSON model to browser DOM and Factorio Lua skeleton.
- Keep browser and Lua component names aligned.
- Add structural tests comparing model anchors to Lua GUI anchors.
- Start measuring where 1:1 parity is possible and where it is approximate.

### Phase 5: Read-Only Web Demo Surface

- Reuse the browser renderer in static exported/demo artifacts if licensing and
  package size remain acceptable.
- Keep it read-only unless editing has a clear user benefit.
- Use it to explain selected layouts without launching Factorio.

## Open Questions

- How much of Factorio style definitions can be represented without copying Wube
  assets or overfitting to one game version?
- Should the model target raw Factorio GUI primitives, `flib`, local helper
  primitives, or a layered mapping?
- How strict should 1:1 parity be before Lua implementation starts?
- Which visual differences are acceptable between browser and in-game output?
- Should generated Lua skeletons be committed, or treated as temporary build
  artifacts until reviewed?
- Can screenshot comparison later detect model drift, or should human visual
  review remain the only taste gate?

## Issue Tracking Checklist

- [x] Build the first bare browser window shell.
- [ ] Extract enforceable tokens/contracts from Raiguard's Factorio GUI style
      guide, including style-inspector workflow.
- [ ] Survey Raiguard's public Factorio repositories on Codeberg for GUI/style
      examples before deeper builder implementation.
- [ ] Review legacy GUI learning references, including
      `ClaudeMetz/UntitledGuiGuide`, against current official API docs.
- [ ] Capture graphical Factorio style-inspector notes for vanilla widgets that
      target GUIs want to mimic.
- [x] Capture top-level frame, header filler, and inside-frame constraints from
      graphical Factorio `Ctrl+F6` screenshots.
- [ ] Add a graphical-client GUI style dump beside future screenshot artifacts
      for script-visible `LuaGuiElement` and `LuaStyle` fields.
- [x] Add an in-memory layout model for the current top-level window shell.
- [x] Add a read-only generated Lua skeleton preview for the current shell.
- [x] Add a quick local Factorio preview mod export for the current Lua output.
- [ ] Add persisted layout model export.
- [ ] Add reviewed Lua skeleton export.
- [ ] Write the Factorio GUI constraint catalog.
- [ ] Add constrained builder controls.
- [ ] Add model-to-browser and model-to-Lua renderers.
- [ ] Add structural tests that compare model anchors and Lua anchors.
- [ ] Explore read-only demo/export reuse of the browser renderer.

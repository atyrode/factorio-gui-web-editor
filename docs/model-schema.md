# Factorio GUI Model

The editor uses one structured model as the source for browser preview, style
inspection, and Lua export. Browser CSS and inspector text are projections of
this model; they must not become the source of truth for Factorio layout.

## Current Schema

Schema id: `factorio-gui-layout.v0`

The in-app Model Schema page includes an interactive Atom Implementation
Tracker generated from `src/factorioAtomRegistry.js`. Atom records are
class-backed definitions from `src/factorioAtomModel.js`, not freeform display
objects. Add new editor primitives there as they become available.

Each atom field should include:

```text
name: stable field name
type: expected value type, such as integer, size2i, vector2i, rectangle2i, boolean, style-name
state: captured, inferred, editorOwned, hardcoded, missing, notImplemented, planned, or notApplicable
example: representative capture value, if known
source: capture id, fixture id, or documentation source
note: what we know and what we do not know yet
nullable: whether unknown/null is allowed while the atom is incomplete
```

Captured Ctrl+F6 screenshots should be transcribed into atom `captures`, with
typed rows and child rows. The tracker is allowed to show example values, but
values are evidence, not necessarily general constants. A field only becomes a
trusted model rule after enough captures, official docs, or an explicit
hardcoded-fixture decision.

Atom completion is the average of five explicit progress dimensions:

```text
evidence: in-game/API evidence captured and transcribed
model: represented in the structured editor model
renderer: browser preview implemented
luaExport: Factorio Lua structure/style export implemented
behavior: runtime interaction behavior modeled
```

The progress bar is segmented by those dimensions. The headline percentage is
only the average; it should never be read as "captured fields" or "1:1
Factorio parity" by itself.

Atom identity should name the reusable GUI component or reported class family,
not a style-specific role. Use names such as `Window`, `Horizontal Flow`,
`Vertical Flow`, `Label`, and `Filler`. Captured styles such as
`frame_header_flow`, `frame_title`, `draggable_space_header`,
`inside_deep_frame`, and `inset_frame_container_horizontal_flow` belong in the
atom `style`, `captures`, fields, and tracking notes. If two captures are the
same component class with different styles, keep them under one atom unless the
editor later proves they need separate component behavior.

The current seed model contains one top-level window:

```text
root agui::Window frame
|- agui::HorizontalFlow frame_header_flow
|  |- agui::Label frame_title
|  `- agui::Filler draggable_space_header
`- agui::HorizontalFlow inset_frame_container_horizontal_flow
```

The current Window reference uses the attached Blueprint Library capture as its
concrete box: outer size `1476 x 870`, content size `1440 x 840`, and clip size
`{{0, -4}, {1476, 874}}`. The model derives titlebar and body geometry from
that reference box plus the captured frame edge and padding values. This is a
reference atom, not a general layout solver for every top-level window width,
height, or side-frame variant.

The same Blueprint Library capture also shows optional header controls and body
children that are tracked but not yet implemented as editable/exportable child
atoms:

```text
root agui::Window inset_frame_container_frame
|- agui::HorizontalFlow frame_header_flow
|  |- agui::Label frame_title
|  |- agui::Filler draggable_space_header
|  |- SearchBar frame_action_button
|  |- agui::HorizontalFlow browse-arrow group
|  `- CloseButton close_button
`- agui::HorizontalFlow inset_frame_container_horizontal_flow
   |- agui::Frame
   |- FrameWithSubheader
   `- agui::VerticalFlow
```

The generic editor Window intentionally keeps optional header actions and body
children out of the baseline until those children have explicit model and export
rules. The tracker should keep these as planned variant work rather than hiding
them or adding them to every Window.

Each node should keep stable fields:

```text
id: stable anchor used by DOM, inspector, tree, and export
primitive: Factorio GUI primitive such as frame, flow, label, empty-widget
className: captured graphical inspector class when known
style: Factorio style name or local style reference
derivedFrom: captured derived style name when known
direction: Factorio layout direction when applicable
caption: user-visible text when applicable
location: explicit screen location only after dragging
referenceSize: captured or computed size facts for inspection
styleReference: captured Factorio style facts used by renderer/export
children: ordered child nodes
role: local semantic role only when the primitive needs extra meaning
```

The model also exposes `constraints`, which are named rules that must remain
true for the structure. Current constraints keep the frame top-level, avoid
freeform absolute positioning inside Factorio layout, require a draggable
titlebar, stretch the header filler, and keep the body as a vertical flow.

## Inspector Projection

The `Ctrl+F6`-style inspector reads model rows generated from structured node
facts. A row can carry metadata in addition to display text:

```text
label: displayed key
value: displayed value
indent: visual indentation level
tone: optional value color category
targetId: model node to preview on hover and open on click
preview: optional smart preview such as geometry measurement
editable: optional mutation target for values the editor owns
```

Missing known fields should still render as `not implemented` instead of being
omitted. This keeps gaps visible while the model is incomplete.

Inspector navigation uses `targetId` references. Hovering a child reference
temporarily highlights the target node in the preview; clicking it locks the
inspector to that node and pushes the previous node onto the back stack.
Back/forward stacks are transient UI state, not serialized model data. Only
inspector row traversal may build that history. Direct canvas clicks and
component-tree clicks are direct selection actions and must not push entries.

Geometry rows such as `size`, `content_size`, `clip_size`, and
`size_before_stretching` use `preview` metadata to draw a measured overlay on
the browser preview. The overlay is inspector chrome only and must not appear in
the model or Lua export.

Rows such as `maximal_height` may be captured runtime/layout metrics rather than
author-owned style assignments. They should be displayed when captured, but not
exported until the model has a rule for when Factorio expects them to be set.

Editable rows must be opt-in. They should mutate only values the editor model
actually owns. Captured Factorio style facts remain read-only until the model
defines how changing them maps to valid Factorio Lua/style behavior. The current
editable field is the title label caption; the root Window atom does not own a
caption field.

## Renderer And Export Boundary

The DOM renderer should render nodes by stable `id`/`data-anchor` and Factorio
primitive semantics. Renderer-only chrome, such as the painted frame edge or
measurement overlays, must not be added as model children.

Lua export should consume the model structure and style facts. Generated Lua is
a structural skeleton until behavior hooks and event wiring are explicitly
modeled.

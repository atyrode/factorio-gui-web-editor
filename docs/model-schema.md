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
state: captured, official, inferred, editorOwned, implemented, hardcoded, missing, notImplemented, planned, or notApplicable
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

Atom progress should come from named progress checks whenever an atom has enough
known scope to write them. Each check is `done`, `partial`, `todo`, or
`blocked`; the dimension percentage is derived from those check states. Older
or rougher atoms may still use manual percentages until their own completion
checks are written.

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

Horizontal Flow is the reusable horizontal layout atom behind the titlebar and
horizontal body rows. It maps to the official Factorio `flow` primitive with
`direction: "horizontal"`; Vertical Flow remains a separate atom. Frame is the
visible container atom used for body split children. Role-specific styles such
as `frame_header_flow`, `inset_frame_container_horizontal_flow`,
`inside_deep_frame`, and the captured 72 x 36 header action group are variant
data on their real atoms, not separate atom identities.

Current Horizontal Flow model nodes keep:

```text
primitive: flow
direction: horizontal
className: agui::HorizontalFlow
style: captured Factorio style name when known
role: local slot role, such as window-titlebar or window-body
styleReference: spacing, inherited spacing, padding, stretch/search flags
children: ordered child nodes or captured future child slots
```

The editor exports supported horizontal flows immediately as Factorio `flow`
Lua with stable `name`, `style`, `direction`, and explicit spacing/stretch
assignments where the API supports them. Captured values such as
`size_before_stretching`, `maximum_horizontal_squash_size`, clip rectangles,
and one-window fixture dimensions remain inspector/evidence data until a
layout-solver or additional in-game captures justify formulas.

The no-code builder persists only constrained layout specs under the current
Window, not hydrated renderer nodes:

```text
windowBodyDirection:
  selected body flow direction used by the next create/recreate Window action;
  one of horizontal or vertical

currentWindow.bodyDirection:
  generated Window body flow direction for this Window; one of horizontal or
  vertical

currentWindow.layoutChildren:
  id: gui_frame_N
  atom: frame
  styleVariant: inside-deep-frame
  children: ordered nested Horizontal Flow specs

nested Horizontal Flow specs:
  id: gui_horizontal_flow_N
  atom: horizontal-flow
  styleVariant: generic-horizontal-flow
  children: ordered nested Frame specs

currentWindow.nextLayoutNodeNumber:
  next positive integer used to allocate stable editor-created layout ids

currentWindow.luaVariableNames:
  optional map from exported node id to user-authored Lua local variable name;
  omitted entries use the generated default based on the stable node id
```

The editor also persists authored layout settings at the editor-state level.
These settings are project/editor assumptions, not captured Factorio defaults,
until official docs or in-game captures prove otherwise:

```text
layoutSettings.horizontalFlowSpacing:
  exported `horizontal_spacing` for editor-created Horizontal Flows

layoutSettings.horizontalFlowMinimumWidth:
  exported `minimal_width` for top-level editor-created Frames

layoutSettings.nestedHorizontalFlowMinimumWidth:
  exported `minimal_width` for nested editor-created Frames

layoutSettings.horizontalFlowMinimumHeight:
  exported `minimal_height` for editor-created Frames and Horizontal Flows

layoutSettings.horizontalFlowPadding:
  exported top/right/bottom/left padding for editor-created Horizontal Flows
```

The Settings panel lets those values be edited and reset to authored defaults.
Renderer CSS reads the hydrated model style facts through custom properties; it
does not store separate layout truth. Lua export writes the same supported
`LuaStyle` assignments so the current constrained layout builder slice remains
structurally compatible with the generated Lua skeleton.
Lua variable names are export-facing aliases only: they change generated local
identifiers in `gui.lua`, while stable node ids, DOM anchors, Inspector targets,
and Factorio element `name` fields stay unchanged.

Legacy cached windows normalize to an empty `layoutChildren` array with
`nextLayoutNodeNumber: 1`. Legacy root `horizontal-flow` specs normalize into
root Frame specs because the real-game content split is `HorizontalFlow` body
with direct `Frame` children. `gui_window_body` is still generated as the
non-deletable Window body flow in the hydrated model and Lua export; it is not
stored in `layoutChildren` because the Window shell owns that Factorio element.
The Builder tree shows that fixed body flow root so the component list matches
the Inspector and generated Lua structure. Editor-created root Frame specs
hydrate to `primitive: frame`, `style: inside_deep_frame`, and stretch flags
that make sibling Frames fill/split available space. Editor-created
`generic-horizontal-flow` specs hydrate to `primitive: flow`, `direction:
horizontal`, `style: horizontal_flow`, the current `layoutSettings` spacing and
padding values, and ordered Frame children. Legal parents alternate by primitive:
the Window body and Horizontal Flow nodes accept Frames, while Frame nodes accept
Horizontal Flows. The Window root, titlebar, title label, drag filler, a moved
node itself, and descendants of the moved node are not legal drop parents.

Window references are named records, not one anonymous hardcoded box. The
editor-created default is authored for the web preview at `680 x 480`, so a new
Window fits the canvas instead of copying one arbitrary in-game GUI instance.
New Window controls let the user adjust authored width and height from that
sensible default and choose the generated body flow direction before creating
or recreating the Window.
The model also carries in-game capture fixtures: the Blueprint Library capture
has outer size `1476 x 870`, content size `1440 x 840`, and clip size
`{{0, -4}, {1476, 874}}`; Factoriopedia and filter-selection references cover
full-height roots and horizontal/vertical body flow variants. The current
captures record their UI scale as Manual (pixels) `150%`; that context is
evidence, not a scale formula. The model derives titlebar and body geometry
from the selected reference plus the captured frame edge and padding values.
This is not yet a general layout solver for every top-level window width,
height, UI scale, or side-frame variant.

The capture fixtures are internal reconstruction evidence. The editor should
not expose vanilla GUI presets such as Blueprint Library or Factoriopedia in the
New Window flow for the current build-from-scratch product direction.

The frame edge in that derivation is a 6 px graphical band. It represents the
decorative Factorio chrome that surrounds framed or slotted content; it is
preserved by the browser renderer, but it is not a serialized child node or a
Lua style assignment.

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
children out of the rendered/exported baseline until those children have
explicit model and export rules. Window still owns the stable captured slots
for those children so later child atoms can be inserted without changing the
Window shell contract. The no-code interface now exposes the `Frame` atom
because it is the observed direct child used for body splits. Other body child
atoms should be exposed only after their own model and export rules exist.

For the Blueprint Library reference, the header slot math is captured:

```text
title label: [0, -4], 191 x 46
filler: [209, 0], 1045 x 36
SearchBar: [1272, 0], 36 x 36
browse-arrow group: inferred [1320, 0], 72 x 36
CloseButton: [1404, 0], 36 x 36
```

The filler position follows `191 title width + 12 header spacing + 6 left
margin`. The SearchBar and CloseButton positions then follow the filler width,
filler right margin, header spacing, and the browse-arrow group width.

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
titlebar, stretch the header filler, and keep the body as a Window content flow
whose direction/style comes from the selected reference.

`relative` fields are captured layout coordinates. For children they are local
to the parent layout: the Blueprint Library title label's `[0, -4]` matches its
`top_margin=-4`, and the filler `[209, 0]` follows title width plus spacing and
left margin. Root `relative` can vary by GUI/root container and is not used as
the exported screen `location`.

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
omitted. This keeps gaps visible while the model is incomplete. Child rows are
not missing when they reference an implemented atom: they should keep `targetId`
navigation and show the child atom identity, such as `flow.horizontal`, instead
of a missing-value placeholder.

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
defines how changing them maps to valid Factorio Lua/style behavior. Current
editable fields are the title label caption and `lua_variable_name` for exported
nodes. Lua variable names must be Lua-safe identifiers, cannot be reserved words,
and must not duplicate another exported node's effective variable name. Empty
`lua_variable_name` input resets that node to its generated default. The root
Window atom still does not own a visible caption field.

## Renderer And Export Boundary

The DOM renderer should render nodes by stable `id`/`data-anchor` and Factorio
primitive semantics. Renderer-only chrome, such as the painted frame edge or
measurement overlays, must not be added as model children.

Lua export should consume the model structure, style facts, and effective
`luaVariableName` values. Generated Lua local variables use the effective Lua
variable names, but every created Factorio element still uses the stable model
id as its `name`. Generated Lua is a structural skeleton until behavior hooks
and event wiring are explicitly modeled.

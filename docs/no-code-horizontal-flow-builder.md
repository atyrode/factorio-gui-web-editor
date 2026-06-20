# No-Code Frame And Horizontal Flow Builder Spec

This product spec covers the first no-code engine slice in the editor. It
implements constrained Frame insertion inside the current top-level Window body
flow, with Horizontal Flow insertion available inside Frames for nested layout.

## Problem Frame

The editor creates a Window shell by choosing the fixed body flow direction:
Horizontal Flow or Vertical Flow. The Window model then has two generated
top-level children: the horizontal titlebar flow and the chosen body flow.
Authored layout specs are inserted under that body flow. The next product job
is not a general page builder. It is a Factorio-safe no-code surface that
mutates the shared GUI model with approved primitives.

The real-game split reference is a Window body `agui::HorizontalFlow` whose
direct children are `agui::Frame` elements. The editor therefore treats Flow as
layout structure and Frame as the visible split/container atom.

Freeform pixel dragging remains out of scope. Drag/drop in this slice means
choosing a parent flow and ordered insertion index.

Drag/drop interaction plumbing uses `@dnd-kit/react`. The library owns pointer
tracking, drag source state, droppable collision, and overlay rendering. The
project still owns tree mutation because the persisted shape is a constrained
recursive Factorio layout tree, not a flat sortable list or arbitrary DOM
layout.

## User Jobs

- Create a top-level Window with a Horizontal Flow or Vertical Flow body.
- Add a Frame to the Window body.
- Add a nested Horizontal Flow inside a user-created Frame.
- Add a Frame inside a user-created Horizontal Flow.
- Reorder Frames across the body and compatible nested flows.
- Remove a Frame or Horizontal Flow subtree.
- Select a builder row and inspect the same model node in the inspector,
  Builder tree, canvas, and Lua output.
- Navigate implemented Frame and Horizontal Flow children from the Inspector.
  Child rows display `frame` or `flow.horizontal` and target the child node
  instead of using a missing placeholder.

## Information Architecture

The editor rail contains three pinned sections:

```text
[Window]
  title, width, height, create/recreate, body-flow toggle, reset

[Builder]
  [Palette: drag-only Frame]
  [Scroll: Window body tree]
    [Non-deletable Window body flow root]
    [Drop slots and ghost blocks under the root]
    [Child rows with add child, add after, remove]

[Inspector]
  Ctrl+F6 style inspector toggle
  Lua output toggle
  selected node details

[Settings]
  collapsed by default
  Frame and Horizontal Flow authored values
  Reset defaults
```

The canvas remains the visual preview. It accepts drops into the Window body
and into user-created Horizontal Flows. The Window header/titlebar is locked and
is not a builder drop target.

The Builder tree is the only structure navigator. It has a bounded height and
scrolls when nested flows would otherwise crowd the Inspector.

The Settings panel is the last section in the editor rail and is collapsed by
default. It owns authored Horizontal Flow assumptions until Factorio defaults
are proven. It currently controls generic flow spacing, top-level minimum
width, nested minimum width, minimum height, and padding.

## Data Contract

The Window panel has one create/recreate command. A nearby body-flow toggle
chooses whether that command creates a Window with a Horizontal Flow or Vertical
Flow body. The persisted editor state stores only constrained specs:

```json
{
  "windowBodyDirection": "horizontal",
  "currentWindow": {
    "bodyDirection": "horizontal",
    "layoutChildren": [
      {
        "id": "gui_frame_1",
        "atom": "frame",
        "styleVariant": "inside-deep-frame",
        "children": []
      }
    ],
    "nextLayoutNodeNumber": 2
  }
}
```

The model hydrates these specs into Factorio nodes only when rendering,
inspecting, or exporting. `bodyDirection` selects the generated
`gui_window_body` flow direction and style: horizontal bodies use
`inset_frame_container_horizontal_flow`, while vertical bodies use
`inside_deep_frame`. Direct body children are editor-created Frames with
`type = "frame"` and `style = "inside_deep_frame"`. A Frame can contain a
Horizontal Flow with `type = "flow"`, `direction = "horizontal"`, and
`style = "horizontal_flow"` when nested horizontal layout is needed.

Renderer CSS reads those hydrated style facts through custom properties. Lua
export writes the same supported style assignments onto editor-created Frames
and Horizontal Flows, preserving current 1:1 editor-to-Lua compatibility for
this slice without treating CSS as source of truth.

## Drop Rules

- Palette drops create a new `frame` spec.
- The palette tile does not append on click; creation requires an explicit drop
  target.
- Row drops move an existing spec.
- Legal parents alternate by primitive: `gui_window_body` and user-created
  Horizontal Flow nodes accept Frames; user-created Frames accept Horizontal
  Flows.
- Illegal parents include the Window root, titlebar, title label, drag filler,
  self, and descendants of the moved source.
- The Builder tree shows `gui_window_body` as the fixed Window body flow root.
  It can be selected and can receive children, but it cannot be dragged,
  deleted, or reordered because the Window shell owns that Factorio flow.
- `gui_window_body` is horizontal or vertical based on the Window creation
  action. Editor-created body children are Frames in this slice.
- Drop placement is an ordered index in the parent, represented by ghost blocks.
- In the canvas, sibling Frames split available space equally until
  their minimum width is reached; after that the parent flow scrolls.
- The drag overlay, source highlight, active parent highlight, and ghost block
  are visual feedback only. The stored operation remains `{parentId, index}`.
- Canvas hover previews must use the same flex sizing contract as the atom that
  will exist after drop. Hit/collision geometry must not paint layout feedback,
  and highlight paint must not extend the future node's bounds. Previews are
  atom render states: a Frame preview renders through the same Frame shell as a
  real Frame, and a nested Horizontal Flow preview renders through the same
  Horizontal Flow shell as a real Horizontal Flow.
- Removing a row removes its subtree in this slice.

## Fixtures

| Fixture | State | Expected behavior |
| --- | --- | --- |
| `empty-window-horizontal` | Window exists with `bodyDirection: "horizontal"`, no `layoutChildren` | Builder palette enabled, non-deletable horizontal `gui_window_body` root visible, body/canvas accepts first child Frame. |
| `empty-window-vertical` | Window exists with `bodyDirection: "vertical"`, no `layoutChildren` | Builder palette enabled, non-deletable vertical `gui_window_body` root visible, body/canvas accepts first child Frame. |
| `one-frame` | One root Frame | Row selects the same canvas/inspector node, Lua exports one nested `frame`. |
| `frame-with-flow` | Root Frame with one child Horizontal Flow | Child is visible in tree and canvas, inspector has rows for both. |
| `nested-split` | Frame -> Horizontal Flow -> Frame | Nested split remains model-consistent and exportable. |
| `cross-parent-move` | Two root Frames, one nested Frame | Drag can move a Frame between body and another compatible flow, preserving order. |
| `invalid-descendant-drop` | Parent with child | Dragging parent into its child is rejected and shows no ghost. |

## Stable Anchors

- `builder_panel`
- `layout_settings_panel`
- `layout_settings_toggle`
- `frame_palette_item`
- `builder_body_tree`
- `builder_ghost_marker`
- `gui_window_body`
- `gui_frame_N` for editor-created Frame nodes
- `gui_horizontal_flow_N` for editor-created Horizontal Flow nodes

## Visual Gate

Before expanding to Label, Frame, or Action Button insertion, verify:

- ghost placement is visible in both the builder list and canvas;
- canvas ghost placement expands smoothly so affected sibling flows slide into
  the proposed drop layout instead of jumping instantly;
- dragged source rows/flows and current drop parents have clear highlighted
  states;
- sibling Frames visually split the available body or parent-flow space, read as
  inset surfaces inside the parent, and preserve the Window body's continuous
  inset shadow and split gutter;
- scrolling appears only after the minimum Frame width is exhausted;
- empty Frames look like editable Factorio GUI surfaces, not cards;
- nested flows remain scannable in the rail at narrow sidebar widths;
- Lua output order matches the builder tree order;
- no operation creates arbitrary CSS or absolute-positioned child layout.

## Automated Regression Gate

Every objective builder bug should become a check before the fix is accepted.
The first browser regression covers the `one-frame` fixture: dragging a palette
Frame to index `0` of the Window body must make the hover preview, visible
highlighted shell, shifted existing Frame, inter-Frame gap, and final dropped
Frame use matching rectangles within a 1px tolerance. This regression exists
because earlier previews measured wrapper slots while painting a separate
generic ghost child; the wrapper could match while the visible highlight still
had different padding, border, or bounds than the final atom. The fixed contract
renders the preview through the same Frame shell as the dropped node. The test
also verifies that drop hit targets stay visually transparent and that preview
paint does not extend outside the future node bounds.

`scripts/check.sh` runs build, layout-tree, hover/drop geometry, structural,
and Playwright browser checks. CI installs dependencies, installs Chromium, and
runs the same script, so this gate is required for pull requests.

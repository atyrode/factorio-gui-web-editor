# No-Code Horizontal Flow Builder Spec

This product spec covers the first no-code engine slice in the editor. It
implements constrained Horizontal Flow insertion inside the current top-level
Window body.

## Problem Frame

The editor can create and inspect a Window shell, but the body is still empty
unless code authors seed children by hand. The next product job is not a
general page builder. It is a Factorio-safe no-code surface that mutates the
shared GUI model with approved primitives.

Freeform pixel dragging remains out of scope. Drag/drop in this slice means
choosing a parent flow and ordered insertion index.

Drag/drop interaction plumbing uses `@dnd-kit/react`. The library owns pointer
tracking, drag source state, droppable collision, and overlay rendering. The
project still owns tree mutation because the persisted shape is a constrained
recursive Factorio layout tree, not a flat sortable list or arbitrary DOM
layout.

## User Jobs

- Create an empty top-level Window.
- Add a Horizontal Flow to the Window body.
- Add a nested Horizontal Flow inside another user-created Horizontal Flow.
- Reorder Horizontal Flows across the body and nested flows.
- Remove a Horizontal Flow subtree.
- Select a builder row and inspect the same model node in the inspector,
  Builder tree, canvas, and Lua output.

## Information Architecture

The editor rail contains three pinned sections:

```text
[Window]
  title, width, height, create/reset

[Builder]
  [Palette: Horizontal Flow]
  [Scroll: Window body tree]
    [Drop slots and ghost blocks]
    [Rows with add child, add after, remove]

[Inspector]
  Ctrl+F6 style inspector toggle
  Lua output toggle
  selected node details
```

The canvas remains the visual preview. It accepts drops into the Window body
and into user-created Horizontal Flows. The Window header/titlebar is locked and
is not a builder drop target.

The Builder tree is the only structure navigator. It has a bounded height and
scrolls when nested flows would otherwise crowd the Inspector.

## Data Contract

The persisted editor state stores only constrained specs:

```json
{
  "currentWindow": {
    "layoutChildren": [
      {
        "id": "gui_horizontal_flow_1",
        "atom": "horizontal-flow",
        "styleVariant": "generic-horizontal-flow",
        "children": []
      }
    ],
    "nextLayoutNodeNumber": 2
  }
}
```

The model hydrates these specs into Factorio nodes only when rendering,
inspecting, or exporting. The generic editor-created variant maps to
`type = "flow"`, `direction = "horizontal"`, `style = "horizontal_flow"`, and
`horizontal_spacing = 6`.

## Drop Rules

- Palette drops create a new `horizontal-flow` spec.
- Row drops move an existing spec.
- Legal parents are `gui_window_body` and user-created Horizontal Flow nodes.
- Illegal parents include the Window root, titlebar, title label, drag filler,
  self, and descendants of the moved source.
- Drop placement is an ordered index in the parent, represented by ghost blocks.
- In the canvas, sibling Horizontal Flows split available space equally until
  their minimum width is reached; after that the parent flow scrolls.
- The drag overlay, source highlight, active parent highlight, and ghost block
  are visual feedback only. The stored operation remains `{parentId, index}`.
- Removing a row removes its subtree in this slice.

## Fixtures

| Fixture | State | Expected behavior |
| --- | --- | --- |
| `empty-window` | Window exists, no `layoutChildren` | Builder palette enabled, body tree empty, body/canvas accepts first flow. |
| `one-flow` | One root Horizontal Flow | Row selects the same canvas/inspector node, Lua exports one nested `flow`. |
| `nested-flows` | Root flow with one child flow | Child is visible in tree and canvas, inspector has rows for both. |
| `cross-parent-move` | Two root flows, one nested flow | Drag can move a flow between body and another flow, preserving order. |
| `invalid-descendant-drop` | Parent with child | Dragging parent into its child is rejected and shows no ghost. |

## Stable Anchors

- `builder_panel`
- `horizontal_flow_palette_item`
- `builder_body_tree`
- `builder_ghost_marker`
- `gui_window_body`
- `gui_horizontal_flow_N` for editor-created flow nodes

## Visual Gate

Before expanding to Label, Frame, or Action Button insertion, verify:

- ghost placement is visible in both the builder list and canvas;
- dragged source rows/flows and current drop parents have clear highlighted
  states;
- sibling flows visually split the available body or parent-flow space;
- scrolling appears only after the minimum flow width is exhausted;
- empty Horizontal Flows look like editable Factorio GUI surfaces, not cards;
- nested flows remain scannable in the rail at narrow sidebar widths;
- Lua output order matches the builder tree order;
- no operation creates arbitrary CSS or absolute-positioned child layout.

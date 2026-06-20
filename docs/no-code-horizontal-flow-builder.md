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
- Navigate implemented Horizontal Flow children from the Inspector. Child rows
  display `flow.horizontal` and target the child node instead of using a missing
  placeholder.

## Information Architecture

The editor rail contains three pinned sections:

```text
[Window]
  title, width, height, create/reset

[Builder]
  [Palette: drag-only Horizontal Flow]
  [Scroll: Window body tree]
    [Drop slots and ghost blocks]
    [Rows with add child, add after, remove]

[Inspector]
  Ctrl+F6 style inspector toggle
  Lua output toggle
  selected node details

[Settings]
  collapsed by default
  Horizontal Flow authored values
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
the current Settings panel values for spacing, `minimal_width`,
`minimal_height`, padding, and stretch behavior.

Renderer CSS reads those hydrated style facts through custom properties. Lua
export writes the same supported style assignments onto each editor-created
Horizontal Flow, preserving current 1:1 editor-to-Lua compatibility for this
slice without treating CSS as source of truth.

## Drop Rules

- Palette drops create a new `horizontal-flow` spec.
- The palette tile does not append on click; creation requires an explicit drop
  target.
- Row drops move an existing spec.
- Legal parents are `gui_window_body` and user-created Horizontal Flow nodes.
- Illegal parents include the Window root, titlebar, title label, drag filler,
  self, and descendants of the moved source.
- Drop placement is an ordered index in the parent, represented by ghost blocks.
- In the canvas, sibling Horizontal Flows split available space equally until
  their minimum width is reached; after that the parent flow scrolls.
- The drag overlay, source highlight, active parent highlight, and ghost block
  are visual feedback only. The stored operation remains `{parentId, index}`.
- Canvas hover previews must use the same flex sizing contract as the
  Horizontal Flow node that will exist after drop. Hit/collision geometry must
  not paint layout feedback, and highlight paint must not extend the future
  node's bounds. Previews are atom render states: the canvas Horizontal Flow
  preview renders through the same atom shell as a real Horizontal Flow, using a
  temporary preview node hydrated from the same parent child-style contract.
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
- `layout_settings_panel`
- `layout_settings_toggle`
- `horizontal_flow_palette_item`
- `builder_body_tree`
- `builder_ghost_marker`
- `gui_window_body`
- `gui_horizontal_flow_N` for editor-created flow nodes

## Visual Gate

Before expanding to Label, Frame, or Action Button insertion, verify:

- ghost placement is visible in both the builder list and canvas;
- canvas ghost placement expands smoothly so affected sibling flows slide into
  the proposed drop layout instead of jumping instantly;
- dragged source rows/flows and current drop parents have clear highlighted
  states;
- sibling flows visually split the available body or parent-flow space;
- scrolling appears only after the minimum flow width is exhausted;
- empty Horizontal Flows look like editable Factorio GUI surfaces, not cards;
- nested flows remain scannable in the rail at narrow sidebar widths;
- Lua output order matches the builder tree order;
- no operation creates arbitrary CSS or absolute-positioned child layout.

## Automated Regression Gate

Every objective builder bug should become a check before the fix is accepted.
The first browser regression covers the `one-flow` fixture: dragging a palette
Horizontal Flow to index `0` of the Window body must make the hover preview,
visible highlighted shell, shifted existing flow, inter-flow gap, and final
dropped flow use matching rectangles within a 1px tolerance. This regression
exists because an earlier preview measured a wrapper slot while painting a
separate generic ghost child; the wrapper could match while the visible
highlight still had different padding, border, or bounds than the final
Horizontal Flow. The fixed contract renders the preview through the same
Horizontal Flow atom shell as the dropped node. The test also verifies that drop
hit targets stay visually transparent and that preview paint does not extend
outside the future node bounds.

`scripts/check.sh` runs build, layout-tree, hover/drop geometry, structural,
and Playwright browser checks. CI installs dependencies, installs Chromium, and
runs the same script, so this gate is required for pull requests.

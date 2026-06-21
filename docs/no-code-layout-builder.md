# No-Code Layout Builder Spec

This product spec covers the first no-code engine slice in the editor. It
implements constrained Frame and Flow insertion inside the current top-level
Window body flow.

## Problem Frame

The editor creates a Window shell by choosing the fixed body flow direction:
Horizontal Flow or Vertical Flow. The Window model then has two generated
top-level children: the horizontal titlebar flow and the chosen body flow.
Authored layout specs are inserted under that body flow. The next product job
is not a general page builder. It is a Factorio-safe no-code surface that
mutates the shared GUI model with approved primitives.

The real-game split reference is a Window body `agui::HorizontalFlow` whose
direct children are `agui::Frame` elements. The editor therefore treats Flow and
Frame as separate Factorio GUI element atoms: Flow owns ordered child layout and
spacing, while Frame owns the visible split/container surface.

Freeform pixel dragging remains out of scope. Drag/drop in this slice means
choosing a parent flow and ordered insertion index.

Canvas drag/drop interaction plumbing uses `@dnd-kit/react`. The library owns
pointer tracking, drag source state, droppable collision, and overlay rendering
for canvas placement.

Component-tree drag/drop uses Headless Tree (`@headless-tree/core` and
`@headless-tree/react`). Headless Tree owns tree drag source handling, ordered
drop target calculation, reparenting, invalid-drop feedback, drag-line
rendering, and keyboard/a11y behavior. The project keeps only Factorio-domain
drop policy: whether a dragged atom is legal under a proposed parent in the
constrained recursive layout model.

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
  [Palette: drag-only Frame, Horizontal Flow]
  [Scroll: full generated component tree]
    [Non-deletable Window frame root]
    [Non-deletable titlebar flow, title label, header filler]
    [Non-deletable Window body flow root]
    [Headless Tree drag line for ordered placement]
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

The canvas remains the visual preview. It accepts legal drops into the Window
body, user-created Frames, and user-created Horizontal Flows. The Window
root/header/titlebar shell is visible in the component tree but locked.

The Builder tree is the structure navigator for the generated Lua hierarchy. It
shows locked shell nodes such as `gui_window`, `gui_window_titlebar`,
`gui_window_title`, `gui_window_drag_handle`, and `gui_window_body`, followed by
editable authored layout specs under the body flow. It has a bounded height and
scrolls when nested layout would otherwise crowd the Inspector.

Tree row rendering remains Factorio-styled local UI, but tree interaction logic
is not custom. Headless Tree supplies flat visible items, ARIA tree props,
separate drag-handle props, drag targets, and drag-line positioning. The
rendered rows reuse the editor's dark panel/menu vocabulary, compact action
buttons, orange active affordances, and blue structural guide color.

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

Each exported node also has an effective Lua local variable name. By default it
matches the stable node id after Lua identifier sanitization. The component tree
shows this as the blue code value on each row, with an edit affordance. Editing
that value overrides the generated Lua local variable only; the Factorio element
`name`, DOM `data-anchor`, builder row id, and Inspector `targetId` remain the
stable node id. Invalid Lua identifiers, Lua reserved words, and duplicates are
rejected inline. Empty input removes the override and returns to the generated
default. This control intentionally does not appear in the Ctrl+F6-style
Inspector.

## Drop Rules

- Canvas palette drops create either a new `frame` spec or a new
  `horizontal-flow` spec, based on the dragged tile.
- Component-tree palette drops use the palette tile's built-in grip rail and
  Headless Tree foreign drag-object support to create the same constrained
  specs. Canvas drops use the tile body through dnd-kit; tree drops use the same
  tile's native drag payload because Headless Tree consumes browser
  `DataTransfer` events.
- Palette tiles do not append on click; creation requires an explicit drop
  target.
- Tree row drops move an existing spec through Headless Tree's ordered target.
- Legal parents alternate by primitive: `gui_window_body` and user-created
  Horizontal Flow nodes accept Frames; user-created Frames accept Horizontal
  Flows.
- Illegal parents include the Window root, titlebar, title label, drag filler,
  self, and descendants of the moved source.
- The Builder tree shows the generated Window shell. Shell nodes can be
  selected for inspection but cannot be dragged, deleted, or reordered.
  `gui_window_body` is the one locked shell node that can receive authored
  children, because the Window shell owns that Factorio body flow.
- `gui_window_body` is horizontal or vertical based on the Window creation
  action. Editor-created body children are Frames in this slice.
- Tree drop placement is an ordered index in the parent represented by the
  Headless Tree drag line.
- In the canvas, sibling Frames split available space equally until
  their minimum width is reached; after that the parent flow scrolls.
- Vertical Window bodies use the same split-gutter substrate rule: sibling
  Frames split available height equally until minimum height is reached, and the
  body flow keeps a visible gutter between stacked Frames.
- Tree drag-line, source highlight, active parent highlight, and blocked target
  states are visual feedback only. The stored operation remains
  `{parentId, index}`.
- Canvas drag overlay, active parent highlight, and ghost preview are visual
  feedback only. Canvas hit/collision geometry must not paint layout feedback.
- Canvas hover previews must use the same flex sizing contract as the atom that
  will exist after drop. Highlight paint must not extend the future node's
  bounds. Previews are atom render states: a Frame preview renders through the
  same Frame shell as a real Frame, and a nested Horizontal Flow preview renders
  through the same Horizontal Flow shell as a real Horizontal Flow.
- Removing a row removes its subtree in this slice.

## Fixtures

| Fixture | State | Expected behavior |
| --- | --- | --- |
| `empty-window-horizontal` | Window exists with `bodyDirection: "horizontal"`, no `layoutChildren` | Builder palette enabled, non-deletable horizontal `gui_window_body` root visible, body/canvas accepts first child Frame. |
| `empty-window-vertical` | Window exists with `bodyDirection: "vertical"`, no `layoutChildren` | Builder palette enabled, non-deletable vertical `gui_window_body` root visible, body/canvas accepts first child Frame. |
| `one-frame` | One root Frame | Row selects the same canvas/inspector node, Lua exports one nested `frame`. |
| `full-shell-tree` | Window exists | Builder tree shows Window Frame -> titlebar Flow -> Label/Filler and Window body Flow -> authored children. |
| `frame-with-flow` | Root Frame with one child Horizontal Flow | Child is visible in tree and canvas, inspector has rows for both. |
| `nested-split` | Frame -> Horizontal Flow -> Frame | Nested split remains model-consistent and exportable. |
| `cross-parent-move` | Two root Frames, one nested Frame | Tree drag can move a Frame between body and another compatible flow, preserving order. |
| `invalid-descendant-drop` | Parent with child | Dragging parent into its child is rejected and keeps the model unchanged. |

## Stable Anchors

- `builder_panel`
- `layout_settings_panel`
- `layout_settings_toggle`
- `frame_palette_item`
- `horizontal_flow_palette_item`
- `builder_body_tree`
- `builder_tree_drag_line`
- `builder_tree_item_<node_id>`
- `gui_window_body`
- `gui_frame_N` for editor-created Frame nodes
- `gui_horizontal_flow_N` for editor-created Horizontal Flow nodes

## Visual Gate

Before expanding to Label, Action Button, or additional Frame-style insertion,
verify:

- Headless Tree drag-line placement is visible in the builder list;
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
- Lua output uses any authored `lua_variable_name` aliases without changing
  stable Factorio element names;
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

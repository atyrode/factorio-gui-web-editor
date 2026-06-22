# No-Code Layout Builder Spec

This product spec covers the current no-code engine slice in the editor. It
implements constrained Factorio atom insertion inside the current top-level
Window body flow.

## Problem Frame

The editor creates a Window shell by choosing the fixed body flow direction:
Horizontal Flow or Vertical Flow. The Window model then has two generated
top-level children: the horizontal titlebar flow and the chosen body flow.
Authored layout specs are inserted under that body flow. The next product job
is not a general page builder. It is a Factorio-safe no-code surface that
mutates the shared GUI model with approved primitives.

The real-game split reference is a Window body `agui::HorizontalFlow` whose
direct children are `agui::Frame` elements. The editor therefore treats Flow,
Frame, and Filler as separate Factorio GUI element atoms: Flow owns ordered
child layout and spacing, Frame owns the visible split/container surface, and
Filler owns generic `empty-widget` spacer behavior.

Freeform pixel dragging remains out of scope. Drag/drop in this slice means
choosing a parent flow and ordered insertion index.

Palette atoms use native browser drag/drop with a small `DataTransfer` payload.
The same full palette tile can be dropped into the canvas or into the Builder
tree. Canvas drag/drop owns only visual placement feedback and delegates model
validation to the shared Factorio layout helpers.

Component-tree drag/drop uses Headless Tree (`@headless-tree/core` and
`@headless-tree/react`). Headless Tree owns tree drag source handling, ordered
drop target calculation, reparenting, invalid-drop feedback, drag-line
rendering, external `DataTransfer` drops, and keyboard/a11y behavior. The
project keeps only Factorio-domain drop policy: whether a dragged atom is legal
under a proposed parent in the constrained recursive layout model.

## User Jobs

- Create a top-level Window with a Horizontal Flow or Vertical Flow body.
- Add a Frame to the Window body.
- Add a nested Horizontal Flow inside a user-created Frame.
- Add a Frame inside a user-created Horizontal Flow.
- Add a Filler spacer to the Window body, user-created Frame, or user-created
  Horizontal Flow.
- Reorder authored atoms across the body and compatible nested containers.
- Remove a Frame, Horizontal Flow, or Filler subtree.
- Copy, cut, and paste an authored atom subtree using visible Builder row
  copy/paste actions or `Ctrl/Cmd+C`, `Ctrl/Cmd+X`, and `Ctrl/Cmd+V`.
- Undo and redo authored editor/model changes with visible controls or
  `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, and `Ctrl/Cmd+Y`.
- Select a builder row and inspect the same model node in the inspector,
  Builder tree, canvas, and Lua output.
- Navigate implemented Frame, Horizontal Flow, and Filler children from the
  Inspector. Child rows display `frame`, `flow.horizontal`, or `empty-widget`
  and target the child node instead of using a missing placeholder.

## Information Architecture

The editor page is a canvas-dominant workbench rather than a single stacked
control rail. Its default desktop structure is:

```text
[Top command bar]
  editable Window title, body-flow toggle, undo, redo, export drawer toggle,
  create/recreate Window, reset

[Tool strip]
  [Tools: Select, Inspect, Resize]
  [View toggles: GUI shadows]

[Atom bar]
  [Palette: drag/drop Frame, Horizontal Flow, Filler]

[Right rail]
  [Properties panel]
    [Properties tab]
      Layout Settings, collapsed by default, including exact Window size
    [Factorio tab]
      Ctrl+F6-style structured facts for selected/hovered GUI node
  [Component tree]
  [Scroll: component tree, starting at Window body flow by default]
    [Optional non-deletable Window frame root]
    [Optional non-deletable titlebar flow, title label, header filler]
    [Non-deletable Window body flow root]
    [Headless Tree drag line for ordered placement]
    [Child rows with copy, paste, add child, add after, remove]

[Canvas]
  visual preview, canvas drops, Window movement, resize overlays

[Export drawer]
  hidden by default; generated gui.lua and preview-mod download
```

The canvas remains the visual preview. It accepts legal drops into the Window
body, user-created Frames, and user-created Horizontal Flows. Filler is a leaf
and does not expose child drop targets. The Window
root/header/titlebar shell can be shown in the component tree when the Settings
toggle in the Properties tab is enabled; those generated shell rows are locked.

The Builder tree is the structure navigator for the generated Lua hierarchy. It
starts at the locked `gui_window_body` flow by default, followed by editable
authored layout specs under the body flow. A Settings toggle can expose the full
generated shell, including locked nodes such as `gui_window`,
`gui_window_titlebar`, `gui_window_title`, and `gui_window_drag_handle`. It has
a bounded height under the right-side Properties panel and scrolls when nested layout would
otherwise crowd the canvas. The scroll area reserves a right-side gutter so the
vertical scrollbar does not cover row labels or actions.

Tree row rendering remains Factorio-styled local UI, but tree interaction logic
is not custom. Headless Tree supplies flat visible items, ARIA tree props,
separate drag-handle props, drag targets, and drag-line positioning. The
rendered rows reuse the editor's dark panel/menu vocabulary, compact action
buttons, orange active affordances, and blue structural guide color.

The top command bar owns high-frequency Window commands: title, body-flow
direction, creation/recreation, reset, undo/redo, and export drawer visibility.
The atom bar owns creation from the builder palette. The left tool strip keeps
exclusive canvas tools at the top and view toggles, including GUI shadows, at
the bottom. The Properties panel owns lower-frequency root/global settings. The
Layout Settings section is collapsed by default and owns exact Window
width/height plus authored Horizontal Flow
assumptions until Factorio defaults are proven: generic flow spacing, top-level
minimum width, nested minimum width, minimum height, and padding. It also owns
the presentation toggle for showing or hiding generated Window shell rows in the
Builder tree.

The Factorio tab owns Ctrl+F6-style structured facts. Selecting a Builder row or
navigating from inspector child rows switches to this tab so the selected model
node can be checked precisely. The Select and Resize tools can still select
canvas nodes without enabling hover inspection.

The export drawer is closed by default. Opening it reveals generated `gui.lua`
and the preview-mod download action. Lua output remains a generated export
surface; it is not an always-visible editing surface.

Select, Inspect, and Resize are exclusive canvas tools. Select is the default
tool and supports canvas/tree selection. Inspect enables Ctrl+F6-style hover
inspection and routes facts to the Factorio tab. Resize shows a measured overlay
for the selected GUI node; supported nodes show side and corner handles, while
unsupported nodes show a disabled resize state. The tools reuse the same
selected anchor as the Builder tree and properties rail, so selecting a row,
inspector item, or canvas element targets the same model node.

## Data Contract

The command bar has one create/recreate command. Its nearby body-flow toggle
chooses whether that command creates a Window with a Horizontal Flow or Vertical
Flow body. Exact Window width/height remain model state, but their numeric
inputs live in collapsed Settings because the Resize tool is the primary sizing
surface. The persisted editor state stores constrained layout specs separately
from transient workbench UI state:

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
        "size": {
          "minimalWidth": 240,
          "minimalHeight": 96
        },
        "children": []
      }
    ],
    "nextLayoutNodeNumber": 2
  }
}
```

Workbench UI state is persisted under the existing
`labtorio.editorState.v1` local-storage key. New layout fields are
`activeCanvasTool: "select" | "inspect" | "resize"`,
`propertiesTab: "properties" | "factorio"`, and `exportDrawerOpen: boolean`.
Legacy `showInspector`, `resizeMode`, and `showLuaOutput` values are still read
and written during this transition so older saved fixtures migrate to the
matching Inspect, Resize, and export-drawer states.

The model hydrates these specs into Factorio nodes only when rendering,
inspecting, or exporting. `bodyDirection` selects the generated
`gui_window_body` flow direction and style: horizontal bodies use
`inset_frame_container_horizontal_flow`, while vertical bodies use
`inside_deep_frame`. Direct body children are authored atom specs validated by
capability metadata. Frame hydrates to `type = "frame"` and
`style = "inside_deep_frame"`. Horizontal Flow hydrates to `type = "flow"`,
`direction = "horizontal"`, and `style = "horizontal_flow"`. Filler hydrates to
`type = "empty-widget"`, `style = "draggable_space"`, `role: spacer`, stretch
flags, and `ignored_by_interaction = true`.

Renderer CSS reads those hydrated style facts through custom properties. Lua
export writes the same supported style/add assignments onto editor-created
Frames, Horizontal Flows, and Fillers, preserving current 1:1 editor-to-Lua
compatibility for this slice without treating CSS as source of truth.

The optional `size` object is authored per layout node. `minimalWidth` and
`minimalHeight` override the corresponding global layout setting for that node
only, clamp to Factorio-safe editor limits, hydrate into `styleReference`, and
export as `LuaStyle.minimal_width` / `LuaStyle.minimal_height`. Existing nodes
without `size` keep using global layout settings.

Each exported node also has an effective Lua local variable name. By default it
matches the stable node id after Lua identifier sanitization. The component tree
shows this as the blue code value on each row, with an edit affordance. Editing
that value overrides the generated Lua local variable only; the Factorio element
`name`, DOM `data-anchor`, builder row id, and Inspector `targetId` remain the
stable node id. Invalid Lua identifiers, Lua reserved words, and duplicates are
rejected inline. Empty input removes the override and returns to the generated
default. This control intentionally does not appear in the Ctrl+F6-style
Inspector.

Copy/cut/paste does not add persisted clipboard schema. The clipboard is
session-local React state that stores one normalized authored subtree snapshot.
Pasting duplicates that subtree into `layoutChildren` with fresh stable ids and
then normalizes Lua variable names from the current Window. Copied Lua variable
name overrides stay on the original nodes only; cut nodes are removed with their
overrides. Pasted nodes use generated defaults unless the user edits them after
paste.

## Clipboard Rules

- Copy is available only for authored Frame, Horizontal Flow, and Filler rows.
  Generated shell rows and `gui_window_body` cannot be copied.
- Paste is available on `gui_window_body` and authored rows only when the copied
  subtree atom can be placed according to the same parent capability rules as
  drag/drop.
- Paste target resolution is selected-aware: paste into a selected compatible
  parent, otherwise paste after a selected authored node when its parent accepts
  the copied atom, otherwise append to the Window body.
- Keyboard shortcuts operate on the selected/locked anchor and are ignored while
  focus is in text inputs, textareas, selects, or contenteditable controls.
- `Ctrl/Cmd+X` cuts only authored nodes: it copies the selected subtree to the
  in-app clipboard, removes the original subtree, and selects `gui_window_body`.
- The browser system clipboard is not read or written in this slice, so copied
  subtrees do not transfer across tabs, sessions, or reloads.

## Undo/Redo Rules

- Undo/redo history is session-local and bounded to 50 entries. Reloading the
  page keeps only the current persisted editor state, not the undo stack.
- History covers authored state that changes the model or export projection:
  Window creation/reset, title, size, body direction, canvas Window location,
  layout add/remove/move/cut/paste/drop, resize commits, Lua variable names,
  and layout settings.
- History does not record copy-only operations, hover/preview state, Inspector
  navigation, Inspector/Lua/shadow/resize visibility toggles, settings-panel
  expansion, generated-shell visibility, sidebar width, drag ghosts, or drop
  previews.
- Text and number field edits are coalesced into one history entry per focused
  edit session. Resize and Window-location drags are coalesced into one entry
  on pointer release.
- Undo/redo restores the shared editor state and keeps canvas, Builder tree,
  Inspector selection, Lua output, and localStorage synchronized. If a restored
  selection no longer exists, the editor selects `gui_window_body` when a
  Window exists, otherwise it clears selection.
- Undo/redo shortcuts are ignored while focus is inside an editable field so
  browser text editing semantics remain intact.

## Drop Rules

- Canvas palette drops create a new spec from the dragged atom metadata.
- Component-tree palette drops use the same full palette tile and Headless
  Tree foreign drag-object support to create the same constrained specs. Canvas
  and tree drops share the same browser `DataTransfer` payload.
- Palette tiles do not append on click; creation requires an explicit drop
  target.
- Tree row drops move an existing spec through Headless Tree's ordered target.
- Legal parents are declared by atom capability metadata. `gui_window_body`
  accepts implemented authored atoms. User-created Frames and Horizontal Flows
  accept Frame, Horizontal Flow, and Filler children. Filler is a leaf and
  accepts no children.
- Illegal parents include the Window root, titlebar, title label, drag filler,
  self, and descendants of the moved source.
- The Builder tree starts from `gui_window_body` by default. When the generated
  Window shell setting is enabled, shell nodes can be selected for inspection
  but cannot be dragged, deleted, or reordered. `gui_window_body` is the one
  locked shell node that can receive authored children, because the Window
  shell owns that Factorio body flow.
- `gui_window_body` is horizontal or vertical based on the Window creation
  action. The body can contain authored Frame, Horizontal Flow, and Filler
  nodes.
- Frames are vertical containers in this model. Multiple Horizontal Flow
  children inside the same Frame stack vertically; each Horizontal Flow lays out
  its own children left-to-right.
- The old Frame -> Horizontal Flow -> Frame alternation was an implementation
  slice, not a Factorio rule. The current rule system remains Factorio-model
  driven, but it is expressed as atom capabilities rather than one hardcoded
  alternating parent gate.
- Tree drop placement is an ordered index in the parent represented by the
  Headless Tree drag line. Tree hover feedback must not insert flow-affecting
  placeholders under the pointer, because that can cause drop-target
  oscillation when hit testing recalculates after layout shift.
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
  bounds. Previews are atom render states: Frame, Horizontal Flow, and Filler
  previews render through the same shells as their real nodes.
- Removing a row removes its subtree in this slice.

## Resize Rules

- Resize mode is selected from the left canvas tool strip at
  `resize_mode_toggle`.
- `gui_window` supports width and height resizing through `currentWindow.size`;
  the Settings size fields and Lua `.style.width` / `.style.height` update on
  commit.
- Editor-created Frames and Horizontal Flows support `minimal_width` and
  `minimal_height` resizing through their per-node `size` object.
- Generated shell children such as `gui_window_title` and
  `gui_window_drag_handle` are unsupported until their atom contracts define
  explicit Factorio-exportable size fields.
- Builder drag/drop hides resize handles while active. Resize handle events stop
  propagation so they cannot begin Window dragging, tree dragging, or Inspector
  selection changes.
- Resize mode changes only model/exportable size fields. It must not create
  absolute-positioned child layout, arbitrary CSS transforms, or freeform pixel
  coordinates as layout source of truth.

## Fixtures

| Fixture | State | Expected behavior |
| --- | --- | --- |
| `empty-window-horizontal` | Window exists with `bodyDirection: "horizontal"`, no `layoutChildren` | Builder palette enabled, non-deletable horizontal `gui_window_body` root visible, body/canvas accepts implemented authored atoms. |
| `empty-window-vertical` | Window exists with `bodyDirection: "vertical"`, no `layoutChildren` | Builder palette enabled, non-deletable vertical `gui_window_body` root visible, body/canvas accepts implemented authored atoms. |
| `one-frame` | One root Frame | Row selects the same canvas/inspector node, Lua exports one nested `frame`. |
| `full-shell-tree` | Window exists | Builder tree shows Window Frame -> titlebar Flow -> Label/Filler and Window body Flow -> authored children. |
| `frame-with-flow` | Root Frame with one child Horizontal Flow | Child is visible in tree and canvas, inspector has rows for both. |
| `nested-split` | Frame -> Horizontal Flow -> Frame | Nested split remains model-consistent and exportable. |
| `filler-spacer` | Authored Filler in body, Frame, or Horizontal Flow | Filler is visible, selectable, movable, removable, exports as `empty-widget`, and rejects children. |
| `cross-parent-move` | Two root Frames, one nested Frame | Tree drag can move a Frame between body and another compatible flow, preserving order. |
| `invalid-descendant-drop` | Parent with child | Dragging parent into its child is rejected and keeps the model unchanged. |
| `copy-paste-subtree` | Frame -> Horizontal Flow -> two Frames, copied from the root Frame | Paste creates a sibling subtree with fresh ids, selects the pasted root, updates Lua output/localStorage, and leaves copied Lua variable overrides behind. |
| `undo-redo-authored-state` | Window with authored layout, size, title, settings, and Lua aliases | Undo and redo restore shared model state across canvas, Builder tree, Inspector selection, Lua output, and localStorage while excluding transient view state. |
| `resize-frame` | Selected root Frame with resize mode enabled | Handles resize authored `minimal_width`/`minimal_height`, update preview, persist `size`, and export Lua style fields. |
| `resize-unsupported-shell-node` | Selected generated title label with resize mode enabled | Resize overlay reports unsupported and does not mutate Window or layout specs. |

## Stable Anchors

- `editor_command_bar`
- `editor_tool_select`
- `editor_tool_inspect`
- `editor_export_drawer`
- `builder_panel`
- `editor_undo`
- `editor_redo`
- `create_window_command`
- `properties_panel`
- `properties_tab_properties`
- `properties_tab_factorio`
- `layout_settings_panel`
- `layout_settings_toggle`
- `layout_settings_window_size`
- `layout_setting_window_width`
- `layout_setting_window_height`
- `component_tree_shell_toggle`
- `frame_palette_item`
- `horizontal_flow_palette_item`
- `filler_palette_item`
- `builder_body_tree`
- `builder_tree_drag_line`
- `builder_tree_item_<node_id>`
- `builder_copy_<node_id>`
- `builder_paste_<node_id>`
- `resize_mode_toggle`
- `resize_overlay`
- `gui_shadow_toggle`
- `lua_output_file`
- `factorio_mod_download`
- `gui_window_body`
- `gui_frame_N` for editor-created Frame nodes
- `gui_horizontal_flow_N` for editor-created Horizontal Flow nodes
- `gui_filler_N` for editor-created Filler nodes

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
- Factorio preview mod export wraps the same Lua output, so in-game comparison
  tests the current shared model rather than a separate sample fixture;
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

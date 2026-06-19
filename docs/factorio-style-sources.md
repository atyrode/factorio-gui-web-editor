# Factorio Style Source Notes

This note records the public UI and style sources inspected for the browser
renderer and future Factorio exports:

- <https://factorio.com/>
- <https://mods.factorio.com/>
- <https://factorio.com/blog/>
- <https://lua-api.factorio.com/latest/>
- <https://lua-api.factorio.com/latest/classes/LuaGuiElement.html>
- <https://lua-api.factorio.com/latest/classes/LuaStyle.html>
- <https://lua-api.factorio.com/latest/concepts/GuiElementType.html>
- <https://man.sr.ht/~raiguard/factorio-gui-style-guide/>
- <https://mods.factorio.com/user/raiguard>
- <https://mods.factorio.com/mod/flib>
- <https://mods.factorio.com/mod/EditorExtensions>
- <https://mods.factorio.com/mod/Krastorio2>
- <https://codeberg.org/raiguard?q=&tab=repositories&sort=recentupdate>
- <https://github.com/JanSharp/FactorioGUIEditor>
- <https://github.com/ClaudeMetz/UntitledGuiGuide/wiki>

The editor uses these sources as style references. It MUST NOT vendor large Wube
CSS files, copy minified page styles wholesale, or bundle Wube image assets. It
MAY load the public Titillium Web font from Factorio's CDN with a local fallback.
When exact visual parity is the goal, inspect the public CSS and HTML in a
scratch location only, then re-express the relevant subset as local tokens,
shadows, sizing rules, and component states.

Official Factorio API documentation remains authoritative for runtime GUI
behavior. Raiguard's Factorio GUI style guide is the highest-value community
style reference currently tracked here because it focuses directly on
Factorio-like GUI composition and explicitly documents style precepts, element
patterns, and in-game style inspection tools. Treat it as design guidance to
extract into local tokens and constraints, not as license to copy assets.

Raiguard's broader public work is also tracked as a high-value lead. The Mod
Portal lists Raiguard as owner/author for Factorio Library (`flib`), Editor
Extensions, and Krastorio 2. The public Codeberg profile describes Raiguard as
"Game programmer @ Wube Software." That makes the guide and related repositories
especially relevant for Factorio-native GUI taste and architecture research.
Concrete rules should still be cited to the specific page, repository, or file
that was inspected. Editor Extensions is especially relevant to future testing
workflow research because its Mod Portal page describes a separate editor lab
used to design and test away from the main factory.

The style guide's in-game inspection workflow should be treated as part of the
source pipeline. Use graphical Factorio, not headless Factorio, to collect:

- `Ctrl+F6`: GUI style inspector, especially style names and properties;
- `Ctrl+F5`: bounding boxes for element spacing and hit areas;
- `Ctrl+F7`: shadow toggles for checking depth and separation.

Headless Factorio cannot expose these hover/visual overlays because it does not
render GUI surfaces. Captured style-inspector notes should become local tokens,
component constraints, or fixture comments before implementation.

A companion mod can still automate part of this workflow in graphical Factorio.
For script-owned GUI elements, it can dump the script-visible `LuaGuiElement`
tree and readable `LuaStyle` fields to JSON. Use that for repeatable checks of
element names, style names, declared dimensions, spacing, padding, alignment,
and stretch/squash flags. Keep manual `Ctrl+F6` captures for renderer-computed
values that the mod API does not expose, such as content size, clip size, size
before stretching, relative hover coordinates, and the inspector's derived-style
explanation.

`JanSharp/FactorioGUIEditor` was inspected as a possible existing resource. It
is an in-game Factorio GUI editor prototype with unreleased dependencies, not a
browser renderer. Its useful lesson is constraint awareness: Factorio GUI
stretch/fixed-size combinations, scroll panes, and click-event surfaces can
behave differently from browser layout.

`ClaudeMetz/UntitledGuiGuide` was added as a legacy reference with caution. It
is an older custom Factorio GUI tutorial and explicitly says it is not a style
guide. Use it for practical GUI-building concepts and terminology, not as an
authoritative source over the current Factorio API docs or current in-game
behavior.

## Observed Public Web Tokens

The Factorio website and Mod Portal share the same public `main.css` family.
The API docs add a docs-specific stylesheet but keep the same top-bar,
panel/inset vocabulary, compact rhythm, and typography. Together they provide a
useful browser-side reference for the editor skin, while in-game captures remain
necessary for runtime GUI parity.

The observed public web language is compact and mechanical:

- dark brown/black page background;
- dense gray panels with hard corners;
- layered 4 px-ish panel edges and inset shadows;
- Titillium Web for UI copy and headings;
- gold/tan headings for first-read labels;
- orange for selected tabs, hover states, and active affordances;
- blue for links and secondary info;
- green/red only for status, success, harm, or warning semantics;
- gray table rows, alternating row tones, and restrained dividers;
- compact 8 px spacing increments;
- fixed-size slots, square icon buttons, and row rhythm;
- dark scrollbars with gray thumbs and orange hover;
- buttons that feel pressed through inset shadow and small vertical offset.

Observed reusable values from the official public domains:

| Value | Observed role |
| --- | --- |
| `#201810` | website page background |
| `#313031` | main panel fill |
| `#414040` | lighter panel/inset fill |
| `#242324` | dark inset/hole fill |
| `#2e2623` | hard panel edge |
| `#ffe6c0` | headings and active text |
| `#e39827` / `#ffa900` | hover and selected orange |
| `#7dcaed` | links and secondary blue |
| `#8e8e8e` | neutral button and field fill |
| `36px` | default button/textfield height |
| `38px` | slot size |
| `16px x 15px` | checkbox mark surface |

## Local Browser Tokens

The browser renderer owns a local token layer rather than copying source CSS.
The current CSS is split by responsibility:

- `src/styles/base.css`: reset-adjacent base tokens, page background, typography;
- `src/styles/layout.css`: site chrome and page shells;
- `src/styles/factorio-atoms.css`: reusable frame, inset, button, field,
  checkbox, tab, slot, table, notice, scroll-pane, and window atoms;
- `src/styles/editor.css`: editor-specific canvas and rail layout;
- `src/styles/docs.css`: Markdown documentation rendering;
- `src/styles/style-atlas.css`: atom review surface.

| Token | Purpose |
| --- | --- |
| `fx-bg` | neutral gray page background for Labtorio readability |
| `fx-panel` | main gray panel fill; confirmed in-game frame background `#313031` |
| `fx-panel-light` | raised or selected panel fill |
| `fx-panel-dark` | inset/hole fill |
| `fx-edge` | neutral charcoal panel edge for in-game-like editor frames |
| `fx-frame-shadow` | in-game-like raised frame highlight, bottom darkening, and drop shadow |
| `fx-window-outer-border` | 6 px graphical frame edge needed for captured `size` to `content_size` math |
| `fx-window-padding-*` | inspected top-level `frame` padding: top `6`, sides `12`, bottom `12` |
| `fx-window-titlebar-*` | inspected `frame_header_flow`: `48` height, `42` content height, `6` bottom padding, `12` spacing |
| `fx-window-drag-handle-*` | inspected `draggable_space_header`: `36` height and `6` left/right margins |
| `fx-window-body-spacing` | inspected `inside_deep_frame` vertical spacing of `0` |
| `fx-gold` | headings and active primary labels |
| `fx-orange` | selected tab/button accent |
| `fx-blue` | links and secondary info values |
| `fx-muted` | disabled or secondary text |

## Style Atlas Workflow

`/style-atlas` is the first review surface for visual parity. It should contain
every reusable atom before that atom becomes important in the editor. Tune the
atlas against official website/Mod Portal/API docs observations first, then
against graphical Factorio captures.

Each atlas section is its own top-level-style GUI frame. This intentionally
matches the in-game composition baseline: a `frame` with a title, a header
filler, and an inner vertical content flow. Avoid wrapping the whole atlas in one
large frame because that hides per-section frame behavior and makes it harder to
review atom boundaries.

Raised panel boxes should stay visually flat. The official public `.panel`
pattern uses a `#313031` fill, a `4px` `#2e2623` edge, and a small `#201815`
outer shadow before its asset border-image is applied, but that warm edge is a
website fallback that blends into Factorio.com's brown page theme. In in-game
GUI captures the outer frame reads as a thin charcoal/black structure with a
faint light line along the top, stronger black weight at the bottom, and a
drop shadow behind the frame. Close corner crops show this as a hard black
outside corner, a one-pixel bottom/right ledge, a softer shadow cast down and
right, and small inner highlights on the top/left edges. The local editor
therefore uses a neutral charcoal `fx-edge` plus `fx-frame-shadow`, and reserves
deeper inset/outset shadow stacks for inset panels, holes, buttons, fields,
checkboxes, slots, and scroll/table cells.

When an in-game capture contradicts the public website skin, prefer the in-game
capture for editor primitives that will generate Lua.

## Captured In-Game Frame Constraints

The current top-level window baseline comes from graphical Factorio `Ctrl+F6`
captures of map-editor and vanilla Blueprint Library windows. The map-editor
capture was sample-specific; the reusable browser model should report the
generic vanilla top-level window class, not `MapEditorGui`.

| Element | Inspector class/style | Captured constraints |
| --- | --- | --- |
| Top-level window | `agui::Window`, style `inset_frame_container_frame`, derived from `frame` | size `708 x 395` review fixture, content `672 x 365`, top padding `6`, right/bottom/left padding `12`, `use_header_filler=true`, maximum horizontal squash `0`, maximum vertical squash `18` |
| Header row | `agui::HorizontalFlow`, derived from `frame_header_flow` | size `672 x 48`, content `672 x 42`, clip y offset `-4`, bottom padding `6`, horizontal spacing `12`, horizontally stretchable on, vertically stretchable off |
| Title label | `agui::Label`, derived from `frame_title` / `label` | relative `[0, -4]`, height `46`, content height `42`, top margin `-4`, bottom padding `4`, vertically stretchable on, horizontally squashable on, `single_line=true`, font `heading-1`, font color `{1, 0.901961, 0.752941}` |
| Header filler | `agui::Filler`, derived from `draggable_space_header` / `draggable_space` / `empty_widget` | size `473 x 36`, natural height `36`, left/right margin `6`, horizontally and vertically stretchable on |
| Body flow | `agui::VerticalFlow`, part of `inside_deep_frame` | size `672 x 317`, content `672 x 317`, vertical spacing `0`, maximum vertical squash `18` |

The top-level `size` and `content_size` values only reconcile when the browser
frame models Factorio's graphical frame edge as a 6 px border before applying
the inspected style padding. For the current fixture, `708 - 6 - 6 - 12 - 12 =
672` and `395 - 6 - 6 - 6 - 12 = 365`. The border must stay neutral
charcoal/black; it is not the brown public-website panel edge.

This 6 px edge should be treated as a graphical frame band, not a hard CSS
stroke. A close top-left crop sampled as a soft ramp from the world background
into the panel: the left edge settles through approximately `#241d1b`,
`#2a2422`, `#2f2b29`, `#302e2e`, `#313030`, and `#313031`, while the top bevel
starts brighter around `#62605f` and drops into the same panel fill over the
same 6 px depth. The local renderer keeps a transparent 6 px layout border for
box math, then paints that edge with clipped gradients so the frame reads as a
smooth 9-slice-style bevel instead of two visible outline lines. Top-level
windows also avoid the generic raised-panel inset shadow; their depth comes
from the frame-band bevel and an external drop/ledge shadow. The window
padding-box fill must stay the same `fx-panel` color that the frame-band ramp
lands on, with no extra interior glaze, or the edge reads as a separate border
instead of one continuous frame material.

The frame sides are rendered as four trapezoid bands, not as rectangular strips.
Each band owns the full outer edge and a shorter inner edge facing the panel, so
adjacent bands meet on a diagonal miter at every corner. This is currently done
with renderer-only chrome spans and `clip-path: polygon(...)`; those spans are
not model nodes and must not be exported as Factorio GUI elements. Avoid radial
corner fills; they read as dark blobs rather than the short mitered bevel
visible in the in-game corner crops.

The header horizontal flow is placed directly in that content area. It should
not introduce its own margin or extra border. Its outer layout box is `672 x
48`; the `42` content height comes from the `6` bottom padding, and its `clip`
extends 4 px upward for the title label rendering.

The Map Editor header capture also includes a `SearchBar 36 x 36` child after
the draggable filler. That appears to be an optional header control for that
specific GUI, not a universal top-level window requirement. The current generic
browser window renders the title label and draggable filler only; optional
header controls need a separate model field and export mapping before they
should be added to every window.

The header filler visual reads as a repeated 6 px bevel cadence rather than a
flat stripe. A close-up sample showed a dark recessed half followed by a lighter
raised half, approximated locally as `#2a2a2a`, `#2d2c2d`, `#2b2a2b`,
`#383738`, `#3b3a3b`, `#383738` across each repeat. The filler should not have
its own border, drop shadow, or inset top/bottom glaze; it is a flat groove
texture inside the header flow.

These values are not only visual measurements. They are layout-model facts that
the browser DOM, JSON model, and Lua skeleton should preserve until a later
Factorio capture proves a different primitive or style is required.

The editor's Inspector checkbox emulates the `Ctrl+F6` workflow for the current
browser model. When enabled, hovering or focusing a rendered GUI part selects
the matching model node, highlights that part in the preview, and shows a single
Factorio-style inspector box under the sidebar Inspector section. The box should
describe the highlighted node only, not every node at once. Clicking a rendered
GUI part locks the inspector to that node so values can be read or copied; while
locked, hover/focus no longer changes the selection until the inspector is
unlocked or another part is clicked. The highlight should read like Factorio's
inspector wash: a translucent white overlay over the selected part, not an
external bounding outline that changes or obscures the perceived geometry.
The Inspector section also includes a compact component tree using the same
stable model anchors as hover inspection. Clicking a tree row locks the selected
component, highlights the matching preview node, and shows that node's values.
The tree uses CLI `tree`-style connector rails and elbows so parent-child
structure is visible at a glance without adding decorative nodes to the model.
It is pinned to the bottom of the Inspector section and styled as a recessed
component browser so changing inspector value height does not move it around.

The editor caches its current seed state in browser `localStorage`: title,
current top-level window, inspector toggle/selection, Lua output visibility, and
the window location after dragging. The left editor rail also caches a resizable
width preference so the inspector can be widened for long names and values
without adding non-Factorio layout data to the GUI model. Inspector key/value
rows are single-line and crop with an ellipsis at narrow widths; the full text
is available from the browser tooltip. Dragging is intentionally limited to the
header horizontal flow and its draggable filler, matching the Factorio pattern
where a child header element has `drag_target` set to the top-level frame.
Before the first drag, the window remains auto-centered; after dragging, the
model records an explicit screen location and the Lua preview emits that
location. The Lua output is toggled from the Inspector section and, when shown,
occupies a full-width bottom row beneath the editor rather than only the stage
column.

## Component Translation Targets

| Browser component | Factorio Lua export target later |
| --- | --- |
| Window shell | `frame` in `player.gui.screen` or a relative anchor |
| Title bar | draggable frame title / flow |
| Drag handle | empty-widget or flow region reserved for dragging |
| Window body | child flow/table/scroll-pane chosen by the layout model |
| Button | `button` or `sprite-button` with stable action tags |
| Text input | `textfield` with stable action tag |
| Checkbox | `checkbox` with stable action tag |

## Visual Risk Checklist

Reject editor revisions that:

- depend on a bundled domain example for the default experience;
- make browser CSS the source of truth instead of Factorio GUI primitives;
- show large dead slabs of empty gray panel once content primitives exist;
- use green/red as decoration instead of numeric or status meaning;
- add nested cards for every row;
- clip rows or place text under scrollbars;
- depend on copyrighted Wube image assets for the basic look.

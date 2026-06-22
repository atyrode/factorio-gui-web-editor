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
- <https://github.com/wube/factorio-data/blob/master/core/prototypes/style.lua>
- <https://man.sr.ht/~raiguard/factorio-gui-style-guide/>
- <https://mods.factorio.com/user/raiguard>
- <https://mods.factorio.com/mod/flib>
- <https://mods.factorio.com/mod/EditorExtensions>
- <https://mods.factorio.com/mod/Krastorio2>
- <https://codeberg.org/raiguard?q=&tab=repositories&sort=recentupdate>
- <https://github.com/JanSharp/FactorioGUIEditor>
- <https://github.com/ClaudeMetz/UntitledGuiGuide/wiki>
- <https://github.com/ClaudeMetz/FactoryPlanner/blob/356bb911aa12c8fd67cded33b6d48fab14821d1a/modfiles/ui/main/title_bar.lua#L62-L68>
- <https://github.com/ClaudeMetz/FactoryPlanner/blob/356bb911aa12c8fd67cded33b6d48fab14821d1a/modfiles/prototypes/styles.lua#L247-L251>
- <https://github.com/nihilistzsche/LtnManager/blob/539329ddf7ddcb98e99b65ff9001189573cc77bd/scripts/gui/index.lua#L162-L166>
- <https://github.com/nihilistzsche/LtnManager/blob/539329ddf7ddcb98e99b65ff9001189573cc77bd/scripts/gui/index.lua#L203-L226>
- <https://github.com/Refactorio/RedMew/blob/develop/utils/gui.lua#L205-L223>
- <https://github.com/pyanodon/pycoalprocessing/blob/master/scripts/wiki/wiki.lua#L66-L75>
- <https://github.com/galgtonold/ai_combinator/blob/main/src/gui/dialogs/set_task_dialog.lua#L60-L67>

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

The public `wube/factorio-data` repository is tracked as the most useful source
for base game GUI style definitions. Its `core/prototypes/style.lua` file
defines the default `gui-style` table and source-backed label variants such as
`label`, `frame_title`, `caption_label`, `heading_2_label`,
`subheader_caption_label`, and `clickable_label`. Treat that file as
authoritative for style names, inheritance, and declarative style fields. Do
not vendor Wube image assets or graphical sets from it; re-express only the
defensible structural facts and local browser approximations.

For the Label atom specifically, official runtime docs identify `label` as a
GUI element for text and expose label-compatible `LuaStyle` fields including
font, font color, disabled/hover/clicked font colors, padding, margins,
squash/stretch flags, rich-text handling, and `single_line`. Raiguard's style
guide recommends custom titlebars use a `label` with the `frame_title` style and
`ignored_by_interaction=true`. Factory Planner's title bar file uses a `label`
with a custom `fp_label_frame_title` style and `ignored_by_interaction=true`,
with that style parented from `frame_title` in its prototype style file. LTN
Manager uses `label` with `frame_title` and `ignored_by_interaction=true` in
its titlebar and also uses `subheader_caption_label` and `caption_label` in its
toolbar. This evidence is enough to scaffold Label style variants, export the
titlebar Label, and expose an authored base `label` component with editable
caption. It is not enough to close visual parity for every Label state without
fresh in-game captures.

Remaining Label evidence needed before claiming full parity:

- `Ctrl+F6` rows for plain `label`, `caption_label`, `subheader_caption_label`,
  and `frame_title`;
- `Ctrl+F5` bounding-box crops for those same styles;
- normal screenshot crops without overlays for browser-vs-Factorio comparison;
- disabled and hovered captures if disabled/hover behavior is promoted from
  source-backed approximation to completed renderer behavior.

For the Filler atom specifically, the official `GuiElementType` docs identify
`empty-widget` as an empty GUI element, `LuaStyle` exposes stretch and margin
fields, and `LuaGuiElement.drag_target` explicitly supports `empty-widget`
drag handles. Public mod sources were inspected to confirm this is idiomatic:
RedMew has separate helper paths for generic stretch pushers and draggable
header space, Pyanodons uses `draggable_space_header` as title/caption spacing,
and `ai_combinator` uses `draggable_space` as a stretch filler inside a flow.
That evidence makes `header-filler` a local role of the generic Filler atom,
not the atom identity.

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
| `fx-window-body-horizontal-spacing` | inspected `inset_frame_container_horizontal_flow` spacing of `18` |
| `fx-window-body-vertical-spacing` | editor-authored vertical body split gutter; currently mirrors the horizontal body split spacing until graphical Factorio captures prove a separate vertical value |
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
filler, and an inner content flow. Avoid wrapping the whole atlas in one
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
| Top-level window | GUI-specific class or `agui::Frame`, frame-derived styles | size/content/clip are instance-derived, top padding `6`, bottom/left/right padding generally `12`, `use_header_filler=true`, maximum horizontal squash `0` |
| Header row | `agui::HorizontalFlow`, derived from `frame_header_flow` | current reference size `1440 x 48`, content `1440 x 42`, clip y offset `-4`, size before stretching `395 x 48`, maximum horizontal squash `1236`, bottom padding `6`, horizontal spacing `12`, horizontally stretchable on, vertically stretchable off |
| Title label | `agui::Label`, derived from `frame_title` / `label` | relative `[0, -4]`, size `191 x 46`, content `191 x 42`, top margin `-4`, bottom padding `4`, vertically stretchable on, horizontally squashable on, `single_line=true`, font `heading-1`, font color `{1, 0.901961, 0.752941}` |
| Header filler | `agui::Filler`, derived from `draggable_space_header` / `draggable_space` / `empty_widget` | relative `[209, 0]`, size `1045 x 36`, size before stretching `0 x 36`, height `36`, natural height `36`, left/right margin `6`, horizontally and vertically stretchable on |
| Header action slots | `SearchBar`, browse-arrow `agui::HorizontalFlow`, `CloseButton` | SearchBar relative `[1272, 0]`, size `36 x 36`, content `24 x 24`, style `frame_action_button`; CloseButton relative `[1404, 0]`, size `36 x 36`, content `24 x 24`, style `close_button`; the browse-arrow group occupies the `72 x 36` gap between them |
| Body flow | `agui::HorizontalFlow`, part of `inset_frame_container_frame` and derived from `inset_frame_container_horizontal_flow` | current reference size `1440 x 792`, content `1440 x 792`, horizontal spacing `18` with inherited horizontal flow spacing `6`, maximum vertical squash `540` |

The body split reference shows the content `agui::HorizontalFlow` with direct
visible `agui::Frame` children. That distinction matters for the browser
renderer and Lua export: Flow owns ordered layout and spacing, while Frame owns
the visible deep/inset surface. A body split should therefore be modeled as
`HorizontalFlow -> Frame, Frame`, not as sibling Horizontal Flows that paint
their own visible container chrome. Keeping the split gutter in the parent flow also better
matches Factorio's shared-border/T-junction style behavior, where the separator
reads as part of the surrounding frame material rather than as a capped child
overlay.

The browser renderer follows a substrate rule for these splits: the parent body
or parent flow supplies the panel material visible through spacing gaps, while
the child Frames own the top, bottom, and side edge strokes. The parent body
must not draw continuous top or bottom rim shadows across split gaps, because
those strokes visually cap the separator instead of letting it connect into the
surrounding frame material.

The same substrate rule applies to vertical Window bodies in the editor. Even
though one captured `inside_deep_frame` reference reported zero vertical
spacing, the authored vertical body split uses an explicit gutter so stacked
sibling Frames do not visually merge into one surface. Treat this as an editor
split rule until a graphical Factorio capture establishes a more precise
vertical body-flow style.

The editor's GUI shadow toggle mirrors the purpose of Factorio's `Ctrl+F7`
shadow inspection: it disables cast shadows for review without removing bevel
or inset edge styling. A disabled shadow state should make external depth easier
to inspect while preserving the Window and Frame graphical-set edge rules above.

Exact `inside_deep_frame` pixel parity is deferred. The current browser Frame
renderer is a bounded approximation that keeps the model/export structure
honest, but it should not be treated as a completed reproduction of Factorio's
graphical-set edge pixels.

The official Factorio API docs list `flow` and `frame` as distinct runtime
element types. The editor therefore treats `agui::HorizontalFlow` and
`agui::Frame` as separate atoms. Horizontal and vertical are directions on
layout-capable elements; style names such as `frame_header_flow`,
`inset_frame_container_horizontal_flow`, and `inside_deep_frame` are style or
role variants, not atom identities. The captured header/body numbers above are
evidence fixtures. They are not product defaults, and they are not exported as
general style formulas until additional captures or an in-game validation
harness prove the rule.

The current Window captures in this section were taken with Factorio UI scale
set to Manual (pixels) `150%`. That is capture metadata, not a completed scale
rule. Before deriving formulas for `maximal_height`, squash sizes, or viewport
clamps, compare at least one additional UI scale or viewport.

The top-level `size` and `content_size` values only reconcile when the browser
frame models Factorio's graphical frame edge as a 6 px band before applying the
inspected style padding. For the current reference fixture,
`1476 - 6 - 6 - 12 - 12 = 1440` and `870 - 6 - 6 - 6 - 12 = 840`.
This is Factorio's decorative frame chrome: it affects the renderer-computed
content box, but it is not exposed as `padding` and should not be exported as a
Lua style assignment. The same 6 px per-side relationship appears on other
decorated GUI elements such as inventory slots (`60 x 60` outer and `48 x 48`
content). The local renderer preserves it as the Window bevel/border band.

The editor's default Window reference box is authored for the web preview at
`680 x 480`; it is not copied from an in-game screenshot. The attached
Blueprint Library capture remains an evidence fixture: outer size `1476 x 870`,
content size `1440 x 840`, clip size `{{0, -4}, {1476, 874}}`, and
`maximum_vertical_squash_size: 540`. Window references are now named records;
the model also carries a Factoriopedia root reference with `1341 x 973` outer
size, `1305 x 943` content size, `{{0, -4}, {1341, 977}}` clip size,
`maximal_height: 973`, and a horizontal body flow, plus a full-height
filter-selection reference with `672 x 973` outer size, `636 x 943` content
size, `{{0, -4}, {672, 977}}` clip size, `maximal_height: 973`, and a vertical
body flow. These captures are evidence for future width, height, and body
variant controls rather than automatic proof of a general layout formula.

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

Additional top-level captures show that a Window-like root is not always
reported as `agui::Window`. Factoriopedia reports class `Factoriopedia` with
style `inset_frame_container_frame`; Achievements reports `AchievementGui` with
style `frame`; filter selection reports a specialized `FilterSelectGui...`
class with style `frame`; editor side panes report `agui::Frame` with
`character_gui_left_side` and `frame_without_left_side`. All observed captures
still derive from or behave like `frame`, use top padding `6`, bottom padding
`12`, left padding `12`, and `use_header_filler=true`. Right padding is usually
`12`, but `character_gui_left_side` has a style-specific `right_padding=6`
override before the inherited `frame` value.

`relative` needs to be read in context. For normal child elements it is a
parent-layout coordinate. The Blueprint Library title label reports
`relative: [0, -4]`, which matches its `top_margin: -4`. The draggable filler
reports `relative: [209, 0]`, which is explained by the title width `191`,
header spacing `12`, and filler left margin `6`. The SearchBar then reports
`relative: [1272, 0]`, which follows filler `x 209 + width 1045 + right margin
6 + header spacing 12`; the CloseButton reports `[1404, 0]`, after SearchBar,
the `72 x 36` browse-arrow group, and two 12 px header spacings. Root values
are less uniform: the Blueprint Library root stays at `[0, 0]` when moved,
while moved Factoriopedia samples report `[388, 106]`, `[382, 220]`, and
`[1142, 315]` with stable size metrics. The editor therefore treats root
`relative` as capture/variant evidence, not the exported screen `location`;
dragged window location remains editor-owned state mapped to
`LuaGuiElement.location`.

The full-height captures report `maximal_height: 973`, while their outer
height is also `973` and clip height is `977`. In the current evidence set,
those captures are at Manual (pixels) `150%`. Treat `maximal_height` as a
captured runtime/layout metric and defer derivation until the editor can emulate
Factorio GUI scale, viewport, and screen-location changes. It should not be
exported as a fixed Window style constant, and it should not block the baseline
Window shell atom.

The captures do not give a stable formula for `maximum_vertical_squash_size`:
observed values include `540`, `619`, `775`, `673`, `631`, and `565`. Those
values are carried as capture evidence. The editor uses the current Blueprint
Library fixture value `540` for that capture, but authored Windows should not
invent a formula yet. The field may be tied to `maximal_height`, natural content
height, visible viewport, or style variant behavior. This is deferred to a
future GUI-scale/layout-solver phase rather than treated as a blocker for the
current Window container.

The frame sides are rendered as four trapezoid bands, not as rectangular strips.
Each band owns the full outer edge and a shorter inner edge facing the panel, so
adjacent bands meet on a diagonal miter at every corner. This is currently done
with renderer-only chrome spans and `clip-path: polygon(...)`; those spans are
not model nodes and must not be exported as Factorio GUI elements. Avoid radial
corner fills; they read as dark blobs rather than the short mitered bevel
visible in the in-game corner crops.

The header horizontal flow is placed directly in that content area. It should
not introduce its own margin or extra border. Its current reference layout box
is `1440 x 48`; the `42` content height comes from the `6` bottom padding, and its `clip`
extends 4 px upward for the title label rendering.

Several full-height captures include a `SearchPopup 168 x 42` child between the
header flow and content flow. Map Editor header captures also include a
`SearchBar 36 x 36` child after the draggable filler. These appear to be
optional search/header controls for specific GUIs, not universal top-level
window requirements. The Window atom owns stable regions/slots where optional
header actions, between-header-and-body overlays, and body contents can attach.
It does not own the implementation, renderer, export, or runtime behavior of
`SearchPopup`, `CloseButton`, `FrameWithSubheader`, `TabbedPane`, or other child
atoms. The no-code interface should expose actual child insertion only after
those child atoms are implemented.

The vanilla GUI captures are internal reconstruction evidence, not user-facing
presets. The editor starts from a build-from-scratch Window with sensible
authored defaults; it should not offer Blueprint Library or Factoriopedia as
new-window templates unless that product direction changes later.

The header filler visual reads as a repeated 6 px bevel cadence rather than a
flat stripe. A close-up sample showed a dark recessed half followed by a lighter
raised half, approximated locally as `#2a2a2a`, `#2d2c2d`, `#2b2a2b`,
`#383738`, `#3b3a3b`, `#383738` across each repeat. The filler should not have
its own border, drop shadow, or inset top/bottom glaze; it is a flat groove
texture inside the header flow.

The generic Filler model should remain broader than that header texture.
`draggable_space_header` is the captured titlebar/header style variant;
`draggable_space` is a generic spacer or drag-area style used by mods. The
no-code builder exposes authored Fillers as `empty-widget` leaves using
`draggable_space`, stretch flags, `role: spacer`, and
`ignored_by_interaction = true`; the generated titlebar Filler remains the
separate `header-filler` role using `draggable_space_header`.

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

Inspector rows are structured model projections, not parsed strings. Display
uses the in-game `key: value` text rhythm: geometry values stay normal text,
style names are orange, style/property facts are green, and known gaps render as
`not implemented`. Rows can also carry model metadata. Child rows with a
`targetId` temporarily highlight their target on hover and lock/navigate to it
on click. Only this in-inspector row traversal builds back/forward history.
Direct canvas clicks and component-tree clicks lock/select the target component
without modifying the history stacks. Geometry rows such as `size` and
`content_size` can show an inspector measurement overlay with a small label
attached to the preview rectangle.
Editable values must opt in through row metadata and may only mutate state the
editor owns; currently that means the title label caption and authored Label
captions, while captured Factorio style facts remain read-only. Authored Label
captions are also editable from the component tree and Select-mode canvas
double-click. The root Window atom does not own a caption field.

The Inspector section also includes a compact component tree using the same
stable model anchors as hover inspection. Clicking a tree row locks the selected
component, highlights the matching preview node, and shows that node's values.
The tree uses CLI `tree`-style connector rails and elbows so parent-child
structure is visible at a glance without adding decorative nodes to the model.
It is pinned to the bottom of the Inspector section and styled as a recessed
component browser so changing inspector value height does not move it around.
Inspector back/forward controls and lock-state controls use small square action
buttons based on Factorio's dark toolbar buttons: charcoal fill, black outer
ledge, light top bevel, dark bottom bevel, and pale centered glyphs that dim
with the disabled state. The padlock is release-only: while the inspector is
following hover it shows a disabled open lock, and after a GUI part or component
row is clicked it switches to an active closed lock that can be clicked to
unlock back to follow mode.

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

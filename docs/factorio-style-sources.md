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
| `fx-bg` | dark page background |
| `fx-panel` | main gray panel fill |
| `fx-panel-light` | raised or selected panel fill |
| `fx-panel-dark` | inset/hole fill |
| `fx-edge` | hard panel edge |
| `fx-gold` | headings and active primary labels |
| `fx-orange` | selected tab/button accent |
| `fx-blue` | links and secondary info values |
| `fx-muted` | disabled or secondary text |

## Style Atlas Workflow

`/style-atlas` is the first review surface for visual parity. It should contain
every reusable atom before that atom becomes important in the editor. Tune the
atlas against official website/Mod Portal/API docs observations first, then
against graphical Factorio captures.

When an in-game capture contradicts the public website skin, prefer the in-game
capture for editor primitives that will generate Lua.

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

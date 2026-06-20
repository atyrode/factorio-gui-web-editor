import {
  atomCapture,
  atomCompletion,
  atomDefinition,
  atomField,
  atomFieldStates,
  atomProgressCheck,
  atomProgressCheckStates,
  atomValueTypes
} from "./factorioAtomModel.js";

export {
  atomCompletion,
  atomFieldStates,
  atomProgressCheckStates,
  atomValueTypes
};

const field = atomField;
const progressCheck = atomProgressCheck;
const {
  boolean,
  className,
  color,
  guiPrimitive,
  integer,
  nodeList,
  size2i,
  string,
  styleName,
  vector2i,
  rectangle2i
} = atomValueTypes;

function captureRow(name, type, example, note = "") {
  return { name, type, example, note };
}

export const factorioAtomRegistry = Object.freeze([
  atomDefinition({
    id: "window",
    name: "Window",
    primitive: "frame",
    style: "inset_frame_container_frame",
    availability: "Editor seed",
    summary: "Top-level GUI shell with titlebar, drag handle, and body flow.",
    className: "agui::Window",
    derivedFrom: "frame",
    fields: [
      field("className", "captured", "Top-level GUI roots can report generic or GUI-specific classes.", {
        type: className,
        example: "agui::Window / Factoriopedia / AchievementGui / agui::Frame",
        source: "top-level-window-captures"
      }),
      field("primitive", "official", "Mapped to Factorio `frame`: official Factorio GUI element types include `frame` and `flow`, but not a separate public `window` type.", {
        type: guiPrimitive,
        example: "frame",
        source: "factorio-runtime-docs"
      }),
      field("style", "captured", "Current seed uses `inset_frame_container_frame`; real top-level roots also use `frame`, `character_gui_left_side`, and `frame_without_left_side`.", {
        type: styleName,
        example: "inset_frame_container_frame",
        source: "top-level-window-captures"
      }),
      field("derivedFrom", "captured", "`frame` from the style panel.", {
        type: styleName,
        example: "frame",
        source: "blueprint-library-window"
      }),
      field("relative", "captured", "Observed as `[0, 0]` on the top-level window; meaning still needs moved-window captures.", {
        type: vector2i,
        example: "[0, 0]",
        source: "blueprint-library-window"
      }),
      field("size", "captured", "Renderer-computed outer size from the Blueprint Library capture.", {
        type: size2i,
        example: "{1476, 870}",
        source: "blueprint-library-window"
      }),
      field("content_size", "captured", "Renderer-computed content box. For ordinary frame-derived roots, it equals outer size minus the 6 px graphical frame band on each side and inspected padding.", {
        type: size2i,
        example: "{1440, 840}",
        source: "blueprint-library-window"
      }),
      field("clip_size", "captured", "Renderer clipping rectangle can extend above the frame by 4 px.", {
        type: rectangle2i,
        example: "{{0, -4}, {1476, 874}}",
        source: "blueprint-library-window"
      }),
      field("size_before_stretching", "captured", "Observed equal to outer size on ordinary full-height roots; side-frame variants can report their natural pre-clamp height instead.", {
        type: size2i,
        example: "{1476, 870}",
        source: "blueprint-library-window"
      }),
      field("maximum_horizontal_squash_size", "captured", "Observed zero on the top-level window.", {
        type: integer,
        example: 0,
        source: "blueprint-library-window"
      }),
      field("maximum_vertical_squash_size", "captured", "Captured values vary by content/window type. The editor carries the selected reference value but does not yet claim a general derivation formula.", {
        type: integer,
        example: "540 / 619 / 775 / 673 / 631 / 565",
        source: "top-level-window-captures"
      }),
      field("maximal_height", "captured", "Observed as 973 across full-height captures but absent from the current Blueprint Library Window capture; appears viewport/window-instance derived, not a static style constant.", {
        type: integer,
        example: 973,
        source: "top-level-window-captures"
      }),
      field("padding", "captured", "Top 6, bottom/right/left 12 from `frame` style inheritance.", {
        type: integer,
        example: "top=6, right=12, bottom=12, left=12",
        source: "blueprint-library-window"
      }),
      field("use_header_filler", "captured", "Captured as true on `inset_frame_container_frame`.", {
        type: boolean,
        example: true,
        source: "blueprint-library-window"
      }),
      field("children", "captured", "Top-level roots have header/content children, with optional search/header controls depending on GUI.", {
        type: nodeList,
        example: "HorizontalFlow header, optional SearchPopup, content flow",
        source: "top-level-window-captures"
      }),
      field("graphicalBorder", "inferred", "Browser renderer uses a 6 px frame band because the captured size/content_size deltas do not reconcile from inspected padding alone.", {
        type: integer,
        example: 6,
        source: "top-level-window-captures"
      }),
      field("reference captures", "implemented", "Window reference captures are named model data. The current default is the attached Blueprint Library capture, and a full-height vertical-body capture is represented separately.", {
        type: size2i,
        example: "blueprint-library-window / filter-select-root-window",
        source: "window-reference-captures"
      }),
      field("variant layout solver", "planned", "The current atom derives the reference box; future variants still need rules for width, side-frame edge removal, pre-stretch height, and squash-size calculation."),
      field("optional header actions", "planned", "SearchBar, browse arrows, and CloseButton are captured in some vanilla headers but are optional top-level controls, not universal Window children.", {
        type: nodeList,
        example: "SearchBar, HorizontalFlow[BrowseArrow, BrowseArrow], CloseButton",
        source: "blueprint-library-header"
      })
    ],
    progressChecks: [
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Official Factorio primitive model checked",
        note: "`frame` and `flow` are official GUI element types; public API has no separate `window` type."
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Blueprint Library `agui::Window` capture transcribed"
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Full-height top-level root captures transcribed"
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Side-frame root captures transcribed"
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Header and body child flow captures transcribed"
      }),
      progressCheck({
        dimension: "evidence",
        state: "blocked",
        label: "Moved-window, UI-scale, and Ctrl+F5 validation captures",
        note: "Needed to settle `relative`, `maximal_height`, frame-band geometry, and squash-size derivation."
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Root Window maps to a top-level frame node"
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Header flow, title label, and drag filler are structured nodes"
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Blueprint Library reference is named capture data"
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Full-height vertical-body reference is named capture data"
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Content, clip, titlebar, and body geometry read from structured reference data"
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Body flow direction and spacing are data-driven"
      }),
      progressCheck({
        dimension: "model",
        state: "partial",
        label: "Side-frame variants represented",
        note: "`character_gui_left_side` and `frame_without_left_side` are captured, but not yet selectable/model-complete."
      }),
      progressCheck({
        dimension: "model",
        state: "partial",
        label: "Optional children represented",
        note: "SearchPopup, header actions, Frame, FrameWithSubheader, and TabbedPane are visible as gaps but not implemented child atoms."
      }),
      progressCheck({
        dimension: "model",
        state: "blocked",
        label: "General squash/maximal-height layout solver",
        note: "Requires more in-game captures or script-visible style dumps."
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Top-level frame band and padding render from model tokens"
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Header flow, title, and drag filler render"
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Horizontal and vertical body flow direction render from model data"
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Inspector rows and geometry overlays render from structured data"
      }),
      progressCheck({
        dimension: "renderer",
        state: "partial",
        label: "Style variants render",
        note: "Primary frame is covered; side-frame graphical-set variants are not rendered exactly."
      }),
      progressCheck({
        dimension: "renderer",
        state: "partial",
        label: "Optional body/header children render",
        note: "They are listed as not implemented rather than rendered as real atoms."
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Root frame export uses supported Factorio primitive/style fields"
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Header flow, title label, and drag filler export"
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Body flow exports direction and matching spacing field"
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Unresolved computed metrics are not exported",
        note: "`maximal_height`, renderer clip metrics, and null spacing fields stay out of Lua."
      }),
      progressCheck({
        dimension: "luaExport",
        state: "partial",
        label: "Reference variants export",
        note: "Implemented model can represent horizontal and vertical body flows, but the UI cannot choose/export variants yet."
      }),
      progressCheck({
        dimension: "luaExport",
        state: "todo",
        label: "Optional child atoms export"
      }),
      progressCheck({
        dimension: "behavior",
        state: "done",
        label: "Browser titlebar dragging is implemented"
      }),
      progressCheck({
        dimension: "behavior",
        state: "done",
        label: "Lua drag targets are emitted for title/filler"
      }),
      progressCheck({
        dimension: "behavior",
        state: "done",
        label: "Auto-center versus explicit screen location is modeled"
      }),
      progressCheck({
        dimension: "behavior",
        state: "partial",
        label: "Inspector navigation behavior is modeled",
        note: "Useful for editor review, but not a Factorio runtime behavior."
      }),
      progressCheck({
        dimension: "behavior",
        state: "blocked",
        label: "In-game moved-window behavior validated",
        note: "Needed to prove the relationship between Ctrl+F6 `relative`, Lua `location`, and `on_gui_location_changed`."
      }),
      progressCheck({
        dimension: "behavior",
        state: "todo",
        label: "Optional header/body child behavior hooks"
      })
    ],
    captures: [
      atomCapture({
        id: "blueprint-library-window",
        label: "Blueprint Library outer Window",
        screenTitle: "Blueprint library",
        className: "agui::Window",
        style: "inset_frame_container_frame",
        rows: [
          captureRow("relative", vector2i, "[0, 0]"),
          captureRow("size", size2i, "{1476, 870}"),
          captureRow("content_size", size2i, "{1440, 840}"),
          captureRow("clip_size", rectangle2i, "{{0, -4}, {1476, 874}}"),
          captureRow("size_before_stretching", size2i, "{1476, 870}"),
          captureRow("maximum_horizontal_squash_size", integer, 0),
          captureRow("maximum_vertical_squash_size", integer, 540),
          captureRow("Style", styleName, "inset_frame_container_frame"),
          captureRow("Derived from", styleName, "frame"),
          captureRow("top_padding", integer, 6),
          captureRow("bottom_padding", integer, 12),
          captureRow("left_padding", integer, 12),
          captureRow("right_padding", integer, 12),
          captureRow("use_header_filler", boolean, true)
        ],
        children: [
          captureRow("class agui::HorizontalFlow", size2i, "1440 x 48", "Header/titlebar flow."),
          captureRow("class agui::HorizontalFlow", size2i, "1440 x 792", "Content flow.")
        ]
      }),
      atomCapture({
        id: "factoriopedia-root-window",
        label: "Factoriopedia top-level root",
        screenTitle: "Factoriopedia",
        className: "Factoriopedia",
        style: "inset_frame_container_frame",
        rows: [
          captureRow("relative", vector2i, "[289, 18]"),
          captureRow("size", size2i, "{1341, 973}"),
          captureRow("content_size", size2i, "{1305, 943}"),
          captureRow("clip_size", rectangle2i, "{{0, -4}, {1341, 977}}"),
          captureRow("size_before_stretching", size2i, "{1341, 973}"),
          captureRow("maximum_horizontal_squash_size", integer, 0),
          captureRow("maximum_vertical_squash_size", integer, 619),
          captureRow("maximal_height", integer, 973),
          captureRow("Style", styleName, "inset_frame_container_frame"),
          captureRow("Derived from", styleName, "frame"),
          captureRow("top_padding", integer, 6),
          captureRow("bottom_padding", integer, 12),
          captureRow("left_padding", integer, 12),
          captureRow("right_padding", integer, 12),
          captureRow("use_header_filler", boolean, true)
        ],
        children: [
          captureRow("class agui::HorizontalFlow", size2i, "1305 x 48", "Header/titlebar flow."),
          captureRow("class SearchPopup", size2i, "168 x 42", "Search overlay child."),
          captureRow("class agui::HorizontalFlow", size2i, "1305 x 895", "Content flow.")
        ]
      }),
      atomCapture({
        id: "achievements-root-window",
        label: "Achievements top-level root",
        screenTitle: "Achievements",
        className: "AchievementGui",
        style: "frame",
        rows: [
          captureRow("relative", vector2i, "[385, 146]"),
          captureRow("size", size2i, "{654, 973}"),
          captureRow("content_size", size2i, "{618, 943}"),
          captureRow("clip_size", rectangle2i, "{{0, -4}, {654, 977}}"),
          captureRow("size_before_stretching", size2i, "{654, 973}"),
          captureRow("maximum_horizontal_squash_size", integer, 0),
          captureRow("maximum_vertical_squash_size", integer, 775),
          captureRow("maximal_height", integer, 973),
          captureRow("Style", styleName, "frame"),
          captureRow("top_padding", integer, 6),
          captureRow("bottom_padding", integer, 12),
          captureRow("left_padding", integer, 12),
          captureRow("right_padding", integer, 12),
          captureRow("use_header_filler", boolean, true)
        ],
        children: [
          captureRow("class agui::HorizontalFlow", size2i, "618 x 48", "Header/titlebar flow."),
          captureRow("class SearchPopup", size2i, "168 x 42", "Search overlay child."),
          captureRow("class agui::VerticalFlow", size2i, "618 x 895", "Content flow.")
        ]
      }),
      atomCapture({
        id: "filter-select-root-window",
        label: "Filter selection top-level root",
        screenTitle: "Set the filter",
        className: "FilterSelectGui<class IDWithQualityFilter<class ID<...>",
        style: "frame",
        rows: [
          captureRow("relative", vector2i, "[648, 144]"),
          captureRow("size", size2i, "{672, 973}"),
          captureRow("content_size", size2i, "{636, 943}"),
          captureRow("clip_size", rectangle2i, "{{0, -4}, {672, 977}}"),
          captureRow("size_before_stretching", size2i, "{672, 973}"),
          captureRow("maximum_horizontal_squash_size", integer, 0),
          captureRow("maximum_vertical_squash_size", integer, 673),
          captureRow("maximal_height", integer, 973),
          captureRow("Style", styleName, "frame"),
          captureRow("top_padding", integer, 6),
          captureRow("bottom_padding", integer, 12),
          captureRow("left_padding", integer, 12),
          captureRow("right_padding", integer, 12),
          captureRow("use_header_filler", boolean, true)
        ],
        children: [
          captureRow("class agui::HorizontalFlow", size2i, "636 x 48", "Header/titlebar flow."),
          captureRow("class SearchPopup", size2i, "168 x 42", "Search overlay child."),
          captureRow("class agui::VerticalFlow", size2i, "636 x 895", "Content flow.")
        ]
      }),
      atomCapture({
        id: "editor-left-side-root-frame",
        label: "Editor left-side root frame",
        screenTitle: "Editor",
        className: "agui::Frame",
        style: "character_gui_left_side",
        rows: [
          captureRow("relative", vector2i, "[0, 0]"),
          captureRow("size", size2i, "{660, 973}"),
          captureRow("content_size", size2i, "{636, 943}"),
          captureRow("clip_size", rectangle2i, "{{0, -4}, {660, 977}}"),
          captureRow("size_before_stretching", size2i, "{660, 882}"),
          captureRow("maximum_horizontal_squash_size", integer, 0),
          captureRow("maximum_vertical_squash_size", integer, 631),
          captureRow("Style", styleName, "character_gui_left_side"),
          captureRow("right_padding", integer, 6, "Style-specific override before frame inheritance."),
          captureRow("graphical_set", string, "redefined"),
          captureRow("Derived from", styleName, "frame"),
          captureRow("top_padding", integer, 6),
          captureRow("bottom_padding", integer, 12),
          captureRow("left_padding", integer, 12),
          captureRow("right_padding", integer, 12, "Inherited frame value."),
          captureRow("use_header_filler", boolean, true)
        ],
        children: [
          captureRow("class agui::HorizontalFlow", size2i, "636 x 48", "Header/titlebar flow."),
          captureRow("class agui::VerticalFlow", size2i, "636 x 895", "Content flow.")
        ]
      }),
      atomCapture({
        id: "frame-without-left-side-root-frame",
        label: "Frame without left side root frame",
        screenTitle: "Frames",
        className: "agui::Frame",
        style: "frame_without_left_side",
        rows: [
          captureRow("relative", vector2i, "[660, 0]"),
          captureRow("size", size2i, "{666, 973}"),
          captureRow("content_size", size2i, "{636, 943}"),
          captureRow("clip_size", rectangle2i, "{{0, -4}, {666, 977}}"),
          captureRow("size_before_stretching", size2i, "{666, 1224}"),
          captureRow("maximum_horizontal_squash_size", integer, 0),
          captureRow("maximum_vertical_squash_size", integer, 565),
          captureRow("Style", styleName, "frame_without_left_side"),
          captureRow("graphical_set", string, "redefined"),
          captureRow("Derived from", styleName, "frame"),
          captureRow("top_padding", integer, 6),
          captureRow("bottom_padding", integer, 12),
          captureRow("left_padding", integer, 12),
          captureRow("right_padding", integer, 12),
          captureRow("use_header_filler", boolean, true)
        ],
        children: [
          captureRow("class agui::HorizontalFlow", size2i, "636 x 48", "Header/titlebar flow."),
          captureRow("class agui::VerticalFlow", size2i, "636 x 895", "Content flow.")
        ]
      })
    ],
    tracking: {
      document: "Window atom is the first gold atom. It should remain the baseline for top-level editor windows and Lua export.",
      implemented: [
        "Editor creates a top-level frame with a titlebar, draggable filler, title label, and body flow.",
        "Inspector rows expose Window class/style/padding/sizing fields from structured data.",
        "Reference Window geometry derives content, clip, titlebar, and body sizes from named Window reference captures.",
        "Lua export emits a top-level `frame` using the captured style, padding fields, and body flow spacing."
      ],
      assumptions: [
        "GUI-specific root classes still share the same frame-derived top-level layout contract.",
        "`relative: [0, 0]` is not trusted as screen position until moved-window captures confirm it.",
        "`maximal_height` is captured as a runtime/layout metric and is not exported until we know when Factorio expects it to be assigned.",
        "The 6 px visual frame band is inferred from size/content deltas; Ctrl+F6 exposes padding, not a direct border thickness.",
        "`maximum_vertical_squash_size` appears content- and variant-dependent, so the reference value is carried without generalizing it to every future Window."
      ],
      hardcoded: [
        "The editor still defaults to the Blueprint Library reference until users can select width/layout variants.",
        "Browser CSS paints the frame bevel manually from captured visuals."
      ],
      missing: [
        "Rule for deriving maximal_height from viewport, UI scale, screen location, or GUI type.",
        "Rule for deriving maximum_vertical_squash_size from content, natural height, and style variant.",
        "Variant handling for side frames, optional SearchPopup children, and header action controls."
      ]
    }
  }),
  atomDefinition({
    id: "horizontal-flow",
    name: "Horizontal Flow",
    primitive: "flow",
    style: "horizontal_flow",
    availability: "Editor seed / captures",
    summary: "Horizontal flow component; style variants include frame headers and inset-frame content rows.",
    className: "agui::HorizontalFlow",
    derivedFrom: "horizontal_flow",
    progress: {
      evidence: 86,
      model: 52,
      renderer: 58,
      luaExport: 42,
      behavior: 38
    },
    fields: [
      field("className", "captured", "`agui::HorizontalFlow`.", {
        type: className,
        example: "agui::HorizontalFlow",
        source: "blueprint-library-header-flow"
      }),
      field("style variants", "captured", "Observed horizontal flow styles include `frame_header_flow` and `inset_frame_container_horizontal_flow`; the atom identity is still Horizontal Flow.", {
        type: styleName,
        example: "frame_header_flow / inset_frame_container_horizontal_flow",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("relative", "captured", "Captured relative position is role-dependent: the header starts at the Window content origin, while the inset content row starts after the 48 px header.", {
        type: vector2i,
        example: "[0, 0] / [0, 48]",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("size", "captured", "Captured size is style and parent dependent.", {
        type: size2i,
        example: "{1440, 48} / {1440, 792}",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("content_size", "captured", "Header content is 6 px shorter because of bottom padding; content-row captures can match outer size.", {
        type: size2i,
        example: "{1440, 42} / {1440, 792}",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("clip_size", "captured", "Header clip extends 4 px upward; content row clip can have no offset.", {
        type: rectangle2i,
        example: "{{0, -4}, {1440, 52}} / {{0, 0}, {1440, 792}}",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("size_before_stretching", "captured", "Header flow reports a natural width before filler stretch; content-row capture matched its final size.", {
        type: size2i,
        example: "{395, 48} / {1440, 792}",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("maximum_horizontal_squash_size", "captured", "Captured as 1236 for a header with right-side controls and 0 for a content row; likely child/role dependent.", {
        type: integer,
        example: "1236 / 0",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("maximum_vertical_squash_size", "captured", "Captured as zero for header flow and 540 for the Blueprint Library content row.", {
        type: integer,
        example: "0 / 540",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("horizontalSpacing", "captured", "Effective spacing is style-dependent; inherited horizontal_flow spacing is 6.", {
        type: integer,
        example: "12 header, 18 content row, 6 inherited",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("bottomPadding", "captured", "Frame header flow has bottom padding; ordinary content-row captures did not show this override.", {
        type: integer,
        example: 6,
        source: "blueprint-library-header-flow"
      }),
      field("children", "captured", "HorizontalFlow children depend on role: headers can contain label/filler/actions; content rows can contain frames and nested flows.", {
        type: nodeList,
        example: "Label/Filler/SearchBar or Frame/FrameWithSubheader/VerticalFlow",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("header action children", "planned", "Blueprint Library captures SearchBar, browse-arrow group, and CloseButton; editor seed only has label + filler.", {
        type: nodeList,
        example: "SearchBar 36x36, HorizontalFlow 72x36, CloseButton 36x36",
        source: "blueprint-library-header-flow"
      })
    ],
    captures: [
      atomCapture({
        id: "blueprint-library-header-flow",
        label: "Blueprint Library header HorizontalFlow",
        screenTitle: "Blueprint library",
        className: "agui::HorizontalFlow",
        style: "frame_header_flow",
        rows: [
          captureRow("relative", vector2i, "[0, 0]"),
          captureRow("size", size2i, "{1440, 48}"),
          captureRow("content_size", size2i, "{1440, 42}"),
          captureRow("clip_size", rectangle2i, "{{0, -4}, {1440, 52}}"),
          captureRow("size_before_stretching", size2i, "{395, 48}"),
          captureRow("maximum_horizontal_squash_size", integer, 1236),
          captureRow("maximum_vertical_squash_size", integer, 0),
          captureRow("vertically_stretchable", boolean, "off"),
          captureRow("ignored_by_search", boolean, true),
          captureRow("bottom_padding", integer, 6),
          captureRow("horizontally_stretchable", boolean, "on"),
          captureRow("horizontal_spacing", integer, 12),
          captureRow("Derived from", styleName, "horizontal_flow"),
          captureRow("horizontal_spacing", integer, 6, "Inherited horizontal_flow value.")
        ],
        children: [
          captureRow("class agui::Label", size2i, "191 x 46"),
          captureRow("class agui::Filler", size2i, "1045 x 36"),
          captureRow("class SearchBar", size2i, "36 x 36"),
          captureRow("class agui::HorizontalFlow", size2i, "72 x 36", "BrowseArrow group."),
          captureRow("class CloseButton", size2i, "36 x 36")
        ]
      }),
      atomCapture({
        id: "blueprint-library-content-flow",
        label: "Blueprint Library content HorizontalFlow",
        screenTitle: "Blueprint library",
        className: "agui::HorizontalFlow",
        style: "inset_frame_container_horizontal_flow",
        rows: [
          captureRow("relative", vector2i, "[0, 48]"),
          captureRow("size", size2i, "{1440, 792}"),
          captureRow("content_size", size2i, "{1440, 792}"),
          captureRow("clip_size", rectangle2i, "{{0, 0}, {1440, 792}}"),
          captureRow("size_before_stretching", size2i, "{1440, 792}"),
          captureRow("maximum_horizontal_squash_size", integer, 0),
          captureRow("maximum_vertical_squash_size", integer, 540),
          captureRow("Style", styleName, "Part of inset_frame_container_frame definition"),
          captureRow("Derived from", styleName, "inset_frame_container_horizontal_flow"),
          captureRow("horizontal_spacing", integer, 18),
          captureRow("Derived from", styleName, "horizontal_flow"),
          captureRow("horizontal_spacing", integer, 6, "Inherited horizontal_flow value.")
        ],
        children: [
          captureRow("class agui::Frame", size2i, "636 x 792"),
          captureRow("class FrameWithSubheader", size2i, "786 x 792"),
          captureRow("class agui::VerticalFlow", size2i, "0 x 0")
        ]
      })
    ],
    tracking: {
      assumptions: [
        "The atom is the component class `agui::HorizontalFlow`; `frame_header_flow` and `inset_frame_container_horizontal_flow` are style/role variants.",
        "The frame header flow is part of the frame definition, not a normal user-authored child.",
        "`size_before_stretching` for header roles appears to be the minimum natural width of label + filler/action controls before the filler stretches."
      ],
      missing: [
        "Header action child model.",
        "Frame and FrameWithSubheader child atoms.",
        "Rule for computing horizontal flow squash sizes from children and role."
      ]
    }
  }),
  atomDefinition({
    id: "label",
    name: "Label",
    primitive: "label",
    style: "frame_title",
    availability: "Editor seed",
    summary: "Text label component; current capture covers the frame title style variant.",
    className: "agui::Label",
    derivedFrom: "frame_title",
    progress: {
      evidence: 78,
      model: 70,
      renderer: 68,
      luaExport: 60,
      behavior: 45
    },
    fields: [
      field("className", "captured", "`agui::Label`."),
      field("style", "captured", "`frame_title`."),
      field("caption", "editorOwned", "Editable title text owned by the title label node, not the root Window."),
      field("font", "captured", "`heading-1`."),
      field("fontColor", "captured", "{1, 0.901961, 0.752941}."),
      field("topMargin", "captured", "-4."),
      field("bottomPadding", "captured", "4."),
      field("width", "hardcoded", "Estimated from caption length; not measured like Factorio text."),
      field("singleLine", "captured", "true."),
      field("hover text behavior", "missing", "No full label hover/disabled color model yet.")
    ],
    captures: [
      atomCapture({
        id: "blueprint-library-title-label",
        label: "Blueprint Library title Label",
        screenTitle: "Blueprint library",
        className: "agui::Label",
        style: "frame_title",
        rows: [
          captureRow("relative", vector2i, "[0, -4]"),
          captureRow("size", size2i, "{191, 46}"),
          captureRow("content_size", size2i, "{191, 42}"),
          captureRow("clip_size", rectangle2i, "{{0, 0}, {191, 46}}"),
          captureRow("size_before_stretching", size2i, "{191, 46}"),
          captureRow("maximum_horizontal_squash_size", integer, 191),
          captureRow("maximum_vertical_squash_size", integer, 0),
          captureRow("vertically_stretchable", boolean, "on"),
          captureRow("horizontally_squashable", boolean, "on"),
          captureRow("bottom_padding", integer, 4),
          captureRow("top_margin", integer, -4),
          captureRow("font", string, "heading-1"),
          captureRow("font_color", color, "{1, 0.901961, 0.752941}"),
          captureRow("Derived from", styleName, "label"),
          captureRow("font", string, "default"),
          captureRow("font_color", color, "{1, 1, 1}"),
          captureRow("disabled_font_color", color, "{0.5, 0.5, 0.5, 0.5}"),
          captureRow("parent_hovered_font_color", color, "{0, 0, 0}"),
          captureRow("game_controller_hovered_font_color", color, "{1, 0.68, 0}"),
          captureRow("single_line", boolean, true)
        ]
      })
    ]
  }),
  atomDefinition({
    id: "filler",
    name: "Filler",
    primitive: "empty-widget",
    style: "draggable_space_header",
    availability: "Editor seed",
    summary: "Filler component; current capture covers the draggable header filler style variant.",
    className: "agui::Filler",
    derivedFrom: "draggable_space_header",
    progress: {
      evidence: 80,
      model: 62,
      renderer: 55,
      luaExport: 55,
      behavior: 65
    },
    fields: [
      field("className", "captured", "`agui::Filler`."),
      field("style", "captured", "`draggable_space_header`."),
      field("height", "captured", "36."),
      field("naturalHeight", "captured", "36."),
      field("left/right margin", "captured", "6 each."),
      field("stretch flags", "captured", "Horizontally and vertically stretchable."),
      field("visual cadence", "hardcoded", "CSS repeating stripe approximates the captured groove."),
      field("optional right controls", "missing", "No model field for search/close/header actions yet.")
    ],
    captures: [
      atomCapture({
        id: "blueprint-library-header-filler",
        label: "Blueprint Library header Filler",
        screenTitle: "Blueprint library",
        className: "agui::Filler",
        style: "draggable_space_header",
        rows: [
          captureRow("relative", vector2i, "[209, 0]"),
          captureRow("size", size2i, "{1045, 36}"),
          captureRow("content_size", size2i, "{1045, 36}"),
          captureRow("clip_size", rectangle2i, "{{0, 0}, {1045, 36}}"),
          captureRow("size_before_stretching", size2i, "{0, 36}"),
          captureRow("maximum_horizontal_squash_size", integer, 1045),
          captureRow("maximum_vertical_squash_size", integer, 0),
          captureRow("right_margin", integer, 6),
          captureRow("height", integer, 36),
          captureRow("natural_height", integer, 36),
          captureRow("horizontally_stretchable", boolean, "on"),
          captureRow("vertically_stretchable", boolean, "on"),
          captureRow("Derived from", styleName, "draggable_space_header"),
          captureRow("left_margin", integer, 6),
          captureRow("Derived from", styleName, "draggable_space"),
          captureRow("graphical_set", string, "redefined"),
          captureRow("Derived from", styleName, "empty_widget"),
          captureRow("ignored_by_search", boolean, true)
        ]
      })
    ]
  }),
  atomDefinition({
    id: "vertical-flow",
    name: "Vertical Flow",
    primitive: "flow",
    style: "inside_deep_frame",
    availability: "Editor seed",
    summary: "Vertical flow component; current editor capture covers the inside_deep_frame body role.",
    className: "agui::VerticalFlow",
    derivedFrom: "inside_deep_frame",
    progress: {
      evidence: 45,
      model: 45,
      renderer: 40,
      luaExport: 35,
      behavior: 10
    },
    fields: [
      field("className", "captured", "`agui::VerticalFlow`."),
      field("style", "captured", "`inside_deep_frame`."),
      field("verticalSpacing", "captured", "0 for the inside frame definition."),
      field("size", "inferred", "Reference body size derives from the current Window content height minus the 48 px header flow.", {
        type: size2i,
        example: "636 x 895",
        source: "filter-select-root-window"
      }),
      field("children", "missing", "TabbedPane/body primitive insertion is not implemented yet.")
    ],
    tracking: {
      implemented: [
        "Editor seed includes an empty body flow under the titlebar.",
        "Inspector exposes the body flow and lets child rows navigate to it."
      ],
      hardcoded: [
        "Body child content is still empty in the editor seed.",
        "Browser renderer uses CSS layout instead of a Factorio layout solver."
      ],
      missing: [
        "Real body child primitives and insertion model.",
        "Rule for selecting body flow style variants."
      ]
    }
  }),
  atomDefinition({
    id: "action-button",
    name: "Action Button",
    primitive: "button",
    style: "frame_action_button",
    availability: "Blueprint Library capture / Inspector controls",
    summary: "Small square action button component; current captures cover frame header styles and inspector controls.",
    progress: {
      evidence: 76,
      model: 22,
      renderer: 46,
      luaExport: 0,
      behavior: 18
    },
    fields: [
      field("className", "captured", "Captured header classes include SearchBar, BrowseArrow, and CloseButton.", {
        type: className,
        example: "SearchBar / BrowseArrow / CloseButton",
        source: "blueprint-library-frame-actions"
      }),
      field("style", "captured", "SearchBar and BrowseArrow use `frame_action_button`; CloseButton uses `close_button` derived from it.", {
        type: styleName,
        example: "frame_action_button",
        source: "blueprint-library-frame-actions"
      }),
      field("size", "captured", "All captured frame action buttons are 36 x 36.", {
        type: size2i,
        example: "{36, 36}",
        source: "blueprint-library-frame-actions"
      }),
      field("content_size", "captured", "Icon content area is 24 x 24.", {
        type: size2i,
        example: "{24, 24}",
        source: "blueprint-library-frame-actions"
      }),
      field("natural size", "captured", "Style exposes width/height and natural_width/natural_height as 36.", {
        type: size2i,
        example: "{36, 36}",
        source: "blueprint-library-frame-actions"
      }),
      field("padding", "captured", "Frame button has padding 0; inherited button still lists left/right padding 12.", {
        type: integer,
        example: "frame_button padding=0, button left/right=12",
        source: "blueprint-library-frame-actions"
      }),
      field("alignment", "captured", "Inherited button alignment is center/center.", {
        type: string,
        example: "horizontal=center, vertical=center",
        source: "blueprint-library-frame-actions"
      }),
      field("graphical sets", "captured", "normal/hovered/clicked/disabled graphical sets are all redefined by frame_button.", {
        type: string,
        example: "redefined",
        source: "blueprint-library-frame-actions"
      }),
      field("enabled", "captured", "Disabled BrowseArrow shows `enabled: false` while keeping the same style stack.", {
        type: boolean,
        example: false,
        source: "blueprint-library-browse-arrow-disabled"
      }),
      field("icons", "hardcoded", "The web inspector uses Lucide icons as stand-ins; actual Factorio sprites are not vendored."),
      field("Lua export", "planned", "Header actions are captured but not yet part of the exported editor model.")
    ],
    captures: [
      atomCapture({
        id: "blueprint-library-searchbar",
        label: "Blueprint Library SearchBar",
        screenTitle: "Blueprint library",
        className: "SearchBar",
        style: "frame_action_button",
        rows: [
          captureRow("relative", vector2i, "[1272, 0]"),
          captureRow("size", size2i, "{36, 36}"),
          captureRow("content_size", size2i, "{24, 24}"),
          captureRow("clip_size", rectangle2i, "{{0, 0}, {36, 36}}"),
          captureRow("size_before_stretching", size2i, "{36, 36}"),
          captureRow("maximum_horizontal_squash_size", integer, 0),
          captureRow("maximum_vertical_squash_size", integer, 0),
          captureRow("width", integer, 36),
          captureRow("height", integer, 36),
          captureRow("natural_width", integer, 36),
          captureRow("natural_height", integer, 36),
          captureRow("left_click_sound", string, "__core__/sound/gui-tool-button.ogg"),
          captureRow("invert_color_of_picture_when_hovered_or_toggled", integer, 1),
          captureRow("Derived from", styleName, "frame_button"),
          captureRow("padding", integer, 0),
          captureRow("graphical_set", string, "redefined"),
          captureRow("hovered_graphical_set", string, "redefined"),
          captureRow("clicked_graphical_set", string, "redefined"),
          captureRow("disabled_graphical_set", string, "redefined"),
          captureRow("Derived from", styleName, "button"),
          captureRow("minimal_width", integer, 162),
          captureRow("minimal_height", integer, 42),
          captureRow("ignored_by_search", boolean, true),
          captureRow("horizontal_align", string, "center"),
          captureRow("vertical_align", string, "center"),
          captureRow("top_padding", integer, 0),
          captureRow("bottom_padding", integer, 0),
          captureRow("left_padding", integer, 12),
          captureRow("right_padding", integer, 12),
          captureRow("left_click_sound", string, "__core__/sound/gui-click.ogg"),
          captureRow("font", string, "default-semibold"),
          captureRow("default_font_color", color, "{0, 0, 0}"),
          captureRow("hovered_font_color", color, "{0, 0, 0}"),
          captureRow("clicked_font_color", color, "{0, 0, 0}"),
          captureRow("disabled_font_color", color, "{0.701961, 0.701961, 0.701961}"),
          captureRow("strikethrough_color", color, "{0.5, 0.5, 0.5}")
        ]
      }),
      atomCapture({
        id: "blueprint-library-browse-arrow-disabled",
        label: "Blueprint Library disabled BrowseArrow",
        screenTitle: "Blueprint library",
        className: "BrowseArrow",
        style: "frame_action_button",
        rows: [
          captureRow("relative", vector2i, "[36, 0]"),
          captureRow("size", size2i, "{36, 36}"),
          captureRow("content_size", size2i, "{24, 24}"),
          captureRow("enabled", boolean, false),
          captureRow("width", integer, 36),
          captureRow("height", integer, 36),
          captureRow("natural_width", integer, 36),
          captureRow("natural_height", integer, 36),
          captureRow("Derived from", styleName, "frame_button"),
          captureRow("Derived from", styleName, "button")
        ]
      }),
      atomCapture({
        id: "blueprint-library-close-button",
        label: "Blueprint Library CloseButton",
        screenTitle: "Blueprint library",
        className: "CloseButton",
        style: "close_button",
        rows: [
          captureRow("relative", vector2i, "[1404, 0]"),
          captureRow("size", size2i, "{36, 36}"),
          captureRow("content_size", size2i, "{24, 24}"),
          captureRow("clip_size", rectangle2i, "{{0, 0}, {36, 36}}"),
          captureRow("Derived from", styleName, "frame_action_button"),
          captureRow("width", integer, 36),
          captureRow("height", integer, 36),
          captureRow("natural_width", integer, 36),
          captureRow("natural_height", integer, 36)
        ]
      })
    ],
    tracking: {
      implemented: [
        "Inspector navigation uses a CSS approximation of the square frame action button shape."
      ],
      hardcoded: [
        "Lucide icons stand in for Factorio sprites.",
        "Browser button bevel is CSS-only and not yet generated from a graphical_set model."
      ],
      missing: [
        "No exported model for header action buttons.",
        "No graphical_set data structure for normal/hovered/clicked/disabled sprites."
      ]
    }
  }),
  atomDefinition({
    id: "button",
    name: "Button",
    primitive: "button",
    style: "fx-button",
    availability: "Style atlas",
    summary: "Large Factorio-like button sample with default/pressed/disabled/color variants.",
    progress: {
      evidence: 15,
      model: 0,
      renderer: 50,
      luaExport: 0,
      behavior: 20
    },
    fields: [
      field("normal state", "hardcoded", "CSS approximation from public site and screenshots."),
      field("hover state", "hardcoded", "Orange glow approximation."),
      field("pressed state", "hardcoded", "Inset padding/box-shadow approximation."),
      field("green/red variants", "hardcoded", "Atlas-only styling; no model color token mapping."),
      field("Lua export", "planned", "No editor primitive insertion or action tag model yet.")
    ],
    tracking: {
      implemented: [
        "Reusable React button component exists for editor chrome and atlas samples."
      ],
      hardcoded: [
        "Visual states are CSS approximations, not captured Factorio graphical_set data."
      ],
      missing: [
        "Generic button node in the layout model.",
        "Action tags, click behavior, and Lua export."
      ]
    }
  }),
  atomDefinition({
    id: "textfield",
    name: "Text Field",
    primitive: "textfield",
    style: "fx-text-input",
    availability: "Style atlas",
    summary: "Text entry atom with normal, focused, and disabled states.",
    progress: {
      evidence: 10,
      model: 10,
      renderer: 45,
      luaExport: 0,
      behavior: 25
    },
    fields: [
      field("normal/focus visuals", "hardcoded", "CSS approximation."),
      field("disabled visual", "hardcoded", "CSS approximation."),
      field("value binding", "planned", "Only the editor title field uses it today."),
      field("Lua export", "planned", "No generic textfield node in the model yet.")
    ],
    tracking: {
      implemented: [
        "Reusable text input component exists for editor chrome and atlas samples.",
        "The window title editor uses browser input state."
      ],
      hardcoded: [
        "Visual states are CSS approximations."
      ],
      missing: [
        "Generic textfield node in the layout model.",
        "Factorio textfield style names, constraints, and Lua export."
      ]
    }
  }),
  atomDefinition({
    id: "checkbox",
    name: "Checkbox",
    primitive: "checkbox",
    style: "fx-checkbox",
    availability: "Style atlas / editor toggles",
    summary: "Checkbox control used by editor settings and atlas samples.",
    progress: {
      evidence: 10,
      model: 10,
      renderer: 45,
      luaExport: 0,
      behavior: 25
    },
    fields: [
      field("unchecked visual", "hardcoded", "CSS approximation."),
      field("checked visual", "hardcoded", "CSS tick approximation."),
      field("disabled visual", "hardcoded", "CSS approximation."),
      field("model binding", "planned", "Used by editor chrome, not general GUI model nodes."),
      field("Lua export", "planned", "No generic checkbox node in the model yet.")
    ],
    tracking: {
      implemented: [
        "Reusable checkbox component exists for editor toggles and atlas samples."
      ],
      hardcoded: [
        "Checkmark and disabled states are CSS approximations."
      ],
      missing: [
        "Generic checkbox node in the layout model.",
        "Lua export and Factorio checkbox style mapping."
      ]
    }
  }),
  atomDefinition({
    id: "inset",
    name: "Inset",
    primitive: "flow/frame",
    style: "fx-inset",
    availability: "Style atlas",
    summary: "Recessed content surface with dark, lighter, and hole variants.",
    progress: {
      evidence: 10,
      model: 0,
      renderer: 45,
      luaExport: 0,
      behavior: 0
    },
    fields: [
      field("dark inset", "hardcoded", "CSS approximation."),
      field("lighter inset", "hardcoded", "CSS approximation."),
      field("deep hole", "hardcoded", "CSS approximation."),
      field("Factorio style mapping", "missing", "Need exact style names per variant."),
      field("Lua export", "planned", "No generic inset container node yet.")
    ],
    tracking: {
      implemented: [
        "Atlas renders three inset surface variants."
      ],
      hardcoded: [
        "Variants are local CSS classes, not Factorio style definitions."
      ],
      missing: [
        "Exact Factorio style names per inset variant.",
        "Generic inset/frame container model and export."
      ]
    }
  }),
  atomDefinition({
    id: "tabs",
    name: "Tabs",
    primitive: "tabbed-pane",
    style: "fx-tabs",
    availability: "Style atlas",
    summary: "Tab header and active panel atom.",
    progress: {
      evidence: 5,
      model: 0,
      renderer: 35,
      luaExport: 0,
      behavior: 10
    },
    fields: [
      field("tab visual states", "hardcoded", "CSS approximation."),
      field("active tab logic", "hardcoded", "Atlas fixture only."),
      field("TabbedPane model", "missing", "Body child is listed as not implemented in inspector."),
      field("Lua export", "planned", "No tabbed-pane export model yet.")
    ],
    tracking: {
      implemented: [
        "Atlas renders a static tab header and active panel sample."
      ],
      hardcoded: [
        "Active tab is fixture data, not model state."
      ],
      missing: [
        "TabbedPane model, selection behavior, body integration, and Lua export."
      ]
    }
  }),
  atomDefinition({
    id: "slot-grid",
    name: "Slot Grid",
    primitive: "sprite-button/table",
    style: "fx-slot-grid",
    availability: "Style atlas",
    summary: "Inventory-like slot grid sample.",
    progress: {
      evidence: 5,
      model: 0,
      renderer: 35,
      luaExport: 0,
      behavior: 0
    },
    fields: [
      field("empty slot visual", "hardcoded", "CSS approximation."),
      field("filled slot visual", "hardcoded", "Text placeholders, no item sprites."),
      field("grid sizing", "hardcoded", "Fixed 38 px browser cells."),
      field("Factorio item data", "missing", "No sprite/item prototype source."),
      field("Lua export", "planned", "No slot/table primitive model yet.")
    ],
    tracking: {
      implemented: [
        "Atlas renders an inventory-like grid with empty and filled cell samples."
      ],
      hardcoded: [
        "Cells are fixed browser dimensions and filled slots use text placeholders."
      ],
      missing: [
        "Factorio item/sprite source data.",
        "Slot/table model, selection behavior, and Lua export."
      ]
    }
  }),
  atomDefinition({
    id: "table",
    name: "Table",
    primitive: "table",
    style: "fx-table",
    availability: "Style atlas",
    summary: "Styled data table sample.",
    progress: {
      evidence: 5,
      model: 0,
      renderer: 30,
      luaExport: 0,
      behavior: 0
    },
    fields: [
      field("row visuals", "hardcoded", "CSS approximation with alternating rows."),
      field("column model", "planned", "Only atlas fixture columns exist."),
      field("sorting/selection", "missing", "No behavior model yet."),
      field("Lua export", "planned", "No table primitive export model yet.")
    ],
    tracking: {
      implemented: [
        "Atlas renders a static table sample."
      ],
      hardcoded: [
        "Columns and rows are local fixture data."
      ],
      missing: [
        "Column/row model, sorting or selection behavior, and Lua export."
      ]
    }
  }),
  atomDefinition({
    id: "scroll-pane",
    name: "Scroll Pane",
    primitive: "scroll-pane",
    style: "fx-scroll-pane",
    availability: "Style atlas",
    summary: "Scrollable content region sample.",
    progress: {
      evidence: 5,
      model: 0,
      renderer: 25,
      luaExport: 0,
      behavior: 5
    },
    fields: [
      field("scrollbar skin", "hardcoded", "Global webkit scrollbar approximation."),
      field("row sample", "hardcoded", "Atlas-only fixture content."),
      field("scroll policy", "missing", "No Factorio scroll-pane style/size constraints modeled."),
      field("Lua export", "planned", "No scroll-pane node in export model yet.")
    ],
    tracking: {
      implemented: [
        "Atlas renders a scrollable sample region."
      ],
      hardcoded: [
        "Scrollbar visuals and rows are local browser fixtures."
      ],
      missing: [
        "Factorio scroll-pane style constraints, scroll policy, and Lua export."
      ]
    }
  })
]);

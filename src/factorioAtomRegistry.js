import {
  atomCapture,
  atomCompletion,
  atomDefinition,
  atomField,
  atomFieldStates,
  atomValueTypes
} from "./factorioAtomModel.js";

export { atomCompletion, atomFieldStates, atomValueTypes };

const field = atomField;
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
    progress: {
      evidence: 86,
      model: 58,
      renderer: 65,
      luaExport: 55,
      behavior: 35
    },
    fields: [
      field("className", "captured", "Top-level GUI roots can report generic or GUI-specific classes.", {
        type: className,
        example: "agui::Window / Factoriopedia / AchievementGui / agui::Frame",
        source: "top-level-window-captures"
      }),
      field("primitive", "inferred", "Mapped to Factorio `frame` because the style derives from `frame` and Lua top-level windows are frames.", {
        type: guiPrimitive,
        example: "frame",
        source: "blueprint-library-window"
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
      field("content_size", "captured", "Renderer-computed content box. It equals width minus left/right padding and height minus top/bottom padding for this capture.", {
        type: size2i,
        example: "{1440, 840}",
        source: "blueprint-library-window"
      }),
      field("clip_size", "captured", "Renderer clipping rectangle can extend above the frame by 4 px.", {
        type: rectangle2i,
        example: "{{0, -4}, {1476, 874}}",
        source: "blueprint-library-window"
      }),
      field("size_before_stretching", "captured", "Observed equal to outer size on this top-level window.", {
        type: size2i,
        example: "{1476, 870}",
        source: "blueprint-library-window"
      }),
      field("maximum_horizontal_squash_size", "captured", "Observed zero on the top-level window.", {
        type: integer,
        example: 0,
        source: "blueprint-library-window"
      }),
      field("maximum_vertical_squash_size", "captured", "Observed as layout-dependent values across captures; needs a derivation rule before becoming model logic.", {
        type: integer,
        example: "540 / 619 / 775 / 673 / 631 / 565",
        source: "top-level-window-captures"
      }),
      field("maximal_height", "captured", "Observed as 973 across full-height captures; appears viewport/window-instance derived, not a static style constant.", {
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
      field("graphicalBorder", "inferred", "Browser renderer uses a 6 px frame band from visual analysis, but Ctrl+F6 reports padding rather than a direct border field.", {
        type: integer,
        example: 6,
        source: "visual-corner-captures"
      }),
      field("editor seed size", "hardcoded", "The editor fixture still uses 708 x 395 until a real layout solver can size windows from children and viewport.", {
        type: size2i,
        example: "{708, 395}",
        source: "editor-fixture"
      }),
      field("runtime layout solver", "missing", "No general layout solver yet for deriving size/content/clip/squash values from children and viewport."),
      field("header actions", "notImplemented", "SearchBar, browse arrows, and CloseButton are captured in the Blueprint Library header but not modeled in the editor seed yet.", {
        type: nodeList,
        example: "SearchBar, HorizontalFlow[BrowseArrow, BrowseArrow], CloseButton",
        source: "blueprint-library-header"
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
        "Lua export emits a top-level `frame` using the captured style and padding fields."
      ],
      assumptions: [
        "`agui::Window` maps to a Factorio `frame` primitive for Lua export.",
        "GUI-specific root classes still share the same frame-derived top-level layout contract.",
        "`relative: [0, 0]` is not trusted as screen position until moved-window captures confirm it.",
        "`maximal_height` is captured as a runtime/layout metric and is not exported until we know when Factorio expects it to be assigned.",
        "The 6 px visual frame band is inferred from screenshots; Ctrl+F6 exposes padding, not a direct border thickness."
      ],
      hardcoded: [
        "Editor seed uses 708 x 395 fixture values instead of deriving size from current viewport and children.",
        "Browser CSS paints the frame bevel manually from captured visuals."
      ],
      missing: [
        "General layout solver for size, content_size, clip_size, and squash sizes.",
        "Rule for deriving maximal_height from viewport, UI scale, screen location, or GUI type.",
        "Header action controls: SearchBar, BrowseArrow group, and CloseButton.",
        "Variant handling for content child flow styles beyond the current editor seed."
      ]
    }
  }),
  atomDefinition({
    id: "frame-header-flow",
    name: "Frame Header Flow",
    primitive: "flow",
    style: "frame_header_flow",
    availability: "Editor seed",
    summary: "Titlebar horizontal flow that owns the title label and draggable filler.",
    className: "agui::HorizontalFlow",
    derivedFrom: "frame_header_flow",
    progress: {
      evidence: 82,
      model: 48,
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
      field("style", "captured", "`frame_header_flow` as a frame-definition derived style.", {
        type: styleName,
        example: "Part of frame definition / frame_header_flow",
        source: "blueprint-library-header-flow"
      }),
      field("relative", "captured", "Header flow starts at the Window content origin.", {
        type: vector2i,
        example: "[0, 0]",
        source: "blueprint-library-header-flow"
      }),
      field("size", "captured", "Captured Blueprint Library header flow size.", {
        type: size2i,
        example: "{1440, 48}",
        source: "blueprint-library-header-flow"
      }),
      field("content_size", "captured", "Captured as 6 px shorter than outer height because of bottom padding.", {
        type: size2i,
        example: "{1440, 42}",
        source: "blueprint-library-header-flow"
      }),
      field("clip_size", "captured", "Header clip extends 4 px upward and 4 px below the 48 px outer height.", {
        type: rectangle2i,
        example: "{{0, -4}, {1440, 52}}",
        source: "blueprint-library-header-flow"
      }),
      field("size_before_stretching", "captured", "Captured as `{395, 48}` with children before horizontal stretch.", {
        type: size2i,
        example: "{395, 48}",
        source: "blueprint-library-header-flow"
      }),
      field("maximum_horizontal_squash_size", "captured", "Captured as 1236; likely content/viewport derived, not a static style constant.", {
        type: integer,
        example: 1236,
        source: "blueprint-library-header-flow"
      }),
      field("maximum_vertical_squash_size", "captured", "Captured as zero.", {
        type: integer,
        example: 0,
        source: "blueprint-library-header-flow"
      }),
      field("horizontalSpacing", "captured", "Effective frame-header spacing is 12, inherited horizontal_flow spacing is 6.", {
        type: integer,
        example: "12 effective, 6 inherited",
        source: "blueprint-library-header-flow"
      }),
      field("bottomPadding", "captured", "Frame header flow bottom padding.", {
        type: integer,
        example: 6,
        source: "blueprint-library-header-flow"
      }),
      field("header action children", "notImplemented", "Blueprint Library captures SearchBar, browse-arrow group, and CloseButton; editor seed only has label + filler.", {
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
      })
    ],
    tracking: {
      assumptions: [
        "The header flow is part of the frame definition, not a normal user-authored child.",
        "`size_before_stretching` appears to be the minimum natural width of label + filler/action controls before the filler stretches."
      ],
      missing: [
        "Header action child model.",
        "Rule for computing maximum_horizontal_squash_size from title/action children."
      ]
    }
  }),
  atomDefinition({
    id: "frame-title-label",
    name: "Frame Title Label",
    primitive: "label",
    style: "frame_title",
    availability: "Editor seed",
    summary: "Window caption in the header flow.",
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
    id: "header-filler",
    name: "Header Filler",
    primitive: "empty-widget",
    style: "draggable_space_header",
    availability: "Editor seed",
    summary: "Stretching drag target that fills the header between title and controls.",
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
    id: "inset-frame-container-horizontal-flow",
    name: "Inset Frame Container Horizontal Flow",
    primitive: "flow",
    style: "inset_frame_container_horizontal_flow",
    availability: "Blueprint Library capture",
    summary: "Content row directly under a top-level inset frame container, used by Blueprint Library.",
    className: "agui::HorizontalFlow",
    derivedFrom: "inset_frame_container_horizontal_flow",
    progress: {
      evidence: 70,
      model: 20,
      renderer: 10,
      luaExport: 0,
      behavior: 0
    },
    fields: [
      field("className", "captured", "`agui::HorizontalFlow` from the Blueprint Library content region.", {
        type: className,
        example: "agui::HorizontalFlow",
        source: "blueprint-library-content-flow"
      }),
      field("relative", "captured", "Starts after the 48 px header flow.", {
        type: vector2i,
        example: "[0, 48]",
        source: "blueprint-library-content-flow"
      }),
      field("size", "captured", "Content flow fills the remaining window content height in this capture.", {
        type: size2i,
        example: "{1440, 792}",
        source: "blueprint-library-content-flow"
      }),
      field("content_size", "captured", "Equal to size for this flow capture.", {
        type: size2i,
        example: "{1440, 792}",
        source: "blueprint-library-content-flow"
      }),
      field("clip_size", "captured", "No offset in this content flow capture.", {
        type: rectangle2i,
        example: "{{0, 0}, {1440, 792}}",
        source: "blueprint-library-content-flow"
      }),
      field("maximum_vertical_squash_size", "captured", "Matches the parent window's 540 in this capture.", {
        type: integer,
        example: 540,
        source: "blueprint-library-content-flow"
      }),
      field("horizontal_spacing", "captured", "Effective spacing is 18, inherited horizontal_flow spacing is 6.", {
        type: integer,
        example: "18 effective, 6 inherited",
        source: "blueprint-library-content-flow"
      }),
      field("children", "captured", "Contains Frame, FrameWithSubheader, and an empty VerticalFlow in this window.", {
        type: nodeList,
        example: "Frame 636x792, FrameWithSubheader 786x792, VerticalFlow 0x0",
        source: "blueprint-library-content-flow"
      })
    ],
    captures: [
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
        "This is the second immediate child of `inset_frame_container_frame` for Blueprint Library, but not necessarily every Window body."
      ],
      missing: [
        "Frame and FrameWithSubheader child atoms.",
        "Rule for choosing body flow style based on window style."
      ]
    }
  }),
  atomDefinition({
    id: "inside-deep-frame",
    name: "Inside Deep Frame",
    primitive: "flow",
    style: "inside_deep_frame",
    availability: "Editor seed",
    summary: "Top-level window body container.",
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
      field("size", "hardcoded", "672 x 317 fixture until body content drives layout."),
      field("children", "missing", "TabbedPane/body primitive insertion is not implemented yet.")
    ],
    tracking: {
      implemented: [
        "Editor seed includes an empty body flow under the titlebar.",
        "Inspector exposes the body flow and lets child rows navigate to it."
      ],
      hardcoded: [
        "Body size is still the current fixture value.",
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
    name: "Frame Action Button",
    primitive: "button",
    style: "frame_action_button",
    availability: "Blueprint Library capture / Inspector controls",
    summary: "Small square toolbar button used by Factorio frame headers and mirrored by inspector controls.",
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

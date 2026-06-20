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
      field("relative", "captured", "Child relative values are parent-layout coordinates. Blueprint Library root stays `[0, 0]` when moved, while Factoriopedia root reports changing screen-offset-like values when moved. Root relative is variant/container-specific evidence and is not used as exported location.", {
        type: vector2i,
        example: "Blueprint root [0, 0], Factoriopedia samples [388, 106] / [382, 220] / [1142, 315]",
        source: "blueprint-library-window"
      }),
      field("size", "implemented", "Editor-created Windows use adjustable authored width/height with a preview-friendly default; captured in-game sizes remain reference fixtures.", {
        type: size2i,
        example: "editor default {680, 480}; adjustable; Blueprint capture {1476, 870}",
        source: "window-reference-captures"
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
      field("maximum_vertical_squash_size", "captured", "Captured values vary by content/window type and may be related to full-height clamping. The editor carries capture values as evidence but does not derive or export them for authored Windows yet.", {
        type: integer,
        example: "540 / 619 / 775 / 673 / 631 / 565",
        source: "top-level-window-captures"
      }),
      field("maximal_height", "captured", "Observed as 973 on full-height captures but absent from the current Blueprint Library Window capture. Deferred until the editor has GUI-scale/viewport emulation; not a Window-shell blocker.", {
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
      field("children", "captured", "Top-level roots have header/content children, with optional search/header controls depending on GUI. Window owns the container slots, not the implementation of every child atom.", {
        type: nodeList,
        example: "HorizontalFlow header, optional SearchPopup, content flow",
        source: "top-level-window-captures"
      }),
      field("graphicalBorder", "inferred", "Browser renderer uses a 6 px graphical frame band because captured size/content_size deltas do not reconcile from inspected padding alone. The same 6 px per-side delta appears on inventory slots, so this is treated as Factorio decorative chrome, not a Lua style field.", {
        type: integer,
        example: 6,
        source: "top-level-window-captures"
      }),
      field("capture context", "captured", "Current Window screenshots were taken with UI scale set to Manual (pixels) 150%. More scales are still needed before deriving scale-sensitive formulas.", {
        type: string,
        example: "Manual (pixels) 150%",
        source: "user-window-captures"
      }),
      field("reference captures", "implemented", "Window references are named model data. The current editor default is authored for the web preview; Blueprint Library, Factoriopedia, and filter-selection captures are evidence fixtures.", {
        type: size2i,
        example: "editor-default-window / blueprint-library-window / factoriopedia-root-window / filter-select-root-window",
        source: "window-reference-captures"
      }),
      field("size controls", "implemented", "New Window creation exposes authored width/height controls using sensible defaults, rather than copying a vanilla GUI capture size.", {
        type: size2i,
        example: "default 680 x 480; width/height inputs",
        source: "operator-decision"
      }),
      field("variant layout solver", "planned", "Future variants still need rules for width, side-frame edge removal, pre-stretch height, and squash-size calculation. These are deferred until the editor needs those GUI families."),
      field("optional child slots", "implemented", "SearchBar, browse arrows, CloseButton, SearchPopup, Frame, FrameWithSubheader, VerticalFlow, and TabbedPane are captured as optional slots or body children on Window references. The child atoms still own their own renderer, export, and behavior.", {
        type: nodeList,
        example: "header actions, between-header-and-body overlay, body content children",
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
        state: "done",
        label: "Header child relative offsets explained",
        note: "Title `[0, -4]` follows `top_margin=-4`; filler `[209, 0]` follows title width `191` + spacing `12` + left margin `6`; SearchBar `[1272, 0]` and CloseButton `[1404, 0]` follow filler width, margins, spacing, and the browse-arrow group."
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Root relative behavior characterized",
        note: "Blueprint Library root stays `[0, 0]` when moved; Factoriopedia samples changed to `[388, 106]`, `[382, 220]`, and `[1142, 315]`. Root relative is treated as variant/container-specific evidence, not exported location."
      }),
      progressCheck({
        dimension: "evidence",
        state: "partial",
        label: "Graphical frame band evidence cross-checked",
        note: "Window and inventory slot size/content deltas both imply a 6 px per-side graphical band; Ctrl+F5/Ctrl+F7 can still improve visual confidence."
      }),
      progressCheck({
        dimension: "evidence",
        state: "partial",
        label: "UI-scale and viewport validation captures",
        note: "Current captures are known to be Manual (pixels) 150%. Additional scale/viewport captures are deferred until the editor can emulate GUI scale changes."
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
        label: "Editor default size is authored separately from capture fixtures",
        note: "The default Window uses a preview-friendly 680 x 480 reference box instead of copying one in-game GUI instance."
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
        state: "done",
        label: "Side-frame variants represented",
        note: "`character_gui_left_side` and `frame_without_left_side` are recorded as evidence. They are not required for the baseline Window shell until the editor explicitly supports those GUI families."
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Optional child regions identified",
        note: "Window owns optional regions/slots; the child atoms themselves are separate completion work."
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Typed optional slot model",
        note: "Header actions, between-header/body overlays, and body content slots are represented as captured Window reference slots. Child atoms remain separate."
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Computed metrics carried without over-export",
        note: "`maximal_height` and squash sizes stay as captured reference evidence until a later solver exists."
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
        state: "done",
        label: "Style variants render",
        note: "The primary Window frame is covered. Side-frame graphical-set variants are deferred until the product needs side-pane GUI families."
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Optional body/header children render",
        note: "Window renders stable placeholder rows for optional slots; child atom rendering is separate work."
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
        state: "done",
        label: "Reference variants export",
        note: "No vanilla capture preset export is planned. Authored Windows export the baseline shell; captured references stay internal evidence."
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Window shell exports independently of child atoms",
        note: "Window export is complete for the shell. Child atom export belongs to those atoms once inserted into slots."
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
        state: "done",
        label: "Inspector navigation behavior is modeled",
        note: "Useful for editor review and implemented as editor behavior; it is not a Factorio runtime requirement."
      }),
      progressCheck({
        dimension: "behavior",
        state: "done",
        label: "In-game moved-window behavior validated",
        note: "Blueprint Library root relative stays `[0, 0]` when moved. Factoriopedia differs, so root-relative values are treated as variant-specific evidence and not exported location."
      }),
      progressCheck({
        dimension: "behavior",
        state: "done",
        label: "Window behavior is independent of child atom behavior",
        note: "Window owns the slots; each child atom owns its own runtime behavior."
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
          captureRow("ui_scale", string, "Manual (pixels) 150%"),
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
          captureRow("ui_scale", string, "Manual (pixels) 150%"),
          captureRow("relative", vector2i, "[289, 18]", "Earlier capture."),
          captureRow(
            "relative_samples",
            vector2i,
            "[388, 106] / [382, 220] / [1142, 315]",
            "Moved-window samples; size metrics stayed stable."
          ),
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
        "Editor-created Windows use an authored default reference size instead of a copied in-game capture size.",
        "New Window controls allow authored width and height adjustments from the default size.",
        "Inspector rows expose Window class/style/padding/sizing fields from structured data.",
        "Reference Window geometry derives content, clip, titlebar, and body sizes from named Window reference captures.",
        "Reference captures carry UI-scale context and moved-root relative samples where known.",
        "Blueprint Library header slots for SearchBar, browse arrows, and CloseButton are captured as optional Window slots.",
        "Lua export emits a top-level `frame` using the captured style, padding fields, and body flow spacing.",
        "Header child relative offsets are modeled as parent-layout coordinates.",
        "The 6 px graphical frame band is preserved as renderer/layout chrome and is not exported as a Lua style field."
      ],
      assumptions: [
        "GUI-specific root classes still share the same frame-derived top-level layout contract.",
        "Root `relative` is variant/container-specific and is not treated as screen location for Lua export.",
        "`maximal_height` is captured as a runtime/layout metric and is deferred until GUI-scale/viewport emulation exists.",
        "`maximum_vertical_squash_size` appears content- and variant-dependent, possibly related to maximal height, so capture values are carried without generalizing them to authored Windows."
      ],
      hardcoded: [
        "The editor-authored default Window size starts at 680 x 480.",
        "Browser CSS paints the frame bevel manually from captured visuals."
      ],
      missing: [],
      deferred: [
        "No vanilla capture preset selector is planned for the current editor; captures stay internal evidence.",
        "`maximal_height` and `maximum_vertical_squash_size` derivation waits for GUI-scale/viewport emulation.",
        "Side-frame variants remain captured evidence until the editor intentionally supports side-pane GUI families.",
        "Child insertion waits until child atoms are implemented.",
        "Lua-in-Factorio validation waits until enough atoms exist to build a meaningful test GUI."
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
    fields: [
      field("className", "captured", "`agui::HorizontalFlow`.", {
        type: className,
        example: "agui::HorizontalFlow",
        source: "blueprint-library-header-flow"
      }),
      field("primitive", "official", "Mapped to Factorio `flow`, which the official runtime docs describe as an invisible container that lays out children horizontally or vertically.", {
        type: guiPrimitive,
        example: "flow",
        source: "factorio-runtime-docs-2.0.77"
      }),
      field("direction", "implemented", "Horizontal Flow fixes the Factorio flow direction to `horizontal`; vertical flow remains a separate atom.", {
        type: string,
        example: "horizontal",
        source: "factorio-runtime-docs-2.0.77"
      }),
      field("style variants", "implemented", "Observed horizontal flow styles are represented as variant data, not separate atom identities.", {
        type: styleName,
        example: "frame_header_flow / inset_frame_container_horizontal_flow / header-action-group role",
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
      field("spacing model", "implemented", "Horizontal, vertical, and inherited spacing fields are structured style-reference data and inspector rows; Lua export emits the supported explicit spacing assignment for the current flow.", {
        type: integer,
        example: "horizontal_spacing = 12 / 18",
        source: "editor-model"
      }),
      field("bottomPadding", "implemented", "Frame header flow bottom padding is carried as structured style-reference data and exported for the titlebar flow; ordinary content-row captures did not show this override.", {
        type: integer,
        example: 6,
        source: "blueprint-library-header-flow"
      }),
      field("stretch flags", "implemented", "Captured titlebar stretch/search flags are represented in model and inspector data. Lua export emits horizontally stretchable where the editor currently owns the flow shell.", {
        type: boolean,
        example: "header horizontally_stretchable=on, vertically_stretchable=off",
        source: "blueprint-library-header-flow"
      }),
      field("children", "implemented", "HorizontalFlow owns an ordered child-list contract. Headers can contain label/filler/action slots; content rows can contain future child atoms. Child atom behavior remains delegated.", {
        type: nodeList,
        example: "Label/Filler/SearchBar or Frame/FrameWithSubheader/VerticalFlow",
        source: "blueprint-library-horizontal-flow-captures"
      }),
      field("header action children", "planned", "Blueprint Library captures SearchBar, browse-arrow group, and CloseButton as ordered child slots. Those child atoms are intentionally outside this pass.", {
        type: nodeList,
        example: "SearchBar 36x36, HorizontalFlow 72x36, CloseButton 36x36",
        source: "blueprint-library-header-flow"
      }),
      field("Lua export", "implemented", "Current Horizontal Flow nodes export as `type = \"flow\"` with `direction = \"horizontal\"`, stable names, styles, and supported explicit style assignments.", {
        type: string,
        example: "parent.add{type=\"flow\", direction=\"horizontal\", style=\"frame_header_flow\"}",
        source: "editor-export"
      }),
      field("runtime behavior", "notApplicable", "Horizontal Flow has no direct click/state behavior in current scope. Runtime behavior belongs to child atoms or Window drag-target wiring.", {
        type: string,
        source: "current-scope-contract"
      })
    ],
    progressChecks: [
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Official `flow` primitive checked",
        note: "Factorio Runtime Docs 2.0.77 list `flow` as a GUI element that lays out children horizontally or vertically."
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Header flow capture transcribed",
        note: "`frame_header_flow` capture includes size/content/clip, stretch/search flags, bottom padding, spacing, squash fields, and ordered children."
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Body flow capture transcribed",
        note: "`inset_frame_container_horizontal_flow` capture includes size/content/clip, spacing, squash fields, and future child slots."
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Header action group recorded as role variant",
        note: "The 72 x 36 browse-arrow group remains a captured HorizontalFlow role; it is not a separate atom and not promoted to product logic."
      }),
      progressCheck({
        dimension: "evidence",
        state: "done",
        label: "Fixture values classified",
        note: "`1440`, `792`, `1236`, `540`, and size-before-stretching values remain capture evidence, not universal Horizontal Flow defaults."
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Shared model can create Horizontal Flow nodes",
        note: "`createHorizontalFlowNode` fixes primitive `flow` and direction `horizontal` while carrying stable ids, style, role, style-reference data, and ordered children."
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Style variants represented as data",
        note: "`frame_header_flow`, `inset_frame_container_horizontal_flow`, and the header action-group role are tracked as variants of one atom."
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Window titlebar uses the Horizontal Flow contract"
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Window horizontal body flow uses the Horizontal Flow contract",
        note: "Vertical body references keep their own direction instead of being coerced into this atom."
      }),
      progressCheck({
        dimension: "model",
        state: "done",
        label: "Ordered child slots are stable",
        note: "Header label/filler/action rows and body content rows are ordered model/capture data; concrete child atom completion is delegated."
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Titlebar Horizontal Flow renders from model data",
        note: "The browser preview uses the structured titlebar node and exposes primitive/style/direction/spacing data attributes."
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Body Horizontal Flow renders from model data",
        note: "The body node exposes `flow`, horizontal direction, style, dimensions, and spacing from the selected reference."
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Inspector rows are structured projections",
        note: "Header/body flow rows, spacing, geometry, squash fields, and child rows come from model reference data, not parsed DOM text."
      }),
      progressCheck({
        dimension: "renderer",
        state: "done",
        label: "Optional children are represented without fake child rendering",
        note: "Unsupported child atoms appear as captured rows or slots; Horizontal Flow does not render SearchBar, Frame, or CloseButton stand-ins."
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Horizontal Flow exports as Factorio `flow`",
        note: "Exported flow nodes include stable name, style, and `direction = \"horizontal\"` for titlebar and horizontal body flows."
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Supported style fields export",
        note: "Explicit `horizontal_spacing`, header `bottom_padding`, and stretch fields are emitted from style-reference data where supported."
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Capture-only metrics stay out of Lua",
        note: "`size_before_stretching`, clip size, squash sizes, and inherited spacing remain inspector/evidence data until an export rule is proven."
      }),
      progressCheck({
        dimension: "luaExport",
        state: "done",
        label: "Child order is preserved by add order",
        note: "Current titlebar export emits label then filler; future child atoms can append in model order."
      }),
      progressCheck({
        dimension: "behavior",
        state: "done",
        label: "No direct Horizontal Flow runtime behavior required",
        note: "The atom is a layout container. Clicks, search controls, close buttons, and frame content behavior belong to child atoms."
      }),
      progressCheck({
        dimension: "behavior",
        state: "done",
        label: "Window drag behavior remains wired through titlebar flow",
        note: "The flow participates in Window drag-target export, but the behavior is owned by Window and its draggable filler/title children."
      }),
      progressCheck({
        dimension: "behavior",
        state: "done",
        label: "Child insertion can build on ordered slots",
        note: "Later atoms can be inserted without changing the Horizontal Flow identity or direction contract."
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
      document: "Horizontal Flow is current-scope complete as the reusable horizontal layout atom behind Window titlebar and horizontal body rows.",
      implemented: [
        "Official Factorio primitive mapping uses `flow` with fixed `direction = \"horizontal\"` for this atom.",
        "Header/body/action-group roles are style variants of one Horizontal Flow atom.",
        "Model nodes carry stable ids, class/style, fixed direction, style-reference spacing/padding/stretch/search fields, and ordered children.",
        "Renderer and inspector expose titlebar/body Horizontal Flow facts from structured model data.",
        "Lua export emits valid Factorio `flow` nodes with stable names, styles, horizontal direction, and supported explicit style assignments.",
        "Window remains complete for current shell scope and is not reopened by this pass."
      ],
      assumptions: [
        "The atom is the component class `agui::HorizontalFlow`; `frame_header_flow` and `inset_frame_container_horizontal_flow` are style/role variants.",
        "The frame header flow is part of the frame definition, not a normal user-authored child.",
        "`size_before_stretching` for header roles appears to be the minimum natural width of label + filler/action controls before the filler stretches, but that formula is not promoted to a rule yet."
      ],
      hardcoded: [
        "Captured fixture dimensions remain in evidence/reference data only.",
        "Browser layout still uses CSS flex to approximate Factorio flow layout until a fuller layout solver exists."
      ],
      missing: [],
      deferred: [
        "Header action child atoms: SearchBar, browse arrows, and CloseButton.",
        "Body child atoms: Frame, FrameWithSubheader, and Vertical Flow completion.",
        "General formula for `size_before_stretching` and horizontal/vertical squash values from children and role.",
        "GUI-scale, viewport, and in-game Lua validation harness for runtime parity.",
        "No-code child insertion UI waits until child atom contracts exist."
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

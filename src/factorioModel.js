export const FACTORIO_GUI_MODEL_SCHEMA = "factorio-gui-layout.v0";
export const FACTORIO_NOT_IMPLEMENTED = "not implemented";

export const frameStyleReference = Object.freeze({
  className: "agui::Window",
  style: "inset_frame_container_frame",
  derivedFrom: "frame",
  capturedSize: { width: 708, height: 395 },
  capturedContentSize: { width: 672, height: 365 },
  capturedClipSize: {
    offset: { x: 0, y: -4 },
    size: { width: 708, height: 399 }
  },
  capturedSizeBeforeStretching: { width: 708, height: 395 },
  capturedMaximalHeight: 395,
  topPadding: 6,
  rightPadding: 12,
  bottomPadding: 12,
  leftPadding: 12,
  graphicalBorder: 6,
  useHeaderFiller: true,
  titlebarHeight: 48,
  titlebarContentHeight: 42,
  titlebarBottomPadding: 6,
  titlebarHorizontalSpacing: 12,
  titleLabelStyle: "frame_title",
  titleLabelHeight: 46,
  titleLabelContentHeight: 42,
  titleLabelTopMargin: -4,
  titleLabelBottomPadding: 4,
  dragHandleStyle: "draggable_space_header",
  dragHandleHeight: 36,
  dragHandleLeftMargin: 6,
  dragHandleRightMargin: 6,
  bodyStyle: "inside_deep_frame",
  bodyVerticalSpacing: 0,
  maximumHorizontalSquashSize: 0,
  maximumVerticalSquashSize: 18
});

function estimateTitleLabelWidth(caption) {
  return Math.max(1, Math.round(String(caption).length * 11.2));
}

function sizePair({ width, height }) {
  return `{${width}, ${height}}`;
}

function onOff(value) {
  return value ? "on" : "off";
}

function normalizeModelLocation(location) {
  if (
    !location ||
    typeof location.x !== "number" ||
    typeof location.y !== "number" ||
    !Number.isFinite(location.x) ||
    !Number.isFinite(location.y)
  ) {
    return null;
  }

  return {
    x: Math.max(0, Math.round(location.x)),
    y: Math.max(0, Math.round(location.y))
  };
}

export function createWindowModel({
  title = "Untitled window",
  location: sourceLocation = null
} = {}) {
  const caption = title.trim() || "Untitled window";
  const location = normalizeModelLocation(sourceLocation);

  return {
    schema: FACTORIO_GUI_MODEL_SCHEMA,
    root: {
      id: "gui_window",
      primitive: "frame",
      className: frameStyleReference.className,
      style: frameStyleReference.style,
      derivedFrom: frameStyleReference.derivedFrom,
      direction: "vertical",
      location,
      styleReference: frameStyleReference,
      children: [
        {
          id: "gui_window_titlebar",
          primitive: "flow",
          className: "agui::HorizontalFlow",
          style: "frame_header_flow",
          direction: "horizontal",
          referenceSize: { height: frameStyleReference.titlebarHeight },
          styleReference: {
            bottomPadding: frameStyleReference.titlebarBottomPadding,
            horizontalSpacing: frameStyleReference.titlebarHorizontalSpacing,
            horizontallyStretchable: true,
            verticallyStretchable: false,
            ignoredBySearch: true
          },
          children: [
            {
              id: "gui_window_title",
              primitive: "label",
              className: "agui::Label",
              caption,
              style: frameStyleReference.titleLabelStyle,
              referenceSize: {
                width: estimateTitleLabelWidth(caption),
                height: frameStyleReference.titleLabelHeight,
                contentHeight: frameStyleReference.titleLabelContentHeight
              },
              styleReference: {
                topMargin: frameStyleReference.titleLabelTopMargin,
                bottomPadding: frameStyleReference.titleLabelBottomPadding,
                verticallyStretchable: true,
                horizontallySquashable: true,
                font: "heading-1",
                fontColor: "{1, 0.901961, 0.752941}",
                singleLine: true
              }
            },
            {
              id: "gui_window_drag_handle",
              primitive: "empty-widget",
              className: "agui::Filler",
              style: frameStyleReference.dragHandleStyle,
              referenceSize: {
                height: frameStyleReference.dragHandleHeight,
                naturalHeight: frameStyleReference.dragHandleHeight
              },
              styleReference: {
                leftMargin: frameStyleReference.dragHandleLeftMargin,
                rightMargin: frameStyleReference.dragHandleRightMargin,
                horizontallyStretchable: true,
                verticallyStretchable: true,
                ignoredBySearch: true
              },
              role: "header-filler"
            }
          ]
        },
        {
          id: "gui_window_body",
          primitive: "flow",
          className: "agui::VerticalFlow",
          style: frameStyleReference.bodyStyle,
          direction: "vertical",
          styleReference: {
            verticalSpacing: frameStyleReference.bodyVerticalSpacing,
            maximumVerticalSquashSize: frameStyleReference.maximumVerticalSquashSize
          },
          children: []
        }
      ]
    },
    constraints: [
      "top_level_frame",
      "no_absolute_positioning",
      "titlebar_has_drag_handle",
      "header_filler_stretches",
      "body_is_vertical_flow"
    ]
  };
}

export function walkModelNodes(node, visitor, depth = 0, parent = null) {
  if (!node) {
    return;
  }

  visitor(node, { depth, parent });
  for (const child of node.children ?? []) {
    walkModelNodes(child, visitor, depth + 1, node);
  }
}

export function findModelNode(model, id) {
  let match = null;
  walkModelNodes(model?.root, (node) => {
    if (node.id === id) {
      match = node;
    }
  });
  return match;
}

export function getWindowInspectorRows(model) {
  if (!model?.root) {
    return [];
  }

  const root = model.root;
  const titlebar = root.children[0];
  const titleLabel = titlebar.children[0];
  const dragHandle = titlebar.children[1];
  const body = root.children[1];
  const style = root.styleReference;
  const titleLabelWidth = titleLabel.referenceSize.width;

  return [
    {
      id: root.id,
      title: `class ${root.className}`,
      style: root.style,
      derivedFrom: root.derivedFrom,
      relative: "[0, 0]",
      size: sizePair(style.capturedSize),
      contentSize: sizePair(style.capturedContentSize),
      clipSize: `{{${style.capturedClipSize.offset.x}, ${style.capturedClipSize.offset.y}}, {${style.capturedClipSize.size.width}, ${style.capturedClipSize.size.height}}}`,
      sizeBeforeStretching: sizePair(style.capturedSizeBeforeStretching),
      maximumHorizontalSquashSize: style.maximumHorizontalSquashSize,
      maximumVerticalSquashSize: style.maximumVerticalSquashSize,
      maximalHeight: style.capturedMaximalHeight,
      properties: [
        { label: "top_padding", value: style.topPadding, indent: 1 },
        { label: "right_padding", value: style.rightPadding, indent: 1 },
        { label: "bottom_padding", value: style.bottomPadding, indent: 1 },
        { label: "left_padding", value: style.leftPadding, indent: 1 },
        { label: "use_header_filler", value: style.useHeaderFiller, indent: 1 }
      ],
      childRows: [
        { label: "children", value: "" },
        {
          label: "class agui::HorizontalFlow",
          value: "672 x 48",
          indent: 1,
          targetId: titlebar.id
        },
        {
          label: "class agui::VerticalFlow",
          value: "672 x 317",
          indent: 1,
          targetId: body.id
        }
      ]
    },
    {
      id: titlebar.id,
      title: "class agui::HorizontalFlow",
      style: "Part of frame definition",
      derivedFrom: "frame_header_flow",
      relative: "[0, 0]",
      size: "{672, 48}",
      contentSize: "{672, 42}",
      clipSize: "{{0, -4}, {672, 52}}",
      sizeBeforeStretching: "{199, 48}",
      maximumHorizontalSquashSize: 600,
      maximumVerticalSquashSize: 0,
      properties: [
        { label: "ignored_by_search", value: true, indent: 1 },
        { label: "bottom_padding", value: titlebar.styleReference.bottomPadding, indent: 1 },
        {
          label: "horizontally_stretchable",
          value: onOff(titlebar.styleReference.horizontallyStretchable)
        },
        { label: "horizontal_spacing", value: titlebar.styleReference.horizontalSpacing },
        { label: "horizontal_spacing", value: 6, indent: 1 },
        {
          label: "vertically_stretchable",
          value: onOff(titlebar.styleReference.verticallyStretchable)
        }
      ],
      childRows: [
        { label: "children", value: "" },
        {
          label: "class agui::Label",
          value: `${titleLabelWidth} x 46`,
          indent: 1,
          targetId: titleLabel.id
        },
        {
          label: "class agui::Filler",
          value: "473 x 36",
          indent: 1,
          targetId: dragHandle.id
        },
        { label: "class SearchBar", value: FACTORIO_NOT_IMPLEMENTED, indent: 1 }
      ]
    },
    {
      id: titleLabel.id,
      title: "class agui::Label",
      style: "Part of frame definition",
      derivedFrom: titleLabel.style,
      relative: "[0, -4]",
      size: `{${titleLabelWidth}, ${titleLabel.referenceSize.height}}`,
      contentSize: `{${titleLabelWidth}, ${titleLabel.referenceSize.contentHeight}}`,
      clipSize: `{{0, 0}, {${titleLabelWidth}, ${titleLabel.referenceSize.height}}}`,
      sizeBeforeStretching: `{${titleLabelWidth}, ${titleLabel.referenceSize.height}}`,
      maximumHorizontalSquashSize: titleLabelWidth,
      maximumVerticalSquashSize: 0,
      properties: [
        { label: "caption", value: titleLabel.caption, editable: { field: "title" }, tone: "default" },
        {
          label: "vertically_stretchable",
          value: onOff(titleLabel.styleReference.verticallyStretchable)
        },
        {
          label: "horizontally_squashable",
          value: onOff(titleLabel.styleReference.horizontallySquashable)
        },
        { label: "bottom_padding", value: titleLabel.styleReference.bottomPadding, indent: 1 },
        { label: "top_margin", value: titleLabel.styleReference.topMargin, indent: 1 },
        { label: "font", value: titleLabel.styleReference.font, indent: 1 },
        { label: "font_color", value: titleLabel.styleReference.fontColor, indent: 1 },
        { label: "font", value: "default", indent: 1 },
        { label: "font_color", value: "{1, 1, 1}", indent: 1 },
        { label: "disabled_font_color", value: "{0.5, 0.5, 0.5, 0.5}", indent: 1 },
        { label: "parent_hovered_font_color", value: "{0, 0, 0}", indent: 1 },
        { label: "game_controller_hovered_font_color", value: "{1, 0.68, 0}", indent: 1 },
        { label: "single_line", value: titleLabel.styleReference.singleLine, indent: 1 }
      ]
    },
    {
      id: dragHandle.id,
      title: "class agui::Filler",
      style: "Part of frame definition",
      derivedFrom: "draggable_space_header",
      relative: "[145, 0]",
      size: "{473, 36}",
      contentSize: "{473, 36}",
      clipSize: "{{0, 0}, {473, 36}}",
      sizeBeforeStretching: "{0, 36}",
      maximumHorizontalSquashSize: 473,
      maximumVerticalSquashSize: 0,
      properties: [
        { label: "right_margin", value: dragHandle.styleReference.rightMargin },
        { label: "height", value: dragHandle.referenceSize.height },
        { label: "natural_height", value: dragHandle.referenceSize.naturalHeight },
        {
          label: "horizontally_stretchable",
          value: onOff(dragHandle.styleReference.horizontallyStretchable)
        },
        {
          label: "vertically_stretchable",
          value: onOff(dragHandle.styleReference.verticallyStretchable)
        },
        { label: "left_margin", value: dragHandle.styleReference.leftMargin },
        { label: "ignored_by_search", value: true }
      ]
    },
    {
      id: body.id,
      title: "class agui::VerticalFlow",
      style: "Part of inside_deep_frame definition",
      derivedFrom: "inside_deep_frame",
      relative: "[0, 0]",
      size: "{672, 317}",
      contentSize: "{672, 317}",
      clipSize: "{{0, 0}, {672, 317}}",
      sizeBeforeStretching: "{672, 317}",
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: body.styleReference.maximumVerticalSquashSize,
      properties: [
        { label: "vertical_spacing", value: body.styleReference.verticalSpacing },
        { label: "vertical_spacing", value: 6, indent: 1 }
      ],
      childRows: [
        { label: "children", value: "" },
        { label: "class agui::TabbedPane", value: FACTORIO_NOT_IMPLEMENTED, indent: 1 }
      ]
    }
  ];
}

export const FACTORIO_GUI_MODEL_SCHEMA = "factorio-gui-layout.v0";
export const FACTORIO_NOT_IMPLEMENTED = "not implemented";

const FRAME_GRAPHICAL_BORDER = 6;
const FRAME_REFERENCE_OUTER_SIZE = Object.freeze({ width: 672, height: 973 });
const FRAME_REFERENCE_MAXIMUM_VERTICAL_SQUASH_SIZE = 673;
const FRAME_CLIP_TOP_OVERFLOW = 4;

function freezeSize(size) {
  return Object.freeze({ width: size.width, height: size.height });
}

function freezeRectangle(rectangle) {
  return Object.freeze({
    offset: Object.freeze({ x: rectangle.offset.x, y: rectangle.offset.y }),
    size: freezeSize(rectangle.size)
  });
}

function frameContentSize({
  outerSize = FRAME_REFERENCE_OUTER_SIZE,
  graphicalBorder = FRAME_GRAPHICAL_BORDER,
  topPadding,
  rightPadding,
  bottomPadding,
  leftPadding
}) {
  return freezeSize({
    width: outerSize.width - graphicalBorder * 2 - leftPadding - rightPadding,
    height: outerSize.height - graphicalBorder * 2 - topPadding - bottomPadding
  });
}

function frameClipSize({
  outerSize = FRAME_REFERENCE_OUTER_SIZE,
  clipTopOverflow = FRAME_CLIP_TOP_OVERFLOW
}) {
  return freezeRectangle({
    offset: { x: 0, y: -clipTopOverflow },
    size: {
      width: outerSize.width,
      height: outerSize.height + clipTopOverflow
    }
  });
}

const frameContentReferenceSize = frameContentSize({
  topPadding: 6,
  rightPadding: 12,
  bottomPadding: 12,
  leftPadding: 12
});

const frameClipReferenceSize = frameClipSize({});

export const frameStyleReference = Object.freeze({
  className: "agui::Window",
  style: "inset_frame_container_frame",
  derivedFrom: "frame",
  capturedSize: FRAME_REFERENCE_OUTER_SIZE,
  capturedContentSize: frameContentReferenceSize,
  capturedClipSize: frameClipReferenceSize,
  capturedSizeBeforeStretching: FRAME_REFERENCE_OUTER_SIZE,
  capturedMaximalHeight: FRAME_REFERENCE_OUTER_SIZE.height,
  topPadding: 6,
  rightPadding: 12,
  bottomPadding: 12,
  leftPadding: 12,
  graphicalBorder: FRAME_GRAPHICAL_BORDER,
  clipTopOverflow: FRAME_CLIP_TOP_OVERFLOW,
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
  maximumVerticalSquashSize: FRAME_REFERENCE_MAXIMUM_VERTICAL_SQUASH_SIZE
});

function estimateTitleLabelWidth(caption) {
  return Math.max(1, Math.round(String(caption).length * 11.2));
}

export function getFrameContentSize(style = frameStyleReference) {
  return frameContentSize({
    outerSize: style.capturedSize,
    graphicalBorder: style.graphicalBorder,
    topPadding: style.topPadding,
    rightPadding: style.rightPadding,
    bottomPadding: style.bottomPadding,
    leftPadding: style.leftPadding
  });
}

export function getFrameClipSize(style = frameStyleReference) {
  return frameClipSize({
    outerSize: style.capturedSize,
    clipTopOverflow: style.clipTopOverflow
  });
}

export function getFrameTitlebarSize(style = frameStyleReference) {
  const contentSize = getFrameContentSize(style);
  return freezeSize({
    width: contentSize.width,
    height: style.titlebarHeight
  });
}

export function getFrameTitlebarContentSize(style = frameStyleReference) {
  const titlebarSize = getFrameTitlebarSize(style);
  return freezeSize({
    width: titlebarSize.width,
    height: style.titlebarContentHeight
  });
}

export function getFrameTitlebarClipSize(style = frameStyleReference) {
  const titlebarSize = getFrameTitlebarSize(style);
  return freezeRectangle({
    offset: { x: 0, y: -style.clipTopOverflow },
    size: {
      width: titlebarSize.width,
      height: titlebarSize.height + style.clipTopOverflow
    }
  });
}

export function getFrameBodySize(style = frameStyleReference) {
  const contentSize = getFrameContentSize(style);
  return freezeSize({
    width: contentSize.width,
    height: Math.max(0, contentSize.height - style.titlebarHeight)
  });
}

function getFrameDragHandleWidth(style, titleLabelWidth) {
  const titlebarSize = getFrameTitlebarSize(style);
  return Math.max(
    0,
    titlebarSize.width -
      titleLabelWidth -
      style.titlebarHorizontalSpacing -
      style.dragHandleLeftMargin -
      style.dragHandleRightMargin
  );
}

function getFrameTitlebarSizeBeforeStretching(style, titleLabelWidth) {
  return freezeSize({
    width:
      titleLabelWidth +
      style.titlebarHorizontalSpacing +
      style.dragHandleLeftMargin +
      style.dragHandleRightMargin,
    height: style.titlebarHeight
  });
}

function getFrameDragHandleRelative(style, titleLabelWidth) {
  return {
    x: titleLabelWidth + style.titlebarHorizontalSpacing + style.dragHandleLeftMargin,
    y: 0
  };
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
      referenceSize: {
        ...frameStyleReference.capturedSize,
        contentWidth: frameStyleReference.capturedContentSize.width,
        contentHeight: frameStyleReference.capturedContentSize.height
      },
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
  const contentSize = getFrameContentSize(style);
  const clipSize = getFrameClipSize(style);
  const titlebarSize = getFrameTitlebarSize(style);
  const titlebarContentSize = getFrameTitlebarContentSize(style);
  const titlebarClipSize = getFrameTitlebarClipSize(style);
  const bodySize = getFrameBodySize(style);
  const dragHandleWidth = getFrameDragHandleWidth(style, titleLabelWidth);
  const titlebarSizeBeforeStretching = getFrameTitlebarSizeBeforeStretching(
    style,
    titleLabelWidth
  );
  const dragHandleRelative = getFrameDragHandleRelative(style, titleLabelWidth);

  return [
    {
      id: root.id,
      title: `class ${root.className}`,
      style: root.style,
      derivedFrom: root.derivedFrom,
      relative: "[0, 0]",
      size: sizePair(style.capturedSize),
      contentSize: sizePair(contentSize),
      clipSize: `{{${clipSize.offset.x}, ${clipSize.offset.y}}, {${clipSize.size.width}, ${clipSize.size.height}}}`,
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
          value: `${titlebarSize.width} x ${titlebarSize.height}`,
          indent: 1,
          targetId: titlebar.id
        },
        {
          label: "class agui::VerticalFlow",
          value: `${bodySize.width} x ${bodySize.height}`,
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
      size: sizePair(titlebarSize),
      contentSize: sizePair(titlebarContentSize),
      clipSize: `{{${titlebarClipSize.offset.x}, ${titlebarClipSize.offset.y}}, {${titlebarClipSize.size.width}, ${titlebarClipSize.size.height}}}`,
      sizeBeforeStretching: sizePair(titlebarSizeBeforeStretching),
      maximumHorizontalSquashSize: Math.max(0, titlebarSize.width - 72),
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
          value: `${dragHandleWidth} x 36`,
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
      relative: `[${dragHandleRelative.x}, ${dragHandleRelative.y}]`,
      size: `{${dragHandleWidth}, 36}`,
      contentSize: `{${dragHandleWidth}, 36}`,
      clipSize: `{{0, 0}, {${dragHandleWidth}, 36}}`,
      sizeBeforeStretching: "{0, 36}",
      maximumHorizontalSquashSize: dragHandleWidth,
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
      size: sizePair(bodySize),
      contentSize: sizePair(bodySize),
      clipSize: `{{0, 0}, {${bodySize.width}, ${bodySize.height}}}`,
      sizeBeforeStretching: sizePair(bodySize),
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: style.maximumVerticalSquashSize,
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

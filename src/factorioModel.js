export const FACTORIO_GUI_MODEL_SCHEMA = "factorio-gui-layout.v0";
export const FACTORIO_NOT_IMPLEMENTED = "not implemented";

const FRAME_GRAPHICAL_BORDER = 6;
const FRAME_CLIP_TOP_OVERFLOW = 4;
export const DEFAULT_WINDOW_REFERENCE_ID = "blueprint-library-window";

function freezeSize(size) {
  return Object.freeze({ width: size.width, height: size.height });
}

function freezeOptionalSize(size) {
  return size ? freezeSize(size) : null;
}

function freezeRectangle(rectangle) {
  return Object.freeze({
    offset: Object.freeze({ x: rectangle.offset.x, y: rectangle.offset.y }),
    size: freezeSize(rectangle.size)
  });
}

function freezeOptionalRectangle(rectangle) {
  return rectangle ? freezeRectangle(rectangle) : null;
}

function freezeVector(vector) {
  return Object.freeze({ x: vector.x, y: vector.y });
}

function frameContentSize({
  outerSize,
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
  outerSize,
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

function windowReferenceCapture({
  id,
  label,
  className,
  style,
  derivedFrom = "frame",
  capturedSize,
  capturedContentSize,
  capturedClipSize,
  capturedSizeBeforeStretching = capturedSize,
  capturedMaximalHeight = null,
  maximumHorizontalSquashSize = 0,
  maximumVerticalSquashSize,
  padding,
  useHeaderFiller = true,
  body
}) {
  return Object.freeze({
    id,
    label,
    className,
    style,
    derivedFrom,
    capturedSize: freezeSize(capturedSize),
    capturedContentSize: freezeSize(capturedContentSize),
    capturedClipSize: freezeRectangle(capturedClipSize),
    capturedSizeBeforeStretching: freezeSize(capturedSizeBeforeStretching),
    capturedMaximalHeight,
    maximumHorizontalSquashSize,
    maximumVerticalSquashSize,
    padding: Object.freeze({ ...padding }),
    useHeaderFiller,
    body: Object.freeze({
      ...body,
      relative: freezeVector(body.relative ?? { x: 0, y: 48 }),
      capturedSize: freezeSize(body.capturedSize),
      capturedContentSize: freezeOptionalSize(body.capturedContentSize ?? body.capturedSize),
      capturedClipSize: freezeOptionalRectangle(
        body.capturedClipSize ?? {
          offset: { x: 0, y: 0 },
          size: body.capturedSize
        }
      ),
      capturedSizeBeforeStretching: freezeOptionalSize(
        body.capturedSizeBeforeStretching ?? body.capturedSize
      ),
      childRows: Object.freeze([...(body.childRows ?? [])])
    })
  });
}

export const windowReferenceCaptures = Object.freeze([
  windowReferenceCapture({
    id: "blueprint-library-window",
    label: "Blueprint Library Window",
    className: "agui::Window",
    style: "inset_frame_container_frame",
    capturedSize: { width: 1476, height: 870 },
    capturedContentSize: { width: 1440, height: 840 },
    capturedClipSize: {
      offset: { x: 0, y: -4 },
      size: { width: 1476, height: 874 }
    },
    maximumVerticalSquashSize: 540,
    padding: { top: 6, right: 12, bottom: 12, left: 12 },
    body: {
      className: "agui::HorizontalFlow",
      style: "inset_frame_container_horizontal_flow",
      styleDescription: "Part of inset_frame_container_frame definition",
      derivedFrom: "inset_frame_container_horizontal_flow",
      direction: "horizontal",
      relative: { x: 0, y: 48 },
      capturedSize: { width: 1440, height: 792 },
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: 540,
      horizontalSpacing: 18,
      inheritedHorizontalSpacing: 6,
      verticalSpacing: null,
      inheritedVerticalSpacing: null,
      childRows: [
        { label: "class agui::Frame", value: FACTORIO_NOT_IMPLEMENTED },
        { label: "class FrameWithSubheader", value: FACTORIO_NOT_IMPLEMENTED },
        { label: "class agui::VerticalFlow", value: FACTORIO_NOT_IMPLEMENTED }
      ]
    }
  }),
  windowReferenceCapture({
    id: "filter-select-root-window",
    label: "Filter selection root Window",
    className: "FilterSelectGui<class IDWithQualityFilter<class ID<...>",
    style: "frame",
    capturedSize: { width: 672, height: 973 },
    capturedContentSize: { width: 636, height: 943 },
    capturedClipSize: {
      offset: { x: 0, y: -4 },
      size: { width: 672, height: 977 }
    },
    capturedMaximalHeight: 973,
    maximumVerticalSquashSize: 673,
    padding: { top: 6, right: 12, bottom: 12, left: 12 },
    body: {
      className: "agui::VerticalFlow",
      style: "inside_deep_frame",
      styleDescription: "Part of inside_deep_frame definition",
      derivedFrom: "inside_deep_frame",
      direction: "vertical",
      relative: { x: 0, y: 48 },
      capturedSize: { width: 636, height: 895 },
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: 673,
      horizontalSpacing: null,
      inheritedHorizontalSpacing: null,
      verticalSpacing: 0,
      inheritedVerticalSpacing: 6,
      childRows: [
        { label: "class agui::TabbedPane", value: FACTORIO_NOT_IMPLEMENTED }
      ]
    }
  })
]);

export function getWindowReferenceCapture(referenceId = DEFAULT_WINDOW_REFERENCE_ID) {
  return (
    windowReferenceCaptures.find((reference) => reference.id === referenceId) ??
    windowReferenceCaptures.find((reference) => reference.id === DEFAULT_WINDOW_REFERENCE_ID)
  );
}

function createFrameStyleReference(reference = getWindowReferenceCapture()) {
  return Object.freeze({
    referenceId: reference.id,
    referenceLabel: reference.label,
    className: reference.className,
    style: reference.style,
    derivedFrom: reference.derivedFrom,
    capturedSize: reference.capturedSize,
    capturedContentSize: reference.capturedContentSize,
    capturedClipSize: reference.capturedClipSize,
    capturedSizeBeforeStretching: reference.capturedSizeBeforeStretching,
    capturedMaximalHeight: reference.capturedMaximalHeight,
    topPadding: reference.padding.top,
    rightPadding: reference.padding.right,
    bottomPadding: reference.padding.bottom,
    leftPadding: reference.padding.left,
    graphicalBorder: FRAME_GRAPHICAL_BORDER,
    clipTopOverflow: FRAME_CLIP_TOP_OVERFLOW,
    useHeaderFiller: reference.useHeaderFiller,
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
    bodyClassName: reference.body.className,
    bodyStyle: reference.body.style,
    bodyStyleDescription: reference.body.styleDescription,
    bodyDerivedFrom: reference.body.derivedFrom,
    bodyDirection: reference.body.direction,
    bodyRelative: reference.body.relative,
    bodyCapturedSize: reference.body.capturedSize,
    bodyCapturedContentSize: reference.body.capturedContentSize,
    bodyCapturedClipSize: reference.body.capturedClipSize,
    bodyCapturedSizeBeforeStretching: reference.body.capturedSizeBeforeStretching,
    bodyHorizontalSpacing: reference.body.horizontalSpacing,
    bodyInheritedHorizontalSpacing: reference.body.inheritedHorizontalSpacing,
    bodyVerticalSpacing: reference.body.verticalSpacing,
    bodyInheritedVerticalSpacing: reference.body.inheritedVerticalSpacing,
    bodyChildRows: reference.body.childRows,
    maximumHorizontalSquashSize: reference.maximumHorizontalSquashSize,
    maximumVerticalSquashSize: reference.maximumVerticalSquashSize
  });
}

export const frameStyleReference = createFrameStyleReference();

function estimateTitleLabelWidth(caption) {
  return Math.max(1, Math.round(String(caption).length * 11.2));
}

export function getFrameContentSize(style = frameStyleReference) {
  if (style.capturedContentSize) {
    return style.capturedContentSize;
  }

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
  if (style.capturedClipSize) {
    return style.capturedClipSize;
  }

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
  if (style.bodyCapturedSize) {
    return style.bodyCapturedSize;
  }

  const contentSize = getFrameContentSize(style);
  return freezeSize({
    width: contentSize.width,
    height: Math.max(0, contentSize.height - style.titlebarHeight)
  });
}

function getFrameBodyContentSize(style) {
  return style.bodyCapturedContentSize ?? getFrameBodySize(style);
}

function getFrameBodyClipSize(style) {
  return (
    style.bodyCapturedClipSize ??
    freezeRectangle({
      offset: { x: 0, y: 0 },
      size: getFrameBodySize(style)
    })
  );
}

function getFrameBodySizeBeforeStretching(style) {
  return style.bodyCapturedSizeBeforeStretching ?? getFrameBodySize(style);
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

function getBodySpacingProperties(bodyStyleReference) {
  const properties = [];

  if (bodyStyleReference.horizontalSpacing != null) {
    properties.push({
      label: "horizontal_spacing",
      value: bodyStyleReference.horizontalSpacing
    });
  }

  if (bodyStyleReference.inheritedHorizontalSpacing != null) {
    properties.push({
      label: "horizontal_spacing",
      value: bodyStyleReference.inheritedHorizontalSpacing,
      indent: 1
    });
  }

  if (bodyStyleReference.verticalSpacing != null) {
    properties.push({
      label: "vertical_spacing",
      value: bodyStyleReference.verticalSpacing
    });
  }

  if (bodyStyleReference.inheritedVerticalSpacing != null) {
    properties.push({
      label: "vertical_spacing",
      value: bodyStyleReference.inheritedVerticalSpacing,
      indent: 1
    });
  }

  return properties;
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
  location: sourceLocation = null,
  referenceId = DEFAULT_WINDOW_REFERENCE_ID
} = {}) {
  const caption = title.trim() || "Untitled window";
  const location = normalizeModelLocation(sourceLocation);
  const styleReference = createFrameStyleReference(getWindowReferenceCapture(referenceId));

  return {
    schema: FACTORIO_GUI_MODEL_SCHEMA,
    root: {
      id: "gui_window",
      primitive: "frame",
      className: styleReference.className,
      style: styleReference.style,
      derivedFrom: styleReference.derivedFrom,
      direction: "vertical",
      location,
      referenceSize: {
        ...styleReference.capturedSize,
        contentWidth: styleReference.capturedContentSize.width,
        contentHeight: styleReference.capturedContentSize.height
      },
      styleReference,
      children: [
        {
          id: "gui_window_titlebar",
          primitive: "flow",
          className: "agui::HorizontalFlow",
          style: "frame_header_flow",
          direction: "horizontal",
          referenceSize: { height: styleReference.titlebarHeight },
          styleReference: {
            bottomPadding: styleReference.titlebarBottomPadding,
            horizontalSpacing: styleReference.titlebarHorizontalSpacing,
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
              style: styleReference.titleLabelStyle,
              referenceSize: {
                width: estimateTitleLabelWidth(caption),
                height: styleReference.titleLabelHeight,
                contentHeight: styleReference.titleLabelContentHeight
              },
              styleReference: {
                topMargin: styleReference.titleLabelTopMargin,
                bottomPadding: styleReference.titleLabelBottomPadding,
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
              style: styleReference.dragHandleStyle,
              referenceSize: {
                height: styleReference.dragHandleHeight,
                naturalHeight: styleReference.dragHandleHeight
              },
              styleReference: {
                leftMargin: styleReference.dragHandleLeftMargin,
                rightMargin: styleReference.dragHandleRightMargin,
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
          className: styleReference.bodyClassName,
          style: styleReference.bodyStyle,
          direction: styleReference.bodyDirection,
          styleReference: {
            horizontalSpacing: styleReference.bodyHorizontalSpacing,
            inheritedHorizontalSpacing: styleReference.bodyInheritedHorizontalSpacing,
            verticalSpacing: styleReference.bodyVerticalSpacing,
            inheritedVerticalSpacing: styleReference.bodyInheritedVerticalSpacing,
            maximumVerticalSquashSize: styleReference.maximumVerticalSquashSize
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
      "body_is_window_content_flow"
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
  const bodyContentSize = getFrameBodyContentSize(style);
  const bodyClipSize = getFrameBodyClipSize(style);
  const bodySizeBeforeStretching = getFrameBodySizeBeforeStretching(style);
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
          label: `class ${body.className}`,
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
      title: `class ${body.className}`,
      style: style.bodyStyleDescription,
      derivedFrom: style.bodyDerivedFrom,
      relative: `[${style.bodyRelative.x}, ${style.bodyRelative.y}]`,
      size: sizePair(bodySize),
      contentSize: sizePair(bodyContentSize),
      clipSize: `{{${bodyClipSize.offset.x}, ${bodyClipSize.offset.y}}, {${bodyClipSize.size.width}, ${bodyClipSize.size.height}}}`,
      sizeBeforeStretching: sizePair(bodySizeBeforeStretching),
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: style.maximumVerticalSquashSize,
      properties: getBodySpacingProperties(body.styleReference),
      childRows: [
        { label: "children", value: "" },
        ...style.bodyChildRows.map((row) => ({ ...row, indent: 1 }))
      ]
    }
  ];
}

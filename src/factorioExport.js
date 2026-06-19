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
      size: `${style.capturedSize.width} x ${style.capturedSize.height}`,
      contentSize: `${style.capturedContentSize.width} x ${style.capturedContentSize.height}`,
      clipSize: `{{${style.capturedClipSize.offset.x}, ${style.capturedClipSize.offset.y}}, {${style.capturedClipSize.size.width}, ${style.capturedClipSize.size.height}}}`,
      sizeBeforeStretching: `${style.capturedSizeBeforeStretching.width} x ${style.capturedSizeBeforeStretching.height}`,
      maximumHorizontalSquashSize: style.maximumHorizontalSquashSize,
      maximumVerticalSquashSize: style.maximumVerticalSquashSize,
      properties: [
        { label: "top_padding", value: style.topPadding, indent: 1 },
        { label: "right_padding", value: style.rightPadding, indent: 1 },
        { label: "bottom_padding", value: style.bottomPadding, indent: 1 },
        { label: "left_padding", value: style.leftPadding, indent: 1 },
        { label: "use_header_filler", value: style.useHeaderFiller }
      ],
      childRows: [
        { label: "children", value: "" },
        { label: "class agui::HorizontalFlow", value: "672 x 48", indent: 1 },
        { label: "class agui::VerticalFlow", value: "672 x 317", indent: 1 }
      ]
    },
    {
      id: titlebar.id,
      title: "class agui::HorizontalFlow",
      style: "Part of frame definition",
      derivedFrom: "frame_header_flow",
      relative: "[0, 0]",
      size: "672 x 48",
      contentSize: "672 x 42",
      clipSize: "{{0, -4}, {672, 52}}",
      sizeBeforeStretching: "199 x 48",
      maximumHorizontalSquashSize: 600,
      maximumVerticalSquashSize: 0,
      properties: [
        { label: "bottom_padding", value: titlebar.styleReference.bottomPadding, indent: 1 },
        { label: "horizontally_stretchable", value: titlebar.styleReference.horizontallyStretchable },
        { label: "horizontal_spacing", value: titlebar.styleReference.horizontalSpacing },
        { label: "horizontal_spacing", value: 6, indent: 1 },
        { label: "vertically_stretchable", value: titlebar.styleReference.verticallyStretchable }
      ],
      childRows: [
        { label: "children", value: "" },
        { label: "class agui::Label", value: `${titleLabelWidth} x 46`, indent: 1 },
        { label: "class agui::Filler", value: "473 x 36", indent: 1 },
        { label: "class SearchBar", value: "36 x 36", indent: 1 }
      ]
    },
    {
      id: titleLabel.id,
      title: "class agui::Label",
      style: "Part of frame definition",
      derivedFrom: titleLabel.style,
      relative: "[0, -4]",
      size: `${titleLabelWidth} x ${titleLabel.referenceSize.height}`,
      contentSize: `${titleLabelWidth} x ${titleLabel.referenceSize.contentHeight}`,
      clipSize: `{{0, 0}, {${titleLabelWidth}, ${titleLabel.referenceSize.height}}}`,
      sizeBeforeStretching: `${titleLabelWidth} x ${titleLabel.referenceSize.height}`,
      maximumHorizontalSquashSize: titleLabelWidth,
      maximumVerticalSquashSize: 0,
      properties: [
        { label: "vertically_stretchable", value: titleLabel.styleReference.verticallyStretchable },
        { label: "horizontally_squashable", value: titleLabel.styleReference.horizontallySquashable },
        { label: "bottom_padding", value: titleLabel.styleReference.bottomPadding, indent: 1 },
        { label: "top_margin", value: titleLabel.styleReference.topMargin, indent: 1 },
        { label: "font", value: titleLabel.styleReference.font, indent: 1 },
        { label: "font_color", value: titleLabel.styleReference.fontColor, indent: 1 },
        { label: "font", value: "default", indent: 1 },
        { label: "font_color", value: "{1, 1, 1}", indent: 1 },
        { label: "disabled_font_color", value: "{0.5, 0.5, 0.5, 0.5}", indent: 1 },
        { label: "parent_hovered_font_color", value: "{0, 0, 0}", indent: 1 },
        { label: "game_controller_hovered_font_color", value: "{1, 0.68, 0}", indent: 1 },
        { label: "single_line", value: true, indent: 1 }
      ]
    },
    {
      id: dragHandle.id,
      title: "class agui::Filler",
      style: "Part of frame definition",
      derivedFrom: "draggable_space_header",
      relative: "[145, 0]",
      size: "473 x 36",
      contentSize: "473 x 36",
      clipSize: "{{0, 0}, {473, 36}}",
      sizeBeforeStretching: "0 x 36",
      maximumHorizontalSquashSize: 473,
      maximumVerticalSquashSize: 0,
      properties: [
        { label: "right_margin", value: dragHandle.styleReference.rightMargin },
        { label: "height", value: dragHandle.referenceSize.height },
        { label: "natural_height", value: dragHandle.referenceSize.naturalHeight },
        { label: "horizontally_stretchable", value: dragHandle.styleReference.horizontallyStretchable },
        { label: "vertically_stretchable", value: dragHandle.styleReference.verticallyStretchable },
        { label: "left_margin", value: dragHandle.styleReference.leftMargin }
      ]
    },
    {
      id: body.id,
      title: "class agui::VerticalFlow",
      style: "Part of inside_deep_frame definition",
      derivedFrom: "inside_deep_frame",
      relative: "[0, 0]",
      size: "672 x 317",
      contentSize: "672 x 317",
      clipSize: "{{0, 0}, {672, 317}}",
      sizeBeforeStretching: "672 x 317",
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: body.styleReference.maximumVerticalSquashSize,
      properties: [
        { label: "vertical_spacing", value: body.styleReference.verticalSpacing },
        { label: "vertical_spacing", value: 6, indent: 1 }
      ],
      childRows: [
        { label: "children", value: "" },
        { label: "class agui::TabbedPane", value: "672 x 299", indent: 1 }
      ]
    }
  ];
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

export function createWindowModel({ title = "Untitled window", location: sourceLocation = null } = {}) {
  const caption = title.trim() || "Untitled window";
  const location = normalizeModelLocation(sourceLocation);

  return {
    schema: "factorio-gui-layout.v0",
    root: {
      id: "gui_window",
      primitive: "frame",
      className: frameStyleReference.className,
      style: frameStyleReference.style,
      derivedFrom: frameStyleReference.derivedFrom,
      caption,
      direction: "vertical",
      location,
      styleReference: frameStyleReference,
      children: [
        {
          id: "gui_window_titlebar",
          primitive: "flow",
          style: "frame_header_flow",
          direction: "horizontal",
          referenceSize: { height: frameStyleReference.titlebarHeight },
          styleReference: {
            bottomPadding: frameStyleReference.titlebarBottomPadding,
            horizontalSpacing: frameStyleReference.titlebarHorizontalSpacing,
            horizontallyStretchable: true,
            verticallyStretchable: false
          },
          children: [
            {
              id: "gui_window_title",
              primitive: "label",
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
                fontColor: "{1, 0.901961, 0.752941}"
              }
            },
            {
              id: "gui_window_drag_handle",
              primitive: "empty-widget",
              style: frameStyleReference.dragHandleStyle,
              referenceSize: {
                height: frameStyleReference.dragHandleHeight,
                naturalHeight: frameStyleReference.dragHandleHeight
              },
              styleReference: {
                leftMargin: frameStyleReference.dragHandleLeftMargin,
                rightMargin: frameStyleReference.dragHandleRightMargin,
                horizontallyStretchable: true,
                verticallyStretchable: true
              },
              role: "header-filler"
            }
          ]
        },
        {
          id: "gui_window_body",
          primitive: "flow",
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

function luaString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function luaName(value) {
  return String(value).replace(/[^a-zA-Z0-9_]/g, "_");
}

export function renderWindowLua(model) {
  if (!model?.root) {
    return "-- Create a window to generate gui.lua.";
  }

  const root = model.root;
  const frame = luaName(root.id);
  const titlebar = luaName(root.children[0].id);
  const titleNode = root.children[0].children[0];
  const title = luaName(titleNode.id);
  const dragNode = root.children[0].children[1];
  const bodyNode = root.children[1];
  const dragHandle = luaName(dragNode.id);
  const body = luaName(bodyNode.id);
  const style = root.styleReference;
  const locationLua = root.location
    ? `  ${frame}.auto_center = false
  ${frame}.location = {x = ${root.location.x}, y = ${root.location.y}}`
    : `  ${frame}.auto_center = true`;

  return `-- Generated from ${model.schema}.
-- Structural skeleton only. Add behavior hooks by name after review.

local function build_gui(player)
  local screen = player.gui.screen

  if screen.${frame} then
    screen.${frame}.destroy()
  end

  local ${frame} = screen.add{
    type = "frame",
    name = ${luaString(root.id)},
    direction = ${luaString(root.direction)},
    style = ${luaString(root.style)}
  }
${locationLua}
  ${frame}.style.top_padding = ${style.topPadding}
  ${frame}.style.right_padding = ${style.rightPadding}
  ${frame}.style.bottom_padding = ${style.bottomPadding}
  ${frame}.style.left_padding = ${style.leftPadding}
  ${frame}.style.use_header_filler = ${style.useHeaderFiller}

  local ${titlebar} = ${frame}.add{
    type = "flow",
    name = ${luaString(root.children[0].id)},
    direction = ${luaString(root.children[0].direction)},
    style = ${luaString(root.children[0].style)}
  }
  ${titlebar}.style.bottom_padding = ${root.children[0].styleReference.bottomPadding}
  ${titlebar}.style.horizontal_spacing = ${root.children[0].styleReference.horizontalSpacing}
  ${titlebar}.style.horizontally_stretchable = ${root.children[0].styleReference.horizontallyStretchable}
  ${titlebar}.drag_target = ${frame}

  local ${title} = ${titlebar}.add{
    type = "label",
    name = ${luaString(titleNode.id)},
    caption = ${luaString(root.caption)},
    style = ${luaString(titleNode.style)}
  }
  ${title}.style.top_margin = ${titleNode.styleReference.topMargin}
  ${title}.style.bottom_padding = ${titleNode.styleReference.bottomPadding}
  ${title}.style.vertically_stretchable = ${titleNode.styleReference.verticallyStretchable}
  ${title}.style.horizontally_squashable = ${titleNode.styleReference.horizontallySquashable}
  ${title}.drag_target = ${frame}

  local ${dragHandle} = ${titlebar}.add{
    type = "empty-widget",
    name = ${luaString(root.children[0].children[1].id)},
    style = ${luaString(dragNode.style)}
  }
  ${dragHandle}.style.left_margin = ${dragNode.styleReference.leftMargin}
  ${dragHandle}.style.right_margin = ${dragNode.styleReference.rightMargin}
  ${dragHandle}.style.height = ${dragNode.referenceSize.height}
  ${dragHandle}.style.horizontally_stretchable = ${dragNode.styleReference.horizontallyStretchable}
  ${dragHandle}.style.vertically_stretchable = ${dragNode.styleReference.verticallyStretchable}
  ${dragHandle}.drag_target = ${frame}

  local ${body} = ${frame}.add{
    type = "flow",
    name = ${luaString(bodyNode.id)},
    direction = ${luaString(bodyNode.direction)},
    style = ${luaString(bodyNode.style)}
  }
  ${body}.style.horizontally_stretchable = true
  ${body}.style.vertical_spacing = ${bodyNode.styleReference.verticalSpacing}

  return ${frame}
end

return build_gui
`;
}

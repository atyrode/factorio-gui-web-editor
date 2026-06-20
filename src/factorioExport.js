export {
  createWindowModel,
  DEFAULT_WINDOW_SIZE,
  frameStyleReference,
  getWindowInspectorRows,
  normalizeWindowSize,
  WINDOW_SIZE_LIMITS
} from "./factorioModel.js";

function luaString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function luaName(value) {
  return String(value).replace(/[^a-zA-Z0-9_]/g, "_");
}

function flowStyleAssignmentLines(variableName, node) {
  const styleReference = node?.styleReference ?? {};
  const lines = [];

  if (styleReference.bottomPadding != null) {
    lines.push(
      `  ${variableName}.style.bottom_padding = ${styleReference.bottomPadding}`
    );
  }

  if (styleReference.horizontalSpacing != null) {
    lines.push(
      `  ${variableName}.style.horizontal_spacing = ${styleReference.horizontalSpacing}`
    );
  }

  if (styleReference.verticalSpacing != null) {
    lines.push(
      `  ${variableName}.style.vertical_spacing = ${styleReference.verticalSpacing}`
    );
  }

  if (styleReference.horizontallyStretchable != null) {
    lines.push(
      `  ${variableName}.style.horizontally_stretchable = ${styleReference.horizontallyStretchable}`
    );
  }

  return lines;
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
  const titlebarStyleLines = flowStyleAssignmentLines(titlebar, root.children[0]);
  const bodyStyleLines = flowStyleAssignmentLines(body, bodyNode);

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
  ${frame}.style.width = ${style.capturedSize.width}
  ${frame}.style.height = ${style.capturedSize.height}

  local ${titlebar} = ${frame}.add{
    type = "flow",
    name = ${luaString(root.children[0].id)},
    direction = ${luaString(root.children[0].direction)},
    style = ${luaString(root.children[0].style)}
  }
${titlebarStyleLines.join("\n")}
  ${titlebar}.drag_target = ${frame}

  local ${title} = ${titlebar}.add{
    type = "label",
    name = ${luaString(titleNode.id)},
    caption = ${luaString(titleNode.caption)},
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
${bodyStyleLines.join("\n")}

  return ${frame}
end

return build_gui
`;
}

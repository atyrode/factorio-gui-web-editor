#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";

import {
  BODY_LAYOUT_ROOT_ID,
  FILLER_ATOM_ID,
  FRAME_ATOM_ID,
  GENERIC_FILLER_STYLE_VARIANT,
  INSIDE_DEEP_FRAME_STYLE_VARIANT,
  GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
  HORIZONTAL_FLOW_ATOM_ID,
  builderAtomMetadata,
  canLayoutAtomHaveChildren,
  canDropLayoutNode,
  canParentAcceptAtom,
  createFillerSpec,
  createFrameSpec,
  createHorizontalFlowSpec,
  insertLayoutNode,
  moveLayoutNode,
  normalizeLayoutState,
  removeLayoutNode,
  updateLayoutNodeSize
} from "../src/factorioLayoutTree.js";
import {
  createWindowModel,
  getWindowInspectorRows,
  normalizeLayoutSettings,
  VERTICAL_FLOW_DIRECTION
} from "../src/factorioModel.js";
import { renderWindowLua } from "../src/factorioExport.js";
import {
  collectWindowLuaVariableNodeIds,
  luaDefaultVariableName,
  normalizeLuaVariableNames,
  validateLuaVariableNameEdit
} from "../src/factorioLuaNames.js";
import {
  FACTORIO_PREVIEW_MOD_FOLDER,
  FACTORIO_PREVIEW_MOD_NAME,
  FACTORIO_PREVIEW_MOD_VERSION,
  FACTORIO_PREVIEW_MOD_ZIP_FILENAME,
  createFactorioModZipData,
  renderFactorioModFiles
} from "../src/factorioModExport.js";
import { factorioAtomRegistry } from "../src/factorioAtomRegistry.js";

function ids(nodes) {
  return nodes.map((node) => node.id);
}

function firstChild(nodes) {
  assert.equal(nodes.length, 1);
  return nodes[0];
}

function propertyValue(row, label) {
  const property = (row.properties ?? []).find((entry) => entry.label === label);
  assert.ok(property, `Missing inspector property: ${label}`);
  return property.value;
}

const empty = normalizeLayoutState({});
assert.deepEqual(empty.layoutChildren, []);
assert.equal(empty.nextLayoutNodeNumber, 1);

const normalized = normalizeLayoutState({
  nextLayoutNodeNumber: 10,
  layoutChildren: [
    {
      id: "gui_frame_1",
      atom: "frame",
      styleVariant: "legacy",
      children: [
        {
          id: "gui_frame_2",
          atom: "frame",
          children: []
        },
        {
          id: "gui_horizontal_flow_3",
          atom: "horizontal-flow",
          children: [
            {
              id: "gui_filler_4",
              atom: "filler",
              children: [
                {
                  id: "gui_frame_99",
                  atom: "frame",
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: "gui_filler_5",
          atom: "filler",
          children: [
            {
              id: "gui_horizontal_flow_8",
              atom: "horizontal-flow",
              children: []
            }
          ]
        },
        {
          id: "ignored_label",
          atom: "label",
          children: []
        }
      ]
    },
    {
      id: "gui_horizontal_flow_6",
      atom: "horizontal-flow",
      children: [
        {
          id: "gui_frame_7",
          atom: "frame",
          children: []
        },
        {
          id: "gui_filler_8",
          atom: "filler",
          children: []
        }
      ]
    },
    {
      id: "ignored_root_label",
      atom: "label",
      children: []
    }
  ]
});
assert.deepEqual(ids(normalized.layoutChildren), ["gui_frame_1", "gui_horizontal_flow_6"]);
assert.equal(normalized.layoutChildren[0].atom, FRAME_ATOM_ID);
assert.equal(normalized.layoutChildren[0].styleVariant, INSIDE_DEEP_FRAME_STYLE_VARIANT);
assert.deepEqual(ids(normalized.layoutChildren[0].children), [
  "gui_frame_2",
  "gui_horizontal_flow_3",
  "gui_filler_5"
]);
assert.equal(normalized.layoutChildren[0].children[0].atom, FRAME_ATOM_ID);
assert.equal(normalized.layoutChildren[0].children[1].atom, HORIZONTAL_FLOW_ATOM_ID);
assert.equal(normalized.layoutChildren[0].children[1].children[0].atom, FILLER_ATOM_ID);
assert.deepEqual(normalized.layoutChildren[0].children[1].children[0].children, []);
assert.equal(normalized.layoutChildren[0].children[2].atom, FILLER_ATOM_ID);
assert.deepEqual(normalized.layoutChildren[0].children[2].children, []);
assert.equal(normalized.layoutChildren[1].atom, HORIZONTAL_FLOW_ATOM_ID);
assert.deepEqual(ids(normalized.layoutChildren[1].children), ["gui_frame_7", "gui_filler_8"]);
assert.equal(normalized.nextLayoutNodeNumber, 10);
assert.equal(canLayoutAtomHaveChildren(FRAME_ATOM_ID), true);
assert.equal(canLayoutAtomHaveChildren(HORIZONTAL_FLOW_ATOM_ID), true);
assert.equal(canLayoutAtomHaveChildren(FILLER_ATOM_ID), false);
assert.deepEqual(builderAtomMetadata(FILLER_ATOM_ID).createSpec(42), {
  id: "gui_filler_42",
  atom: FILLER_ATOM_ID,
  styleVariant: GENERIC_FILLER_STYLE_VARIANT,
  children: []
});
assert.equal(canParentAcceptAtom(normalized.layoutChildren, BODY_LAYOUT_ROOT_ID, FRAME_ATOM_ID), true);
assert.equal(
  canParentAcceptAtom(normalized.layoutChildren, BODY_LAYOUT_ROOT_ID, HORIZONTAL_FLOW_ATOM_ID),
  true
);
assert.equal(canParentAcceptAtom(normalized.layoutChildren, BODY_LAYOUT_ROOT_ID, FILLER_ATOM_ID), true);
assert.equal(canParentAcceptAtom(normalized.layoutChildren, "gui_frame_1", FRAME_ATOM_ID), true);
assert.equal(canParentAcceptAtom(normalized.layoutChildren, "gui_frame_1", HORIZONTAL_FLOW_ATOM_ID), true);
assert.equal(canParentAcceptAtom(normalized.layoutChildren, "gui_frame_1", FILLER_ATOM_ID), true);
assert.equal(canParentAcceptAtom(normalized.layoutChildren, "gui_horizontal_flow_6", FRAME_ATOM_ID), true);
assert.equal(
  canParentAcceptAtom(normalized.layoutChildren, "gui_horizontal_flow_6", HORIZONTAL_FLOW_ATOM_ID),
  true
);
assert.equal(canParentAcceptAtom(normalized.layoutChildren, "gui_horizontal_flow_6", FILLER_ATOM_ID), true);
assert.equal(canParentAcceptAtom(normalized.layoutChildren, "gui_filler_5", FRAME_ATOM_ID), false);

const normalizedSized = normalizeLayoutState({
  layoutChildren: [
    {
      id: "gui_frame_1",
      atom: "frame",
      size: {
        minimalWidth: 900,
        minimalHeight: 10,
        ignored: 200
      },
      children: []
    }
  ]
});
assert.deepEqual(normalizedSized.layoutChildren[0].size, {
  minimalWidth: 800,
  minimalHeight: 48
});

const frame1 = createFrameSpec(1);
const flow2 = createHorizontalFlowSpec(2);
const frame3 = createFrameSpec(3);
const filler4 = createFillerSpec(4);
let tree = [];

let insertion = insertLayoutNode(tree, BODY_LAYOUT_ROOT_ID, 0, frame1);
assert.equal(insertion.changed, true);
tree = insertion.layoutChildren;
assert.deepEqual(ids(tree), ["gui_frame_1"]);

insertion = insertLayoutNode(tree, "gui_frame_1", 0, flow2);
assert.equal(insertion.changed, true);
tree = insertion.layoutChildren;
assert.deepEqual(ids(firstChild(tree).children), ["gui_horizontal_flow_2"]);

insertion = insertLayoutNode(tree, "gui_horizontal_flow_2", 0, frame3);
assert.equal(insertion.changed, true);
tree = insertion.layoutChildren;
assert.deepEqual(ids(tree[0].children[0].children), ["gui_frame_3"]);

insertion = insertLayoutNode(tree, "gui_frame_1", 1, filler4);
assert.equal(insertion.changed, true);
tree = insertion.layoutChildren;
assert.deepEqual(ids(firstChild(tree).children), ["gui_horizontal_flow_2", "gui_filler_4"]);

insertion = insertLayoutNode(tree, "gui_filler_4", 0, createFrameSpec(5));
assert.equal(insertion.changed, false);
assert.deepEqual(ids(firstChild(tree).children), ["gui_horizontal_flow_2", "gui_filler_4"]);

let sizeUpdate = updateLayoutNodeSize(tree, "gui_frame_3", {
  minimalWidth: 1000,
  minimalHeight: 12
});
assert.equal(sizeUpdate.changed, true);
tree = sizeUpdate.layoutChildren;
assert.deepEqual(tree[0].children[0].children[0].size, {
  minimalWidth: 800,
  minimalHeight: 48
});

assert.equal(canDropLayoutNode(tree, "gui_frame_1", "gui_frame_1"), false);
assert.equal(canDropLayoutNode(tree, "gui_frame_1", "gui_horizontal_flow_2"), false);
assert.equal(canDropLayoutNode(tree, "gui_frame_3", BODY_LAYOUT_ROOT_ID), true);
assert.equal(canDropLayoutNode(tree, "gui_horizontal_flow_2", BODY_LAYOUT_ROOT_ID), true);
assert.equal(canDropLayoutNode(tree, null, BODY_LAYOUT_ROOT_ID, FILLER_ATOM_ID), true);
assert.equal(canDropLayoutNode(tree, null, "gui_frame_1", FILLER_ATOM_ID), true);
assert.equal(canDropLayoutNode(tree, null, "gui_horizontal_flow_2", FILLER_ATOM_ID), true);
assert.equal(canDropLayoutNode(tree, null, "gui_filler_4", FRAME_ATOM_ID), false);

let movement = moveLayoutNode(tree, "gui_frame_3", BODY_LAYOUT_ROOT_ID, 1);
assert.equal(movement.changed, true);
tree = movement.layoutChildren;
assert.deepEqual(ids(tree), ["gui_frame_1", "gui_frame_3"]);
assert.deepEqual(tree[1].size, { minimalWidth: 800, minimalHeight: 48 });
assert.deepEqual(ids(tree[0].children), ["gui_horizontal_flow_2", "gui_filler_4"]);

movement = moveLayoutNode(tree, "gui_horizontal_flow_2", "gui_frame_3", 0);
assert.equal(movement.changed, true);
tree = movement.layoutChildren;
assert.deepEqual(ids(tree), ["gui_frame_1", "gui_frame_3"]);
assert.deepEqual(ids(tree[0].children), ["gui_filler_4"]);
assert.deepEqual(ids(tree[1].children), ["gui_horizontal_flow_2"]);

const removal = removeLayoutNode(tree, "gui_frame_1");
assert.equal(removal.changed, true);
assert.deepEqual(ids(removal.layoutChildren), ["gui_frame_3"]);

const variableNodeIds = collectWindowLuaVariableNodeIds({
  layoutChildren: [
    {
      id: "gui_frame_1",
      children: [
        {
          id: "gui_horizontal_flow_2",
          children: [
            {
              id: "gui_filler_4",
              children: []
            }
          ]
        }
      ]
    }
  ]
});
assert.ok(variableNodeIds.includes("gui_window"));
assert.ok(variableNodeIds.includes("gui_window_body"));
assert.ok(variableNodeIds.includes("gui_frame_1"));
assert.ok(variableNodeIds.includes("gui_filler_4"));
assert.equal(luaDefaultVariableName("1 invalid-name"), "_1_invalid_name");
assert.deepEqual(
  normalizeLuaVariableNames(
    {
      gui_window: "main_window",
      gui_window_body: "end",
      gui_frame_1: "main_window",
      gui_horizontal_flow_2: "main_controls",
      stale_node: "unused_name"
    },
    variableNodeIds
  ),
  {
    gui_window: "main_window",
    gui_horizontal_flow_2: "main_controls"
  }
);
assert.equal(
  validateLuaVariableNameEdit("gui_window_body", {
    nodeId: "gui_frame_1",
    nodeIds: variableNodeIds,
    luaVariableNames: {}
  }).ok,
  false
);
assert.equal(
  validateLuaVariableNameEdit("repeat", {
    nodeId: "gui_frame_1",
    nodeIds: variableNodeIds,
    luaVariableNames: {}
  }).ok,
  false
);
assert.deepEqual(
  validateLuaVariableNameEdit("", {
    nodeId: "gui_frame_1",
    nodeIds: variableNodeIds,
    luaVariableNames: { gui_frame_1: "main_frame" }
  }).luaVariableNames,
  {}
);

const model = createWindowModel({
  title: "Builder test",
  layoutSettings: {
    horizontalFlowSpacing: 10,
    horizontalFlowMinimumWidth: 220,
    nestedHorizontalFlowMinimumWidth: 120,
    horizontalFlowMinimumHeight: 80,
    horizontalFlowPadding: 12
  },
  layoutChildren: [
    {
      id: "gui_frame_1",
      atom: "frame",
      styleVariant: INSIDE_DEEP_FRAME_STYLE_VARIANT,
      size: {
        minimalWidth: 260,
        minimalHeight: 90
      },
      children: [
        {
          id: "gui_horizontal_flow_2",
          atom: "horizontal-flow",
          styleVariant: GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
          size: {
            minimalWidth: 310,
            minimalHeight: 88
          },
          children: [
            {
              id: "gui_frame_3",
              atom: "frame",
              styleVariant: INSIDE_DEEP_FRAME_STYLE_VARIANT,
              size: {
                minimalWidth: 180,
                minimalHeight: 99
              },
              children: []
            },
            {
              id: "gui_filler_4",
              atom: "filler",
              styleVariant: GENERIC_FILLER_STYLE_VARIANT,
              children: [
                {
                  id: "gui_frame_99",
                  atom: "frame",
                  styleVariant: INSIDE_DEEP_FRAME_STYLE_VARIANT,
                  children: []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "gui_filler_5",
      atom: "filler",
      styleVariant: GENERIC_FILLER_STYLE_VARIANT,
      children: []
    }
  ],
  luaVariableNames: {
    gui_window: "main_window",
    gui_window_titlebar: "window_header",
    gui_window_title: "window_heading",
    gui_window_drag_handle: "window_drag_space",
    gui_window_body: "content_body",
    gui_frame_1: "main_frame",
    gui_horizontal_flow_2: "main_controls",
    gui_frame_3: "nested_frame",
    gui_filler_4: "nested_spacer",
    gui_filler_5: "body_spacer"
  }
});
const titlebar = model.root.children[0];
const titleLabel = titlebar.children[0];
const dragHandle = titlebar.children[1];
const body = model.root.children[1];
assert.equal(model.root.luaVariableName, "main_window");
assert.equal(titlebar.luaVariableName, "window_header");
assert.equal(titleLabel.luaVariableName, "window_heading");
assert.equal(dragHandle.luaVariableName, "window_drag_space");
assert.equal(dragHandle.atom, "filler");
assert.equal(dragHandle.primitive, "empty-widget");
assert.equal(dragHandle.className, "agui::Filler");
assert.equal(dragHandle.style, "draggable_space_header");
assert.equal(dragHandle.styleDescription, "Part of frame definition");
assert.equal(dragHandle.derivedFrom, "draggable_space_header");
assert.deepEqual(dragHandle.referenceSize, {
  width: 486,
  height: 36,
  naturalHeight: 36
});
assert.equal(dragHandle.role, "header-filler");
assert.equal(dragHandle.styleReference.variantId, "draggable-space-header");
assert.equal(dragHandle.styleReference.baseStyle, "draggable_space");
assert.equal(dragHandle.styleReference.primitiveStyle, "empty_widget");
assert.equal(dragHandle.styleReference.graphicalSet, "redefined");
assert.equal(dragHandle.styleReference.leftMargin, 6);
assert.equal(dragHandle.styleReference.rightMargin, 6);
assert.equal(dragHandle.styleReference.horizontallyStretchable, true);
assert.equal(dragHandle.styleReference.verticallyStretchable, true);
assert.equal(dragHandle.styleReference.ignoredBySearch, true);
assert.equal(body.luaVariableName, "content_body");
assert.equal(body.children[0].id, "gui_frame_1");
assert.equal(body.children[0].luaVariableName, "main_frame");
assert.equal(body.children[0].primitive, "frame");
assert.equal(body.children[0].style, "inside_deep_frame");
assert.equal(body.children[0].role, "body-frame");
assert.equal(body.children[0].children[0].id, "gui_horizontal_flow_2");
assert.equal(body.children[0].children[0].luaVariableName, "main_controls");
assert.equal(body.children[0].children[0].children[0].id, "gui_frame_3");
assert.equal(body.children[0].children[0].children[0].luaVariableName, "nested_frame");
assert.equal(body.children[0].children[0].children[1].id, "gui_filler_4");
assert.equal(body.children[0].children[0].children[1].luaVariableName, "nested_spacer");
assert.equal(body.children[0].children[0].children[1].atom, "filler");
assert.equal(body.children[0].children[0].children[1].primitive, "empty-widget");
assert.equal(body.children[0].children[0].children[1].className, "agui::Filler");
assert.equal(body.children[0].children[0].children[1].style, "draggable_space");
assert.equal(body.children[0].children[0].children[1].styleDescription, "Editor-created Filler");
assert.equal(body.children[0].children[0].children[1].derivedFrom, "draggable_space");
assert.equal(body.children[0].children[0].children[1].role, "spacer");
assert.equal(body.children[0].children[0].children[1].styleReference.variantId, "draggable-space");
assert.equal(body.children[0].children[0].children[1].styleReference.baseStyle, "empty_widget");
assert.equal(
  body.children[0].children[0].children[1].styleReference.horizontallyStretchable,
  true
);
assert.equal(
  body.children[0].children[0].children[1].styleReference.verticallyStretchable,
  true
);
assert.equal(body.children[0].children[0].children[1].styleReference.ignoredByInteraction, true);
assert.deepEqual(body.children[0].children[0].children[1].children, []);
assert.equal(body.children[1].id, "gui_filler_5");
assert.equal(body.children[1].luaVariableName, "body_spacer");
assert.equal(body.children[1].primitive, "empty-widget");
assert.equal(body.styleReference.childMinimalWidth, 220);
assert.equal(body.styleReference.childMinimalHeight, 80);
assert.equal(body.styleReference.childHorizontalSpacing, 10);
assert.equal(body.styleReference.childLeftPadding, 12);
assert.equal(body.children[0].styleReference.minimalWidth, 260);
assert.equal(body.children[0].styleReference.minimalHeight, 90);
assert.equal(body.children[0].styleReference.leftPadding, 0);
assert.equal(body.children[0].children[0].styleReference.horizontalSpacing, 10);
assert.equal(body.children[0].children[0].styleReference.minimalWidth, 310);
assert.equal(body.children[0].children[0].styleReference.minimalHeight, 88);
assert.equal(body.children[0].children[0].styleReference.leftPadding, 12);
assert.equal(body.children[0].children[0].children[0].styleReference.minimalWidth, 180);
assert.equal(body.children[0].children[0].children[0].styleReference.minimalHeight, 99);

const normalizedSettings = normalizeLayoutSettings({
  horizontalFlowSpacing: -1,
  horizontalFlowMinimumWidth: 1000,
  nestedHorizontalFlowMinimumWidth: 24,
  horizontalFlowMinimumHeight: "not a number",
  horizontalFlowPadding: 100
});
assert.equal(normalizedSettings.horizontalFlowSpacing, 0);
assert.equal(normalizedSettings.horizontalFlowMinimumWidth, 800);
assert.equal(normalizedSettings.nestedHorizontalFlowMinimumWidth, 48);
assert.equal(normalizedSettings.horizontalFlowMinimumHeight, 72);
assert.equal(normalizedSettings.horizontalFlowPadding, 64);

const inspectorRows = getWindowInspectorRows(model);
assert.ok(inspectorRows.some((row) => row.id === "gui_frame_1"));
assert.ok(inspectorRows.some((row) => row.id === "gui_horizontal_flow_2"));
assert.ok(inspectorRows.some((row) => row.id === "gui_frame_3"));
assert.ok(inspectorRows.some((row) => row.id === "gui_filler_4"));
assert.ok(inspectorRows.some((row) => row.id === "gui_filler_5"));
const dragHandleInspectorRow = inspectorRows.find((row) => row.id === "gui_window_drag_handle");
assert.equal(dragHandleInspectorRow.title, "class agui::Filler");
assert.equal(dragHandleInspectorRow.style, "Part of frame definition");
assert.equal(dragHandleInspectorRow.derivedFrom, "draggable_space_header");
assert.equal(dragHandleInspectorRow.relative, "[152, 0]");
assert.equal(dragHandleInspectorRow.size, "{486, 36}");
assert.equal(dragHandleInspectorRow.contentSize, "{486, 36}");
assert.equal(dragHandleInspectorRow.clipSize, "{{0, 0}, {486, 36}}");
assert.equal(dragHandleInspectorRow.sizeBeforeStretching, "{0, 36}");
assert.equal(dragHandleInspectorRow.maximumHorizontalSquashSize, 486);
assert.equal(dragHandleInspectorRow.maximumVerticalSquashSize, 0);
assert.equal(propertyValue(dragHandleInspectorRow, "right_margin"), 6);
assert.equal(propertyValue(dragHandleInspectorRow, "height"), 36);
assert.equal(propertyValue(dragHandleInspectorRow, "natural_height"), 36);
assert.equal(propertyValue(dragHandleInspectorRow, "horizontally_stretchable"), "on");
assert.equal(propertyValue(dragHandleInspectorRow, "vertically_stretchable"), "on");
assert.equal(propertyValue(dragHandleInspectorRow, "left_margin"), 6);
assert.equal(propertyValue(dragHandleInspectorRow, "graphical_set"), "redefined");
assert.equal(propertyValue(dragHandleInspectorRow, "ignored_by_search"), true);
const bodyInspectorRow = inspectorRows.find((row) => row.id === "gui_window_body");
const rootFrameChildRow = bodyInspectorRow.childRows.find(
  (row) => row.targetId === "gui_frame_1"
);
assert.equal(rootFrameChildRow.value, "frame");
const rootFrameInspectorRow = inspectorRows.find((row) => row.id === "gui_frame_1");
assert.ok(
  rootFrameInspectorRow.properties.some(
    (property) => property.label === "minimal_width" && property.value === 260
  )
);
assert.equal(
  inspectorRows.some((row) =>
    (row.properties ?? []).some((property) => property.label === "lua_variable_name")
  ),
  false,
  "Lua variable names are edited in the component tree, not the Ctrl+F6-style inspector"
);
const nestedFlowChildRow = rootFrameInspectorRow.childRows.find(
  (row) => row.targetId === "gui_horizontal_flow_2"
);
assert.equal(nestedFlowChildRow.value, "flow.horizontal");
const nestedFlowInspectorRow = inspectorRows.find((row) => row.id === "gui_horizontal_flow_2");
const authoredFillerChildRow = nestedFlowInspectorRow.childRows.find(
  (row) => row.targetId === "gui_filler_4"
);
assert.equal(authoredFillerChildRow.value, "empty-widget");
const authoredFillerInspectorRow = inspectorRows.find((row) => row.id === "gui_filler_4");
assert.equal(authoredFillerInspectorRow.title, "class agui::Filler");
assert.equal(authoredFillerInspectorRow.style, "Editor-created Filler");
assert.equal(authoredFillerInspectorRow.derivedFrom, "draggable_space");
assert.equal(propertyValue(authoredFillerInspectorRow, "horizontally_stretchable"), "on");
assert.equal(propertyValue(authoredFillerInspectorRow, "vertically_stretchable"), "on");
assert.equal(propertyValue(authoredFillerInspectorRow, "ignored_by_interaction"), true);

const lua = renderWindowLua(model);
assert.ok(lua.includes('name = "gui_frame_1"'));
assert.ok(lua.includes('name = "gui_horizontal_flow_2"'));
assert.ok(lua.includes('name = "gui_filler_4"'));
assert.ok(lua.includes('name = "gui_filler_5"'));
assert.ok(lua.includes('type = "frame"'));
assert.ok(lua.includes('style = "inside_deep_frame"'));
assert.ok(lua.includes("if screen.gui_window then"));
assert.ok(lua.includes("local main_window = screen.add{"));
assert.ok(lua.includes("local window_drag_space = window_header.add{"));
assert.ok(lua.includes('type = "empty-widget"'));
assert.ok(lua.includes('style = "draggable_space_header"'));
assert.ok(lua.includes("window_drag_space.style.left_margin = 6"));
assert.ok(lua.includes("window_drag_space.style.right_margin = 6"));
assert.ok(lua.includes("window_drag_space.style.height = 36"));
assert.ok(lua.includes("window_drag_space.style.horizontally_stretchable = true"));
assert.ok(lua.includes("window_drag_space.style.vertically_stretchable = true"));
assert.ok(lua.includes("window_drag_space.drag_target = main_window"));
assert.ok(lua.includes("local main_frame = content_body.add{"));
assert.ok(lua.includes("local main_controls = main_frame.add{"));
assert.ok(lua.includes("main_frame.style.minimal_width = 260"));
assert.ok(lua.includes("main_frame.style.minimal_height = 90"));
assert.ok(lua.includes("main_frame.style.horizontally_stretchable = true"));
assert.ok(lua.includes("main_controls.style.minimal_width = 310"));
assert.ok(lua.includes("main_controls.style.minimal_height = 88"));
assert.ok(lua.includes("main_controls.style.horizontal_spacing = 10"));
assert.ok(lua.includes("main_controls.style.left_padding = 12"));
assert.ok(lua.includes("nested_frame.style.minimal_width = 180"));
assert.ok(lua.includes("nested_frame.style.minimal_height = 99"));
assert.ok(lua.includes("local nested_spacer = main_controls.add{"));
assert.ok(lua.includes("local body_spacer = content_body.add{"));
assert.ok(lua.includes('type = "empty-widget"'));
assert.ok(lua.includes("ignored_by_interaction = true"));
assert.ok(lua.includes('style = "draggable_space"'));
assert.ok(lua.includes("nested_spacer.style.horizontally_stretchable = true"));
assert.ok(lua.includes("nested_spacer.style.vertically_stretchable = true"));
assert.ok(lua.includes("body_spacer.style.horizontally_stretchable = true"));
assert.ok(
  lua.indexOf('name = "gui_frame_1"') <
    lua.indexOf('name = "gui_horizontal_flow_2"')
);

const fillerAtom = factorioAtomRegistry.find((atom) => atom.id === "filler");
assert.equal(fillerAtom.primitive, "empty-widget");
assert.equal(fillerAtom.style, "empty_widget");
assert.equal(fillerAtom.derivedFrom, "empty_widget");
assert.ok(
  fillerAtom.fields.some(
    (field) =>
      field.name === "style variants" &&
      field.note.includes("draggable_space_header") &&
      field.note.includes("draggable_space")
  )
);
assert.ok(
  fillerAtom.captures.some(
    (capture) => capture.id === "blueprint-library-header-filler"
  )
);
assert.ok(
  fillerAtom.captures.some(
    (capture) => capture.id === "tips-and-tricks-header-filler"
  )
);
assert.ok(
  fillerAtom.tracking.implemented.some((entry) =>
    entry.includes("Authored Filler palette support")
  )
);

const modelSchemaDoc = readFileSync(
  new URL("../docs/model-schema.md", import.meta.url),
  "utf8"
);
assert.ok(
  modelSchemaDoc.includes("Filler maps to the official Factorio `empty-widget` primitive")
);
assert.ok(modelSchemaDoc.includes("role: header-filler"));
assert.ok(modelSchemaDoc.includes("generic stretch"));
assert.ok(modelSchemaDoc.includes("pusher/spacer"));
const styleSourcesDoc = readFileSync(
  new URL("../docs/factorio-style-sources.md", import.meta.url),
  "utf8"
);
assert.ok(styleSourcesDoc.includes("RedMew has separate helper paths"));
assert.ok(styleSourcesDoc.includes("`draggable_space` is a generic spacer"));
const atomSpecsDoc = readFileSync(
  new URL("../docs/atom-specs.md", import.meta.url),
  "utf8"
);
assert.ok(atomSpecsDoc.includes("| Builder availability |"));
assert.ok(atomSpecsDoc.includes("Decide builder availability explicitly"));

const modFiles = renderFactorioModFiles(model);
assert.deepEqual(Object.keys(modFiles), ["info.json", "control.lua", "gui.lua"]);
assert.equal(modFiles["gui.lua"], lua);
const modInfo = JSON.parse(modFiles["info.json"]);
assert.equal(modInfo.name, FACTORIO_PREVIEW_MOD_NAME);
assert.equal(modInfo.version, FACTORIO_PREVIEW_MOD_VERSION);
assert.equal(modInfo.factorio_version, "2.0");
assert.deepEqual(modInfo.dependencies, ["base"]);
assert.ok(modFiles["control.lua"].includes('local build_gui = require("gui")'));
assert.ok(modFiles["control.lua"].includes("script.on_init(rebuild_all_players)"));
assert.ok(
  modFiles["control.lua"].includes("script.on_configuration_changed(rebuild_all_players)")
);
assert.ok(modFiles["control.lua"].includes("defines.events.on_player_created"));
assert.ok(modFiles["control.lua"].includes("defines.events.on_player_joined_game"));

const modZip = createFactorioModZipData(model);
assert.deepEqual(modZip, createFactorioModZipData(model));
assert.equal(FACTORIO_PREVIEW_MOD_ZIP_FILENAME, `${FACTORIO_PREVIEW_MOD_FOLDER}.zip`);
const modZipEntries = unzipSync(modZip);
assert.deepEqual(Object.keys(modZipEntries).sort(), [
  `${FACTORIO_PREVIEW_MOD_FOLDER}/control.lua`,
  `${FACTORIO_PREVIEW_MOD_FOLDER}/gui.lua`,
  `${FACTORIO_PREVIEW_MOD_FOLDER}/info.json`
]);
assert.equal(strFromU8(modZipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/gui.lua`]), lua);
assert.equal(
  strFromU8(modZipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/control.lua`]),
  modFiles["control.lua"]
);
assert.equal(
  strFromU8(modZipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/info.json`]),
  modFiles["info.json"]
);

const movedVariableNames = normalizeLuaVariableNames(
  {
    gui_frame_1: "main_frame",
    gui_horizontal_flow_2: "main_controls",
    gui_frame_3: "nested_frame"
  },
  collectWindowLuaVariableNodeIds({ layoutChildren: movement.layoutChildren })
);
assert.equal(movedVariableNames.gui_horizontal_flow_2, "main_controls");
const prunedVariableNames = normalizeLuaVariableNames(
  movedVariableNames,
  collectWindowLuaVariableNodeIds({ layoutChildren: removal.layoutChildren })
);
assert.deepEqual(prunedVariableNames, {
  gui_horizontal_flow_2: "main_controls",
  gui_frame_3: "nested_frame"
});

const verticalBodyModel = createWindowModel({
  title: "Vertical body",
  bodyDirection: VERTICAL_FLOW_DIRECTION,
  layoutChildren: [
    {
      id: "gui_frame_1",
      atom: "frame",
      styleVariant: INSIDE_DEEP_FRAME_STYLE_VARIANT,
      children: []
    }
  ]
});
const verticalBody = verticalBodyModel.root.children[1];
assert.equal(verticalBody.id, BODY_LAYOUT_ROOT_ID);
assert.equal(verticalBody.className, "agui::VerticalFlow");
assert.equal(verticalBody.direction, VERTICAL_FLOW_DIRECTION);
assert.equal(verticalBody.style, "inside_deep_frame");
assert.equal(verticalBody.styleReference.verticalSpacing, 18);
assert.equal(verticalBody.children[0].id, "gui_frame_1");
const verticalLua = renderWindowLua(verticalBodyModel);
assert.ok(verticalLua.includes('name = "gui_window_body"'));
assert.ok(verticalLua.includes('direction = "vertical"'));
assert.ok(verticalLua.includes('style = "inside_deep_frame"'));
assert.ok(verticalLua.includes("gui_window_body.style.vertical_spacing = 18"));
assert.ok(verticalLua.includes('name = "gui_frame_1"'));

console.log("Layout tree checks passed.");

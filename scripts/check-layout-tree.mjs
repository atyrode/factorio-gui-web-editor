#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  BODY_LAYOUT_ROOT_ID,
  FRAME_ATOM_ID,
  INSIDE_DEEP_FRAME_STYLE_VARIANT,
  GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
  HORIZONTAL_FLOW_ATOM_ID,
  canDropLayoutNode,
  createFrameSpec,
  createHorizontalFlowSpec,
  insertLayoutNode,
  moveLayoutNode,
  normalizeLayoutState,
  removeLayoutNode
} from "../src/factorioLayoutTree.js";
import {
  createWindowModel,
  getWindowInspectorRows,
  normalizeLayoutSettings,
  VERTICAL_FLOW_DIRECTION
} from "../src/factorioModel.js";
import { renderWindowLua } from "../src/factorioExport.js";

function ids(nodes) {
  return nodes.map((node) => node.id);
}

function firstChild(nodes) {
  assert.equal(nodes.length, 1);
  return nodes[0];
}

const empty = normalizeLayoutState({});
assert.deepEqual(empty.layoutChildren, []);
assert.equal(empty.nextLayoutNodeNumber, 1);

const normalized = normalizeLayoutState({
  nextLayoutNodeNumber: 1,
  layoutChildren: [
    {
      id: "gui_horizontal_flow_7",
      atom: "horizontal-flow",
      styleVariant: "legacy",
      children: [
        {
          id: "not-valid",
          atom: "horizontal-flow",
          children: []
        },
        {
          id: "gui_horizontal_flow_7",
          atom: "horizontal-flow",
          children: []
        },
        {
          id: "ignored_label",
          atom: "label",
          children: []
        }
      ]
    }
  ]
});
assert.equal(normalized.layoutChildren[0].id, "gui_frame_1");
assert.equal(normalized.layoutChildren[0].atom, FRAME_ATOM_ID);
assert.equal(normalized.layoutChildren[0].styleVariant, INSIDE_DEEP_FRAME_STYLE_VARIANT);
assert.equal(normalized.layoutChildren[0].children.length, 2);
assert.equal(normalized.layoutChildren[0].children[0].atom, HORIZONTAL_FLOW_ATOM_ID);
assert.equal(normalized.layoutChildren[0].children[1].id, "gui_horizontal_flow_7");
assert.equal(normalized.nextLayoutNodeNumber, 8);

const frame1 = createFrameSpec(1);
const flow2 = createHorizontalFlowSpec(2);
const frame3 = createFrameSpec(3);
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

assert.equal(canDropLayoutNode(tree, "gui_frame_1", "gui_frame_1"), false);
assert.equal(canDropLayoutNode(tree, "gui_frame_1", "gui_horizontal_flow_2"), false);
assert.equal(canDropLayoutNode(tree, "gui_frame_3", BODY_LAYOUT_ROOT_ID), true);
assert.equal(canDropLayoutNode(tree, "gui_horizontal_flow_2", BODY_LAYOUT_ROOT_ID), false);

let movement = moveLayoutNode(tree, "gui_frame_3", BODY_LAYOUT_ROOT_ID, 1);
assert.equal(movement.changed, true);
tree = movement.layoutChildren;
assert.deepEqual(ids(tree), ["gui_frame_1", "gui_frame_3"]);
assert.deepEqual(ids(tree[0].children), ["gui_horizontal_flow_2"]);

movement = moveLayoutNode(tree, "gui_horizontal_flow_2", "gui_frame_3", 0);
assert.equal(movement.changed, true);
tree = movement.layoutChildren;
assert.deepEqual(ids(tree), ["gui_frame_1", "gui_frame_3"]);
assert.deepEqual(ids(tree[1].children), ["gui_horizontal_flow_2"]);

const removal = removeLayoutNode(tree, "gui_frame_1");
assert.equal(removal.changed, true);
assert.deepEqual(ids(removal.layoutChildren), ["gui_frame_3"]);

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
      children: [
        {
          id: "gui_horizontal_flow_2",
          atom: "horizontal-flow",
          styleVariant: GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
          children: [
            {
              id: "gui_frame_3",
              atom: "frame",
              styleVariant: INSIDE_DEEP_FRAME_STYLE_VARIANT,
              children: []
            }
          ]
        }
      ]
    }
  ]
});
const body = model.root.children[1];
assert.equal(body.children[0].id, "gui_frame_1");
assert.equal(body.children[0].primitive, "frame");
assert.equal(body.children[0].style, "inside_deep_frame");
assert.equal(body.children[0].role, "body-frame");
assert.equal(body.children[0].children[0].id, "gui_horizontal_flow_2");
assert.equal(body.children[0].children[0].children[0].id, "gui_frame_3");
assert.equal(body.styleReference.childMinimalWidth, 220);
assert.equal(body.styleReference.childMinimalHeight, 80);
assert.equal(body.styleReference.childHorizontalSpacing, 10);
assert.equal(body.styleReference.childLeftPadding, 12);
assert.equal(body.children[0].styleReference.minimalWidth, 220);
assert.equal(body.children[0].styleReference.minimalHeight, 80);
assert.equal(body.children[0].styleReference.leftPadding, 0);
assert.equal(body.children[0].children[0].styleReference.horizontalSpacing, 10);
assert.equal(body.children[0].children[0].styleReference.leftPadding, 12);
assert.equal(body.children[0].children[0].children[0].styleReference.minimalWidth, 120);

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
const bodyInspectorRow = inspectorRows.find((row) => row.id === "gui_window_body");
const rootFrameChildRow = bodyInspectorRow.childRows.find(
  (row) => row.targetId === "gui_frame_1"
);
assert.equal(rootFrameChildRow.value, "frame");
const rootFrameInspectorRow = inspectorRows.find((row) => row.id === "gui_frame_1");
const nestedFlowChildRow = rootFrameInspectorRow.childRows.find(
  (row) => row.targetId === "gui_horizontal_flow_2"
);
assert.equal(nestedFlowChildRow.value, "flow.horizontal");

const lua = renderWindowLua(model);
assert.ok(lua.includes('name = "gui_frame_1"'));
assert.ok(lua.includes('name = "gui_horizontal_flow_2"'));
assert.ok(lua.includes('type = "frame"'));
assert.ok(lua.includes('style = "inside_deep_frame"'));
assert.ok(lua.includes("gui_frame_1.style.minimal_width = 220"));
assert.ok(lua.includes("gui_frame_1.style.minimal_height = 80"));
assert.ok(lua.includes("gui_frame_1.style.horizontally_stretchable = true"));
assert.ok(lua.includes("gui_horizontal_flow_2.style.horizontal_spacing = 10"));
assert.ok(lua.includes("gui_horizontal_flow_2.style.left_padding = 12"));
assert.ok(lua.includes("gui_frame_3.style.minimal_width = 120"));
assert.ok(
  lua.indexOf('name = "gui_frame_1"') <
    lua.indexOf('name = "gui_horizontal_flow_2"')
);

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
assert.equal(verticalBody.children[0].id, "gui_frame_1");
const verticalLua = renderWindowLua(verticalBodyModel);
assert.ok(verticalLua.includes('name = "gui_window_body"'));
assert.ok(verticalLua.includes('direction = "vertical"'));
assert.ok(verticalLua.includes('style = "inside_deep_frame"'));
assert.ok(verticalLua.includes('name = "gui_frame_1"'));

console.log("Layout tree checks passed.");

#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  BODY_LAYOUT_ROOT_ID,
  GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
  canDropLayoutNode,
  createHorizontalFlowSpec,
  insertLayoutNode,
  moveLayoutNode,
  normalizeLayoutState,
  removeLayoutNode
} from "../src/factorioLayoutTree.js";
import {
  createWindowModel,
  getWindowInspectorRows,
  normalizeLayoutSettings
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
assert.equal(normalized.layoutChildren[0].id, "gui_horizontal_flow_7");
assert.equal(normalized.layoutChildren[0].styleVariant, GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT);
assert.equal(normalized.layoutChildren[0].children.length, 2);
assert.equal(normalized.nextLayoutNodeNumber, 10);

const flow1 = createHorizontalFlowSpec(1);
const flow2 = createHorizontalFlowSpec(2);
const flow3 = createHorizontalFlowSpec(3);
let tree = [];

let insertion = insertLayoutNode(tree, BODY_LAYOUT_ROOT_ID, 0, flow1);
assert.equal(insertion.changed, true);
tree = insertion.layoutChildren;
assert.deepEqual(ids(tree), ["gui_horizontal_flow_1"]);

insertion = insertLayoutNode(tree, "gui_horizontal_flow_1", 0, flow2);
assert.equal(insertion.changed, true);
tree = insertion.layoutChildren;
assert.deepEqual(ids(firstChild(tree).children), ["gui_horizontal_flow_2"]);

insertion = insertLayoutNode(tree, BODY_LAYOUT_ROOT_ID, 1, flow3);
assert.equal(insertion.changed, true);
tree = insertion.layoutChildren;
assert.deepEqual(ids(tree), ["gui_horizontal_flow_1", "gui_horizontal_flow_3"]);

assert.equal(canDropLayoutNode(tree, "gui_horizontal_flow_1", "gui_horizontal_flow_1"), false);
assert.equal(canDropLayoutNode(tree, "gui_horizontal_flow_1", "gui_horizontal_flow_2"), false);
assert.equal(canDropLayoutNode(tree, "gui_horizontal_flow_3", "gui_horizontal_flow_1"), true);

let movement = moveLayoutNode(tree, "gui_horizontal_flow_3", "gui_horizontal_flow_1", 1);
assert.equal(movement.changed, true);
tree = movement.layoutChildren;
assert.deepEqual(ids(firstChild(tree).children), [
  "gui_horizontal_flow_2",
  "gui_horizontal_flow_3"
]);

movement = moveLayoutNode(tree, "gui_horizontal_flow_2", BODY_LAYOUT_ROOT_ID, 0);
assert.equal(movement.changed, true);
tree = movement.layoutChildren;
assert.deepEqual(ids(tree), ["gui_horizontal_flow_2", "gui_horizontal_flow_1"]);
assert.deepEqual(ids(tree[1].children), ["gui_horizontal_flow_3"]);

const removal = removeLayoutNode(tree, "gui_horizontal_flow_1");
assert.equal(removal.changed, true);
assert.deepEqual(ids(removal.layoutChildren), ["gui_horizontal_flow_2"]);

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
      id: "gui_horizontal_flow_1",
      atom: "horizontal-flow",
      styleVariant: GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
      children: [
        {
          id: "gui_horizontal_flow_2",
          atom: "horizontal-flow",
          styleVariant: GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
          children: []
        }
      ]
    }
  ]
});
const body = model.root.children[1];
assert.equal(body.children[0].id, "gui_horizontal_flow_1");
assert.equal(body.children[0].children[0].id, "gui_horizontal_flow_2");
assert.equal(body.styleReference.childMinimalWidth, 220);
assert.equal(body.styleReference.childMinimalHeight, 80);
assert.equal(body.styleReference.childHorizontalSpacing, 10);
assert.equal(body.styleReference.childLeftPadding, 12);
assert.equal(body.children[0].styleReference.horizontalSpacing, 10);
assert.equal(body.children[0].styleReference.minimalWidth, 220);
assert.equal(body.children[0].styleReference.minimalHeight, 80);
assert.equal(body.children[0].styleReference.leftPadding, 12);
assert.equal(body.children[0].styleReference.childMinimalHeight, 80);
assert.equal(body.children[0].styleReference.childHorizontalSpacing, 10);
assert.equal(body.children[0].styleReference.childLeftPadding, 12);
assert.equal(body.children[0].children[0].styleReference.minimalWidth, 120);

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
assert.ok(inspectorRows.some((row) => row.id === "gui_horizontal_flow_1"));
assert.ok(inspectorRows.some((row) => row.id === "gui_horizontal_flow_2"));

const lua = renderWindowLua(model);
assert.ok(lua.includes('name = "gui_horizontal_flow_1"'));
assert.ok(lua.includes('name = "gui_horizontal_flow_2"'));
assert.ok(lua.includes("gui_horizontal_flow_1.style.horizontal_spacing = 10"));
assert.ok(lua.includes("gui_horizontal_flow_1.style.minimal_width = 220"));
assert.ok(lua.includes("gui_horizontal_flow_1.style.minimal_height = 80"));
assert.ok(lua.includes("gui_horizontal_flow_1.style.left_padding = 12"));
assert.ok(lua.includes("gui_horizontal_flow_1.style.horizontally_stretchable = true"));
assert.ok(lua.includes("gui_horizontal_flow_2.style.minimal_width = 120"));
assert.ok(
  lua.indexOf('name = "gui_horizontal_flow_1"') <
    lua.indexOf('name = "gui_horizontal_flow_2"')
);

console.log("Layout tree checks passed.");

#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createWindowModel,
  frameStyleVariants,
  horizontalFlowStyleVariants,
  labelStyleVariants
} from "../src/factorioModel.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const catalogPath = join(ROOT, "src/generated/factorioStyleCatalog.generated.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const REQUIRED_STYLES = Object.freeze([
  "label",
  "frame_title",
  "caption_label",
  "heading_2_label",
  "subheader_caption_label",
  "clickable_label",
  "empty_widget",
  "draggable_space",
  "draggable_space_header",
  "frame",
  "inside_deep_frame",
  "inset_frame_container_frame",
  "horizontal_flow",
  "vertical_flow",
  "frame_header_flow",
  "inset_frame_container_horizontal_flow"
]);

const FORBIDDEN_KEYS = Object.freeze(new Set([
  "filename",
  "position",
  "graphical_set",
  "sprite",
  "sound",
  "base",
  "shadow",
  "corner_size",
  "draw_type"
]));

function walkForForbiddenAssetKeys(value, path = "catalog") {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkForForbiddenAssetKeys(entry, `${path}[${index}]`));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    assert.equal(
      FORBIDDEN_KEYS.has(key),
      false,
      `catalog must not contain asset-bearing key ${path}.${key}`
    );
    walkForForbiddenAssetKeys(entry, `${path}.${key}`);
  }
}

function style(styleName) {
  const entry = catalog.styles[styleName];
  assert.ok(entry, `missing style catalog entry: ${styleName}`);
  return entry;
}

function assertStyleType(styleName, expectedType) {
  assert.equal(style(styleName).declared.type, expectedType, `${styleName} type`);
}

function assertStyleParent(styleName, expectedParent) {
  assert.equal(style(styleName).declared.parent ?? null, expectedParent, `${styleName} parent`);
}

function colorParts(value) {
  assert.equal(typeof value, "string");
  assert.equal(value.startsWith("{"), true, `color must use Lua-ish braces: ${value}`);
  return value.slice(1, -1).split(",").map((part) => Number(part.trim()));
}

function assertColorEqual(actual, expected, message) {
  const actualParts = colorParts(actual);
  const expectedParts = colorParts(expected);
  assert.equal(actualParts.length, expectedParts.length, message);
  actualParts.forEach((actualPart, index) => {
    assert.ok(
      Math.abs(actualPart - expectedParts[index]) < 0.000001,
      `${message}: component ${index} expected ${expectedParts[index]} got ${actualPart}`
    );
  });
}

function assertFieldEqual(actual, expected, message) {
  if (typeof actual === "string" && actual.startsWith("{")) {
    assertColorEqual(actual, expected, message);
    return;
  }
  assert.equal(actual, expected, message);
}

function assertResolvedFields(styleName, expectedFields) {
  const fields = style(styleName).resolvedFields ?? {};
  for (const [fieldName, expectedValue] of Object.entries(expectedFields)) {
    assertFieldEqual(fields[fieldName], expectedValue, `${styleName}.${fieldName}`);
  }
}

function assertLabelVariantMatchesCatalog(variant, options = {}) {
  const catalogStyle = style(variant.style);
  assert.equal(catalogStyle.declared.type, "label_style", `${variant.style} type`);
  if (options.parent !== undefined) {
    assert.equal(variant.parent ?? null, options.parent, `${variant.style} model parent`);
    assert.equal(catalogStyle.declared.parent ?? null, options.parent, `${variant.style} catalog parent`);
  }
  assertResolvedFields(variant.style, options.fields ?? {});
}

assert.equal(catalog.schema, "factorio-style-catalog.v0");
assert.equal(catalog.source.kind, "factorio-dump-data");
assert.equal(catalog.source.factorioVersion, "2.0.76");
assert.deepEqual(catalog.source.activeMods, ["base", "elevated-rails", "quality", "space-age"]);
assert.equal(catalog.selectedStyleCount, REQUIRED_STYLES.length);
assert.ok(catalog.totalStyleCount >= REQUIRED_STYLES.length);

for (const styleName of REQUIRED_STYLES) {
  style(styleName);
}
walkForForbiddenAssetKeys(catalog);

assertLabelVariantMatchesCatalog(labelStyleVariants.base, {
  fields: {
    font: "default",
    fontColor: "{1, 1, 1}",
    disabledFontColor: "{1, 1, 1, 0.5}",
    parentHoveredFontColor: "{0, 0, 0}",
    richTextSetting: "enabled",
    gameControllerHoveredFontColor: "{1, 0.68, 0}",
    singleLine: true
  }
});
assertLabelVariantMatchesCatalog(labelStyleVariants.frameTitle, {
  parent: "label",
  fields: {
    font: "heading-1",
    fontColor: "{1, 0.901961, 0.752941}",
    singleLine: true
  }
});
assertLabelVariantMatchesCatalog(labelStyleVariants.caption, {
  parent: "bold_label",
  fields: {
    font: "default-bold",
    fontColor: "{1, 0.901961, 0.752941}",
    ignoredBySearch: true,
    singleLine: true
  }
});
assertLabelVariantMatchesCatalog(labelStyleVariants.heading2, {
  parent: "label",
  fields: {
    font: "heading-2",
    fontColor: "{1, 0.901961, 0.752941}",
    singleLine: true
  }
});
assertLabelVariantMatchesCatalog(labelStyleVariants.subheaderCaption, {
  parent: "heading_2_label",
  fields: {
    font: "heading-2",
    fontColor: "{1, 0.901961, 0.752941}",
    leftPadding: 8,
    singleLine: true
  }
});
assertLabelVariantMatchesCatalog(labelStyleVariants.clickable, {
  fields: {
    hoveredFontColor: "{1, 0.74, 0.4}",
    clickedFontColor: "{0.98, 0.66, 0.22}"
  }
});

assertStyleType("empty_widget", "empty_widget_style");
assertStyleType("draggable_space", "empty_widget_style");
assertStyleType("draggable_space_header", "empty_widget_style");
assertStyleParent("draggable_space_header", "draggable_space");

assertStyleType(frameStyleVariants.insideDeepFrame.style, "frame_style");
assertStyleParent(frameStyleVariants.insideDeepFrame.style, "frame");
assertResolvedFields(frameStyleVariants.insideDeepFrame.style, { padding: 0 });
assert.equal(
  style(frameStyleVariants.insideDeepFrame.style)
    .declared.childStyles.verticalFlowStyle.declared.fields.verticalSpacing,
  0
);

assertStyleType(horizontalFlowStyleVariants.generic.style, "horizontal_flow_style");
assertStyleType(horizontalFlowStyleVariants.frameHeader.style, "horizontal_flow_style");
assertStyleType(horizontalFlowStyleVariants.insetFrameContainer.style, "horizontal_flow_style");
assertResolvedFields("horizontal_flow", { horizontalSpacing: 4 });
assertResolvedFields("frame_header_flow", {
  horizontalSpacing: 8,
  bottomPadding: 4,
  horizontallyStretchable: true,
  ignoredBySearch: true
});
assertResolvedFields("inset_frame_container_horizontal_flow", { horizontalSpacing: 12 });

const windowModel = createWindowModel();
const titlebar = windowModel.root.children[0];
const titleLabel = titlebar.children[0];
const dragHandle = titlebar.children[1];
const body = windowModel.root.children[1];

assert.ok(style(windowModel.root.style));
assert.ok(style(titlebar.style));
assert.ok(style(titleLabel.style));
assert.ok(style(dragHandle.style));
assert.ok(style(body.style));

// The model's captured numeric spacing is browser/in-game evidence at the
// captured UI scale. Prototype catalog values are unscaled declared facts, so
// this check validates style identity and source-backed facts, not visual
// geometry such as rendered size, clip size, shadows, or scaled margins.
console.log("Style catalog checks passed.");

#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/factorio-atoms.css", import.meta.url), "utf8");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleFor(selector) {
  const match = css.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, "m"));
  return match?.[1] ?? null;
}

function declaration(rule, property) {
  const match = rule?.match(new RegExp(`(?:^|;)\\s*${escapeRegExp(property)}\\s*:\\s*([^;]+);`, "m"));
  return match?.[1]?.trim() ?? null;
}

function pxBasis(value, minimumWidth) {
  if (value === "0" || value === "0px") {
    return 0;
  }
  if (value?.includes("--fx-horizontal-flow-child-min-width")) {
    return minimumWidth;
  }
  if (value?.endsWith("px")) {
    return Number.parseFloat(value);
  }
  throw new Error(`unsupported flex-basis in hover/drop geometry test: ${value}`);
}

function flexWidths({ parentWidth, gap, minimumWidth, previewBasis }) {
  const availableWidth = parentWidth - gap;
  const existingBasis = 0;
  const totalBasis = existingBasis + previewBasis;
  const freeWidth = availableWidth - totalBasis;
  const previewWidth = previewBasis + freeWidth / 2;
  const existingWidth = existingBasis + freeWidth / 2;

  return {
    preview: Math.max(minimumWidth, previewWidth),
    existing: Math.max(minimumWidth, existingWidth)
  };
}

const realFlowRule = ruleFor(".fx-gui-horizontal-flow");
const previewRule = ruleFor(".fx-gui-flow-drop-preview-slot.is-expanded");
const targetedDropRule = ruleFor(".fx-gui-flow-drop-target.is-targeted");

assert.equal(
  declaration(realFlowRule, "flex"),
  "1 1 0",
  "real Horizontal Flow sizing contract changed; update hover/drop preview tests with the new model"
);
assert.equal(
  declaration(previewRule, "flex-grow"),
  "1",
  "hover preview must grow like the future Horizontal Flow"
);
assert.equal(
  declaration(previewRule, "flex-shrink"),
  "1",
  "hover preview must shrink like the future Horizontal Flow"
);
assert.equal(
  declaration(previewRule, "flex-basis"),
  "0",
  "hover preview must not add a nonzero base width before flex distribution"
);
assert.equal(
  declaration(previewRule, "min-width"),
  "var(--fx-horizontal-flow-child-min-width, 168px)",
  "hover preview must use the parent-provided child minimum width"
);
assert.equal(
  declaration(targetedDropRule, "background"),
  "transparent",
  "drop hit targets are collision geometry and must not paint over previews"
);

for (const selector of [
  ".fx-gui-flow-drop-preview-slot.is-start-edge::before",
  ".fx-gui-flow-drop-preview-slot.is-end-edge::before",
  ".fx-gui-flow-drop-preview-slot.is-middle::before"
]) {
  assert.equal(
    ruleFor(selector),
    null,
    `${selector} must not extend preview paint into Factorio spacing gaps`
  );
}

const minimumWidth = 168;
const widths = flexWidths({
  parentWidth: 1000,
  gap: 6,
  minimumWidth,
  previewBasis: pxBasis(declaration(previewRule, "flex-basis"), minimumWidth)
});

assert.equal(
  Math.round(widths.preview),
  Math.round(widths.existing),
  "one-flow insert-left hover preview must split width exactly like the final two-flow layout"
);

console.log("Hover/drop geometry checks passed.");

#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/factorio-atoms.css", import.meta.url), "utf8");
const guiSource = readFileSync(
  new URL("../src/components/factorioGui.jsx", import.meta.url),
  "utf8"
);

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
const realFrameRule = ruleFor(".fx-gui-frame");
const bodyRule = ruleFor(".fx-gui-window__body");
const previewRule = ruleFor(".fx-gui-flow-drop-preview-slot.is-expanded");
const previewFrameRule = ruleFor(".fx-gui-frame.fx-gui-flow-drop-preview-slot.is-expanded");
const targetedDropRule = ruleFor(".fx-gui-flow-drop-target.is-targeted");

assert.equal(
  declaration(realFlowRule, "flex"),
  "1 1 0",
  "real Horizontal Flow sizing contract changed; update hover/drop preview tests with the new model"
);
assert.match(
  declaration(realFlowRule, "background"),
  /transparent/,
  "real Horizontal Flow must remain a layout container, not the visible body Frame skin"
);
assert.equal(
  declaration(realFlowRule, "box-shadow"),
  "none",
  "real Horizontal Flow must not paint the inset Frame surface"
);
assert.equal(
  declaration(realFrameRule, "flex"),
  "1 1 0",
  "real Frame sizing contract changed; update hover/drop preview tests with the new model"
);
assert.match(
  declaration(realFrameRule, "box-shadow"),
  /inset 0 4px 4px -1px/,
  "real Frame must paint the inset child surface inside its parent flow"
);
assert.doesNotMatch(
  declaration(realFrameRule, "box-shadow"),
  /1px 1px 0/,
  "real Frame must not use the old raised bottom/right drop shadow"
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
  declaration(previewFrameRule, "min-width"),
  "var(--fx-gui-frame-min-width, 168px)",
  "hover preview must use the same Frame min-width variable as a real Frame"
);
assert.equal(
  declaration(targetedDropRule, "background"),
  "transparent",
  "drop hit targets are collision geometry and must not paint over previews"
);
assert.equal(
  ruleFor(".fx-gui-window__body::before"),
  null,
  "Window body must not use a fake top rail or overlay above child flows"
);
assert.match(
  declaration(bodyRule, "box-shadow"),
  /inset 0 3px 4px/,
  "Window body inset shadow must remain part of the real body flow surface"
);

for (const selector of [
  ".fx-gui-flow-drop-preview-slot::before",
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

assert.match(
  guiSource,
  /function GuiHorizontalFlowShell/,
  "Horizontal Flow rendering must expose a shared atom shell"
);
assert.match(
  guiSource,
  /function GuiFrameShell/,
  "Frame rendering must expose a shared atom shell"
);
assert.match(
  guiSource,
  /function windowBodyStyleVariables[\s\S]*--fx-window-body-horizontal-spacing[\s\S]*reference\.horizontalSpacing/,
  "Window body rendering must bind horizontal spacing from the generated body flow style reference"
);
assert.match(
  guiSource,
  /function windowBodyStyleVariables[\s\S]*--fx-window-body-vertical-spacing[\s\S]*reference\.verticalSpacing/,
  "Window body rendering must bind vertical spacing from the generated body flow style reference"
);
assert.match(
  guiSource,
  /function CanvasDropPreviewSlot[\s\S]*const PreviewShell[\s\S]*<PreviewShell/,
  "canvas preview must render through the same atom shell as the dropped node"
);
assert.match(
  guiSource,
  /export function GuiHorizontalFlow[\s\S]*<GuiHorizontalFlowShell/,
  "real Horizontal Flow nodes must render through the shared atom shell"
);
assert.match(
  guiSource,
  /export function GuiFrame[\s\S]*<GuiFrameShell/,
  "real Frame nodes must render through the shared atom shell"
);
assert.match(
  guiSource,
  /function GuiLayoutNode[\s\S]*props\.node\?\.primitive === "frame"[\s\S]*<GuiFrame/,
  "layout node rendering must dispatch Frame primitives to the Frame atom"
);
assert.doesNotMatch(
  guiSource,
  /"fx-gui-flow-drop-preview-slot"[\s\S]*<BuilderGhostBlock \/>/,
  "canvas preview must not wrap a separate generic ghost block with different box styling"
);
for (const [field, source] of [
  ["horizontalSpacing", "childHorizontalSpacing"],
  ["topPadding", "childTopPadding"],
  ["rightPadding", "childRightPadding"],
  ["bottomPadding", "childBottomPadding"],
  ["leftPadding", "childLeftPadding"],
  ["minimalWidth", "childMinimalWidth"],
  ["minimalHeight", "childMinimalHeight"]
]) {
  assert.match(
    guiSource,
    new RegExp(`${field}:\\s*reference\\.${source}`),
    `preview node must hydrate ${field} from parent ${source}`
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
  "one-frame insert-left hover preview must split width exactly like the final two-frame layout"
);

console.log("Hover/drop geometry checks passed.");

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
const realFrameBevelRule = ruleFor(".fx-gui-frame::before");
const bodyRule = ruleFor(".fx-gui-window__body");
const shadowDisabledWindowRule = ruleFor('.fx-gui-window[data-fx-shadows="hidden"]');
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
assert.equal(
  declaration(realFrameRule, "box-shadow"),
  "none",
  "real Frame bevel must be painted by its graphical edge pseudo-element, not by layout shadow"
);
assert.match(
  declaration(realFrameRule, "background"),
  /#403f40/,
  "real Frame fill must stay lighter than the parent body substrate"
);
assert.match(
  declaration(realFrameRule, "border"),
  /1px solid #0a0909/,
  "real Frame must keep a hard dark outer edge for the inset surface"
);
assert.match(
  declaration(realFrameBevelRule, "box-shadow"),
  /inset 0 -1px 0 rgba\(255, 255, 255, 0\.20\)/,
  "real Frame bevel must include the bottom inner glint visible with GUI shadows disabled"
);
assert.match(
  declaration(realFrameBevelRule, "box-shadow"),
  /inset 0 2px 2px rgba\(0, 0, 0, 0\.58\)/,
  "real Frame bevel must include a dark top recessed lip"
);
assert.doesNotMatch(
  declaration(realFrameBevelRule, "box-shadow"),
  /inset 0 1px 0 rgba\(255/,
  "real Frame must not add the extra top highlight line under its border"
);
assert.doesNotMatch(
  declaration(realFrameRule, "box-shadow"),
  /1px 1px 0/,
  "real Frame must not use the old raised bottom/right drop shadow"
);
assert.doesNotMatch(
  declaration(realFrameRule, "box-shadow"),
  /(?:^|,)\s*-?\d+px 0 2px -2px/,
  "real Frame must not cast external side shadows onto the parent substrate"
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
assert.doesNotMatch(
  declaration(bodyRule, "box-shadow"),
  /(?:0 -1px 0|inset 0 [1-9])/,
  "Window body must not draw a continuous top stroke over body child split gaps"
);
assert.match(
  declaration(bodyRule, "box-shadow"),
  /^none$/,
  "Window body must act as substrate only; child Frames own top and bottom split edges"
);
assert.equal(
  declaration(shadowDisabledWindowRule, "box-shadow"),
  "none",
  "GUI shadow toggle must disable only the Window cast shadow through data-fx-shadows"
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

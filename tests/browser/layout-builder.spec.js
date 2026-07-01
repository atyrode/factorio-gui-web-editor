import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { strFromU8, unzipSync } from "fflate";

const EDITOR_STORAGE_KEY = "labtorio.editorState.v1";
const FACTORIO_DESIGN_FILE_SCHEMA = "labtorio-gui-design.v0";
const FACTORIO_DESIGN_FILE_EXTENSION = ".labtorio-gui.json";
const FACTORIO_PREVIEW_MOD_FOLDER = "labtorio_gui_preview_0.1.0";
const FACTORIO_PREVIEW_MOD_DESIGN_FILENAME = "design.labtorio-gui.json";
const FACTORIO_PREVIEW_MOD_ZIP_FILENAME = `${FACTORIO_PREVIEW_MOD_FOLDER}.zip`;
const ONE_FRAME_STATE = {
  title: "Machin truc lab",
  windowSize: { width: 1100, height: 450 },
  windowBodyDirection: "horizontal",
  currentWindow: {
    title: "Machin truc lab",
    location: null,
    size: { width: 1100, height: 450 },
    bodyDirection: "horizontal",
    layoutChildren: [
      {
        id: "gui_frame_1",
        atom: "frame",
        styleVariant: "inside-deep-frame",
        children: []
      }
    ],
    nextLayoutNodeNumber: 2
  },
  showInspector: false,
  showLuaOutput: false,
  inspectorLocked: false,
  inspectedAnchor: null,
  showLayoutSettings: false,
  layoutSettings: {
    horizontalFlowSpacing: 6,
    horizontalFlowMinimumWidth: 168,
    nestedHorizontalFlowMinimumWidth: 144,
    horizontalFlowMinimumHeight: 72,
    horizontalFlowPadding: 8
  },
  sidebarWidth: 260
};
const TWO_VERTICAL_FRAME_STATE = {
  ...ONE_FRAME_STATE,
  windowBodyDirection: "vertical",
  currentWindow: {
    ...ONE_FRAME_STATE.currentWindow,
    bodyDirection: "vertical",
    layoutChildren: [
      {
        id: "gui_frame_1",
        atom: "frame",
        styleVariant: "inside-deep-frame",
        children: []
      },
      {
        id: "gui_frame_2",
        atom: "frame",
        styleVariant: "inside-deep-frame",
        children: []
      }
    ],
    nextLayoutNodeNumber: 3
  }
};
const NESTED_TREE_STATE = {
  ...ONE_FRAME_STATE,
  currentWindow: {
    ...ONE_FRAME_STATE.currentWindow,
    layoutChildren: [
      {
        id: "gui_frame_1",
        atom: "frame",
        styleVariant: "inside-deep-frame",
        children: [
          {
            id: "gui_horizontal_flow_2",
            atom: "horizontal-flow",
            styleVariant: "generic-horizontal-flow",
            children: [
              {
                id: "gui_frame_3",
                atom: "frame",
                styleVariant: "inside-deep-frame",
                children: []
              },
              {
                id: "gui_frame_4",
                atom: "frame",
                styleVariant: "inside-deep-frame",
                children: []
              }
            ]
          }
        ]
      }
    ],
    nextLayoutNodeNumber: 5
  }
};
const BODY_FILLER_STATE = {
  ...ONE_FRAME_STATE,
  currentWindow: {
    ...ONE_FRAME_STATE.currentWindow,
    layoutChildren: [
      {
        id: "gui_filler_1",
        atom: "filler",
        styleVariant: "draggable-space",
        children: [
          {
            id: "gui_frame_99",
            atom: "frame",
            styleVariant: "inside-deep-frame",
            children: []
          }
        ]
      }
    ],
    nextLayoutNodeNumber: 2
  }
};
const MANY_BODY_FRAMES_STATE = {
  ...ONE_FRAME_STATE,
  currentWindow: {
    ...ONE_FRAME_STATE.currentWindow,
    layoutChildren: Array.from({ length: 14 }, (_, index) => ({
      id: `gui_frame_${index + 1}`,
      atom: "frame",
      styleVariant: "inside-deep-frame",
      children: []
    })),
    nextLayoutNodeNumber: 15
  }
};

function stateWithSelection(state, anchor, overrides = {}) {
  return {
    ...state,
    inspectedAnchor: anchor,
    inspectorLocked: true,
    ...overrides,
    currentWindow: {
      ...state.currentWindow,
      ...(overrides.currentWindow ?? {})
    }
  };
}

function roundedRect(rect) {
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function readPng(buffer) {
  const signature = "89504e470d0a1a0a";
  expect(buffer.subarray(0, 8).toString("hex")).toBe(signature);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  expect(bitDepth).toBe(8);
  expect([2, 6]).toContain(colorType);

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowLength = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(width * height * bytesPerPixel);

  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const row = inflated.subarray(sourceOffset, sourceOffset + rowLength);
    sourceOffset += rowLength;

    for (let x = 0; x < rowLength; x += 1) {
      const raw = row[x];
      const left = x >= bytesPerPixel ? pixels[y * rowLength + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[(y - 1) * rowLength + x] : 0;
      const upperLeft =
        y > 0 && x >= bytesPerPixel
          ? pixels[(y - 1) * rowLength + x - bytesPerPixel]
          : 0;
      let value = raw;

      if (filter === 1) {
        value = raw + left;
      } else if (filter === 2) {
        value = raw + above;
      } else if (filter === 3) {
        value = raw + Math.floor((left + above) / 2);
      } else if (filter === 4) {
        value = raw + paethPredictor(left, above, upperLeft);
      } else {
        expect(filter).toBe(0);
      }
      pixels[y * rowLength + x] = value & 0xff;
    }
  }

  return {
    getPixel(x, y) {
      const safeX = Math.min(Math.max(0, Math.round(x)), width - 1);
      const safeY = Math.min(Math.max(0, Math.round(y)), height - 1);
      const pixelOffset = safeY * rowLength + safeX * bytesPerPixel;
      return [
        pixels[pixelOffset],
        pixels[pixelOffset + 1],
        pixels[pixelOffset + 2]
      ];
    }
  };
}

function luminance([red, green, blue]) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

async function seedEditorState(page, state) {
  await page.addInitScript(
    ({ key, state }) => {
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    { key: EDITOR_STORAGE_KEY, state }
  );
  await page.goto("/");
}

async function seedOneFrameWindow(page) {
  await seedEditorState(page, ONE_FRAME_STATE);
  await expect(page.locator('[data-anchor="gui_frame_1"]')).toBeVisible();
}

async function dragResizeHandle(page, handle, deltaX, deltaY) {
  const handleLocator = page.locator(
    `[data-anchor="resize_overlay"] [data-resize-handle="${handle}"]`
  );
  await handleLocator.scrollIntoViewIfNeeded();
  const handleBox = await handleLocator.boundingBox();
  expect(handleBox).not.toBeNull();

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY);
  await page.mouse.up();
}

async function dragWindowBy(page, deltaX, deltaY) {
  const titlebar = page.locator('[data-anchor="gui_window_titlebar"]');
  await expect(titlebar).toBeVisible();
  const titlebarBox = await titlebar.boundingBox();
  expect(titlebarBox).not.toBeNull();

  const startX = titlebarBox.x + titlebarBox.width / 2;
  const startY = titlebarBox.y + titlebarBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY);
  await page.mouse.up();
}

async function readStoredEditorState(page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key)), EDITOR_STORAGE_KEY);
}

async function startNativePaletteDrag(page, paletteAnchor) {
  const source = page.locator(`[data-anchor="${paletteAnchor}"]`);
  await expect(source).toBeVisible();

  await page.evaluate(({ paletteAnchor }) => {
    const source = document.querySelector(`[data-anchor="${paletteAnchor}"]`);
    if (!source) {
      throw new Error(`Missing palette source: ${paletteAnchor}`);
    }

    const dataTransfer = new DataTransfer();
    const sourceRect = source.getBoundingClientRect();
    window.__layoutBuilderNativeDrag = { dataTransfer, source };

    source.dispatchEvent(new DragEvent("dragstart", {
      bubbles: true,
      cancelable: true,
      clientX: sourceRect.left + sourceRect.width / 2,
      clientY: sourceRect.top + sourceRect.height / 2,
      dataTransfer
    }));
  }, { paletteAnchor });

  await expect(source).toHaveClass(/is-dragging/);
}

async function dragActiveNativePaletteOver(page, targetSelector, position = {}) {
  await page.locator(targetSelector).waitFor({ state: "visible" });

  await page.evaluate(({ targetSelector, position }) => {
    const drag = window.__layoutBuilderNativeDrag;
    const target = document.querySelector(targetSelector);
    if (!drag?.dataTransfer || !target) {
      throw new Error(`Missing active drag or target: ${targetSelector}`);
    }

    const rect = target.getBoundingClientRect();
    const clientX = rect.left + (position.x ?? rect.width / 2);
    const clientY = rect.top + (position.y ?? rect.height / 2);

    for (const type of ["dragenter", "dragover"]) {
      target.dispatchEvent(new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer: drag.dataTransfer
      }));
    }
  }, { targetSelector, position });
}

async function dropActiveNativePalette(page, targetSelector, position = {}) {
  await page.locator(targetSelector).waitFor({ state: "visible" });

  await page.evaluate(({ targetSelector, position }) => {
    const drag = window.__layoutBuilderNativeDrag;
    const target = document.querySelector(targetSelector);
    if (!drag?.dataTransfer || !target) {
      throw new Error(`Missing active drag or target: ${targetSelector}`);
    }

    const rect = target.getBoundingClientRect();
    const clientX = rect.left + (position.x ?? rect.width / 2);
    const clientY = rect.top + (position.y ?? rect.height / 2);

    target.dispatchEvent(new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      dataTransfer: drag.dataTransfer
    }));
    drag.source.dispatchEvent(new DragEvent("dragend", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      dataTransfer: drag.dataTransfer
    }));
    delete window.__layoutBuilderNativeDrag;
  }, { targetSelector, position });
}

async function dragPaletteToBodyStart(page) {
  await startNativePaletteDrag(page, "frame_palette_item");
  await dragActiveNativePaletteOver(
    page,
    '[data-anchor="gui_window_body"] > .fx-gui-flow-drop-target.is-start-edge',
    { x: 8 }
  );
  const preview = page.locator('[data-anchor="gui_window_body"] > .fx-gui-flow-drop-preview-slot');
  await expect(preview).toHaveCount(1);
  await expect(preview).toHaveClass(/is-expanded/);
  await page.waitForFunction(() => {
    const slot = document.querySelector(
      '[data-anchor="gui_window_body"] > .fx-gui-flow-drop-preview-slot'
    );
    return slot && window.getComputedStyle(slot).opacity === "1";
  });
  await page.waitForTimeout(220);
}

async function dragHorizontalFlowPaletteToFrame(page) {
  await page.locator('[data-anchor="horizontal_flow_palette_item"]').dragTo(
    page.locator('[data-anchor="gui_frame_1"]'),
    { targetPosition: { x: 48, y: 28 } }
  );
}

async function dragTreeNodeToRow(page, sourceId, targetId) {
  const sourceHandle = page.locator(
    `[data-anchor="builder_tree_item_${sourceId}"] .fx-builder-row__drag-handle`
  );
  const targetRow = page.locator(`[data-anchor="builder_tree_item_${targetId}"]`);

  await expect(sourceHandle).toBeVisible();
  await expect(targetRow).toBeVisible();

  await page.evaluate(({ sourceId, targetId }) => {
    const source = document.querySelector(
      `[data-anchor="builder_tree_item_${sourceId}"] .fx-builder-row__drag-handle`
    );
    const target = document.querySelector(`[data-anchor="builder_tree_item_${targetId}"]`);
    if (!source || !target) {
      throw new Error(`Missing tree drag source or target: ${sourceId} -> ${targetId}`);
    }

    const dataTransfer = new DataTransfer();
    const targetRect = target.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();

    function fireDragEvent(element, type, rect) {
      const event = new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + Math.min(96, Math.max(8, rect.width / 2)),
        clientY: rect.top + rect.height / 2,
        dataTransfer
      });
      element.dispatchEvent(event);
    }

    fireDragEvent(source, "dragstart", sourceRect);
    fireDragEvent(target, "dragenter", targetRect);
    fireDragEvent(target, "dragover", targetRect);
    fireDragEvent(target, "drop", targetRect);
    fireDragEvent(source, "dragend", sourceRect);
  }, { sourceId, targetId });
}

async function previewTreeNodeOverRow(page, sourceId, targetId) {
  const sourceHandle = page.locator(
    `[data-anchor="builder_tree_item_${sourceId}"] .fx-builder-row__drag-handle`
  );
  const targetRow = page.locator(`[data-anchor="builder_tree_item_${targetId}"]`);

  await expect(sourceHandle).toBeVisible();
  await expect(targetRow).toBeVisible();

  await page.evaluate(({ sourceId, targetId }) => {
    const source = document.querySelector(
      `[data-anchor="builder_tree_item_${sourceId}"] .fx-builder-row__drag-handle`
    );
    const target = document.querySelector(`[data-anchor="builder_tree_item_${targetId}"]`);
    if (!source || !target) {
      throw new Error(`Missing tree drag source or target: ${sourceId} -> ${targetId}`);
    }

    const dataTransfer = new DataTransfer();
    const targetRect = target.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    window.__layoutBuilderTreeDrag = { dataTransfer, source };

    function fireDragEvent(element, type, clientX, clientY) {
      const event = new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      });
      element.dispatchEvent(event);
    }

    fireDragEvent(
      source,
      "dragstart",
      sourceRect.left + sourceRect.width / 2,
      sourceRect.top + sourceRect.height / 2
    );
    fireDragEvent(
      target,
      "dragenter",
      targetRect.left + Math.min(96, Math.max(8, targetRect.width / 2)),
      targetRect.top + 4
    );
    fireDragEvent(
      target,
      "dragover",
      targetRect.left + Math.min(96, Math.max(8, targetRect.width / 2)),
      targetRect.top + 4
    );
  }, { sourceId, targetId });
}

async function dragPaletteTileToTreeRow(page, paletteAnchor, targetId) {
  const sourceHandle = page.locator(`[data-anchor="${paletteAnchor}"]`);
  const targetRow = page.locator(`[data-anchor="builder_tree_item_${targetId}"]`);

  await expect(sourceHandle).toBeVisible();
  await expect(targetRow).toBeVisible();

  await sourceHandle.dragTo(targetRow, {
    targetPosition: { x: 56, y: 18 }
  });
}

async function previewPaletteTileOverTreeRow(page, paletteAnchor, targetId) {
  const sourceHandle = page.locator(`[data-anchor="${paletteAnchor}"]`);
  const targetRow = page.locator(`[data-anchor="builder_tree_item_${targetId}"]`);

  await expect(sourceHandle).toBeVisible();
  await expect(targetRow).toBeVisible();
  await startNativePaletteDrag(page, paletteAnchor);
  await dragActiveNativePaletteOver(
    page,
    `[data-anchor="builder_tree_item_${targetId}"]`,
    { x: 56, y: 18 }
  );
}

async function dropPaletteTileOverTreeRow(page, paletteAnchor, targetId) {
  await startNativePaletteDrag(page, paletteAnchor);
  await dragActiveNativePaletteOver(
    page,
    `[data-anchor="builder_tree_item_${targetId}"]`,
    { x: 56, y: 18 }
  );
  await dropActiveNativePalette(
    page,
    `[data-anchor="builder_tree_item_${targetId}"]`,
    { x: 56, y: 18 }
  );
}

async function endNativeDrag(page) {
  await page.evaluate(() => {
    const drag = window.__layoutBuilderNativeDrag ?? window.__layoutBuilderTreeDrag;
    const dataTransfer = drag?.dataTransfer ?? new DataTransfer();
    const source = drag?.source ?? window;
    source.dispatchEvent(new DragEvent("dragend", {
      bubbles: true,
      cancelable: true,
      dataTransfer
    }));
    delete window.__layoutBuilderNativeDrag;
    delete window.__layoutBuilderTreeDrag;
  });
}

async function measureHover(page) {
  return page.evaluate(() => {
    function rect(selector) {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Missing element: ${selector}`);
      }
      return {
        left: element.getBoundingClientRect().left,
        top: element.getBoundingClientRect().top,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height
      };
    }

    const preview = document.querySelector(
      '[data-anchor="gui_window_body"] > [data-anchor="builder_ghost_marker"].fx-gui-flow-drop-preview-slot'
    );
    const previewStyle = window.getComputedStyle(preview);
    const existing = document.querySelector('[data-anchor="gui_frame_1"]');
    const existingStyle = window.getComputedStyle(existing);
    return {
      preview: rect(
        '[data-anchor="gui_window_body"] > [data-anchor="builder_ghost_marker"].fx-gui-flow-drop-preview-slot'
      ),
      existing: rect('[data-anchor="gui_frame_1"]'),
      gap: existing.getBoundingClientRect().left - preview.getBoundingClientRect().right,
      previewPaddingLeft: previewStyle.paddingLeft,
      previewPaddingRight: previewStyle.paddingRight,
      previewMinHeight: previewStyle.minHeight,
      existingPaddingLeft: existingStyle.paddingLeft,
      existingPaddingRight: existingStyle.paddingRight,
      existingMinHeight: existingStyle.minHeight,
      dropTargetBackgrounds: Array.from(
        document.querySelectorAll('[data-anchor="gui_window_body"] > .fx-gui-flow-drop-target'),
        (target) => window.getComputedStyle(target).backgroundColor
      )
    };
  });
}

async function measureFinal(page) {
  return page.locator('[data-fx-role="body-frame"]').evaluateAll((elements) =>
    elements.map((element) => ({
      id: element.dataset.anchor,
      left: element.getBoundingClientRect().left,
      top: element.getBoundingClientRect().top,
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height
    }))
  );
}

function expectRectClose(actual, expected, label) {
  expect(roundedRect(actual), label).toEqual(roundedRect(expected));
}

function expectSharedFlowSize(actual, expected, label) {
  const actualRect = roundedRect(actual);
  const expectedRect = roundedRect(expected);
  expect(
    {
      top: actualRect.top,
      width: actualRect.width,
      height: actualRect.height
    },
    label
  ).toEqual({
    top: expectedRect.top,
    width: expectedRect.width,
    height: expectedRect.height
  });
}

test.describe("Layout builder canvas preview", () => {
  test("style atlas renders Label samples without missing anchors or overflowing text", async ({
    page
  }) => {
    await page.goto("/style-atlas");

    await expect(page.locator('[data-anchor="atlas_labels"]')).toBeVisible();
    const samples = page.locator('[data-anchor="atlas_labels_samples"] .fx-label');
    await expect(samples).toHaveCount(8);

    const sampleMetrics = await samples.evaluateAll((elements) =>
      elements.map((element) => ({
        text: element.textContent?.trim() ?? "",
        style: element.getAttribute("data-fx-style"),
        state: element.getAttribute("data-fx-state"),
        disabled: element.getAttribute("aria-disabled"),
        fits: Math.ceil(element.scrollWidth) <= Math.ceil(element.clientWidth) + 1
      }))
    );

    expect(sampleMetrics.map((sample) => sample.style)).toEqual([
      "label",
      "label",
      "frame_title",
      "caption_label",
      "subheader_caption_label",
      "clickable_label",
      "clickable_label",
      "clickable_label"
    ]);
    expect(sampleMetrics[1].disabled).toBe("true");
    expect(sampleMetrics[6].state).toBe("hovered");
    expect(sampleMetrics[7].state).toBe("clicked");
    expect(sampleMetrics.filter((sample) => !sample.fits)).toEqual([]);

    const evidence = page.locator('[data-anchor="atlas_style_evidence"]');
    await expect(evidence).toBeVisible();
    const atlasOrder = await page.evaluate(() => {
      const scrollPane = document.querySelector('[data-anchor="atlas_scroll_pane"]');
      const styleEvidence = document.querySelector('[data-anchor="atlas_style_evidence"]');
      if (!scrollPane || !styleEvidence) {
        throw new Error("Missing atlas section for order check");
      }

      return {
        scrollPaneTop: scrollPane.getBoundingClientRect().top,
        evidenceTop: styleEvidence.getBoundingClientRect().top
      };
    });
    expect(atlasOrder.evidenceTop).toBeGreaterThan(atlasOrder.scrollPaneTop);
    await expect(evidence.locator('[data-anchor="atlas_style_evidence_source"]'))
      .toContainText("factorio-style-catalog.v0");
    await expect(evidence.locator('[data-anchor="atlas_style_evidence_source"]'))
      .toContainText("2.0.76");
    await expect(evidence.locator("[data-evidence-style]")).toHaveCount(16);
    await expect(
      evidence.locator('[data-evidence-style="frame_header_flow"] [data-evidence-section="catalog"]')
    ).toContainText("horizontal_spacing");
    await expect(
      evidence.locator('[data-evidence-style="frame_header_flow"] [data-evidence-section="browser"]')
    ).toContainText("captured_spacing");
    await expect(
      evidence.locator('[data-evidence-style="draggable_space_header"] [data-evidence-section="gaps"]')
    ).toContainText("asset-backed drawing data");

    const evidenceText = await evidence.textContent();
    expect(evidenceText).not.toContain("graphical_set");
    expect(evidenceText).not.toContain("filename");
  });

  test("undo and redo controls restore Window creation and reset", async ({ page }) => {
    await page.addInitScript((key) => window.localStorage.removeItem(key), EDITOR_STORAGE_KEY);
    await page.goto("/");

    const undo = page.locator('[data-anchor="editor_undo"]');
    const redo = page.locator('[data-anchor="editor_redo"]');
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();
    await expect(page.locator('[data-anchor="editor_command_bar"] [data-anchor="editor_undo"]'))
      .toBeVisible();
    const historyHeaderGeometry = await page.locator('[data-anchor="editor_command_bar"]').evaluate(
      (bar) => {
        const title = bar.querySelector(".fx-editor-command-bar__title");
        const undoButton = bar.querySelector('[data-anchor="editor_undo"]');
        const redoButton = bar.querySelector('[data-anchor="editor_redo"]');
        if (!title || !undoButton || !redoButton) {
          throw new Error("Missing command title or history controls");
        }

        const titleRect = title.getBoundingClientRect();
        const undoRect = undoButton.getBoundingClientRect();
        const redoRect = redoButton.getBoundingClientRect();
        return {
          titleRight: titleRect.right,
          undoLeft: undoRect.left,
          titleTop: Math.round(titleRect.top),
          undoTop: Math.round(undoRect.top),
          redoRight: Math.round(redoRect.right),
          panelRight: Math.round(bar.getBoundingClientRect().right)
        };
      }
    );
    expect(historyHeaderGeometry.undoLeft).toBeGreaterThan(historyHeaderGeometry.titleRight);
    expect(Math.abs(historyHeaderGeometry.undoTop - historyHeaderGeometry.titleTop))
      .toBeLessThanOrEqual(8);
    expect(historyHeaderGeometry.redoRight).toBeLessThan(historyHeaderGeometry.panelRight);

    await page.locator("#create-window").click();
    await expect(page.locator('[data-anchor="gui_window"]')).toBeVisible();
    await expect(undo).toBeEnabled();
    await expect(redo).toBeDisabled();

    await undo.click();
    await expect(page.locator('[data-anchor="editor_empty_state"]')).toBeVisible();
    await expect(undo).toBeDisabled();
    await expect(redo).toBeEnabled();

    await redo.click();
    await expect(page.locator('[data-anchor="gui_window"]')).toBeVisible();

    await page.locator("#reset-window").click();
    await expect(page.locator('[data-anchor="editor_empty_state"]')).toBeVisible();
    await undo.click();
    await expect(page.locator('[data-anchor="gui_window"]')).toBeVisible();
    await redo.click();
    await expect(page.locator('[data-anchor="editor_empty_state"]')).toBeVisible();

    const state = await readStoredEditorState(page);
    expect(state.currentWindow).toBeNull();
  });

  test("export drawer is closed by default and opens from the command bar", async ({ page }) => {
    await seedOneFrameWindow(page);

    await expect(page.locator('[data-anchor="editor_export_drawer"]')).toHaveCount(0);
    await expect(page.locator('[data-anchor="lua_output_file"]')).toHaveCount(0);

    const exportToggle = page.locator('[data-anchor="editor_export_toggle"]');
    await exportToggle.click();
    await expect(exportToggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-anchor="editor_export_drawer"]')).toBeVisible();
    await expect(page.locator('[data-anchor="lua_output_file"]')).toBeVisible();
    await expect(page.locator(".fx-editor-output__code code")).toContainText(
      "local function build_gui(player)"
    );

    await exportToggle.click();
    await expect(page.locator('[data-anchor="editor_export_drawer"]')).toHaveCount(0);
  });

  test("Inspect tool opens the Factorio properties tab", async ({ page }) => {
    await seedOneFrameWindow(page);

    await page.locator('[data-anchor="editor_tool_inspect"]').click();
    await expect(page.locator('[data-anchor="editor_tool_inspect"]')).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.locator('[data-anchor="properties_tab_factorio"]')).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await page.locator('[data-anchor="gui_frame_1"]').click();
    await expect(page.locator('[data-anchor="style_inspector_panel"]')).toBeVisible();
    await expect(page.locator('[data-anchor="style_inspector_panel"]')).toContainText(
      "class agui::Frame"
    );
  });

  test("Select tool leaves canvas clicks passive", async ({ page }) => {
    await seedOneFrameWindow(page);

    await expect(page.locator('[data-anchor="editor_tool_select"]')).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await page.locator('[data-anchor="gui_frame_1"]').click();
    await expect(page.locator('[data-anchor="properties_tab_properties"]')).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator('[data-anchor="style_inspector_panel"]')).toHaveCount(0);
    await expect(page.locator('[data-anchor="gui_frame_1"]')).not.toHaveClass(/is-inspected/);

    const state = await readStoredEditorState(page);
    expect(state.inspectedAnchor).toBeNull();
    expect(state.inspectorLocked).toBe(false);
  });

  test("canvas is the dominant desktop work area without a closed export drawer", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedOneFrameWindow(page);

    await expect(page.locator('[data-anchor="editor_export_drawer"]')).toHaveCount(0);
    const geometry = await page.evaluate(() => {
      const canvas = document.querySelector('[data-anchor="editor_canvas"]');
      const componentsRow = document.querySelector('[data-anchor="builder_panel"]');
      const properties = document.querySelector('[data-anchor="properties_panel"]');
      const tree = document.querySelector('[data-anchor="component_tree_panel"]');
      const canvasRect = canvas.getBoundingClientRect();
      const componentsRowRect = componentsRow.getBoundingClientRect();
      const propertiesRect = properties.getBoundingClientRect();
      const treeRect = tree.getBoundingClientRect();
      const labelFits = (selector) => [...document.querySelectorAll(selector)].map((label) => ({
        text: label.textContent?.trim() ?? "",
        fits: Math.ceil(label.scrollWidth) <= Math.ceil(label.clientWidth) + 1
      }));
      return {
        canvas: {
          top: canvasRect.top,
          left: canvasRect.left,
          right: canvasRect.right,
          width: canvasRect.width
        },
        componentsRow: {
          bottom: componentsRowRect.bottom
        },
        properties: {
          left: propertiesRect.left,
          right: propertiesRect.right,
          width: propertiesRect.width
        },
        tree: {
          left: treeRect.left,
          width: treeRect.width
        },
        componentLabels: labelFits('[data-anchor="builder_panel"] .fx-builder-palette__item span'),
        treeLabels: labelFits('[data-anchor="component_tree_panel"] .fx-builder-row__label span')
      };
    });

    expect(geometry.canvas.width).toBeGreaterThan(geometry.properties.width);
    expect(geometry.canvas.width).toBeGreaterThan(geometry.tree.width);
    expect(geometry.componentsRow.bottom).toBeLessThanOrEqual(geometry.canvas.top);
    expect(geometry.canvas.right).toBeLessThanOrEqual(geometry.properties.left);
    expect(geometry.properties.left).toBe(geometry.tree.left);
    expect(geometry.componentLabels.filter((label) => !label.fits)).toEqual([]);
    expect(geometry.treeLabels.filter((label) => !label.fits)).toEqual([]);
  });

  test("authored field edits coalesce and clear the redo branch", async ({ page }) => {
    await seedEditorState(page, {
      ...ONE_FRAME_STATE,
      showLayoutSettings: true,
      showLuaOutput: true
    });

    const undo = page.locator('[data-anchor="editor_undo"]');
    const redo = page.locator('[data-anchor="editor_redo"]');
    const titleInput = page.locator("#window-title");
    const widthInput = page.locator("#window-width");

    await titleInput.fill("Alpha");
    await titleInput.fill("Beta");
    await page.keyboard.press("Tab");
    await undo.click();
    await expect(titleInput).toHaveValue("Machin truc lab");
    await redo.click();
    await expect(titleInput).toHaveValue("Beta");

    await undo.click();
    await expect(titleInput).toHaveValue("Machin truc lab");
    await expect(redo).toBeEnabled();

    await widthInput.fill("900");
    await widthInput.fill("760");
    await page.keyboard.press("Tab");
    await expect(redo).toBeDisabled();
    await undo.click();
    await expect(widthInput).toHaveValue("1100");
    await redo.click();
    await expect(widthInput).toHaveValue("760");

    const minWidthInput = page.locator(
      '[data-anchor="layout_setting_horizontal_flow_min_width"] input'
    );
    await minWidthInput.fill("210");
    await minWidthInput.fill("220");
    await page.keyboard.press("Tab");
    await expect(page.locator('[data-anchor="gui_frame_1"]')).toHaveAttribute(
      "data-fx-minimal-width",
      "220"
    );
    await undo.click();
    await expect(minWidthInput).toHaveValue("168");
    await expect(page.locator('[data-anchor="gui_frame_1"]')).toHaveAttribute(
      "data-fx-minimal-width",
      "168"
    );
    await redo.click();
    await expect(minWidthInput).toHaveValue("220");
  });

  test("undo and redo shortcuts ignore editable fields", async ({ page }) => {
    await seedOneFrameWindow(page);

    await dropPaletteTileOverTreeRow(page, "horizontal_flow_palette_item", "gui_frame_1");
    await expect(page.locator('[data-anchor="gui_horizontal_flow_2"]')).toBeVisible();

    await page.locator('[data-anchor="properties_tab_properties"]').click();
    await page.locator("#window-title").click();
    await page.keyboard.press("ControlOrMeta+Z");
    await expect(page.locator('[data-anchor="gui_horizontal_flow_2"]')).toBeVisible();

    await page.locator('[data-anchor="editor_undo"]').click();
    await expect(page.locator('[data-anchor="gui_horizontal_flow_2"]')).toHaveCount(0);
    await page.keyboard.press("ControlOrMeta+Shift+Z");
    await expect(page.locator('[data-anchor="gui_horizontal_flow_2"]')).toBeVisible();
  });

  test("component tree edits Lua variable names without changing stable element names", async ({ page }) => {
    await seedEditorState(page, {
      ...ONE_FRAME_STATE,
      showInspector: true,
      showLuaOutput: true,
      inspectorLocked: true,
      inspectedAnchor: "gui_frame_1",
      currentWindow: {
        ...ONE_FRAME_STATE.currentWindow,
        luaVariableNames: {}
      }
    });

    const inspector = page.locator('[data-anchor="inspector_gui_frame_1"]');
    await expect(inspector).toBeVisible();
    await expect(inspector.getByText("lua_variable_name")).toHaveCount(0);

    const variableControl = page.locator('[data-anchor="builder_lua_variable_gui_frame_1"]');
    await expect(variableControl).toHaveText("gui_frame_1");

    await variableControl.click();
    await page.getByLabel("Edit Lua variable for gui_frame_1").fill("main_controls");
    await page.getByLabel("Edit Lua variable for gui_frame_1").press("Enter");

    await expect(variableControl).toHaveText("main_controls");
    const luaOutput = page.locator(".fx-editor-output__code code");
    await expect(luaOutput).toContainText("local main_controls = gui_window_body.add{");
    await expect(luaOutput).toContainText('name = "gui_frame_1"');
    await expect(luaOutput).not.toContainText("local gui_frame_1 =");

    await variableControl.click();
    const duplicateInput = page.getByLabel("Edit Lua variable for gui_frame_1");
    await duplicateInput.fill("gui_window_body");
    await duplicateInput.press("Enter");

    await expect(duplicateInput).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toContainText("already used");
    await expect(luaOutput).toContainText("local main_controls = gui_window_body.add{");

    await duplicateInput.fill("");
    await duplicateInput.press("Enter");

    await expect(variableControl).toHaveText("gui_frame_1");
    await expect(luaOutput).toContainText("local gui_frame_1 = gui_window_body.add{");
  });

  test("Lua variable-name history ignores invalid edits", async ({ page }) => {
    await seedEditorState(page, {
      ...ONE_FRAME_STATE,
      showLuaOutput: true
    });

    const variableControl = page.locator('[data-anchor="builder_lua_variable_gui_frame_1"]');
    await variableControl.click();
    await page.getByLabel("Edit Lua variable for gui_frame_1").fill("main_controls");
    await page.getByLabel("Edit Lua variable for gui_frame_1").press("Enter");
    await expect(variableControl).toHaveText("main_controls");

    await variableControl.click();
    const duplicateInput = page.getByLabel("Edit Lua variable for gui_frame_1");
    await duplicateInput.fill("gui_window_body");
    await duplicateInput.press("Enter");
    await expect(duplicateInput).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toContainText("already used");
    await duplicateInput.press("Escape");

    await page.locator('[data-anchor="editor_undo"]').click();
    await expect(variableControl).toHaveText("gui_frame_1");
    await expect(page.locator(".fx-editor-output__code code")).toContainText(
      "local gui_frame_1 = gui_window_body.add{"
    );
    await page.locator('[data-anchor="editor_redo"]').click();
    await expect(variableControl).toHaveText("main_controls");
  });

  test("component tree defaults to the Window body flow", async ({ page }) => {
    await seedOneFrameWindow(page);

    const tree = page.locator('[data-anchor="builder_body_tree"]');
    await expect(tree.getByText("Window Frame")).toHaveCount(0);
    await expect(tree.getByText("Titlebar Horizontal Flow")).toHaveCount(0);
    await expect(tree.getByText("Title Label")).toHaveCount(0);
    await expect(tree.getByText("Header Filler")).toHaveCount(0);
    await expect(tree.getByText("Window body Horizontal Flow")).toBeVisible();
    await expect(tree.getByText("gui_window_body", { exact: true })).toBeVisible();
    await expect(tree.getByRole("button", { name: "Frame", exact: true }))
      .toBeVisible();
    await expect(page.locator('[data-anchor="builder_lua_variable_gui_frame_1"]'))
      .toBeVisible();
    await expect(tree.getByText("gui_frame_1", { exact: true })).toBeVisible();
    await expect(page.locator('[data-anchor="frame_palette_item"]')).toBeVisible();
    await expect(page.locator('[data-anchor="horizontal_flow_palette_item"]')).toBeVisible();
    await expect(page.locator('[data-anchor="label_palette_item"]')).toBeVisible();
    await expect(page.locator('[data-anchor="filler_palette_item"]')).toBeVisible();
  });

  test("component tree scrollbar has a dedicated right gutter", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 560 });
    await seedEditorState(page, {
      ...MANY_BODY_FRAMES_STATE,
      currentWindow: {
        ...MANY_BODY_FRAMES_STATE.currentWindow,
        layoutChildren: Array.from({ length: 80 }, (_, index) => ({
          id: `gui_frame_${index + 1}`,
          atom: "frame",
          styleVariant: "inside-deep-frame",
          children: []
        })),
        nextLayoutNodeNumber: 81
      }
    });

    const geometry = await page.locator('[data-anchor="builder_body_tree"]').evaluate((tree) => {
      const firstRow = tree.querySelector('[data-anchor="builder_tree_item_gui_frame_1"]');
      if (!firstRow) {
        throw new Error("Missing first builder row");
      }

      const treeRect = tree.getBoundingClientRect();
      const rowRect = firstRow.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(tree);
      return {
        hasVerticalScroll: tree.scrollHeight > tree.clientHeight,
        rightGap: treeRect.right - rowRect.right,
        gutter: computedStyle.getPropertyValue("--fx-builder-scrollbar-gutter").trim(),
        paddingRight: computedStyle.paddingRight
      };
    });

    expect(geometry.hasVerticalScroll).toBe(true);
    expect(geometry.gutter).toBe("16px");
    expect(geometry.paddingRight).toBe("16px");
    expect(geometry.rightGap).toBeGreaterThanOrEqual(12);
  });

  test("component tree can show the generated Window shell", async ({ page }) => {
    await seedEditorState(page, {
      ...ONE_FRAME_STATE,
      showComponentTreeShell: true
    });

    const tree = page.locator('[data-anchor="builder_body_tree"]');
    await expect(tree.getByText("Window Frame")).toBeVisible();
    await expect(tree.getByText("gui_window", { exact: true })).toBeVisible();
    await expect(tree.getByText("Titlebar Horizontal Flow")).toBeVisible();
    await expect(tree.getByText("gui_window_titlebar", { exact: true })).toBeVisible();
    await expect(tree.getByText("Title Label")).toBeVisible();
    await expect(tree.getByText("gui_window_title", { exact: true })).toBeVisible();
    await expect(tree.getByText("Header Filler")).toBeVisible();
    await expect(tree.getByText("gui_window_drag_handle", { exact: true })).toBeVisible();
    const headerFiller = page.locator('[data-anchor="gui_window_drag_handle"]');
    await expect(headerFiller).toHaveAttribute("data-fx-atom", "filler");
    await expect(headerFiller).toHaveAttribute("data-fx-primitive", "empty-widget");
    await expect(headerFiller).toHaveAttribute("data-fx-class", "agui::Filler");
    await expect(headerFiller).toHaveAttribute("data-fx-style", "draggable_space_header");
    await expect(headerFiller).toHaveAttribute("data-fx-role", "header-filler");
    await expect(headerFiller).toHaveAttribute("data-fx-height", "36");
    await expect(headerFiller).toHaveAttribute("data-fx-natural-height", "36");
    await expect(headerFiller).toHaveAttribute("data-fx-left-margin", "6");
    await expect(headerFiller).toHaveAttribute("data-fx-right-margin", "6");
    await expect(headerFiller).toHaveAttribute("data-fx-horizontally-stretchable", "true");
    await expect(headerFiller).toHaveAttribute("data-fx-vertically-stretchable", "true");
    await expect(headerFiller).toHaveAttribute("data-fx-ignored-by-search", "true");
    await expect(tree.getByText("Window body Horizontal Flow")).toBeVisible();
    await expect(tree.getByText("gui_window_body", { exact: true })).toBeVisible();
    await expect(tree.getByRole("button", { name: "Frame", exact: true }))
      .toBeVisible();
    await expect(page.locator('[data-anchor="builder_lua_variable_gui_frame_1"]'))
      .toBeVisible();
    await expect(tree.getByText("gui_frame_1", { exact: true })).toBeVisible();
    await expect(page.locator('[data-anchor="filler_palette_item"]')).toBeVisible();
  });

  test("settings toggle switches component tree between body flow and generated shell", async ({ page }) => {
    await seedOneFrameWindow(page);

    const tree = page.locator('[data-anchor="builder_body_tree"]');
    await expect(tree.getByText("Window Frame")).toHaveCount(0);

    await page.locator('[data-anchor="layout_settings_toggle"]').click();
    const shellToggle = page.locator('[data-anchor="component_tree_shell_toggle"] input');
    await expect(shellToggle).not.toBeChecked();
    await page.locator('[data-anchor="component_tree_shell_toggle"]').click();
    await expect(shellToggle).toBeChecked();

    await expect(tree.getByText("Window Frame")).toBeVisible();
    await expect(tree.getByText("Titlebar Horizontal Flow")).toBeVisible();
    await expect(tree.getByText("Header Filler")).toBeVisible();
  });

  test("nested Horizontal Flow keeps horizontal direction in DOM and Lua", async ({ page }) => {
    await seedEditorState(page, {
      ...NESTED_TREE_STATE,
      showLuaOutput: true
    });

    const flow = page.locator('[data-anchor="gui_horizontal_flow_2"]');
    await expect(flow).toBeVisible();
    await expect(flow).toHaveAttribute("data-fx-direction", "horizontal");
    await expect(flow).toHaveCSS("flex-direction", "row");

    const childGeometry = await flow.locator(':scope > [data-fx-role="body-frame"]')
      .evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          id: element.dataset.anchor,
          left: rect.left,
          top: rect.top
        };
      }));
    expect(childGeometry.map((child) => child.id)).toEqual(["gui_frame_3", "gui_frame_4"]);
    expect(childGeometry[1].left).toBeGreaterThan(childGeometry[0].left);
    expect(Math.abs(childGeometry[1].top - childGeometry[0].top)).toBeLessThan(2);

    const luaOutput = page.locator(".fx-editor-output__code code");
    await expect(luaOutput).toContainText('local gui_horizontal_flow_2 = gui_frame_1.add{');
    await expect(luaOutput).toContainText('direction = "horizontal"');
  });

  test("component tree moves nested nodes through Headless Tree and keeps outputs synchronized", async ({ page }) => {
    await seedEditorState(page, {
      ...NESTED_TREE_STATE,
      showInspector: true,
      showLuaOutput: true
    });

    await dragTreeNodeToRow(page, "gui_frame_4", "gui_window_body");

    await expect(page.locator('[data-anchor="builder_tree_item_gui_frame_4"]'))
      .toHaveClass(/is-selected/);
    await expect(page.locator('[data-anchor="inspector_gui_frame_4"]')).toBeVisible();

    const bodyFrames = await page.locator('[data-anchor="gui_window_body"] > [data-fx-role="body-frame"]')
      .evaluateAll((elements) => elements.map((element) => element.dataset.anchor));
    expect(bodyFrames).toEqual(["gui_frame_1", "gui_frame_4"]);

    const nestedFrames = await page.locator('[data-anchor="gui_horizontal_flow_2"] > [data-fx-role="body-frame"]')
      .evaluateAll((elements) => elements.map((element) => element.dataset.anchor));
    expect(nestedFrames).toEqual(["gui_frame_3"]);

    const luaOutput = page.locator(".fx-editor-output__code code");
    await expect(luaOutput).toContainText("local gui_frame_4 = gui_window_body.add{");
    await expect(luaOutput).toContainText("local gui_frame_3 = gui_horizontal_flow_2.add{");
  });

  test("component tree copy and paste duplicates a subtree across all projections", async ({ page }) => {
    await seedEditorState(page, {
      ...NESTED_TREE_STATE,
      showInspector: true,
      showLuaOutput: true
    });

    await expect(page.locator('[data-anchor="builder_paste_gui_window_body"]')).toHaveCount(0);

    await page.locator('[data-anchor="builder_copy_gui_frame_1"]').click();
    await page.locator('[data-anchor="builder_paste_gui_window_body"]').click();

    await expect(page.locator('[data-anchor="builder_tree_item_gui_frame_5"]'))
      .toHaveClass(/is-selected/);
    await expect(page.locator('[data-anchor="inspector_gui_frame_5"]')).toBeVisible();

    const bodyFrames = await page.locator('[data-anchor="gui_window_body"] > [data-fx-role="body-frame"]')
      .evaluateAll((elements) => elements.map((element) => element.dataset.anchor));
    expect(bodyFrames).toEqual(["gui_frame_1", "gui_frame_5"]);
    await expect(
      page.locator('[data-anchor="gui_frame_5"] > [data-anchor="gui_horizontal_flow_6"]')
    ).toHaveCount(1);
    const pastedNestedFrames = await page.locator(
      '[data-anchor="gui_horizontal_flow_6"] > [data-fx-role="body-frame"]'
    ).evaluateAll((elements) => elements.map((element) => element.dataset.anchor));
    expect(pastedNestedFrames).toEqual(["gui_frame_7", "gui_frame_8"]);

    const luaOutput = page.locator(".fx-editor-output__code code");
    await expect(luaOutput).toContainText("local gui_frame_5 = gui_window_body.add{");
    await expect(luaOutput).toContainText("local gui_horizontal_flow_6 = gui_frame_5.add{");
    await expect(luaOutput).toContainText("local gui_frame_7 = gui_horizontal_flow_6.add{");
    await expect(luaOutput).toContainText("local gui_frame_8 = gui_horizontal_flow_6.add{");

    const storedWindow = await page.evaluate((key) => {
      const state = JSON.parse(window.localStorage.getItem(key));
      return state.currentWindow;
    }, EDITOR_STORAGE_KEY);
    expect(storedWindow.inspectedAnchor).toBeUndefined();
    expect(storedWindow.layoutChildren.map((node) => node.id)).toEqual([
      "gui_frame_1",
      "gui_frame_5"
    ]);
    expect(storedWindow.layoutChildren[1].children[0].id).toBe("gui_horizontal_flow_6");
    expect(storedWindow.nextLayoutNodeNumber).toBe(9);
  });

  test("keyboard copy and paste use selected-aware placement outside text fields", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_frame_1", { showLuaOutput: true })
    );

    await page.keyboard.press("ControlOrMeta+C");
    await page.keyboard.press("ControlOrMeta+V");

    await expect(
      page.locator('[data-anchor="gui_frame_1"] > [data-anchor="gui_frame_2"]')
    ).toHaveCount(1);
    await expect(page.locator('[data-anchor="builder_tree_item_gui_frame_2"]'))
      .toHaveClass(/is-selected/);
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      "local gui_frame_2 = gui_frame_1.add{"
    );

    const frameCountAfterPaste = await page.locator('[data-anchor^="gui_frame_"]').count();
    await page.locator('[data-anchor="properties_tab_properties"]').click();
    await page.locator("#window-title").click();
    await page.keyboard.press("ControlOrMeta+C");
    await page.keyboard.press("ControlOrMeta+X");
    await page.keyboard.press("ControlOrMeta+V");
    await expect(page.locator('[data-anchor^="gui_frame_"]')).toHaveCount(frameCountAfterPaste);
  });

  test("keyboard cut removes the selected subtree and keeps it pasteable", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(NESTED_TREE_STATE, "gui_frame_1", { showLuaOutput: true })
    );

    await page.keyboard.press("ControlOrMeta+X");

    await expect(page.locator('[data-anchor="gui_frame_1"]')).toHaveCount(0);
    await expect(page.locator('[data-anchor="gui_horizontal_flow_2"]')).toHaveCount(0);
    await expect(page.locator('[data-anchor="builder_tree_item_gui_window_body"]'))
      .toHaveClass(/is-selected/);
    await expect(page.locator('[data-anchor="builder_paste_gui_window_body"]')).toBeVisible();
    await expect(page.locator(".fx-editor-output__code")).not.toContainText("gui_frame_1");

    await page.keyboard.press("ControlOrMeta+V");

    await expect(page.locator('[data-anchor="gui_frame_5"]')).toBeVisible();
    await expect(page.locator('[data-anchor="builder_tree_item_gui_frame_5"]'))
      .toHaveClass(/is-selected/);
    await expect(
      page.locator('[data-anchor="gui_frame_5"] > [data-anchor="gui_horizontal_flow_6"]')
    ).toHaveCount(1);
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      "local gui_frame_5 = gui_window_body.add{"
    );
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      "local gui_horizontal_flow_6 = gui_frame_5.add{"
    );

    const storedWindow = await page.evaluate((key) => {
      const state = JSON.parse(window.localStorage.getItem(key));
      return state.currentWindow;
    }, EDITOR_STORAGE_KEY);
    expect(storedWindow.layoutChildren.map((node) => node.id)).toEqual(["gui_frame_5"]);
    expect(storedWindow.nextLayoutNodeNumber).toBe(9);
  });

  test("undo and redo restore component tree move and remove mutations", async ({ page }) => {
    await seedEditorState(page, {
      ...NESTED_TREE_STATE,
      showInspector: true,
      showLuaOutput: true
    });

    await dragTreeNodeToRow(page, "gui_frame_4", "gui_window_body");
    await expect(page.locator('[data-anchor="builder_tree_item_gui_frame_4"]'))
      .toHaveClass(/is-selected/);
    await expect(page.locator(".fx-editor-output__code code")).toContainText(
      "local gui_frame_4 = gui_window_body.add{"
    );

    await page.keyboard.press("ControlOrMeta+Z");
    await expect(page.locator('[data-anchor="gui_window_body"] > [data-anchor="gui_frame_4"]'))
      .toHaveCount(0);
    await expect(
      page.locator('[data-anchor="gui_horizontal_flow_2"] > [data-anchor="gui_frame_4"]')
    ).toHaveCount(1);

    await page.keyboard.press("ControlOrMeta+Shift+Z");
    await expect(page.locator('[data-anchor="gui_window_body"] > [data-anchor="gui_frame_4"]'))
      .toHaveCount(1);

    await page
      .locator('[data-anchor="builder_tree_item_gui_frame_4"]')
      .getByRole("button", { name: "Remove Frame subtree" })
      .click();
    await expect(page.locator('[data-anchor="gui_frame_4"]')).toHaveCount(0);
    await expect(page.locator('[data-anchor="builder_tree_item_gui_window_body"]'))
      .toHaveClass(/is-selected/);

    await page.locator('[data-anchor="editor_undo"]').click();
    await expect(page.locator('[data-anchor="gui_window_body"] > [data-anchor="gui_frame_4"]'))
      .toHaveCount(1);
    await expect(page.locator('[data-anchor="builder_tree_item_gui_frame_4"]'))
      .toHaveClass(/is-selected/);

    await page.locator('[data-anchor="editor_redo"]').click();
    await expect(page.locator('[data-anchor="gui_frame_4"]')).toHaveCount(0);

    const state = await readStoredEditorState(page);
    expect(state.currentWindow.layoutChildren.map((node) => node.id)).toEqual(["gui_frame_1"]);
  });

  test("undo and redo restore paste and cut mutations", async ({ page }) => {
    await seedEditorState(page, {
      ...NESTED_TREE_STATE,
      showLuaOutput: true
    });

    await page.locator('[data-anchor="builder_copy_gui_frame_1"]').click();
    await page.locator('[data-anchor="builder_paste_gui_window_body"]').click();
    await expect(page.locator('[data-anchor="gui_frame_5"]')).toBeVisible();
    await expect(page.locator(".fx-editor-output__code code")).toContainText(
      "local gui_frame_5 = gui_window_body.add{"
    );

    await page.locator('[data-anchor="editor_undo"]').click();
    await expect(page.locator('[data-anchor="gui_frame_5"]')).toHaveCount(0);
    await page.locator('[data-anchor="editor_redo"]').click();
    await expect(page.locator('[data-anchor="gui_frame_5"]')).toBeVisible();
    await expect(page.locator('[data-anchor="builder_tree_item_gui_frame_5"]'))
      .toHaveClass(/is-selected/);

    await page.keyboard.press("ControlOrMeta+X");
    await expect(page.locator('[data-anchor="gui_frame_5"]')).toHaveCount(0);
    await expect(page.locator('[data-anchor="builder_tree_item_gui_window_body"]'))
      .toHaveClass(/is-selected/);

    await page.keyboard.press("ControlOrMeta+Z");
    await expect(page.locator('[data-anchor="gui_frame_5"]')).toBeVisible();
    await expect(page.locator('[data-anchor="builder_tree_item_gui_frame_5"]'))
      .toHaveClass(/is-selected/);

    await page.keyboard.press("ControlOrMeta+Y");
    await expect(page.locator('[data-anchor="gui_frame_5"]')).toHaveCount(0);

    const state = await readStoredEditorState(page);
    expect(state.currentWindow.layoutChildren.map((node) => node.id)).toEqual(["gui_frame_1"]);
  });

  test("pasted subtrees reset copied Lua variable-name overrides", async ({ page }) => {
    await seedEditorState(page, {
      ...NESTED_TREE_STATE,
      showLuaOutput: true,
      currentWindow: {
        ...NESTED_TREE_STATE.currentWindow,
        luaVariableNames: {
          gui_frame_1: "main_frame",
          gui_horizontal_flow_2: "main_flow",
          gui_frame_3: "left_frame",
          gui_frame_4: "right_frame"
        }
      }
    });

    await page.locator('[data-anchor="builder_copy_gui_frame_1"]').click();
    await page.locator('[data-anchor="builder_paste_gui_window_body"]').click();

    await expect(page.locator('[data-anchor="builder_lua_variable_gui_frame_1"]'))
      .toHaveText("main_frame");
    await expect(page.locator('[data-anchor="builder_lua_variable_gui_frame_5"]'))
      .toHaveText("gui_frame_5");

    const luaOutput = page.locator(".fx-editor-output__code code");
    await expect(luaOutput).toContainText("local main_frame = gui_window_body.add{");
    await expect(luaOutput).toContainText("local main_flow = main_frame.add{");
    await expect(luaOutput).toContainText("local gui_frame_5 = gui_window_body.add{");
    await expect(luaOutput).toContainText("local gui_horizontal_flow_6 = gui_frame_5.add{");
    await expect(luaOutput).not.toContainText("local main_frame = gui_frame_5.add{");
    await expect(luaOutput).not.toContainText("local main_flow = gui_frame_5.add{");
  });

  test("paste controls are unavailable without a clipboard or current Window", async ({ page }) => {
    await seedOneFrameWindow(page);
    await expect(page.locator('[data-anchor^="builder_paste_"]')).toHaveCount(0);

    await seedEditorState(page, {
      ...ONE_FRAME_STATE,
      currentWindow: null,
      inspectedAnchor: null,
      inspectorLocked: false
    });
    await expect(page.locator('[data-anchor^="builder_paste_"]')).toHaveCount(0);
    await expect(page.locator('[data-anchor^="builder_copy_"]')).toHaveCount(0);
  });

  test("component tree keeps generated shell rows locked while still selectable", async ({ page }) => {
    await seedEditorState(page, {
      ...ONE_FRAME_STATE,
      showInspector: true,
      showComponentTreeShell: true
    });

    const windowRow = page.locator('[data-anchor="builder_tree_item_gui_window"]');
    await windowRow.click();

    await expect(windowRow).toHaveClass(/is-selected/);
    await expect(page.locator('[data-anchor="inspector_gui_window"]')).toBeVisible();
    await expect(windowRow.locator(".fx-builder-row__drag-handle")).toBeDisabled();
    await expect(windowRow.getByRole("button", { name: /remove/i })).toHaveCount(0);
  });

  test("component tree rejects descendant drops without mutating the model", async ({ page }) => {
    await seedEditorState(page, NESTED_TREE_STATE);

    await dragTreeNodeToRow(page, "gui_frame_1", "gui_horizontal_flow_2");

    const bodyFrames = await page.locator('[data-anchor="gui_window_body"] > [data-fx-role="body-frame"]')
      .evaluateAll((elements) => elements.map((element) => element.dataset.anchor));
    expect(bodyFrames).toEqual(["gui_frame_1"]);
    await expect(
      page.locator('[data-anchor="gui_frame_1"] > [data-anchor="gui_horizontal_flow_2"]')
    ).toHaveCount(1);
  });

  test("palette tile inserts through Headless Tree foreign drops", async ({ page }) => {
    await seedOneFrameWindow(page);

    await dragPaletteTileToTreeRow(page, "horizontal_flow_palette_item", "gui_frame_1");

    await expect(page.locator('[data-anchor="gui_horizontal_flow_2"]')).toBeVisible();
    await expect(
      page.locator('[data-anchor="gui_frame_1"] > [data-anchor="gui_horizontal_flow_2"]')
    ).toHaveCount(1);
    await expect(page.locator('[data-anchor="builder_tree_item_gui_horizontal_flow_2"]'))
      .toHaveClass(/is-selected/);
  });

  test("component tree palette hover keeps row hit targets stable", async ({ page }) => {
    await seedEditorState(page, TWO_VERTICAL_FRAME_STATE);

    const secondFrameRow = page.locator('[data-anchor="builder_tree_item_gui_frame_2"]');
    const before = await secondFrameRow.boundingBox();
    expect(before).not.toBeNull();

    await previewPaletteTileOverTreeRow(page, "horizontal_flow_palette_item", "gui_frame_1");

    await expect(page.locator('[data-anchor="builder_tree_insertion_placeholder"]')).toHaveCount(0);

    await expect.poll(async () => {
      const after = await secondFrameRow.boundingBox();
      expect(after).not.toBeNull();
      return Math.abs(after.y - before.y);
    }).toBeLessThan(4);

    await endNativeDrag(page);
  });

  test("component tree move preview opens a visual gap without moving hit targets", async ({ page }) => {
    await seedEditorState(page, TWO_VERTICAL_FRAME_STATE);

    const targetHitBox = page.locator('[data-tree-hit-anchor="builder_tree_hit_gui_frame_1"]');
    const targetRow = page.locator('[data-anchor="builder_tree_item_gui_frame_1"]');
    const targetVisual = targetHitBox.locator(".fx-builder-tree__visual");
    const beforeHitBox = await targetHitBox.boundingBox();
    const beforeRowBox = await targetRow.boundingBox();
    expect(beforeHitBox).not.toBeNull();
    expect(beforeRowBox).not.toBeNull();

    await previewTreeNodeOverRow(page, "gui_frame_2", "gui_frame_1");

    await expect(targetVisual).toHaveClass(/is-visual-shifted/);
    await expect.poll(async () => {
      const afterHitBox = await targetHitBox.boundingBox();
      expect(afterHitBox).not.toBeNull();
      return Math.abs(afterHitBox.y - beforeHitBox.y);
    }).toBeLessThan(4);
    await expect.poll(async () => {
      const afterRowBox = await targetRow.boundingBox();
      expect(afterRowBox).not.toBeNull();
      return afterRowBox.y - beforeRowBox.y;
    }).toBeGreaterThan(8);

    await endNativeDrag(page);
  });

  test("palette can insert a Horizontal Flow inside a Frame", async ({ page }) => {
    await seedOneFrameWindow(page);
    await expect(page.locator('[data-anchor="frame_palette_item"]')).toBeVisible();
    await expect(page.locator('[data-anchor="horizontal_flow_palette_item"]')).toBeVisible();
    await expect(page.locator('[data-anchor="label_palette_item"]')).toBeVisible();
    await expect(page.locator('[data-anchor="filler_palette_item"]')).toBeVisible();

    await dragHorizontalFlowPaletteToFrame(page);

    await expect(page.locator('[data-anchor="gui_horizontal_flow_2"]')).toBeVisible();
    await expect(
      page.locator('[data-anchor="gui_frame_1"] > [data-anchor="gui_horizontal_flow_2"]')
    ).toHaveCount(1);
    await expect(page.locator('[data-anchor="builder_body_tree"]').getByText(
      "gui_horizontal_flow_2",
      { exact: true }
    )).toBeVisible();
  });

  test("palette can insert authored Filler into body, Frame, and Horizontal Flow", async ({ page }) => {
    await seedEditorState(page, {
      ...ONE_FRAME_STATE,
      showLuaOutput: true
    });

    await dropPaletteTileOverTreeRow(page, "filler_palette_item", "gui_window_body");
    await dropPaletteTileOverTreeRow(page, "filler_palette_item", "gui_frame_1");
    await dropPaletteTileOverTreeRow(page, "horizontal_flow_palette_item", "gui_frame_1");
    await dropPaletteTileOverTreeRow(page, "filler_palette_item", "gui_horizontal_flow_4");

    const bodyFiller = page.locator(
      '[data-anchor="gui_window_body"] > [data-anchor="gui_filler_2"]'
    );
    const frameFiller = page.locator(
      '[data-anchor="gui_frame_1"] > [data-anchor="gui_filler_3"]'
    );
    const flowFiller = page.locator(
      '[data-anchor="gui_horizontal_flow_4"] > [data-anchor="gui_filler_5"]'
    );
    for (const filler of [bodyFiller, frameFiller, flowFiller]) {
      await expect(filler).toBeVisible();
      await expect(filler).toHaveAttribute("data-fx-atom", "filler");
      await expect(filler).toHaveAttribute("data-fx-primitive", "empty-widget");
      await expect(filler).toHaveAttribute("data-fx-class", "agui::Filler");
      await expect(filler).toHaveAttribute("data-fx-style", "draggable_space");
      await expect(filler).toHaveAttribute("data-fx-role", "spacer");
      await expect(filler).toHaveAttribute("data-fx-horizontally-stretchable", "true");
      await expect(filler).toHaveAttribute("data-fx-vertically-stretchable", "true");
      await expect(filler).toHaveAttribute("data-fx-ignored-by-interaction", "true");
    }

    await expect(page.locator('[data-anchor="builder_tree_item_gui_filler_5"]'))
      .toHaveClass(/is-selected/);
    const luaOutput = page.locator(".fx-editor-output__code code");
    await expect(luaOutput).toContainText('local gui_filler_2 = gui_window_body.add{');
    await expect(luaOutput).toContainText('local gui_filler_3 = gui_frame_1.add{');
    await expect(luaOutput).toContainText('local gui_filler_5 = gui_horizontal_flow_4.add{');
    await expect(luaOutput).toContainText('type = "empty-widget"');
    await expect(luaOutput).toContainText('style = "draggable_space"');
    await expect(luaOutput).toContainText("ignored_by_interaction = true");
    await expect(luaOutput).toContainText("gui_filler_5.style.horizontally_stretchable = true");
    await expect(luaOutput).toContainText("gui_filler_5.style.vertically_stretchable = true");
  });

  test("palette can insert authored Label and edit its caption", async ({ page }) => {
    await seedEditorState(page, {
      ...ONE_FRAME_STATE,
      showInspector: true,
      showLuaOutput: true
    });

    await dropPaletteTileOverTreeRow(page, "label_palette_item", "gui_window_body");
    await dropPaletteTileOverTreeRow(page, "horizontal_flow_palette_item", "gui_frame_1");
    await dropPaletteTileOverTreeRow(page, "label_palette_item", "gui_horizontal_flow_3");

    const bodyLabel = page.locator('[data-anchor="gui_label_2"]');
    const flowLabel = page.locator(
      '[data-anchor="gui_horizontal_flow_3"] > [data-anchor="gui_label_4"]'
    );
    for (const label of [bodyLabel, flowLabel]) {
      await expect(label).toBeVisible();
      await expect(label).toHaveAttribute("data-fx-atom", "label");
      await expect(label).toHaveAttribute("data-fx-primitive", "label");
      await expect(label).toHaveAttribute("data-fx-class", "agui::Label");
      await expect(label).toHaveAttribute("data-fx-style", "label");
      await expect(label).toContainText("Label");
    }

    const labelRow = page.locator('[data-anchor="builder_tree_item_gui_label_2"]');
    await labelRow.click();
    await expect(labelRow).toHaveClass(/is-selected/);
    await expect(labelRow.getByRole("button", { name: "Add child" })).toHaveCount(0);
    await expect(labelRow.getByRole("button", { name: "Edit Label text" })).toBeVisible();
    await expect(page.locator('[data-anchor="inspector_gui_label_2"]')).toBeVisible();

    await page
      .locator('[data-anchor="inspector_gui_label_2"]')
      .getByTitle("Edit caption: Label")
      .click();
    await page.getByLabel("Edit caption").fill("Power grid");
    await page.getByLabel("Edit caption").press("Enter");

    await expect(bodyLabel).toHaveText("Power grid");

    await page.locator('[data-anchor="builder_edit_label_text_gui_label_4"]').click();
    const treeStartedEdit = page.locator('[data-anchor="gui_label_text_edit_gui_label_4"]');
    await expect(treeStartedEdit).toBeVisible();
    await treeStartedEdit.fill("Throughput");
    await treeStartedEdit.press("Enter");
    await expect(flowLabel).toHaveText("Throughput");

    await page.locator('[data-anchor="editor_tool_select"]').click();
    await bodyLabel.dblclick();
    const canvasEdit = page.locator('[data-anchor="gui_label_text_edit_gui_label_2"]');
    await expect(canvasEdit).toBeVisible();
    await canvasEdit.fill("Power demand");
    await canvasEdit.press("Enter");
    await expect(bodyLabel).toHaveText("Power demand");

    const luaOutput = page.locator(".fx-editor-output__code code");
    await expect(luaOutput).toContainText('local gui_label_2 = gui_window_body.add{');
    await expect(luaOutput).toContainText('caption = "Power demand"');
    await expect(luaOutput).toContainText('style = "label"');
    await expect(luaOutput).toContainText('local gui_label_4 = gui_horizontal_flow_3.add{');
    await expect(luaOutput).toContainText('caption = "Throughput"');
  });

  test("authored Filler is selectable, movable, removable, and not a drop parent", async ({ page }) => {
    await seedEditorState(page, {
      ...BODY_FILLER_STATE,
      showInspector: true,
      showLuaOutput: true
    });

    const fillerRow = page.locator('[data-anchor="builder_tree_item_gui_filler_1"]');
    await expect(page.locator('[data-anchor="gui_filler_1"]')).toBeVisible();
    await expect(page.locator('[data-anchor="gui_filler_1"] > .fx-gui-flow-drop-target'))
      .toHaveCount(0);
    await expect(page.locator('[data-anchor="gui_frame_99"]')).toHaveCount(0);
    await fillerRow.click();
    await expect(fillerRow).toHaveClass(/is-selected/);
    await expect(page.locator('[data-anchor="inspector_gui_filler_1"]')).toBeVisible();
    await expect(fillerRow.getByRole("button", { name: "Add child" })).toHaveCount(0);

    await dropPaletteTileOverTreeRow(page, "frame_palette_item", "gui_filler_1");
    await expect(page.locator('[data-anchor="gui_frame_2"]')).toBeVisible();
    await expect(page.locator('[data-anchor="gui_filler_1"] > [data-anchor="gui_frame_2"]'))
      .toHaveCount(0);
    await expect(page.locator('[data-anchor="gui_window_body"] > [data-anchor="gui_frame_2"]'))
      .toHaveCount(1);
    await expect(page.locator('[data-anchor="gui_filler_1"] > .fx-gui-flow-drop-target'))
      .toHaveCount(0);

    await dragTreeNodeToRow(page, "gui_filler_1", "gui_frame_2");
    await expect(
      page.locator('[data-anchor="gui_frame_2"] > [data-anchor="gui_filler_1"]')
    ).toHaveCount(1);
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      "local gui_filler_1 = gui_frame_2.add{"
    );

    await page
      .locator('[data-anchor="builder_tree_item_gui_filler_1"]')
      .getByRole("button", { name: "Remove Filler subtree" })
      .click();
    await expect(page.locator('[data-anchor="gui_filler_1"]')).toHaveCount(0);
    await expect(page.locator(".fx-editor-output__code")).not.toContainText("gui_filler_1");
  });

  test("drag-created Horizontal Flow keeps horizontal child layout", async ({ page }) => {
    await seedOneFrameWindow(page);

    await dragHorizontalFlowPaletteToFrame(page);
    await dropPaletteTileOverTreeRow(page, "frame_palette_item", "gui_horizontal_flow_2");
    await dropPaletteTileOverTreeRow(page, "frame_palette_item", "gui_horizontal_flow_2");

    const flow = page.locator('[data-anchor="gui_horizontal_flow_2"]');
    await expect(flow).toHaveAttribute("data-fx-direction", "horizontal");
    await expect(flow).toHaveCSS("flex-direction", "row");

    const childGeometry = await flow.locator(':scope > [data-fx-role="body-frame"]')
      .evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          id: element.dataset.anchor,
          left: rect.left,
          top: rect.top
        };
      }));
    expect(new Set(childGeometry.map((child) => child.id))).toEqual(
      new Set(["gui_frame_3", "gui_frame_4"])
    );
    const byLeft = [...childGeometry].sort((left, right) => left.left - right.left);
    expect(byLeft[1].left).toBeGreaterThan(byLeft[0].left);
    expect(Math.abs(byLeft[1].top - byLeft[0].top)).toBeLessThan(2);
  });

  test("GUI shadow toggle disables only the Window cast shadow", async ({ page }) => {
    await seedOneFrameWindow(page);

    const shadowOn = await page.evaluate(() => {
      const root = document.querySelector('[data-anchor="gui_window"]');
      const body = document.querySelector('[data-anchor="gui_window_body"]');
      const frame = document.querySelector('[data-anchor="gui_frame_1"]');
      const frameBevel = getComputedStyle(frame, "::before");
      return {
        root: getComputedStyle(root).boxShadow,
        body: getComputedStyle(body).boxShadow,
        frame: getComputedStyle(frame).boxShadow,
        frameBevel: frameBevel.boxShadow
      };
    });

    const shadowToggle = page.locator('[data-anchor="gui_shadow_toggle"]');
    await expect(shadowToggle).toHaveAttribute("aria-pressed", "true");
    expect(shadowOn.root).not.toBe("none");
    expect(shadowOn.body).toBe("none");
    expect(shadowOn.frame).toBe("none");
    expect(shadowOn.frameBevel).toContain("inset");

    await shadowToggle.click();
    await expect(shadowToggle).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator('[data-anchor="gui_window"]')).toHaveAttribute(
      "data-fx-shadows",
      "hidden"
    );

    const shadowOff = await page.evaluate(() => {
      const root = document.querySelector('[data-anchor="gui_window"]');
      const body = document.querySelector('[data-anchor="gui_window_body"]');
      const frame = document.querySelector('[data-anchor="gui_frame_1"]');
      const frameBevel = getComputedStyle(frame, "::before");
      return {
        root: getComputedStyle(root).boxShadow,
        body: getComputedStyle(body).boxShadow,
        frame: getComputedStyle(frame).boxShadow,
        frameBevel: frameBevel.boxShadow
      };
    });

    expect(shadowOff.root).toBe("none");
    expect(shadowOff.body).toBe("none");
    expect(shadowOff.frame).toBe(shadowOn.frame);
    expect(shadowOff.frameBevel).toBe(shadowOn.frameBevel);
  });

  test("resize mode shows handles only when enabled for a resizable Frame", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_frame_1", { showLuaOutput: true })
    );

    await expect(page.locator('[data-anchor="resize_overlay"]')).toHaveCount(0);
    const resizeTool = page.locator('[data-anchor="resize_mode_toggle"]');
    await resizeTool.click();
    await expect(resizeTool).toHaveAttribute("aria-pressed", "true");

    const overlay = page.locator('[data-anchor="resize_overlay"]');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute("data-resize-anchor", "gui_frame_1");
    await expect(overlay).toHaveAttribute("data-resize-supported", "true");
    await expect(overlay.locator("[data-resize-handle]")).toHaveCount(8);

    await dragResizeHandle(page, "se", 140, 50);

    await expect(page.locator('[data-anchor="gui_frame_1"]')).toHaveAttribute(
      "data-fx-minimal-width",
      "308"
    );
    await expect(page.locator('[data-anchor="gui_frame_1"]')).toHaveAttribute(
      "data-fx-minimal-height",
      "122"
    );
    await expect(page.locator('[data-anchor="lua_output_file"]')).toBeVisible();
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      "gui_frame_1.style.minimal_width = 308"
    );
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      "gui_frame_1.style.minimal_height = 122"
    );

    const storedSize = await page.evaluate((key) => {
      const state = JSON.parse(window.localStorage.getItem(key));
      return state.currentWindow.layoutChildren[0].size;
    }, EDITOR_STORAGE_KEY);
    expect(storedSize).toEqual({ minimalWidth: 308, minimalHeight: 122 });
  });

  test("undo and redo restore one committed layout-node resize", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_frame_1", { showLuaOutput: true })
    );
    await page.locator('[data-anchor="resize_mode_toggle"]').click();

    await dragResizeHandle(page, "se", 140, 50);
    await expect(page.locator('[data-anchor="gui_frame_1"]')).toHaveAttribute(
      "data-fx-minimal-width",
      "308"
    );

    await page.locator('[data-anchor="editor_undo"]').click();
    await expect(page.locator('[data-anchor="gui_frame_1"]')).toHaveAttribute(
      "data-fx-minimal-width",
      "168"
    );
    let state = await readStoredEditorState(page);
    expect(state.currentWindow.layoutChildren[0].size).toBeUndefined();

    await page.locator('[data-anchor="editor_redo"]').click();
    await expect(page.locator('[data-anchor="gui_frame_1"]')).toHaveAttribute(
      "data-fx-minimal-width",
      "308"
    );
    state = await readStoredEditorState(page);
    expect(state.currentWindow.layoutChildren[0].size).toEqual({
      minimalWidth: 308,
      minimalHeight: 122
    });
  });

  test("resize mode updates Window width and height through exported style fields", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_window", {
        showLayoutSettings: true,
        showLuaOutput: true
      })
    );
    await page.locator('[data-anchor="resize_mode_toggle"]').click();

    const overlay = page.locator('[data-anchor="resize_overlay"]');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute("data-resize-anchor", "gui_window");
    await dragResizeHandle(page, "se", 100, 40);

    await expect(page.locator("#window-width")).toHaveValue("1200");
    await expect(page.locator("#window-height")).toHaveValue("490");
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      "gui_window.style.width = 1200"
    );
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      "gui_window.style.height = 490"
    );
  });

  test("undo and redo restore one committed Window location drag", async ({ page }) => {
    await seedEditorState(page, ONE_FRAME_STATE);

    await dragWindowBy(page, 80, 30);
    const movedState = await readStoredEditorState(page);
    expect(movedState.currentWindow.location).toEqual(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number)
      })
    );
    await expect(page.locator('[data-anchor="gui_window"]')).toHaveClass(/is-positioned/);

    await page.locator('[data-anchor="editor_undo"]').click();
    let state = await readStoredEditorState(page);
    expect(state.currentWindow.location).toBeNull();
    await expect(page.locator('[data-anchor="gui_window"]')).not.toHaveClass(/is-positioned/);

    await page.locator('[data-anchor="editor_redo"]').click();
    state = await readStoredEditorState(page);
    expect(state.currentWindow.location).toEqual(movedState.currentWindow.location);
    await expect(page.locator('[data-anchor="gui_window"]')).toHaveClass(/is-positioned/);
  });

  test("downloads a Factorio preview mod zip from the current Lua output", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_frame_1", { showLuaOutput: true })
    );

    const downloadPromise = page.waitForEvent("download");
    await page.locator('[data-anchor="factorio_mod_download"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(FACTORIO_PREVIEW_MOD_ZIP_FILENAME);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const zipBuffer = await readFile(downloadPath);
    const zipEntries = unzipSync(new Uint8Array(zipBuffer));
    const guiLua = strFromU8(zipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/gui.lua`]);
    const controlLua = strFromU8(zipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/control.lua`]);
    const embeddedDesignFile = JSON.parse(
      strFromU8(
        zipEntries[
          `${FACTORIO_PREVIEW_MOD_FOLDER}/${FACTORIO_PREVIEW_MOD_DESIGN_FILENAME}`
        ]
      )
    );
    const infoJson = JSON.parse(
      strFromU8(zipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/info.json`])
    );

    expect(infoJson.name).toBe("labtorio_gui_preview");
    expect(infoJson.factorio_version).toBe("2.0");
    expect(embeddedDesignFile.schema).toBe(FACTORIO_DESIGN_FILE_SCHEMA);
    expect(embeddedDesignFile.design.title).toBe("Machin truc lab");
    expect(embeddedDesignFile.design.currentWindow.layoutChildren[0].id).toBe("gui_frame_1");
    expect(controlLua).toContain('local build_gui = require("gui")');
    expect(controlLua).toContain("defines.events.on_player_created");
    expect(controlLua).toContain("defines.events.on_player_joined_game");
    expect(guiLua).toContain('caption = "Machin truc lab"');
    expect(guiLua).toContain('name = "gui_frame_1"');
    expect(guiLua).toContain("gui_frame_1.style.minimal_width = 168");

    await page.locator("#reset-window").click();
    await expect(page.locator('[data-anchor="editor_empty_state"]')).toBeVisible();

    await page.locator('[data-anchor="design_file_input"]').setInputFiles({
      name: FACTORIO_PREVIEW_MOD_ZIP_FILENAME,
      mimeType: "application/zip",
      buffer: zipBuffer
    });

    await expect(page.locator('[data-anchor="gui_frame_1"]')).toBeVisible();
    await expect(page.locator('[data-anchor="design_file_status"]')).toHaveAttribute(
      "data-tone",
      "success"
    );
    const importedState = await readStoredEditorState(page);
    expect(importedState.title).toBe("Machin truc lab");
    expect(importedState.currentWindow.layoutChildren[0].id).toBe("gui_frame_1");
  });

  test("downloads and imports the structured design file", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_frame_1", { showLuaOutput: true })
    );

    const downloadPromise = page.waitForEvent("download");
    await page.locator('[data-anchor="design_file_download"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      `machin-truc-lab${FACTORIO_DESIGN_FILE_EXTENSION}`
    );

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const fileText = await readFile(downloadPath, "utf8");
    const designFile = JSON.parse(fileText);
    expect(designFile.schema).toBe(FACTORIO_DESIGN_FILE_SCHEMA);
    expect(designFile.source).toEqual({
      app: "factorio-gui-web-editor",
      modelSchema: "factorio-gui-layout.v0"
    });
    expect(designFile.design.currentWindow.layoutChildren[0].id).toBe("gui_frame_1");

    await page.locator("#reset-window").click();
    await expect(page.locator('[data-anchor="editor_empty_state"]')).toBeVisible();

    await page.locator('[data-anchor="design_file_input"]').setInputFiles({
      name: `restored${FACTORIO_DESIGN_FILE_EXTENSION}`,
      mimeType: "application/json",
      buffer: Buffer.from(fileText)
    });

    await expect(page.locator('[data-anchor="gui_frame_1"]')).toBeVisible();
    await expect(page.locator('[data-anchor="design_file_status"]')).toHaveAttribute(
      "data-tone",
      "success"
    );
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      'caption = "Machin truc lab"'
    );
    await expect(page.locator(".fx-editor-output__code")).toContainText(
      'name = "gui_frame_1"'
    );

    const state = await readStoredEditorState(page);
    expect(state.title).toBe("Machin truc lab");
    expect(state.currentWindow.layoutChildren[0].id).toBe("gui_frame_1");
    expect(state.currentWindow.layoutChildren[0].atom).toBe("frame");
    expect(state.currentWindow.luaVariableNames).toEqual({});
  });

  test("rejects unsupported design files without mutating the current layout", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_frame_1", { showLuaOutput: true })
    );

    await page.locator('[data-anchor="design_file_input"]').setInputFiles({
      name: "unsupported.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ schema: "unsupported.v1", design: {} }))
    });

    await expect(page.locator('[data-anchor="design_file_status"]')).toHaveAttribute(
      "data-tone",
      "error"
    );
    await expect(page.locator('[data-anchor="design_file_status"]')).toContainText(
      "Unsupported design file schema"
    );

    const state = await readStoredEditorState(page);
    expect(state.title).toBe("Machin truc lab");
    expect(state.currentWindow.layoutChildren).toHaveLength(1);
    expect(state.currentWindow.layoutChildren[0].id).toBe("gui_frame_1");
    await expect(page.locator('[data-anchor="gui_frame_1"]')).toBeVisible();
  });

  test("resize mode marks unsupported generated nodes without mutating state", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_window_title")
    );
    await page.locator('[data-anchor="resize_mode_toggle"]').click();

    const overlay = page.locator('[data-anchor="resize_overlay"]');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute("data-resize-anchor", "gui_window_title");
    await expect(overlay).toHaveAttribute("data-resize-supported", "false");
    await expect(overlay.locator("[data-resize-handle]")).toHaveCount(0);
    await expect(overlay.getByText("Resize unavailable")).toBeVisible();

    const storedWindow = await page.evaluate((key) => {
      const state = JSON.parse(window.localStorage.getItem(key));
      return state.currentWindow;
    }, EDITOR_STORAGE_KEY);
    expect(storedWindow.layoutChildren[0].size).toBeUndefined();
    expect(storedWindow.size).toEqual({ width: 1100, height: 450 });
  });

  test("vertical Window body splits sibling Frames with a substrate gutter", async ({ page }) => {
    await seedEditorState(page, TWO_VERTICAL_FRAME_STATE);
    await expect(page.locator('[data-anchor="gui_frame_2"]')).toBeVisible();

    const geometry = await page.evaluate(() => {
      const body = document.querySelector('[data-anchor="gui_window_body"]');
      const frames = Array.from(document.querySelectorAll('[data-fx-role="body-frame"]'));
      return {
        bodyDirection: body.dataset.fxDirection,
        bodyGap: getComputedStyle(body).rowGap,
        frames: frames.map((frame) => {
          const rect = frame.getBoundingClientRect();
          return {
            id: frame.dataset.anchor,
            top: rect.top,
            height: rect.height
          };
        })
      };
    });

    expect(geometry.bodyDirection).toBe("vertical");
    expect(geometry.bodyGap).toBe("18px");
    expect(geometry.frames.map((frame) => frame.id)).toEqual([
      "gui_frame_1",
      "gui_frame_2"
    ]);
    const verticalGap =
      geometry.frames[1].top - (geometry.frames[0].top + geometry.frames[0].height);
    expect(Math.round(verticalGap)).toBe(18);
    expect(Math.round(geometry.frames[0].height)).toBe(
      Math.round(geometry.frames[1].height)
    );
  });

  test("matches final geometry when inserting left of one existing Frame", async ({ page }) => {
    await seedOneFrameWindow(page);
    await dragPaletteToBodyStart(page);

    const hover = await measureHover(page);
    expectSharedFlowSize(
      hover.preview,
      hover.existing,
      "hover preview and shifted existing Frame should split the body into equal-sized siblings"
    );
    expect(hover.preview.left).toBeLessThan(hover.existing.left);
    expect(hover.previewPaddingLeft).toBe(hover.existingPaddingLeft);
    expect(hover.previewPaddingRight).toBe(hover.existingPaddingRight);
    expect(hover.previewMinHeight).toBe(hover.existingMinHeight);
    expect(new Set(hover.dropTargetBackgrounds)).toEqual(new Set(["rgba(0, 0, 0, 0)"]));

    await dropActiveNativePalette(
      page,
      '[data-anchor="gui_window_body"] > .fx-gui-flow-drop-target.is-start-edge',
      { x: 8 }
    );
    await expect(page.locator('[data-fx-role="body-frame"]')).toHaveCount(2);
    const finalFrames = await measureFinal(page);

    expect(finalFrames.map((frame) => frame.id)).toEqual([
      "gui_frame_2",
      "gui_frame_1"
    ]);
    const finalGap = finalFrames[1].left - (finalFrames[0].left + finalFrames[0].width);
    expectRectClose(hover.preview, finalFrames[0], "hover preview should match dropped Frame");
    expectRectClose(
      hover.existing,
      finalFrames[1],
      "hover-shifted existing Frame should match final existing Frame"
    );
    expect(Math.round(hover.gap)).toBe(Math.round(finalGap));

    const windowBox = await page.locator('[data-anchor="gui_window"]').boundingBox();
    expect(windowBox).not.toBeNull();
    const screenshot = readPng(await page.locator('[data-anchor="gui_window"]').screenshot());
    const topY = finalFrames[0].top - windowBox.y;
    const bottomY = finalFrames[0].top + finalFrames[0].height - 1 - windowBox.y;
    const gapCenterX =
      (finalFrames[0].left + finalFrames[0].width + finalFrames[1].left) / 2 -
      windowBox.x;
    const leftFrameTopX = finalFrames[0].left + finalFrames[0].width - 20 - windowBox.x;
    const rightFrameTopX = finalFrames[1].left + 20 - windowBox.x;
    const edgeOffsets = [-1, 0, 1, 2];
    function edgeContrastAt(y) {
      const gap = luminance(screenshot.getPixel(gapCenterX, y));
      const frame = Math.max(
        luminance(screenshot.getPixel(leftFrameTopX, y)),
        luminance(screenshot.getPixel(rightFrameTopX, y))
      );
      return gap - frame;
    }
    const topEdgeContrast = Math.max(
      ...edgeOffsets.map((offset) => edgeContrastAt(topY + offset))
    );
    const bottomEdgeContrast = Math.max(
      ...edgeOffsets.map((offset) => edgeContrastAt(bottomY + offset))
    );

    expect(
      topEdgeContrast,
      "the Window body must not draw a continuous dark top stroke over the split gap"
    ).toBeGreaterThan(24);
    expect(
      bottomEdgeContrast,
      "the Window body must not draw a continuous dark bottom stroke over the split gap"
    ).toBeGreaterThan(24);
  });
});

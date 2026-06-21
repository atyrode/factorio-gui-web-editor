import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { strFromU8, unzipSync } from "fflate";

const EDITOR_STORAGE_KEY = "labtorio.editorState.v1";
const FACTORIO_PREVIEW_MOD_FOLDER = "labtorio_gui_preview_0.1.0";
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
    await expect(tree.getByText("Window body Horizontal Flow")).toBeVisible();
    await expect(tree.getByText("gui_window_body", { exact: true })).toBeVisible();
    await expect(tree.getByRole("button", { name: "Frame", exact: true }))
      .toBeVisible();
    await expect(page.locator('[data-anchor="builder_lua_variable_gui_frame_1"]'))
      .toBeVisible();
    await expect(tree.getByText("gui_frame_1", { exact: true })).toBeVisible();
  });

  test("settings toggle switches component tree between body flow and generated shell", async ({ page }) => {
    await seedOneFrameWindow(page);

    const tree = page.locator('[data-anchor="builder_body_tree"]');
    await expect(tree.getByText("Window Frame")).toHaveCount(0);

    await page.locator('[data-anchor="layout_settings_toggle"]').click();
    const shellToggle = page.locator('[data-anchor="component_tree_shell_toggle"] input');
    await expect(shellToggle).not.toBeChecked();
    await shellToggle.click({ force: true });

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

  test("drag-created Horizontal Flow keeps horizontal child layout", async ({ page }) => {
    await seedOneFrameWindow(page);

    await dragHorizontalFlowPaletteToFrame(page);
    await page.locator('[data-anchor="frame_palette_item"]').dragTo(
      page.locator('[data-anchor="gui_horizontal_flow_2"]'),
      { targetPosition: { x: 20, y: 24 } }
    );
    await page.locator('[data-anchor="frame_palette_item"]').dragTo(
      page.locator('[data-anchor="gui_horizontal_flow_2"]'),
      { targetPosition: { x: 120, y: 24 } }
    );

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

    await expect(page.locator('[data-anchor="gui_shadow_toggle"] input')).toBeChecked();
    expect(shadowOn.root).not.toBe("none");
    expect(shadowOn.body).toBe("none");
    expect(shadowOn.frame).toBe("none");
    expect(shadowOn.frameBevel).toContain("inset");

    await page.locator('[data-anchor="gui_shadow_toggle"] input').click({ force: true });
    await expect(page.locator('[data-anchor="gui_shadow_toggle"] input')).not.toBeChecked();
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
    await page.locator('[data-anchor="resize_mode_toggle"] input').click({ force: true });

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

  test("resize mode updates Window width and height through exported style fields", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_window", { showLuaOutput: true })
    );
    await page.locator('[data-anchor="resize_mode_toggle"] input').click({ force: true });

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
    const zipEntries = unzipSync(new Uint8Array(await readFile(downloadPath)));
    const guiLua = strFromU8(zipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/gui.lua`]);
    const controlLua = strFromU8(zipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/control.lua`]);
    const infoJson = JSON.parse(
      strFromU8(zipEntries[`${FACTORIO_PREVIEW_MOD_FOLDER}/info.json`])
    );

    expect(infoJson.name).toBe("labtorio_gui_preview");
    expect(infoJson.factorio_version).toBe("2.0");
    expect(controlLua).toContain('local build_gui = require("gui")');
    expect(controlLua).toContain("defines.events.on_player_created");
    expect(controlLua).toContain("defines.events.on_player_joined_game");
    expect(guiLua).toContain('caption = "Machin truc lab"');
    expect(guiLua).toContain('name = "gui_frame_1"');
    expect(guiLua).toContain("gui_frame_1.style.minimal_width = 168");
  });

  test("resize mode marks unsupported generated nodes without mutating state", async ({ page }) => {
    await seedEditorState(
      page,
      stateWithSelection(ONE_FRAME_STATE, "gui_window_title")
    );
    await page.locator('[data-anchor="resize_mode_toggle"] input').click({ force: true });

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
    const gapTop = luminance(screenshot.getPixel(gapCenterX, topY));
    const frameTop = Math.max(
      luminance(screenshot.getPixel(leftFrameTopX, topY)),
      luminance(screenshot.getPixel(rightFrameTopX, topY))
    );
    const gapBottom = luminance(screenshot.getPixel(gapCenterX, bottomY));
    const frameBottom = Math.max(
      luminance(screenshot.getPixel(leftFrameTopX, bottomY)),
      luminance(screenshot.getPixel(rightFrameTopX, bottomY))
    );

    expect(
      gapTop - frameTop,
      "the Window body must not draw a continuous dark top stroke over the split gap"
    ).toBeGreaterThan(24);
    expect(
      gapBottom - frameBottom,
      "the Window body must not draw a continuous dark bottom stroke over the split gap"
    ).toBeGreaterThan(24);
  });
});

import { expect, test } from "@playwright/test";
import { inflateSync } from "node:zlib";

const EDITOR_STORAGE_KEY = "labtorio.editorState.v1";
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

async function dragPaletteToBodyStart(page) {
  const paletteBox = await page.locator('[data-anchor="frame_palette_item"]').boundingBox();
  const bodyBox = await page.locator('[data-anchor="gui_window_body"]').boundingBox();

  expect(paletteBox).not.toBeNull();
  expect(bodyBox).not.toBeNull();

  await page.mouse.move(
    paletteBox.x + paletteBox.width / 2,
    paletteBox.y + paletteBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(paletteBox.x + paletteBox.width / 2 + 12, paletteBox.y + 12, {
    steps: 4
  });
  await expect(page.locator('[data-anchor="builder_drag_preview"]')).toBeVisible();

  await page.mouse.move(bodyBox.x + 8, bodyBox.y + bodyBox.height / 2, { steps: 16 });
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
  const paletteBox = await page.locator('[data-anchor="horizontal_flow_palette_item"]').boundingBox();
  const frameBox = await page.locator('[data-anchor="gui_frame_1"]').boundingBox();

  expect(paletteBox).not.toBeNull();
  expect(frameBox).not.toBeNull();

  await page.mouse.move(
    paletteBox.x + paletteBox.width / 2,
    paletteBox.y + paletteBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(paletteBox.x + paletteBox.width / 2 + 12, paletteBox.y + 12, {
    steps: 4
  });
  await expect(page.locator('[data-anchor="builder_drag_preview"]')).toBeVisible();

  await page.mouse.move(
    frameBox.x + frameBox.width / 2,
    frameBox.y + frameBox.height / 2,
    { steps: 16 }
  );
  await expect(page.locator('[data-anchor="gui_frame_1"] > .fx-gui-flow-drop-preview-slot'))
    .toHaveCount(1);
  await page.mouse.up();
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

async function dragPaletteTileToTreeRow(page, paletteAnchor, targetId) {
  const sourceHandle = page.locator(`[data-anchor="${paletteAnchor}"]`);
  const targetRow = page.locator(`[data-anchor="builder_tree_item_${targetId}"]`);

  await expect(sourceHandle).toBeVisible();
  await expect(targetRow).toBeVisible();

  await page.evaluate(({ paletteAnchor, targetId }) => {
    const source = document.querySelector(`[data-anchor="${paletteAnchor}"]`);
    const target = document.querySelector(`[data-anchor="builder_tree_item_${targetId}"]`);
    if (!source || !target) {
      throw new Error(`Missing tree palette source or target: ${paletteAnchor} -> ${targetId}`);
    }

    const dataTransfer = new DataTransfer();
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

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
  }, { paletteAnchor, targetId });
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

  test("component tree shows the generated Window shell and authored body children", async ({ page }) => {
    await seedOneFrameWindow(page);

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
      showInspector: true
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

    await page.mouse.up();
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

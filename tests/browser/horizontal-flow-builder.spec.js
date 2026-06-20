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

async function seedOneFrameWindow(page) {
  await page.addInitScript(
    ({ key, state }) => {
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    { key: EDITOR_STORAGE_KEY, state: ONE_FRAME_STATE }
  );
  await page.goto("/");
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

test.describe("Frame builder canvas preview", () => {
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

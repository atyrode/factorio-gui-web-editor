import { expect, test } from "@playwright/test";

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
  });
});

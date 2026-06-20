import { expect, test } from "@playwright/test";

const EDITOR_STORAGE_KEY = "labtorio.editorState.v1";
const ONE_FLOW_STATE = {
  title: "Machin truc lab",
  windowSize: { width: 1100, height: 450 },
  currentWindow: {
    title: "Machin truc lab",
    location: null,
    size: { width: 1100, height: 450 },
    layoutChildren: [
      {
        id: "gui_horizontal_flow_1",
        atom: "horizontal-flow",
        styleVariant: "generic-horizontal-flow",
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

async function seedOneFlowWindow(page) {
  await page.addInitScript(
    ({ key, state }) => {
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    { key: EDITOR_STORAGE_KEY, state: ONE_FLOW_STATE }
  );
  await page.goto("/");
  await expect(page.locator('[data-anchor="gui_horizontal_flow_1"]')).toBeVisible();
}

async function dragPaletteToBodyStart(page) {
  const paletteBox = await page.locator('[data-anchor="horizontal_flow_palette_item"]').boundingBox();
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
      '[data-anchor="gui_window_body"] > .fx-gui-flow-drop-preview-slot'
    );
    const previewBefore = window.getComputedStyle(preview, "::before");
    return {
      preview: rect('[data-anchor="gui_window_body"] > .fx-gui-flow-drop-preview-slot'),
      previewGhost: rect('[data-anchor="gui_window_body"] > .fx-gui-flow-drop-preview-slot > .fx-builder-ghost'),
      existing: rect('[data-anchor="gui_horizontal_flow_1"]'),
      previewBeforeLeft: previewBefore.left,
      previewBeforeRight: previewBefore.right,
      dropTargetBackgrounds: Array.from(
        document.querySelectorAll('[data-anchor="gui_window_body"] > .fx-gui-flow-drop-target'),
        (target) => window.getComputedStyle(target).backgroundColor
      )
    };
  });
}

async function measureFinal(page) {
  return page.locator('[data-fx-role="builder-horizontal-flow"]').evaluateAll((elements) =>
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

test.describe("Horizontal Flow builder canvas preview", () => {
  test("matches final geometry when inserting left of one existing flow", async ({ page }) => {
    await seedOneFlowWindow(page);
    await dragPaletteToBodyStart(page);

    const hover = await measureHover(page);
    expectRectClose(
      hover.preview,
      hover.previewGhost,
      "the visible ghost should occupy the same bounds as the layout preview slot"
    );
    expectRectClose(
      hover.preview,
      hover.existing,
      "hover preview and shifted existing flow should split the body equally"
    );
    expect(hover.previewBeforeLeft).toBe("0px");
    expect(hover.previewBeforeRight).toBe("0px");
    expect(new Set(hover.dropTargetBackgrounds)).toEqual(new Set(["rgba(0, 0, 0, 0)"]));

    await page.mouse.up();
    await expect(page.locator('[data-fx-role="builder-horizontal-flow"]')).toHaveCount(2);
    const finalFlows = await measureFinal(page);

    expect(finalFlows.map((flow) => flow.id)).toEqual([
      "gui_horizontal_flow_2",
      "gui_horizontal_flow_1"
    ]);
    expectRectClose(hover.preview, finalFlows[0], "hover preview should match dropped flow");
    expectRectClose(
      hover.existing,
      finalFlows[1],
      "hover-shifted existing flow should match final existing flow"
    );
  });
});

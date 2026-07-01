import assert from "node:assert/strict";
import test from "node:test";

import {
  FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
  assertFactorioBehaviorHooks,
  collectFactorioHookElementIds,
  normalizeFactorioBehaviorHooks
} from "../../src/factorioBehaviorHooks.js";

test("normalizeFactorioBehaviorHooks normalizes action metadata and derives events", () => {
  const hooks = normalizeFactorioBehaviorHooks({
    schema: FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
    actions: [
      {
        id: "confirm_dispatch",
        elementId: "gui_label_2",
        event: "on_gui_click",
        label: " Confirm dispatch ",
        description: " User-owned handler "
      }
    ]
  }, {
    validElementIds: ["gui_label_2"]
  });

  assert.deepEqual(hooks, {
    schema: FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
    actions: [
      {
        id: "confirm_dispatch",
        elementId: "gui_label_2",
        event: "on_gui_click",
        owner: "user",
        label: "Confirm dispatch",
        description: "User-owned handler"
      }
    ],
    events: [
      {
        event: "on_gui_click",
        elementId: "gui_label_2",
        actionId: "confirm_dispatch",
        owner: "user"
      }
    ]
  });
});

test("normalizeFactorioBehaviorHooks drops invalid local hook metadata by default", () => {
  const hooks = normalizeFactorioBehaviorHooks({
    schema: FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
    actions: [
      {
        id: "bad-name",
        elementId: "gui_label_2",
        event: "on_gui_click"
      },
      {
        id: "stale_hook",
        elementId: "missing_node",
        event: "on_gui_click"
      }
    ]
  }, {
    validElementIds: ["gui_label_2"]
  });

  assert.deepEqual(hooks, {
    schema: FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
    actions: [],
    events: []
  });
});

test("assertFactorioBehaviorHooks rejects unsupported schemas and stale references", () => {
  assert.throws(
    () => assertFactorioBehaviorHooks({ schema: "future.v1", actions: [] }),
    /Unsupported behavior hooks schema/
  );
  assert.throws(
    () => assertFactorioBehaviorHooks({
      schema: FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
      actions: [
        {
          id: "confirm_dispatch",
          elementId: "missing_node",
          event: "on_gui_click"
        }
      ]
    }, {
      validElementIds: ["gui_label_2"]
    }),
    /unknown GUI element/
  );
});

test("collectFactorioHookElementIds includes generated chrome and authored layout ids", () => {
  const ids = collectFactorioHookElementIds({
    currentWindow: {
      layoutChildren: [
        {
          id: "gui_frame_1",
          children: [
            {
              id: "gui_label_2",
              children: []
            }
          ]
        }
      ]
    }
  });

  assert.ok(ids.has("gui_window"));
  assert.ok(ids.has("gui_window_body"));
  assert.ok(ids.has("gui_frame_1"));
  assert.ok(ids.has("gui_label_2"));
});

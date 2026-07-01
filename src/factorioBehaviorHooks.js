export const FACTORIO_BEHAVIOR_HOOKS_SCHEMA = "labtorio-gui-hooks.v0";

export const FACTORIO_BEHAVIOR_HOOK_OWNER_USER = "user";
export const FACTORIO_BEHAVIOR_HOOK_OWNER_TOOL = "tool";

export const FACTORIO_BEHAVIOR_HOOK_EVENTS = Object.freeze([
  "on_gui_click",
  "on_gui_checked_state_changed",
  "on_gui_confirmed",
  "on_gui_elem_changed",
  "on_gui_selection_state_changed",
  "on_gui_switch_state_changed",
  "on_gui_text_changed",
  "on_gui_value_changed"
]);

const WINDOW_HOOK_ELEMENT_IDS = Object.freeze([
  "gui_window",
  "gui_window_titlebar",
  "gui_window_title",
  "gui_window_drag_handle",
  "gui_window_body"
]);
const HOOK_ID_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const HOOK_ELEMENT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_:-]{0,127}$/;
const HOOK_INVALID_DROP = "drop";
const HOOK_INVALID_THROW = "throw";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  return text || null;
}

function reportInvalid(message, mode) {
  if (mode === HOOK_INVALID_THROW) {
    throw new Error(message);
  }

  return null;
}

function collectLayoutIdsFromChildren(layoutChildren = [], ids = new Set()) {
  for (const node of layoutChildren) {
    if (typeof node?.id === "string" && node.id) {
      ids.add(node.id);
    }
    collectLayoutIdsFromChildren(node?.children, ids);
  }

  return ids;
}

export function collectFactorioHookElementIds(designState = null) {
  const ids = new Set(WINDOW_HOOK_ELEMENT_IDS);
  const layoutChildren = designState?.currentWindow?.layoutChildren ?? designState?.layoutChildren;
  return collectLayoutIdsFromChildren(layoutChildren, ids);
}

function normalizeHookId(value, mode) {
  const id = normalizeOptionalText(value);
  if (!id || !HOOK_ID_PATTERN.test(id)) {
    return reportInvalid(
      `Invalid behavior hook action id: ${String(value ?? "missing")}.`,
      mode
    );
  }

  return id;
}

function normalizeHookElementId(value, validElementIds, mode) {
  const elementId = normalizeOptionalText(value);
  if (!elementId || !HOOK_ELEMENT_ID_PATTERN.test(elementId)) {
    return reportInvalid(
      `Invalid behavior hook element id: ${String(value ?? "missing")}.`,
      mode
    );
  }

  if (validElementIds && !validElementIds.has(elementId)) {
    return reportInvalid(
      `Behavior hook references unknown GUI element: ${elementId}.`,
      mode
    );
  }

  return elementId;
}

function normalizeHookEvent(value, mode) {
  const event = normalizeOptionalText(value);
  if (!FACTORIO_BEHAVIOR_HOOK_EVENTS.includes(event)) {
    return reportInvalid(
      `Unsupported behavior hook event: ${String(value ?? "missing")}.`,
      mode
    );
  }

  return event;
}

function normalizeHookOwner(value) {
  return value === FACTORIO_BEHAVIOR_HOOK_OWNER_TOOL
    ? FACTORIO_BEHAVIOR_HOOK_OWNER_TOOL
    : FACTORIO_BEHAVIOR_HOOK_OWNER_USER;
}

function normalizeAction(action, { seenActionIds, validElementIds, mode }) {
  if (!isObject(action)) {
    return reportInvalid("Behavior hook actions must be objects.", mode);
  }

  const id = normalizeHookId(action.id, mode);
  const elementId = normalizeHookElementId(action.elementId, validElementIds, mode);
  const event = normalizeHookEvent(action.event, mode);
  if (!id || !elementId || !event) {
    return null;
  }

  if (seenActionIds.has(id)) {
    return reportInvalid(`Duplicate behavior hook action id: ${id}.`, mode);
  }
  seenActionIds.add(id);

  return {
    id,
    elementId,
    event,
    owner: normalizeHookOwner(action.owner),
    ...(normalizeOptionalText(action.label) ? { label: normalizeOptionalText(action.label) } : {}),
    ...(normalizeOptionalText(action.description)
      ? { description: normalizeOptionalText(action.description) }
      : {})
  };
}

function derivedEventForAction(action) {
  return {
    event: action.event,
    elementId: action.elementId,
    actionId: action.id,
    owner: action.owner
  };
}

export function normalizeFactorioBehaviorHooks(value = null, {
  validElementIds = null,
  invalid = HOOK_INVALID_DROP
} = {}) {
  const mode = invalid === HOOK_INVALID_THROW ? HOOK_INVALID_THROW : HOOK_INVALID_DROP;
  const source = isObject(value) ? value : {};

  if (source.schema != null && source.schema !== FACTORIO_BEHAVIOR_HOOKS_SCHEMA) {
    reportInvalid(
      `Unsupported behavior hooks schema: ${String(source.schema)}.`,
      mode
    );
    return {
      schema: FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
      actions: [],
      events: []
    };
  }

  const validIds = validElementIds ? new Set(validElementIds) : null;
  const seenActionIds = new Set();
  const actions = Array.isArray(source.actions)
    ? source.actions
        .map((action) => normalizeAction(action, {
          seenActionIds,
          validElementIds: validIds,
          mode
        }))
        .filter(Boolean)
    : [];

  return {
    schema: FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
    actions,
    events: actions.map(derivedEventForAction)
  };
}

export function assertFactorioBehaviorHooks(value, options = {}) {
  return normalizeFactorioBehaviorHooks(value, {
    ...options,
    invalid: HOOK_INVALID_THROW
  });
}

export function factorioBehaviorHooksEqual(left, right) {
  return JSON.stringify(normalizeFactorioBehaviorHooks(left)) ===
    JSON.stringify(normalizeFactorioBehaviorHooks(right));
}

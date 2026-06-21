const LUA_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const LUA_RESERVED_WORDS = new Set([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "false",
  "for",
  "function",
  "goto",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "until",
  "while"
]);

export const WINDOW_SHELL_LUA_VARIABLE_NODE_IDS = Object.freeze([
  "gui_window",
  "gui_window_titlebar",
  "gui_window_title",
  "gui_window_drag_handle",
  "gui_window_body"
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (typeof value !== "string" || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}

function collectLayoutIds(nodes = [], result = []) {
  for (const node of nodes) {
    if (!isObject(node) || typeof node.id !== "string") {
      continue;
    }
    result.push(node.id);
    collectLayoutIds(node.children, result);
  }
  return result;
}

function validateIdentifier(value) {
  if (!LUA_IDENTIFIER_PATTERN.test(value)) {
    return {
      ok: false,
      message: "Use letters, numbers, and underscores; start with a letter or underscore."
    };
  }

  if (LUA_RESERVED_WORDS.has(value)) {
    return {
      ok: false,
      message: `"${value}" is a Lua reserved word.`
    };
  }

  return { ok: true };
}

export function luaDefaultVariableName(nodeId) {
  let name = String(nodeId ?? "").replace(/[^a-zA-Z0-9_]/g, "_");
  if (!/^[A-Za-z_]/.test(name)) {
    name = `_${name}`;
  }
  if (!name) {
    name = "_";
  }
  return LUA_RESERVED_WORDS.has(name) ? `_${name}` : name;
}

export function collectWindowLuaVariableNodeIds(windowState = {}) {
  return uniqueStrings([
    ...WINDOW_SHELL_LUA_VARIABLE_NODE_IDS,
    ...collectLayoutIds(windowState?.layoutChildren)
  ]);
}

export function normalizeLuaVariableNames(source = {}, nodeIds = []) {
  if (!isObject(source)) {
    return {};
  }

  const ids = uniqueStrings(nodeIds);
  const defaultNames = new Map(ids.map((id) => [id, luaDefaultVariableName(id)]));
  const allDefaultNames = new Set(defaultNames.values());
  const usedNames = new Set();
  const result = {};

  for (const id of ids) {
    const defaultName = defaultNames.get(id);
    const requestedName =
      typeof source[id] === "string" ? source[id].trim() : "";
    let effectiveName = defaultName;

    if (
      requestedName &&
      requestedName !== defaultName &&
      validateIdentifier(requestedName).ok &&
      !usedNames.has(requestedName) &&
      !allDefaultNames.has(requestedName)
    ) {
      result[id] = requestedName;
      effectiveName = requestedName;
    }

    usedNames.add(effectiveName);
  }

  return result;
}

export function luaVariableNameForNode(nodeId, luaVariableNames = {}) {
  const defaultName = luaDefaultVariableName(nodeId);
  const requestedName =
    isObject(luaVariableNames) && typeof luaVariableNames[nodeId] === "string"
      ? luaVariableNames[nodeId].trim()
      : "";

  return requestedName && validateIdentifier(requestedName).ok
    ? requestedName
    : defaultName;
}

export function validateLuaVariableNameEdit(
  rawValue,
  { nodeId, nodeIds = [], luaVariableNames = {} } = {}
) {
  const ids = uniqueStrings(nodeIds);
  if (!ids.includes(nodeId)) {
    return { ok: false, message: "This node is not exported to Lua." };
  }

  const value = String(rawValue ?? "").trim();
  const defaultName = luaDefaultVariableName(nodeId);
  if (!value || value === defaultName) {
    const nextNames = { ...(isObject(luaVariableNames) ? luaVariableNames : {}) };
    delete nextNames[nodeId];
    return {
      ok: true,
      luaVariableNames: normalizeLuaVariableNames(nextNames, ids),
      value: defaultName
    };
  }

  const identifier = validateIdentifier(value);
  if (!identifier.ok) {
    return identifier;
  }

  for (const otherId of ids) {
    if (otherId === nodeId) {
      continue;
    }
    const otherName = luaVariableNameForNode(otherId, luaVariableNames);
    if (otherName === value) {
      return {
        ok: false,
        message: `"${value}" is already used by another exported node.`
      };
    }
  }

  return {
    ok: true,
    luaVariableNames: normalizeLuaVariableNames(
      {
        ...(isObject(luaVariableNames) ? luaVariableNames : {}),
        [nodeId]: value
      },
      ids
    ),
    value
  };
}

import {
  DEFAULT_WINDOW_SIZE,
  FACTORIO_GUI_MODEL_SCHEMA,
  HORIZONTAL_FLOW_DIRECTION,
  normalizeWindowBodyDirection,
  normalizeWindowSize
} from "./factorioModel.js";
import { normalizeLayoutSettings } from "./factorioEditorSettings.js";
import { normalizeLayoutState } from "./factorioLayoutTree.js";
import {
  collectWindowLuaVariableNodeIds,
  normalizeLuaVariableNames
} from "./factorioLuaNames.js";

export const FACTORIO_DESIGN_FILE_CURRENT_SCHEMA = "labtorio-gui-design.v0";
export const FACTORIO_DESIGN_FILE_SCHEMA = FACTORIO_DESIGN_FILE_CURRENT_SCHEMA;
export const FACTORIO_DESIGN_FILE_SUPPORTED_SCHEMAS = Object.freeze([
  FACTORIO_DESIGN_FILE_CURRENT_SCHEMA
]);
export const FACTORIO_DESIGN_FILE_EXTENSION = ".labtorio-gui.json";
export const FACTORIO_DESIGN_FILE_SOURCE = Object.freeze({
  app: "factorio-gui-web-editor",
  modelSchema: FACTORIO_GUI_MODEL_SCHEMA
});

const DEFAULT_DESIGN_TITLE = "Untitled window";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTitle(value, fallback = DEFAULT_DESIGN_TITLE) {
  const title = String(value ?? fallback).trim();
  return title || fallback;
}

function normalizeLocation(location) {
  if (
    !isObject(location) ||
    typeof location.x !== "number" ||
    typeof location.y !== "number" ||
    !Number.isFinite(location.x) ||
    !Number.isFinite(location.y)
  ) {
    return null;
  }

  return {
    x: Math.max(0, Math.round(location.x)),
    y: Math.max(0, Math.round(location.y))
  };
}

export function normalizeDesignWindow(value, fallbackTitle = DEFAULT_DESIGN_TITLE) {
  if (!isObject(value)) {
    return null;
  }

  const size = normalizeWindowSize(value.size ?? DEFAULT_WINDOW_SIZE);
  const layoutState = normalizeLayoutState(value);
  const luaVariableNames = normalizeLuaVariableNames(
    value.luaVariableNames,
    collectWindowLuaVariableNodeIds(layoutState)
  );

  return {
    title: normalizeTitle(value.title, fallbackTitle),
    location: normalizeLocation(value.location),
    size,
    bodyDirection: normalizeWindowBodyDirection(value.bodyDirection),
    layoutChildren: layoutState.layoutChildren,
    nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber,
    luaVariableNames
  };
}

export function normalizeDesignState(value = {}) {
  const source = isObject(value) ? value : {};
  const title = normalizeTitle(source.title);
  const currentWindow = normalizeDesignWindow(source.currentWindow, title);

  return {
    title,
    windowSize: normalizeWindowSize(source.windowSize ?? currentWindow?.size),
    windowBodyDirection: normalizeWindowBodyDirection(
      source.windowBodyDirection ?? currentWindow?.bodyDirection ?? HORIZONTAL_FLOW_DIRECTION
    ),
    currentWindow,
    layoutSettings: normalizeLayoutSettings(source.layoutSettings)
  };
}

function slugFromTitle(title) {
  const slug = normalizeTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "factorio-gui-design";
}

export function createFactorioDesignFile(editorState, { now = new Date() } = {}) {
  const design = normalizeDesignState(editorState);

  return {
    schema: FACTORIO_DESIGN_FILE_SCHEMA,
    exportedAt: now.toISOString(),
    source: FACTORIO_DESIGN_FILE_SOURCE,
    design
  };
}

export function createFactorioDesignFileDownload(editorState, options = {}) {
  const designFile = createFactorioDesignFile(editorState, options);

  return {
    filename: `${slugFromTitle(designFile.design.title)}${FACTORIO_DESIGN_FILE_EXTENSION}`,
    content: `${JSON.stringify(designFile, null, 2)}\n`
  };
}

function assertDesignFileEnvelope(value) {
  if (!isObject(value)) {
    throw new Error("The selected design file must be a JSON object.");
  }

  if (!FACTORIO_DESIGN_FILE_SUPPORTED_SCHEMAS.includes(value.schema)) {
    throw new Error(`Unsupported design file schema: ${String(value.schema ?? "missing")}.`);
  }

  if (!isObject(value.design)) {
    throw new Error("The selected design file is missing its design payload.");
  }
}

export function migrateFactorioDesignFile(value) {
  assertDesignFileEnvelope(value);

  switch (value.schema) {
    case FACTORIO_DESIGN_FILE_CURRENT_SCHEMA:
      return {
        schema: FACTORIO_DESIGN_FILE_CURRENT_SCHEMA,
        exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : null,
        source: isObject(value.source) ? value.source : FACTORIO_DESIGN_FILE_SOURCE,
        design: normalizeDesignState(value.design)
      };
    default:
      throw new Error(`Unsupported design file schema: ${String(value.schema ?? "missing")}.`);
  }
}

export function parseFactorioDesignFileText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The selected design file is not valid JSON.");
  }

  return migrateFactorioDesignFile(parsed).design;
}

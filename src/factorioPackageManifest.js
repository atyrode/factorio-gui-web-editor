import {
  FACTORIO_BEHAVIOR_HOOKS_SCHEMA,
  assertFactorioBehaviorHooks,
  normalizeFactorioBehaviorHooks
} from "./factorioBehaviorHooks.js";

export const FACTORIO_PACKAGE_MANIFEST_SCHEMA = "labtorio-gui-package.v0";
export const FACTORIO_PACKAGE_MANIFEST_ENTRY = "labtorio-gui-package.json";
export const FACTORIO_PACKAGE_HOOKS_SCHEMA = FACTORIO_BEHAVIOR_HOOKS_SCHEMA;

export const FACTORIO_PACKAGE_OWNER_TOOL = "tool";
export const FACTORIO_PACKAGE_OWNER_GENERATED = "generated";
export const FACTORIO_PACKAGE_OWNER_USER = "user";

const PACKAGE_KIND_PREVIEW_MOD = "factorio-preview-mod";
const DEFAULT_PACKAGE_SOURCE = Object.freeze({
  app: "factorio-gui-web-editor",
  packageKind: PACKAGE_KIND_PREVIEW_MOD
});

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeSafeRelativePath(value, fallback) {
  const path = typeof value === "string" ? value.trim() : "";
  const segments = path.split("/");
  if (
    path &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    segments.every((segment) => segment && segment !== "." && segment !== "..")
  ) {
    return path;
  }

  return fallback;
}

function normalizeOwnershipRecord(value) {
  if (!isObject(value)) {
    return null;
  }

  const path = normalizeSafeRelativePath(value.path, null);
  if (!path) {
    return null;
  }

  const owner = [
    FACTORIO_PACKAGE_OWNER_TOOL,
    FACTORIO_PACKAGE_OWNER_GENERATED,
    FACTORIO_PACKAGE_OWNER_USER
  ].includes(value.owner)
    ? value.owner
    : FACTORIO_PACKAGE_OWNER_TOOL;

  return {
    path,
    owner,
    purpose: typeof value.purpose === "string" ? value.purpose.trim() : "",
    editable: Boolean(value.editable)
  };
}

export function createFactorioPackageOwnership({
  manifestEntry = FACTORIO_PACKAGE_MANIFEST_ENTRY,
  designEntry,
  generatedLuaEntry,
  controlEntry,
  infoEntry
}) {
  return Object.freeze([
    {
      path: manifestEntry,
      owner: FACTORIO_PACKAGE_OWNER_TOOL,
      purpose: "Tool-authored package boundary and source metadata.",
      editable: false
    },
    {
      path: designEntry,
      owner: FACTORIO_PACKAGE_OWNER_TOOL,
      purpose: "Canonical editable GUI design payload.",
      editable: false
    },
    {
      path: generatedLuaEntry,
      owner: FACTORIO_PACKAGE_OWNER_GENERATED,
      purpose: "Generated Factorio GUI Lua projection.",
      editable: false
    },
    {
      path: controlEntry,
      owner: FACTORIO_PACKAGE_OWNER_TOOL,
      purpose: "Preview runtime wrapper that loads generated GUI Lua.",
      editable: false
    },
    {
      path: infoEntry,
      owner: FACTORIO_PACKAGE_OWNER_TOOL,
      purpose: "Factorio preview mod metadata.",
      editable: false
    }
  ]);
}

export function createFactorioPackageManifest({
  now = new Date(),
  source = DEFAULT_PACKAGE_SOURCE,
  designEntry,
  designSchema,
  generatedLuaEntry = "gui.lua",
  controlEntry = "control.lua",
  infoEntry = "info.json",
  styleCatalog = null,
  hooks = null,
  validHookElementIds = null
}) {
  const safeDesignEntry = normalizeSafeRelativePath(designEntry, "design.labtorio-gui.json");
  const safeGeneratedLuaEntry = normalizeSafeRelativePath(generatedLuaEntry, "gui.lua");
  const safeControlEntry = normalizeSafeRelativePath(controlEntry, "control.lua");
  const safeInfoEntry = normalizeSafeRelativePath(infoEntry, "info.json");

  return {
    schema: FACTORIO_PACKAGE_MANIFEST_SCHEMA,
    generatedAt: now.toISOString(),
    source: {
      ...DEFAULT_PACKAGE_SOURCE,
      ...(isObject(source) ? source : {})
    },
    entries: {
      design: safeDesignEntry,
      generatedLua: safeGeneratedLuaEntry,
      previewRuntime: safeControlEntry,
      factorioModInfo: safeInfoEntry
    },
    model: {
      designSchema: typeof designSchema === "string" ? designSchema : null,
      ...(styleCatalog ? { styleCatalog } : {})
    },
    ownership: createFactorioPackageOwnership({
      manifestEntry: FACTORIO_PACKAGE_MANIFEST_ENTRY,
      designEntry: safeDesignEntry,
      generatedLuaEntry: safeGeneratedLuaEntry,
      controlEntry: safeControlEntry,
      infoEntry: safeInfoEntry
    }),
    hooks: normalizeFactorioBehaviorHooks(hooks, { validElementIds: validHookElementIds })
  };
}

export function renderFactorioPackageManifestJson(options = {}) {
  return `${JSON.stringify(createFactorioPackageManifest(options), null, 2)}\n`;
}

export function parseFactorioPackageManifestText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The package manifest is not valid JSON.");
  }

  if (!isObject(parsed)) {
    throw new Error("The package manifest must be a JSON object.");
  }

  if (parsed.schema !== FACTORIO_PACKAGE_MANIFEST_SCHEMA) {
    throw new Error(`Unsupported package manifest schema: ${String(parsed.schema ?? "missing")}.`);
  }

  const entries = isObject(parsed.entries) ? parsed.entries : {};
  const designEntry = normalizeSafeRelativePath(entries.design, null);
  if (!designEntry) {
    throw new Error("The package manifest is missing a valid design entry.");
  }

  return {
    schema: FACTORIO_PACKAGE_MANIFEST_SCHEMA,
    generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : null,
    source: isObject(parsed.source) ? parsed.source : DEFAULT_PACKAGE_SOURCE,
    entries: {
      design: designEntry,
      generatedLua: normalizeSafeRelativePath(entries.generatedLua, "gui.lua"),
      previewRuntime: normalizeSafeRelativePath(entries.previewRuntime, "control.lua"),
      factorioModInfo: normalizeSafeRelativePath(entries.factorioModInfo, "info.json")
    },
    model: isObject(parsed.model) ? parsed.model : {},
    ownership: Array.isArray(parsed.ownership)
      ? parsed.ownership.map(normalizeOwnershipRecord).filter(Boolean)
      : [],
    hooks: assertFactorioBehaviorHooks(parsed.hooks)
  };
}

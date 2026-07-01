import assert from "node:assert/strict";
import test from "node:test";

import {
  FACTORIO_PACKAGE_HOOKS_SCHEMA,
  FACTORIO_PACKAGE_MANIFEST_ENTRY,
  FACTORIO_PACKAGE_MANIFEST_SCHEMA,
  FACTORIO_PACKAGE_OWNER_GENERATED,
  FACTORIO_PACKAGE_OWNER_TOOL,
  createFactorioPackageManifest,
  parseFactorioPackageManifestText,
  renderFactorioPackageManifestJson
} from "../../src/factorioPackageManifest.js";

test("createFactorioPackageManifest records package ownership and reserved hooks", () => {
  const manifest = createFactorioPackageManifest({
    now: new Date("2026-07-01T12:34:56Z"),
    designEntry: "design.labtorio-gui.json",
    designSchema: "labtorio-gui-design.v0",
    styleCatalog: {
      schema: "factorio-style-catalog.v0",
      source: "factorio-style-catalog"
    }
  });

  assert.equal(manifest.schema, FACTORIO_PACKAGE_MANIFEST_SCHEMA);
  assert.equal(manifest.generatedAt, "2026-07-01T12:34:56.000Z");
  assert.equal(manifest.entries.design, "design.labtorio-gui.json");
  assert.equal(manifest.entries.generatedLua, "gui.lua");
  assert.equal(manifest.model.designSchema, "labtorio-gui-design.v0");
  assert.deepEqual(manifest.model.styleCatalog, {
    schema: "factorio-style-catalog.v0",
    source: "factorio-style-catalog"
  });
  assert.deepEqual(manifest.hooks, {
    schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
    actions: [],
    events: [],
    reserved: true
  });
  assert.ok(
    manifest.ownership.some(
      (entry) =>
        entry.path === FACTORIO_PACKAGE_MANIFEST_ENTRY &&
        entry.owner === FACTORIO_PACKAGE_OWNER_TOOL &&
        entry.editable === false
    )
  );
  assert.ok(
    manifest.ownership.some(
      (entry) =>
        entry.path === "gui.lua" &&
        entry.owner === FACTORIO_PACKAGE_OWNER_GENERATED &&
        entry.editable === false
    )
  );
});

test("parseFactorioPackageManifestText normalizes supported manifests", () => {
  const parsed = parseFactorioPackageManifestText(renderFactorioPackageManifestJson({
    now: new Date("2026-07-01T12:34:56Z"),
    designEntry: "design.labtorio-gui.json",
    designSchema: "labtorio-gui-design.v0"
  }));

  assert.equal(parsed.schema, FACTORIO_PACKAGE_MANIFEST_SCHEMA);
  assert.equal(parsed.entries.design, "design.labtorio-gui.json");
  assert.equal(parsed.entries.previewRuntime, "control.lua");
  assert.equal(parsed.hooks.schema, FACTORIO_PACKAGE_HOOKS_SCHEMA);
});

test("parseFactorioPackageManifestText rejects invalid manifests", () => {
  assert.throws(
    () => parseFactorioPackageManifestText("{"),
    /not valid JSON/
  );
  assert.throws(
    () => parseFactorioPackageManifestText(JSON.stringify({
      schema: "future.package.v1",
      entries: { design: "design.labtorio-gui.json" }
    })),
    /Unsupported package manifest schema/
  );
  assert.throws(
    () => parseFactorioPackageManifestText(JSON.stringify({
      schema: FACTORIO_PACKAGE_MANIFEST_SCHEMA,
      entries: { design: "../design.labtorio-gui.json" }
    })),
    /missing a valid design entry/
  );
});

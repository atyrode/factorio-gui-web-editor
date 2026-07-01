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

test("createFactorioPackageManifest records package ownership and hook metadata", () => {
  const manifest = createFactorioPackageManifest({
    now: new Date("2026-07-01T12:34:56Z"),
    designEntry: "design.labtorio-gui.json",
    designSchema: "labtorio-gui-design.v0",
    styleCatalog: {
      schema: "factorio-style-catalog.v0",
      source: "factorio-style-catalog"
    },
    validHookElementIds: ["gui_label_2"],
    hooks: {
      schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
      actions: [
        {
          id: "confirm_dispatch",
          elementId: "gui_label_2",
          event: "on_gui_click",
          label: "Confirm dispatch",
          description: "User-owned click handler."
        }
      ]
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
    actions: [
      {
        id: "confirm_dispatch",
        elementId: "gui_label_2",
        event: "on_gui_click",
        owner: "user",
        label: "Confirm dispatch",
        description: "User-owned click handler."
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
  assert.deepEqual(parsed.hooks, {
    schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
    actions: [],
    events: []
  });
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
  assert.throws(
    () => parseFactorioPackageManifestText(JSON.stringify({
      schema: FACTORIO_PACKAGE_MANIFEST_SCHEMA,
      entries: { design: "design.labtorio-gui.json" },
      hooks: { schema: "future-hooks.v1", actions: [] }
    })),
    /Unsupported behavior hooks schema/
  );
  assert.throws(
    () => parseFactorioPackageManifestText(JSON.stringify({
      schema: FACTORIO_PACKAGE_MANIFEST_SCHEMA,
      entries: { design: "design.labtorio-gui.json" },
      hooks: {
        schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
        actions: [
          {
            id: "bad-name",
            elementId: "gui_label_2",
            event: "on_gui_click"
          }
        ]
      }
    })),
    /Invalid behavior hook action id/
  );
});

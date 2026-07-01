import assert from "node:assert/strict";
import test from "node:test";
import { strToU8, zipSync } from "fflate";

import {
  FACTORIO_DESIGN_FILE_CURRENT_SCHEMA,
  FACTORIO_DESIGN_FILE_EXTENSION,
  FACTORIO_DESIGN_FILE_PACKAGE_ENTRY,
  FACTORIO_DESIGN_FILE_SOURCE,
  createFactorioDesignFileDownload,
  migrateFactorioDesignFile,
  parseFactorioDesignFilePackage,
  parseFactorioDesignFileText,
  readFactorioDesignFilePackage
} from "../../src/factorioDesignFile.js";
import {
  FACTORIO_PACKAGE_HOOKS_SCHEMA,
  FACTORIO_PACKAGE_MANIFEST_ENTRY,
  renderFactorioPackageManifestJson
} from "../../src/factorioPackageManifest.js";

function roughDesignState() {
  return {
    title: "  Train Dispatch  ",
    windowSize: { width: 9999, height: 10 },
    windowBodyDirection: "vertical",
    currentWindow: {
      title: "  Train Dispatch  ",
      location: { x: 14.7, y: -9 },
      size: { width: 9999, height: 10 },
      bodyDirection: "vertical",
      layoutChildren: [
        {
          id: "legacy_frame",
          atom: "frame",
          styleVariant: "legacy",
          children: [
            {
              id: "gui_label_2",
              atom: "label",
              caption: "  Departures  ",
              children: [
                {
                  id: "gui_frame_99",
                  atom: "frame",
                  children: []
                }
              ]
            },
            {
              id: "bad_atom_3",
              atom: "unknown",
              children: []
            }
          ]
        }
      ],
      nextLayoutNodeNumber: -5,
      luaVariableNames: {
        gui_frame_1: "main_frame",
        gui_label_2: "bad-name"
      }
    },
    layoutSettings: {
      horizontalFlowSpacing: 999
    },
    transientDrawerState: true
  };
}

test("createFactorioDesignFileDownload serializes a normalized durable design", () => {
  const { filename, content } = createFactorioDesignFileDownload(roughDesignState(), {
    now: new Date("2026-07-01T12:34:56Z")
  });
  const designFile = JSON.parse(content);

  assert.equal(filename, `train-dispatch${FACTORIO_DESIGN_FILE_EXTENSION}`);
  assert.equal(designFile.schema, FACTORIO_DESIGN_FILE_CURRENT_SCHEMA);
  assert.equal(designFile.exportedAt, "2026-07-01T12:34:56.000Z");
  assert.deepEqual(designFile.source, FACTORIO_DESIGN_FILE_SOURCE);
  assert.equal(designFile.design.title, "Train Dispatch");
  assert.deepEqual(designFile.design.windowSize, { width: 1600, height: 180 });
  assert.equal(designFile.design.windowBodyDirection, "vertical");
  assert.equal(designFile.design.transientDrawerState, undefined);

  const frame = designFile.design.currentWindow.layoutChildren[0];
  assert.equal(frame.id, "gui_frame_1");
  assert.equal(frame.atom, "frame");
  assert.equal(frame.styleVariant, "inside-deep-frame");
  assert.equal(frame.children.length, 1);
  assert.equal(frame.children[0].id, "gui_label_2");
  assert.equal(frame.children[0].caption, "Departures");
  assert.deepEqual(designFile.design.currentWindow.location, { x: 15, y: 0 });
  assert.deepEqual(designFile.design.currentWindow.luaVariableNames, {
    gui_frame_1: "main_frame"
  });
  assert.equal(designFile.design.layoutSettings.horizontalFlowSpacing, 64);
  assert.deepEqual(designFile.design.hooks, {
    schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
    actions: [],
    events: []
  });
});

test("createFactorioDesignFileDownload serializes normalized behavior hooks", () => {
  const { content } = createFactorioDesignFileDownload({
    ...roughDesignState(),
    hooks: {
      schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
      actions: [
        {
          id: "open_dispatch",
          elementId: "gui_label_2",
          event: "on_gui_click",
          label: "Open dispatch"
        },
        {
          id: "stale_hook",
          elementId: "missing_node",
          event: "on_gui_click"
        }
      ]
    }
  });
  const designFile = JSON.parse(content);

  assert.deepEqual(designFile.design.hooks, {
    schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
    actions: [
      {
        id: "open_dispatch",
        elementId: "gui_label_2",
        event: "on_gui_click",
        owner: "user",
        label: "Open dispatch"
      }
    ],
    events: [
      {
        event: "on_gui_click",
        elementId: "gui_label_2",
        actionId: "open_dispatch",
        owner: "user"
      }
    ]
  });
});

test("createFactorioDesignFileDownload serializes normalized agent provenance", () => {
  const { content } = createFactorioDesignFileDownload({
    ...roughDesignState(),
    provenance: {
      schema: "labtorio-agent-provenance.v0",
      entries: [
        {
          at: "2026-07-01T12:34:56Z",
          author: "agent",
          label: "Codex",
          commandTypes: ["createWindow", "insertAtom", "insertAtom"],
          touchedNodeIds: ["gui_label_2", "gui_label_2", ""],
          summary: "Created initial draft."
        }
      ]
    }
  });
  const designFile = JSON.parse(content);

  assert.deepEqual(designFile.design.provenance, {
    schema: "labtorio-agent-provenance.v0",
    entries: [
      {
        at: "2026-07-01T12:34:56.000Z",
        author: "agent",
        label: "Codex",
        commandTypes: ["createWindow", "insertAtom"],
        touchedNodeIds: ["gui_label_2"],
        summary: "Created initial draft."
      }
    ]
  });
});

test("parseFactorioDesignFileText returns migrated normalized design state", () => {
  const migrated = parseFactorioDesignFileText(JSON.stringify({
    schema: FACTORIO_DESIGN_FILE_CURRENT_SCHEMA,
    exportedAt: "2026-07-01T00:00:00Z",
    source: FACTORIO_DESIGN_FILE_SOURCE,
    design: roughDesignState()
  }));

  assert.equal(migrated.title, "Train Dispatch");
  assert.equal(migrated.currentWindow.layoutChildren[0].id, "gui_frame_1");
  assert.equal(migrated.currentWindow.layoutChildren[0].children[0].id, "gui_label_2");
  assert.equal(migrated.currentWindow.layoutChildren[0].children[0].children.length, 0);
});

test("parseFactorioDesignFilePackage imports manifest-backed package design files", () => {
  const { content } = createFactorioDesignFileDownload({
    ...roughDesignState(),
    hooks: {
      schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
      actions: [
        {
          id: "open_dispatch",
          elementId: "gui_label_2",
          event: "on_gui_click"
        }
      ]
    }
  }, {
    now: new Date("2026-07-01T12:34:56Z")
  });
  const zip = zipSync({
    [`labtorio_gui_preview_0.1.0/${FACTORIO_PACKAGE_MANIFEST_ENTRY}`]: strToU8(
      renderFactorioPackageManifestJson({
        now: new Date("2026-07-01T12:34:56Z"),
        designEntry: FACTORIO_DESIGN_FILE_PACKAGE_ENTRY,
        designSchema: FACTORIO_DESIGN_FILE_CURRENT_SCHEMA,
        hooks: JSON.parse(content).design.hooks
      })
    ),
    [`labtorio_gui_preview_0.1.0/${FACTORIO_DESIGN_FILE_PACKAGE_ENTRY}`]: strToU8(content),
    "labtorio_gui_preview_0.1.0/gui.lua": strToU8("-- generated lua projection")
  });

  const result = readFactorioDesignFilePackage(zip);

  assert.equal(result.manifest.entries.design, FACTORIO_DESIGN_FILE_PACKAGE_ENTRY);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.design.title, "Train Dispatch");
  assert.equal(result.design.currentWindow.layoutChildren[0].id, "gui_frame_1");
  assert.equal(result.design.currentWindow.layoutChildren[0].children[0].id, "gui_label_2");
  assert.deepEqual(result.design.hooks.actions, [
    {
      id: "open_dispatch",
      elementId: "gui_label_2",
      event: "on_gui_click",
      owner: "user"
    }
  ]);
});

test("parseFactorioDesignFilePackage preserves manifest hook metadata when design hooks are absent", () => {
  const { content } = createFactorioDesignFileDownload(roughDesignState(), {
    now: new Date("2026-07-01T12:34:56Z")
  });
  const zip = zipSync({
    [`labtorio_gui_preview_0.1.0/${FACTORIO_PACKAGE_MANIFEST_ENTRY}`]: strToU8(
      renderFactorioPackageManifestJson({
        now: new Date("2026-07-01T12:34:56Z"),
        designEntry: FACTORIO_DESIGN_FILE_PACKAGE_ENTRY,
        designSchema: FACTORIO_DESIGN_FILE_CURRENT_SCHEMA,
        hooks: {
          schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
          actions: [
            {
              id: "open_dispatch",
              elementId: "gui_label_2",
              event: "on_gui_click"
            }
          ]
        }
      })
    ),
    [`labtorio_gui_preview_0.1.0/${FACTORIO_DESIGN_FILE_PACKAGE_ENTRY}`]: strToU8(content)
  });

  const result = readFactorioDesignFilePackage(zip);

  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /imported the manifest hook metadata/);
  assert.deepEqual(result.design.hooks.actions, [
    {
      id: "open_dispatch",
      elementId: "gui_label_2",
      event: "on_gui_click",
      owner: "user"
    }
  ]);
});

test("parseFactorioDesignFilePackage imports legacy design-only zips with a warning", () => {
  const { content } = createFactorioDesignFileDownload(roughDesignState(), {
    now: new Date("2026-07-01T12:34:56Z")
  });
  const zip = zipSync({
    [`labtorio_gui_preview_0.1.0/${FACTORIO_DESIGN_FILE_PACKAGE_ENTRY}`]: strToU8(content),
    "labtorio_gui_preview_0.1.0/gui.lua": strToU8("-- generated lua projection")
  });

  const result = readFactorioDesignFilePackage(zip);

  assert.equal(parseFactorioDesignFilePackage(zip).title, "Train Dispatch");
  assert.equal(result.manifest, null);
  assert.equal(result.design.title, "Train Dispatch");
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /no labtorio-gui-package\.json/);
});

test("parseFactorioDesignFilePackage rejects invalid package envelopes", () => {
  assert.throws(
    () => parseFactorioDesignFilePackage(strToU8("not a zip")),
    /zip could not be read/
  );

  assert.throws(
    () => parseFactorioDesignFilePackage(zipSync({
      "labtorio_gui_preview_0.1.0/gui.lua": strToU8("-- generated lua projection")
    })),
    /does not contain labtorio-gui-package\.json or design\.labtorio-gui\.json/
  );

  assert.throws(
    () => parseFactorioDesignFilePackage(zipSync({
      [FACTORIO_DESIGN_FILE_PACKAGE_ENTRY]: strToU8("{}"),
      [`nested/${FACTORIO_DESIGN_FILE_PACKAGE_ENTRY}`]: strToU8("{}")
    })),
    /contains multiple design\.labtorio-gui\.json/
  );

  assert.throws(
    () => parseFactorioDesignFilePackage(zipSync({
      [`labtorio_gui_preview_0.1.0/${FACTORIO_PACKAGE_MANIFEST_ENTRY}`]: strToU8(
        renderFactorioPackageManifestJson({
          designEntry: FACTORIO_DESIGN_FILE_PACKAGE_ENTRY,
          designSchema: FACTORIO_DESIGN_FILE_CURRENT_SCHEMA
        })
      )
    })),
    /manifest points to missing design\.labtorio-gui\.json/
  );

  const { content } = createFactorioDesignFileDownload(roughDesignState());
  assert.throws(
    () => parseFactorioDesignFilePackage(zipSync({
      [`labtorio_gui_preview_0.1.0/${FACTORIO_PACKAGE_MANIFEST_ENTRY}`]: strToU8(
        renderFactorioPackageManifestJson({
          designEntry: FACTORIO_DESIGN_FILE_PACKAGE_ENTRY,
          designSchema: FACTORIO_DESIGN_FILE_CURRENT_SCHEMA,
          hooks: {
            schema: FACTORIO_PACKAGE_HOOKS_SCHEMA,
            actions: [
              {
                id: "missing_target",
                elementId: "gui_label_404",
                event: "on_gui_click"
              }
            ]
          }
        })
      ),
      [`labtorio_gui_preview_0.1.0/${FACTORIO_DESIGN_FILE_PACKAGE_ENTRY}`]: strToU8(content)
    })),
    /unknown GUI element/
  );
});

test("migrateFactorioDesignFile preserves current-schema metadata", () => {
  const migrated = migrateFactorioDesignFile({
    schema: FACTORIO_DESIGN_FILE_CURRENT_SCHEMA,
    exportedAt: "2026-07-01T00:00:00Z",
    source: { app: "test", modelSchema: "test.v0" },
    design: roughDesignState()
  });

  assert.equal(migrated.schema, FACTORIO_DESIGN_FILE_CURRENT_SCHEMA);
  assert.equal(migrated.exportedAt, "2026-07-01T00:00:00Z");
  assert.deepEqual(migrated.source, { app: "test", modelSchema: "test.v0" });
  assert.equal(migrated.design.title, "Train Dispatch");
});

test("parseFactorioDesignFileText rejects invalid envelopes", () => {
  assert.throws(
    () => parseFactorioDesignFileText("{"),
    /not valid JSON/
  );
  assert.throws(
    () => parseFactorioDesignFileText(JSON.stringify({ schema: "future.v1", design: {} })),
    /Unsupported design file schema/
  );
  assert.throws(
    () => parseFactorioDesignFileText(JSON.stringify({ schema: FACTORIO_DESIGN_FILE_CURRENT_SCHEMA })),
    /missing its design payload/
  );
});

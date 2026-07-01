import assert from "node:assert/strict";
import test from "node:test";

import {
  FACTORIO_DESIGN_FILE_CURRENT_SCHEMA,
  FACTORIO_DESIGN_FILE_EXTENSION,
  FACTORIO_DESIGN_FILE_SOURCE,
  createFactorioDesignFileDownload,
  migrateFactorioDesignFile,
  parseFactorioDesignFileText
} from "../../src/factorioDesignFile.js";

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

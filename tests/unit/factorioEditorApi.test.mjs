import assert from "node:assert/strict";
import test from "node:test";

import {
  FACTORIO_EDITOR_API_COMMANDS,
  FACTORIO_EDITOR_API_DIRECTIONS,
  FACTORIO_EDITOR_API_SCHEMA,
  runFactorioEditorCommand,
  runFactorioEditorCommands,
  validateFactorioEditorApiState
} from "../../src/factorioEditorApi.js";
import { BODY_LAYOUT_ROOT_ID } from "../../src/factorioLayoutTree.js";

test("runFactorioEditorCommands builds a reviewable layout through structured commands", () => {
  const result = runFactorioEditorCommands({}, [
    {
      type: FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW,
      title: "Scripted Window",
      size: { width: 720, height: 480 },
      bodyDirection: FACTORIO_EDITOR_API_DIRECTIONS.VERTICAL
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM,
      atom: "frame",
      parentId: BODY_LAYOUT_ROOT_ID
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM,
      atom: "horizontal-flow",
      parentId: "gui_frame_1"
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM,
      atom: "label",
      parentId: "gui_horizontal_flow_2"
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.EDIT_CAPTION,
      nodeId: "gui_label_3",
      caption: "Dispatch"
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM,
      atom: "filler",
      parentId: "gui_horizontal_flow_2"
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.MOVE_ATOM,
      nodeId: "gui_filler_4",
      parentId: BODY_LAYOUT_ROOT_ID,
      index: 0
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.RESIZE_NODE,
      nodeId: "gui_frame_1",
      minimalWidth: 220,
      minimalHeight: 140
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.SET_LUA_VARIABLE_NAME,
      nodeId: "gui_label_3",
      name: "dispatch_label"
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.EXPORT_LUA
    }
  ]);

  assert.equal(result.schema, FACTORIO_EDITOR_API_SCHEMA);
  assert.equal(result.ok, true);
  assert.equal(result.mutated, true);
  assert.equal(result.state.title, "Scripted Window");
  assert.equal(result.state.currentWindow.bodyDirection, "vertical");
  assert.equal(result.state.currentWindow.layoutChildren[0].id, "gui_filler_4");
  assert.equal(result.state.currentWindow.layoutChildren[1].id, "gui_frame_1");
  assert.deepEqual(result.state.currentWindow.layoutChildren[1].size, {
    minimalWidth: 220,
    minimalHeight: 140
  });
  assert.equal(result.state.currentWindow.luaVariableNames.gui_label_3, "dispatch_label");
  assert.match(result.results.at(-1).exports.lua, /local dispatch_label =/);
  assert.match(result.results.at(-1).exports.lua, /caption = "Dispatch"/);
});

test("runFactorioEditorCommands keeps batches atomic when validation fails", () => {
  const result = runFactorioEditorCommands({}, [
    {
      type: FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW,
      title: "Partial"
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM,
      atom: "unknown-widget",
      parentId: BODY_LAYOUT_ROOT_ID
    }
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.mutated, false);
  assert.equal(result.state.currentWindow, null);
  assert.equal(result.diagnostics[0].code, "unsupported_atom");
  assert.equal(result.diagnostics[0].commandIndex, 1);
});

test("runFactorioEditorCommand surfaces validation errors without throwing", () => {
  const created = runFactorioEditorCommand({}, {
    type: FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW
  });
  const label = runFactorioEditorCommand(created.state, {
    type: FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM,
    atom: "label",
    parentId: BODY_LAYOUT_ROOT_ID
  });
  const resize = runFactorioEditorCommand(label.state, {
    type: FACTORIO_EDITOR_API_COMMANDS.RESIZE_NODE,
    nodeId: "gui_label_1",
    minimalWidth: 200
  });

  assert.equal(resize.ok, false);
  assert.equal(resize.diagnostics[0].code, "unsupported_resize");
});

test("design import and export commands avoid localStorage coupling", () => {
  const built = runFactorioEditorCommands({}, [
    {
      type: FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW,
      title: "Importable"
    },
    {
      type: FACTORIO_EDITOR_API_COMMANDS.EXPORT_DESIGN_FILE
    }
  ]);
  const designExport = built.results.at(-1).value;
  const imported = runFactorioEditorCommand({}, {
    type: FACTORIO_EDITOR_API_COMMANDS.IMPORT_DESIGN_FILE,
    text: designExport.content
  });

  assert.equal(imported.ok, true);
  assert.equal(imported.state.title, "Importable");
  assert.equal(designExport.filename, "importable.labtorio-gui.json");
});

test("validateFactorioEditorApiState returns structured diagnostics", () => {
  assert.deepEqual(validateFactorioEditorApiState({}), [
    {
      severity: "warning",
      code: "missing_window",
      message: "Create a Window before exporting Lua or a preview mod."
    }
  ]);

  const diagnostics = validateFactorioEditorApiState({
    hooks: {
      schema: "labtorio-gui-hooks.v0",
      actions: [
        {
          id: "missing_target",
          elementId: "missing_node",
          event: "on_gui_click"
        }
      ]
    }
  });

  assert.equal(diagnostics[0].code, "missing_window");
  assert.equal(diagnostics[1].code, "invalid_hooks");
});

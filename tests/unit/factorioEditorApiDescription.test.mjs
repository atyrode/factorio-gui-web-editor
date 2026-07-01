import assert from "node:assert/strict";
import test from "node:test";

import {
  FACTORIO_EDITOR_API_DESCRIPTION_SCHEMA,
  FACTORIO_EDITOR_API_RUNNER_OUTPUTS,
  describeFactorioEditorApi
} from "../../src/factorioEditorApiDescription.js";
import { FACTORIO_EDITOR_API_COMMANDS } from "../../src/factorioEditorApi.js";
import {
  BODY_LAYOUT_ROOT_ID,
  BUILDER_PALETTE_ATOMS,
  FRAME_ATOM_ID,
  HORIZONTAL_FLOW_ATOM_ID
} from "../../src/factorioLayoutTree.js";

test("describeFactorioEditorApi returns command, runner, and layout constraints", () => {
  const description = describeFactorioEditorApi();

  assert.equal(description.schema, FACTORIO_EDITOR_API_DESCRIPTION_SCHEMA);
  assert.equal(description.boundary.remoteServer, false);
  assert.equal(description.boundary.perEditProvenance, false);
  assert.deepEqual(description.layout.paletteAtoms, BUILDER_PALETTE_ATOMS);
  assert.deepEqual(
    description.layout.parents[BODY_LAYOUT_ROOT_ID].allowedChildren,
    BUILDER_PALETTE_ATOMS
  );
  assert.deepEqual(
    description.layout.parents[FRAME_ATOM_ID].allowedChildren,
    BUILDER_PALETTE_ATOMS
  );
  assert.equal(description.layout.atoms[FRAME_ATOM_ID].resizable, true);
  assert.equal(description.layout.atoms[HORIZONTAL_FLOW_ATOM_ID].canHaveChildren, true);

  assert.deepEqual(
    new Set(Object.keys(description.commands)),
    new Set(Object.values(FACTORIO_EDITOR_API_COMMANDS))
  );
  assert.equal(description.commands[FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM].mutating, true);
  assert.equal(description.commands[FACTORIO_EDITOR_API_COMMANDS.VALIDATE].readOnly, true);
  assert.deepEqual(
    description.commands[FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM]
      .fields.find((field) => field.name === "atom")
      .values,
    BUILDER_PALETTE_ATOMS
  );
  assert.deepEqual(new Set(Object.keys(description.runner.outputFlags)), new Set([
    "design",
    "lua",
    "modZip",
    "result"
  ]));
  assert.equal(description.runner.outputFlags.lua.flag, FACTORIO_EDITOR_API_RUNNER_OUTPUTS.lua.flag);
});

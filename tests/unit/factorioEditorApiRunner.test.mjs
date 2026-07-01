import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const RUNNER = fileURLToPath(new URL("../../scripts/editor-api.mjs", import.meta.url));

function runApiRunner(args) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [RUNNER, ...args],
      {
        cwd: ROOT,
        maxBuffer: 1024 * 1024 * 4
      },
      (error, stdout, stderr) => {
        resolve({
          code: error?.code ?? 0,
          stdout,
          stderr
        });
      }
    );
  });
}

test("editor API runner writes outputs and a machine-readable summary", async () => {
  const dir = await mkdtemp(join(tmpdir(), "labtorio-api-runner-"));
  const commandsPath = join(dir, "commands.json");
  const designPath = join(dir, "layout.labtorio-gui.json");
  const luaPath = join(dir, "gui.lua");
  const zipPath = join(dir, "preview.zip");
  const resultPath = join(dir, "result.json");

  await writeFile(commandsPath, JSON.stringify({
    commands: [
      {
        type: "createWindow",
        title: "Scripted Window",
        size: { width: 760, height: 500 }
      },
      {
        type: "insertAtom",
        atom: "frame",
        parentId: "gui_window_body"
      },
      {
        type: "insertAtom",
        atom: "horizontal-flow",
        parentId: "gui_frame_1"
      },
      {
        type: "insertAtom",
        atom: "label",
        parentId: "gui_horizontal_flow_2"
      },
      {
        type: "editCaption",
        nodeId: "gui_label_3",
        caption: "Dispatch"
      },
      {
        type: "setLuaVariableName",
        nodeId: "gui_label_3",
        name: "dispatch_label"
      }
    ]
  }));

  const run = await runApiRunner([
    "--commands",
    commandsPath,
    "--out-design",
    designPath,
    "--out-lua",
    luaPath,
    "--out-mod-zip",
    zipPath,
    "--result",
    resultPath,
    "--pretty"
  ]);

  assert.equal(run.code, 0, run.stderr);
  const stdoutResult = JSON.parse(run.stdout);
  const fileResult = JSON.parse(await readFile(resultPath, "utf8"));
  const designFile = JSON.parse(await readFile(designPath, "utf8"));
  const lua = await readFile(luaPath, "utf8");
  const zipStats = await stat(zipPath);

  assert.equal(stdoutResult.schema, "labtorio-editor-api-runner.v0");
  assert.equal(stdoutResult.ok, true);
  assert.equal(fileResult.summary.nodeCount, 3);
  assert.equal(stdoutResult.summary.window.title, "Scripted Window");
  assert.deepEqual(stdoutResult.summary.window.childIds, ["gui_frame_1"]);
  assert.deepEqual(
    stdoutResult.summary.nodes.find((node) => node.id === "gui_label_3"),
    {
      id: "gui_label_3",
      atom: "label",
      parentId: "gui_horizontal_flow_2",
      index: 0,
      depth: 2,
      childIds: [],
      styleVariant: "label",
      caption: "Dispatch",
      luaVariableName: "dispatch_label"
    }
  );
  assert.equal(designFile.schema, "labtorio-gui-design.v0");
  assert.match(lua, /local dispatch_label =/);
  assert.match(lua, /caption = "Dispatch"/);
  assert.ok(zipStats.size > 0);
  assert.equal(stdoutResult.outputs.modZip.byteLength, zipStats.size);
});

test("editor API runner reports command failures as structured JSON", async () => {
  const dir = await mkdtemp(join(tmpdir(), "labtorio-api-runner-"));
  const commandsPath = join(dir, "commands.json");
  await writeFile(commandsPath, JSON.stringify([
    {
      type: "createWindow",
      title: "Partial"
    },
    {
      type: "insertAtom",
      atom: "unknown-widget",
      parentId: "gui_window_body"
    }
  ]));

  const run = await runApiRunner(["--commands", commandsPath]);
  assert.equal(run.code, 1);

  const result = JSON.parse(run.stdout);
  assert.equal(result.ok, false);
  assert.equal(result.state.currentWindow, null);
  assert.equal(result.diagnostics[0].code, "unsupported_atom");
  assert.equal(result.diagnostics[0].commandIndex, 1);
  assert.equal(result.summary.window, null);
});

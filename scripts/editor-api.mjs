#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

import {
  createWindowModel,
  renderWindowLua
} from "../src/factorioExport.js";
import {
  createFactorioDesignFileDownload,
  parseFactorioDesignFileText
} from "../src/factorioDesignFile.js";
import {
  FACTORIO_PREVIEW_MOD_ZIP_FILENAME,
  createFactorioModZipData
} from "../src/factorioModExport.js";
import {
  FACTORIO_EDITOR_API_RUNNER_SCHEMA,
  describeFactorioEditorApi
} from "../src/factorioEditorApiDescription.js";
import {
  FACTORIO_EDITOR_API_SCHEMA,
  createFactorioEditorApiState,
  runFactorioEditorCommands
} from "../src/factorioEditorApi.js";
import { summarizeFactorioEditorApiState } from "../src/factorioEditorApiSummary.js";

function usage() {
  return `Usage:
  npm run api:run -- --describe
  npm run api:run -- --commands commands.json [options]
  node scripts/editor-api.mjs --commands - --out-design layout.labtorio-gui.json

Options:
  --describe                Print API description JSON without command input.
  --commands <path|->       JSON array, or object with a "commands" array.
  --input-design <path>     Optional *.labtorio-gui.json starting state.
  --out-design <path>       Write final design JSON.
  --out-lua <path>          Write final gui.lua.
  --out-mod-zip <path>      Write final local preview mod zip.
  --result <path>           Write the runner result JSON.
  --pretty                  Pretty-print JSON output.
  --help                    Show this help.`;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseArgs(argv) {
  const options = {
    pretty: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--commands":
        options.commandsPath = argv[index + 1];
        index += 1;
        break;
      case "--input-design":
        options.inputDesignPath = argv[index + 1];
        index += 1;
        break;
      case "--out-design":
        options.outDesignPath = argv[index + 1];
        index += 1;
        break;
      case "--out-lua":
        options.outLuaPath = argv[index + 1];
        index += 1;
        break;
      case "--out-mod-zip":
        options.outModZipPath = argv[index + 1];
        index += 1;
        break;
      case "--result":
        options.resultPath = argv[index + 1];
        index += 1;
        break;
      case "--pretty":
        options.pretty = true;
        break;
      case "--describe":
        options.describe = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  for (const [name, value] of Object.entries(options)) {
    if (name.endsWith("Path") && typeof value !== "string") {
      throw new Error(`Missing value for --${name.replace(/Path$/, "").replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}.`);
    }
  }

  return options;
}

async function readStdinText() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readText(path) {
  if (path === "-") {
    return readStdinText();
  }
  return readFile(path, "utf8");
}

function parseCommandsJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Command input is not valid JSON.");
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (isObject(parsed) && Array.isArray(parsed.commands)) {
    return parsed.commands;
  }

  throw new Error("Command input must be a JSON array or an object with a commands array.");
}

async function readInitialState(options) {
  if (!options.inputDesignPath) {
    return createFactorioEditorApiState();
  }

  const designText = await readFile(options.inputDesignPath, "utf8");
  return createFactorioEditorApiState(parseFactorioDesignFileText(designText));
}

function currentModelForState(state, outputName) {
  const model = state.currentWindow
    ? createWindowModel({
        ...state.currentWindow,
        layoutSettings: state.layoutSettings
      })
    : null;

  if (!model?.root) {
    throw new Error(`Create a Window before writing ${outputName}.`);
  }

  return model;
}

async function writeOutputFile(path, data) {
  const resolvedPath = resolve(path);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, data);
  return resolvedPath;
}

function sanitizeExports(exportsValue) {
  if (!isObject(exportsValue)) {
    return exportsValue;
  }

  const sanitized = { ...exportsValue };
  if (sanitized.data instanceof Uint8Array) {
    sanitized.data = {
      type: "Uint8Array",
      byteLength: sanitized.data.byteLength
    };
  }
  return sanitized;
}

function sanitizeCommandResults(results = []) {
  return results.map((result) => ({
    ...result,
    ...(result.exports ? { exports: sanitizeExports(result.exports) } : {})
  }));
}

function createDiagnostic(code, message, path = null) {
  return {
    severity: "error",
    code,
    message,
    ...(path ? { path } : {})
  };
}

async function buildRunnerResult(options) {
  const initialState = await readInitialState(options);
  const commands = parseCommandsJson(await readText(options.commandsPath));
  const apiResult = runFactorioEditorCommands(initialState, commands);
  const diagnostics = [...apiResult.diagnostics];
  const outputs = {};
  let ok = apiResult.ok;

  if (apiResult.ok) {
    try {
      if (options.outDesignPath) {
        const designDownload = createFactorioDesignFileDownload(apiResult.state);
        outputs.design = {
          path: await writeOutputFile(options.outDesignPath, designDownload.content),
          filename: designDownload.filename
        };
      }

      if (options.outLuaPath) {
        const model = currentModelForState(apiResult.state, "Lua output");
        outputs.lua = {
          path: await writeOutputFile(options.outLuaPath, `${renderWindowLua(model)}\n`)
        };
      }

      if (options.outModZipPath) {
        const model = currentModelForState(apiResult.state, "preview mod zip");
        const data = createFactorioModZipData(model, { editorState: apiResult.state });
        outputs.modZip = {
          path: await writeOutputFile(options.outModZipPath, data),
          filename: FACTORIO_PREVIEW_MOD_ZIP_FILENAME,
          byteLength: data.byteLength
        };
      }
    } catch (error) {
      ok = false;
      diagnostics.push(createDiagnostic(
        "output_error",
        error instanceof Error ? error.message : "Failed to write requested output."
      ));
    }
  }

  return {
    schema: FACTORIO_EDITOR_API_RUNNER_SCHEMA,
    apiSchema: FACTORIO_EDITOR_API_SCHEMA,
    ok,
    mutated: apiResult.mutated,
    diagnostics,
    summary: summarizeFactorioEditorApiState(apiResult.state),
    state: apiResult.state,
    results: sanitizeCommandResults(apiResult.results),
    outputs
  };
}

function serializeJson(value, pretty = false) {
  return `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return 0;
    }
    if (options.describe) {
      const content = serializeJson(describeFactorioEditorApi(), options.pretty);
      if (options.resultPath) {
        await writeOutputFile(options.resultPath, content);
      }
      process.stdout.write(content);
      return 0;
    }
    if (!options.commandsPath) {
      throw new Error("Missing required --commands input.");
    }
  } catch (error) {
    process.stderr.write(`${usage()}\n`);
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }

  let runnerResult;
  try {
    runnerResult = await buildRunnerResult(options);
  } catch (error) {
    runnerResult = {
      schema: FACTORIO_EDITOR_API_RUNNER_SCHEMA,
      apiSchema: FACTORIO_EDITOR_API_SCHEMA,
      ok: false,
      mutated: false,
      diagnostics: [
        createDiagnostic(
          "runner_error",
          error instanceof Error ? error.message : "The API runner failed."
        )
      ],
      summary: summarizeFactorioEditorApiState(),
      state: createFactorioEditorApiState(),
      results: [],
      outputs: {}
    };
  }

  const content = serializeJson(runnerResult, options.pretty);
  if (options.resultPath) {
    await writeOutputFile(options.resultPath, content);
  }
  process.stdout.write(content);
  return runnerResult.ok ? 0 : 1;
}

process.exitCode = await main();

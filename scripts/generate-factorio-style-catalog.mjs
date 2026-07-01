#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DEFAULT_FACTORIO_BINARY =
  "/mnt/HC_Volume_105232828/shared/games/factorio-headless/factorio/bin/x64/factorio";
const DEFAULT_SCRATCH_DIR = join(ROOT, ".cache/factorio-style-catalog");
const DEFAULT_OUTPUT = join(ROOT, "src/generated/factorioStyleCatalog.generated.json");
const CATALOG_SCHEMA = "factorio-style-catalog.v0";

const SELECTED_STYLES = Object.freeze([
  "label",
  "frame_title",
  "caption_label",
  "heading_2_label",
  "subheader_caption_label",
  "clickable_label",
  "empty_widget",
  "draggable_space",
  "draggable_space_header",
  "frame",
  "inside_deep_frame",
  "inset_frame_container_frame",
  "horizontal_flow",
  "vertical_flow",
  "frame_header_flow",
  "inset_frame_container_horizontal_flow"
]);

const STYLE_FIELDS = Object.freeze(new Set([
  "font",
  "font_color",
  "disabled_font_color",
  "parent_hovered_font_color",
  "game_controller_hovered_font_color",
  "hovered_font_color",
  "clicked_font_color",
  "rich_text_setting",
  "single_line",
  "ignored_by_search",
  "top_padding",
  "right_padding",
  "bottom_padding",
  "left_padding",
  "padding",
  "top_margin",
  "right_margin",
  "bottom_margin",
  "left_margin",
  "margin",
  "horizontal_spacing",
  "vertical_spacing",
  "minimal_width",
  "minimal_height",
  "maximal_width",
  "maximal_height",
  "natural_width",
  "natural_height",
  "width",
  "height",
  "horizontally_stretchable",
  "vertically_stretchable",
  "horizontally_squashable",
  "vertically_squashable",
  "horizontal_align",
  "vertical_align",
  "use_header_filler",
  "drag_by_title"
]));

const CHILD_STYLE_FIELDS = Object.freeze(new Set([
  "title_style",
  "horizontal_flow_style",
  "vertical_flow_style",
  "header_flow_style",
  "header_filler_style"
]));

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--input") {
      args.input = argv[++index];
    } else if (arg === "--factorio-binary") {
      args.factorioBinary = argv[++index];
    } else if (arg === "--output") {
      args.output = argv[++index];
    } else if (arg === "--scratch") {
      args.scratch = argv[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/generate-factorio-style-catalog.mjs [options]

Options:
  --input <path>             Use an existing data-raw-dump.json instead of running Factorio.
  --factorio-binary <path>   Factorio binary to run with --dump-data.
  --output <path>            Catalog output path. Defaults to src/generated/factorioStyleCatalog.generated.json.
  --scratch <path>           Ignored scratch directory. Defaults to .cache/factorio-style-catalog.
`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const stderr = result.stderr ? `\n${result.stderr}` : "";
    const stdout = result.stdout ? `\n${result.stdout}` : "";
    throw new Error(`Command failed: ${command} ${args.join(" ")}${stdout}${stderr}`);
  }
  return result;
}

function factorioRootFromBinary(binaryPath) {
  return dirname(dirname(dirname(resolve(binaryPath))));
}

function parseVersion(output) {
  const line = output.split(/\r?\n/).find((candidate) => candidate.startsWith("Version: "));
  const match = line?.match(/^Version:\s+([^\s]+)\s+\(build\s+([^,]+),\s*([^)]+)\)/);
  return {
    raw: line ?? output.trim(),
    version: match?.[1] ?? null,
    build: match?.[2] ?? null,
    flavor: match?.[3] ?? null
  };
}

function safeStamp(date = new Date()) {
  return date.toISOString().replaceAll(":", "").replaceAll(".", "-");
}

function ensureDirectory(path) {
  mkdirSync(path, { recursive: true });
}

function writeFactorioConfig(configPath, readDataPath, writeDataPath) {
  writeFileSync(
    configPath,
    `[path]
read-data=${readDataPath}
write-data=${writeDataPath}

[general]
locale=auto
`,
    "utf8"
  );
}

function dumpDataRaw({ factorioBinary, scratchDir }) {
  const versionResult = run(factorioBinary, ["--version"]);
  const version = parseVersion(versionResult.stdout);
  const factorioRoot = factorioRootFromBinary(factorioBinary);
  const readDataPath = join(factorioRoot, "data");
  const runId = `run-${safeStamp()}`;
  const runDir = join(scratchDir, runId);
  const writeDataPath = join(runDir, "write-data");
  const modDirectory = join(writeDataPath, "mods");
  const configPath = join(runDir, "config.ini");
  ensureDirectory(modDirectory);
  writeFactorioConfig(configPath, readDataPath, writeDataPath);

  const commandArgs = [
    "--config",
    configPath,
    "--mod-directory",
    modDirectory,
    "--dump-data"
  ];
  run(factorioBinary, commandArgs);
  const dumpPath = join(writeDataPath, "script-output/data-raw-dump.json");
  const modListPath = join(modDirectory, "mod-list.json");
  const retainedDumpPath = join(scratchDir, "latest-data-raw-dump.json");
  copyFileSync(dumpPath, retainedDumpPath);

  let activeMods = [];
  try {
    const modList = JSON.parse(readFileSync(modListPath, "utf8"));
    activeMods = (modList.mods ?? []).filter((mod) => mod.enabled).map((mod) => mod.name);
  } catch {
    activeMods = [];
  }

  return {
    inputPath: retainedDumpPath,
    source: {
      kind: "factorio-dump-data",
      factorioVersion: version.version,
      factorioBuild: version.build,
      factorioFlavor: version.flavor,
      factorioVersionRaw: version.raw,
      factorioBinary,
      command: "$FACTORIO_BINARY --config <scratch>/config.ini --mod-directory <scratch>/mods --dump-data",
      rawDumpPath: relative(ROOT, retainedDumpPath),
      activeMods
    }
  };
}

function camelCase(fieldName) {
  return fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function trimNumber(number) {
  if (Number.isInteger(number)) {
    return String(number);
  }
  return number.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizeColorComponent(component) {
  const normalized = component > 1 ? component / 255 : component;
  return Number(trimNumber(normalized));
}

function formatColor(value) {
  return `{${value.map((component) => trimNumber(normalizeColorComponent(component))).join(", ")}}`;
}

function normalizeValue(key, value) {
  if (Array.isArray(value) && key.endsWith("_color")) {
    return formatColor(value);
  }
  if (value === "on") {
    return true;
  }
  if (value === "off") {
    return false;
  }
  return value;
}

function filterFields(styleSpec = {}) {
  const fields = {};
  for (const [key, value] of Object.entries(styleSpec)) {
    if (STYLE_FIELDS.has(key)) {
      fields[camelCase(key)] = normalizeValue(key, value);
    }
  }
  return fields;
}

function filterStyleSpec(styleSpec = {}, allStyles = {}) {
  const filtered = {
    type: styleSpec.type ?? null
  };
  if (styleSpec.parent) {
    filtered.parent = styleSpec.parent;
  }

  const fields = filterFields(styleSpec);
  if (Object.keys(fields).length > 0) {
    filtered.fields = fields;
  }

  const childStyles = {};
  for (const [key, value] of Object.entries(styleSpec)) {
    if (CHILD_STYLE_FIELDS.has(key) && value && typeof value === "object" && !Array.isArray(value)) {
      childStyles[camelCase(key)] = {
        declared: filterStyleSpec(value, allStyles),
        resolvedFields: resolveSpecFields(value, allStyles)
      };
    }
  }
  if (Object.keys(childStyles).length > 0) {
    filtered.childStyles = childStyles;
  }

  if (Object.prototype.hasOwnProperty.call(styleSpec, "graphical_set")) {
    filtered.hasGraphicalSet = true;
  }
  if (Object.prototype.hasOwnProperty.call(styleSpec, "border")) {
    filtered.hasBorder = true;
  }

  return filtered;
}

function resolveStyleFields(styleName, allStyles, seen = new Set()) {
  if (!styleName || seen.has(styleName)) {
    return {};
  }
  const style = allStyles[styleName];
  if (!style) {
    return {};
  }
  seen.add(styleName);
  return {
    ...resolveStyleFields(style.parent, allStyles, seen),
    ...filterFields(style)
  };
}

function resolveSpecFields(styleSpec, allStyles) {
  return {
    ...resolveStyleFields(styleSpec.parent, allStyles),
    ...filterFields(styleSpec)
  };
}

function buildCatalog(dataRaw, source) {
  const guiStyle = dataRaw?.["gui-style"]?.default;
  if (!guiStyle) {
    throw new Error('Input JSON does not contain data.raw["gui-style"].default');
  }

  const styles = {};
  for (const styleName of SELECTED_STYLES) {
    const styleSpec = guiStyle[styleName];
    if (!styleSpec) {
      throw new Error(`Required style not found in dump: ${styleName}`);
    }
    styles[styleName] = {
      name: styleName,
      declared: filterStyleSpec(styleSpec, guiStyle),
      resolvedFields: resolveStyleFields(styleName, guiStyle)
    };
  }

  return {
    schema: CATALOG_SCHEMA,
    generatedAt: new Date().toISOString(),
    source,
    selectedStyleCount: SELECTED_STYLES.length,
    totalStyleCount: Object.keys(guiStyle).length,
    styles
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const outputPath = resolve(args.output ?? DEFAULT_OUTPUT);
  const scratchDir = resolve(args.scratch ?? DEFAULT_SCRATCH_DIR);
  ensureDirectory(scratchDir);

  let inputPath;
  let source;
  if (args.input) {
    inputPath = resolve(args.input);
    source = {
      kind: "provided-data-raw-json",
      rawDumpPath: relative(ROOT, inputPath)
    };
  } else {
    const factorioBinary =
      args.factorioBinary ?? process.env.FACTORIO_BINARY ?? DEFAULT_FACTORIO_BINARY;
    ({ inputPath, source } = dumpDataRaw({ factorioBinary, scratchDir }));
  }

  const dataRaw = JSON.parse(readFileSync(inputPath, "utf8"));
  const catalog = buildCatalog(dataRaw, source);
  ensureDirectory(dirname(outputPath));
  writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Generated ${relative(ROOT, outputPath)} from ${source.rawDumpPath}.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

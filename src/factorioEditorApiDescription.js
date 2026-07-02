import { FACTORIO_BEHAVIOR_HOOKS_SCHEMA } from "./factorioBehaviorHooks.js";
import {
  FACTORIO_DESIGN_FILE_EXTENSION,
  FACTORIO_DESIGN_FILE_SCHEMA
} from "./factorioDesignFile.js";
import {
  FACTORIO_EDITOR_API_COMMANDS,
  FACTORIO_EDITOR_API_DIRECTIONS,
  FACTORIO_EDITOR_API_SCHEMA,
  isFactorioEditorApiMutatingCommand
} from "./factorioEditorApi.js";
import { FACTORIO_EDITOR_API_SUMMARY_SCHEMA } from "./factorioEditorApiSummary.js";
import {
  DEFAULT_WINDOW_SIZE,
  WINDOW_SIZE_LIMITS
} from "./factorioExport.js";
import {
  BODY_LAYOUT_ROOT_ID,
  BUILDER_PALETTE_ATOMS,
  FRAME_ATOM_ID,
  HORIZONTAL_FLOW_ATOM_ID,
  LAYOUT_NODE_SIZE_LIMITS,
  builderAtomMetadata
} from "./factorioLayoutTree.js";
import { FACTORIO_PREVIEW_MOD_ZIP_FILENAME } from "./factorioModExport.js";

export const FACTORIO_EDITOR_API_DESCRIPTION_SCHEMA =
  "labtorio-editor-api-description.v0";
export const FACTORIO_EDITOR_API_RUNNER_SCHEMA = "labtorio-editor-api-runner.v0";

export const FACTORIO_EDITOR_API_RUNNER_OUTPUTS = Object.freeze({
  design: Object.freeze({
    flag: "--out-design",
    value: "<path>",
    description: `Write final ${FACTORIO_DESIGN_FILE_EXTENSION} design JSON.`,
    requiresWindow: false
  }),
  lua: Object.freeze({
    flag: "--out-lua",
    value: "<path>",
    description: "Write final generated gui.lua.",
    requiresWindow: true
  }),
  modZip: Object.freeze({
    flag: "--out-mod-zip",
    value: "<path>",
    description: `Write final local preview mod zip (${FACTORIO_PREVIEW_MOD_ZIP_FILENAME}).`,
    requiresWindow: true
  }),
  result: Object.freeze({
    flag: "--result",
    value: "<path>",
    description: "Write the runner result JSON.",
    requiresWindow: false
  })
});

const STRING_FIELD = "string";
const OBJECT_FIELD = "object";
const NUMBER_FIELD = "number";

function field(name, type, options = {}) {
  return {
    name,
    type,
    required: Boolean(options.required),
    ...(options.aliases ? { aliases: options.aliases } : {}),
    ...(options.values ? { values: [...options.values] } : {}),
    ...(options.default !== undefined ? { default: options.default } : {}),
    ...(options.description ? { description: options.description } : {})
  };
}

function commandFields(type, fields) {
  return [
    field("type", STRING_FIELD, {
      required: true,
      values: [type]
    }),
    ...fields
  ];
}

const COMMAND_FIELD_DEFINITIONS = Object.freeze({
  [FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW,
    [
      field("title", STRING_FIELD, { default: "Untitled window" }),
      field("size", OBJECT_FIELD, {
        description: "Optional { width, height } bounded by Window size limits."
      }),
      field("bodyDirection", STRING_FIELD, {
        values: Object.values(FACTORIO_EDITOR_API_DIRECTIONS),
        default: FACTORIO_EDITOR_API_DIRECTIONS.HORIZONTAL
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.RESET_WINDOW]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.RESET_WINDOW,
    []
  )),
  [FACTORIO_EDITOR_API_COMMANDS.SET_TITLE]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.SET_TITLE,
    [
      field("title", STRING_FIELD, {
        aliases: ["value"],
        description: "New editor and Window title."
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.SET_BODY_DIRECTION]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.SET_BODY_DIRECTION,
    [
      field("direction", STRING_FIELD, {
        aliases: ["value"],
        values: Object.values(FACTORIO_EDITOR_API_DIRECTIONS)
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.SET_WINDOW_SIZE]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.SET_WINDOW_SIZE,
    [
      field("size", OBJECT_FIELD, {
        description: "Optional { width, height } object."
      }),
      field("width", NUMBER_FIELD),
      field("height", NUMBER_FIELD)
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM,
    [
      field("atom", STRING_FIELD, {
        values: BUILDER_PALETTE_ATOMS,
        default: FRAME_ATOM_ID
      }),
      field("parentId", STRING_FIELD, {
        default: BODY_LAYOUT_ROOT_ID,
        description: "Window body id or a parent layout node id."
      }),
      field("index", NUMBER_FIELD, {
        description: "Ordered insertion index. Defaults to append."
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.MOVE_ATOM]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.MOVE_ATOM,
    [
      field("nodeId", STRING_FIELD, {
        required: true,
        aliases: ["sourceId"]
      }),
      field("parentId", STRING_FIELD, {
        aliases: ["targetParentId"],
        default: BODY_LAYOUT_ROOT_ID
      }),
      field("index", NUMBER_FIELD, {
        description: "Ordered insertion index. Defaults to append."
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.RESIZE_NODE]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.RESIZE_NODE,
    [
      field("nodeId", STRING_FIELD, {
        required: true,
        aliases: ["targetId", "anchor"],
        description: "`gui_window` or a resizable authored node id."
      }),
      field("size", OBJECT_FIELD),
      field("width", NUMBER_FIELD, {
        description: "Window width when nodeId is gui_window."
      }),
      field("height", NUMBER_FIELD, {
        description: "Window height when nodeId is gui_window."
      }),
      field("minimalWidth", NUMBER_FIELD, {
        description: "Frame/Horizontal Flow minimal width."
      }),
      field("minimalHeight", NUMBER_FIELD, {
        description: "Frame/Horizontal Flow minimal height."
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.EDIT_CAPTION]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.EDIT_CAPTION,
    [
      field("nodeId", STRING_FIELD, {
        required: true,
        aliases: ["targetId"]
      }),
      field("caption", STRING_FIELD, {
        aliases: ["value"]
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.SET_LUA_VARIABLE_NAME]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.SET_LUA_VARIABLE_NAME,
    [
      field("nodeId", STRING_FIELD, { required: true }),
      field("name", STRING_FIELD, {
        aliases: ["value"],
        description: "Lua local variable alias, or empty/null to clear."
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.SET_HOOKS]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.SET_HOOKS,
    [
      field("hooks", OBJECT_FIELD, {
        required: true,
        description: `${FACTORIO_BEHAVIOR_HOOKS_SCHEMA} behavior hook metadata.`
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.IMPORT_DESIGN_FILE]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.IMPORT_DESIGN_FILE,
    [
      field("text", STRING_FIELD, {
        description: "Raw design-file JSON text."
      }),
      field("designFile", OBJECT_FIELD, {
        aliases: ["file"],
        description: "Parsed design-file envelope."
      })
    ]
  )),
  [FACTORIO_EDITOR_API_COMMANDS.EXPORT_DESIGN_FILE]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.EXPORT_DESIGN_FILE,
    []
  )),
  [FACTORIO_EDITOR_API_COMMANDS.EXPORT_LUA]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.EXPORT_LUA,
    []
  )),
  [FACTORIO_EDITOR_API_COMMANDS.EXPORT_MOD_ZIP]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.EXPORT_MOD_ZIP,
    []
  )),
  [FACTORIO_EDITOR_API_COMMANDS.VALIDATE]: Object.freeze(commandFields(
    FACTORIO_EDITOR_API_COMMANDS.VALIDATE,
    []
  ))
});

const COMMAND_OUTPUTS = Object.freeze({
  [FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW]: Object.freeze(["value.selectedAnchor"]),
  [FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM]: Object.freeze([
    "value.nodeId",
    "value.parentId",
    "value.index",
    "value.atom"
  ]),
  [FACTORIO_EDITOR_API_COMMANDS.MOVE_ATOM]: Object.freeze([
    "value.nodeId",
    "value.parentId"
  ]),
  [FACTORIO_EDITOR_API_COMMANDS.RESIZE_NODE]: Object.freeze(["value.nodeId"]),
  [FACTORIO_EDITOR_API_COMMANDS.EDIT_CAPTION]: Object.freeze(["value.nodeId"]),
  [FACTORIO_EDITOR_API_COMMANDS.SET_LUA_VARIABLE_NAME]: Object.freeze([
    "value.nodeId",
    "value.name"
  ]),
  [FACTORIO_EDITOR_API_COMMANDS.EXPORT_DESIGN_FILE]: Object.freeze([
    "value.schema",
    "value.filename",
    "value.content",
    "value.designFile"
  ]),
  [FACTORIO_EDITOR_API_COMMANDS.EXPORT_LUA]: Object.freeze(["exports.lua"]),
  [FACTORIO_EDITOR_API_COMMANDS.EXPORT_MOD_ZIP]: Object.freeze([
    "exports.filename",
    "exports.data"
  ]),
  [FACTORIO_EDITOR_API_COMMANDS.VALIDATE]: Object.freeze(["diagnostics"])
});

function commandDescription(type) {
  const mutating = isFactorioEditorApiMutatingCommand({ type });
  return {
    type,
    mutating,
    readOnly: !mutating,
    fields: COMMAND_FIELD_DEFINITIONS[type] ?? commandFields(type, []),
    outputs: [...(COMMAND_OUTPUTS[type] ?? [])]
  };
}

function atomDescription(atom) {
  const metadata = builderAtomMetadata(atom);
  return {
    atom,
    label: metadata.paletteLabel,
    paletteCode: metadata.paletteCode,
    idPrefix: metadata.idPrefix,
    defaultStyleVariant: metadata.defaultStyleVariant,
    canHaveChildren: metadata.canHaveChildren,
    defaultChildAtom: metadata.defaultChildAtom,
    allowedChildren: [...metadata.allowedChildren],
    resizable: [FRAME_ATOM_ID, HORIZONTAL_FLOW_ATOM_ID].includes(atom),
    editableCaption: atom === "label",
    ...(metadata.defaultCaption != null ? { defaultCaption: metadata.defaultCaption } : {})
  };
}

function parentDescriptions() {
  return {
    [BODY_LAYOUT_ROOT_ID]: {
      id: BODY_LAYOUT_ROOT_ID,
      kind: "generated-window-body",
      allowedChildren: [...BUILDER_PALETTE_ATOMS]
    },
    ...Object.fromEntries(
      BUILDER_PALETTE_ATOMS
        .filter((atom) => builderAtomMetadata(atom).canHaveChildren)
        .map((atom) => [
          atom,
          {
            atom,
            kind: "atom",
            allowedChildren: [...builderAtomMetadata(atom).allowedChildren]
          }
        ])
    )
  };
}

export function describeFactorioEditorApi() {
  return {
    schema: FACTORIO_EDITOR_API_DESCRIPTION_SCHEMA,
    apiSchema: FACTORIO_EDITOR_API_SCHEMA,
    runnerSchema: FACTORIO_EDITOR_API_RUNNER_SCHEMA,
    summarySchema: FACTORIO_EDITOR_API_SUMMARY_SCHEMA,
    designFileSchema: FACTORIO_DESIGN_FILE_SCHEMA,
    boundary: {
      transport: "local-only",
      browserFacade: "window.labtorioEditorApi",
      headlessRunner: "npm run api:run --",
      remoteServer: false,
      arbitraryCss: false,
      arbitraryPixelLayout: false,
      generatedBehaviorCode: false,
      perEditProvenance: false
    },
    commands: Object.fromEntries(
      Object.values(FACTORIO_EDITOR_API_COMMANDS).map((type) => [
        type,
        commandDescription(type)
      ])
    ),
    layout: {
      bodyRootId: BODY_LAYOUT_ROOT_ID,
      paletteAtoms: [...BUILDER_PALETTE_ATOMS],
      atoms: Object.fromEntries(
        BUILDER_PALETTE_ATOMS.map((atom) => [atom, atomDescription(atom)])
      ),
      parents: parentDescriptions(),
      sizeLimits: {
        window: WINDOW_SIZE_LIMITS,
        layoutNode: LAYOUT_NODE_SIZE_LIMITS,
        defaultWindowSize: DEFAULT_WINDOW_SIZE
      },
      directions: Object.values(FACTORIO_EDITOR_API_DIRECTIONS)
    },
    runner: {
      command: "npm run api:run --",
      options: [
        {
          flag: "--describe",
          description: "Print this API description without requiring command input."
        },
        {
          flag: "--commands",
          value: "<path|->",
          description: "JSON array, or object with a commands array.",
          requiredForRun: true
        },
        {
          flag: "--input-design",
          value: "<path>",
          description: `Optional ${FACTORIO_DESIGN_FILE_EXTENSION} starting state.`
        },
        ...Object.values(FACTORIO_EDITOR_API_RUNNER_OUTPUTS),
        {
          flag: "--pretty",
          description: "Pretty-print JSON output."
        },
        {
          flag: "--help",
          description: "Show CLI usage."
        }
      ],
      outputFlags: FACTORIO_EDITOR_API_RUNNER_OUTPUTS
    },
    resultEnvelopes: {
      command: ["schema", "ok", "mutated", "state", "diagnostics", "value", "exports"],
      batch: ["schema", "ok", "mutated", "state", "results", "diagnostics"],
      runner: [
        "schema",
        "apiSchema",
        "ok",
        "mutated",
        "diagnostics",
        "summary",
        "state",
        "results",
        "outputs"
      ]
    }
  };
}

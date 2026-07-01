import {
  DEFAULT_WINDOW_SIZE,
  HORIZONTAL_FLOW_DIRECTION,
  VERTICAL_FLOW_DIRECTION,
  createWindowModel,
  normalizeWindowBodyDirection,
  normalizeWindowSize,
  renderWindowLua
} from "./factorioExport.js";
import {
  BODY_LAYOUT_ROOT_ID,
  FRAME_ATOM_ID,
  HORIZONTAL_FLOW_ATOM_ID,
  LABEL_ATOM_ID,
  createLayoutSpec,
  defaultLayoutChildAtom,
  findLayoutNode,
  insertLayoutNode,
  moveLayoutNode,
  normalizeLayoutState,
  updateLayoutNodeCaption,
  updateLayoutNodeSize
} from "./factorioLayoutTree.js";
import { normalizeLayoutSettings } from "./factorioEditorSettings.js";
import {
  FACTORIO_DESIGN_FILE_SCHEMA,
  createFactorioDesignFile,
  createFactorioDesignFileDownload,
  migrateFactorioDesignFile,
  normalizeDesignState,
  parseFactorioDesignFileText
} from "./factorioDesignFile.js";
import {
  FACTORIO_PREVIEW_MOD_ZIP_FILENAME,
  createFactorioModZipData
} from "./factorioModExport.js";
import {
  collectWindowLuaVariableNodeIds,
  normalizeLuaVariableNames,
  validateLuaVariableNameEdit
} from "./factorioLuaNames.js";
import {
  assertFactorioBehaviorHooks,
  collectFactorioHookElementIds,
  normalizeFactorioBehaviorHooks
} from "./factorioBehaviorHooks.js";
import {
  appendFactorioAgentProvenanceEntry,
  createFactorioAgentProvenanceEntry
} from "./factorioAgentProvenance.js";

export const FACTORIO_EDITOR_API_SCHEMA = "labtorio-editor-api.v0";

export const FACTORIO_EDITOR_API_COMMANDS = Object.freeze({
  CREATE_WINDOW: "createWindow",
  RESET_WINDOW: "resetWindow",
  SET_TITLE: "setTitle",
  SET_BODY_DIRECTION: "setBodyDirection",
  SET_WINDOW_SIZE: "setWindowSize",
  INSERT_ATOM: "insertAtom",
  MOVE_ATOM: "moveAtom",
  RESIZE_NODE: "resizeNode",
  EDIT_CAPTION: "editCaption",
  SET_LUA_VARIABLE_NAME: "setLuaVariableName",
  SET_HOOKS: "setHooks",
  IMPORT_DESIGN_FILE: "importDesignFile",
  EXPORT_DESIGN_FILE: "exportDesignFile",
  EXPORT_LUA: "exportLua",
  EXPORT_MOD_ZIP: "exportModZip",
  VALIDATE: "validate"
});

const MUTATING_COMMANDS = new Set([
  FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW,
  FACTORIO_EDITOR_API_COMMANDS.RESET_WINDOW,
  FACTORIO_EDITOR_API_COMMANDS.SET_TITLE,
  FACTORIO_EDITOR_API_COMMANDS.SET_BODY_DIRECTION,
  FACTORIO_EDITOR_API_COMMANDS.SET_WINDOW_SIZE,
  FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM,
  FACTORIO_EDITOR_API_COMMANDS.MOVE_ATOM,
  FACTORIO_EDITOR_API_COMMANDS.RESIZE_NODE,
  FACTORIO_EDITOR_API_COMMANDS.EDIT_CAPTION,
  FACTORIO_EDITOR_API_COMMANDS.SET_LUA_VARIABLE_NAME,
  FACTORIO_EDITOR_API_COMMANDS.SET_HOOKS,
  FACTORIO_EDITOR_API_COMMANDS.IMPORT_DESIGN_FILE
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeTitle(value, fallback = "Untitled window") {
  const title = String(value ?? fallback).trim();
  return title || fallback;
}

function createDiagnostic(code, message, path = null) {
  return {
    severity: "error",
    code,
    message,
    ...(path ? { path } : {})
  };
}

function createWarning(code, message, path = null) {
  return {
    severity: "warning",
    code,
    message,
    ...(path ? { path } : {})
  };
}

function success(state, options = {}) {
  return {
    schema: FACTORIO_EDITOR_API_SCHEMA,
    ok: true,
    mutated: Boolean(options.mutated),
    state: createFactorioEditorApiState(state),
    diagnostics: options.diagnostics ?? [],
    ...(options.value !== undefined ? { value: options.value } : {}),
    ...(options.exports ? { exports: options.exports } : {})
  };
}

function failure(state, diagnostic) {
  return {
    schema: FACTORIO_EDITOR_API_SCHEMA,
    ok: false,
    mutated: false,
    state: createFactorioEditorApiState(state),
    diagnostics: [diagnostic]
  };
}

function normalizeIndex(index, length) {
  const numberValue = Number(index);
  if (!Number.isFinite(numberValue)) {
    return length;
  }

  return Math.min(Math.max(0, Math.round(numberValue)), length);
}

function normalizeSelectedAnchor(value, state) {
  if (!state.currentWindow || typeof value !== "string") {
    return state.currentWindow ? BODY_LAYOUT_ROOT_ID : null;
  }

  if (
    value === "gui_window" ||
    value === "gui_window_titlebar" ||
    value === "gui_window_title" ||
    value === "gui_window_drag_handle" ||
    value === "gui_window_body" ||
    findLayoutNode(state.currentWindow.layoutChildren, value)
  ) {
    return value;
  }

  return BODY_LAYOUT_ROOT_ID;
}

function normalizeWindowLuaVariableNames(windowState) {
  return normalizeLuaVariableNames(
    windowState?.luaVariableNames,
    collectWindowLuaVariableNodeIds(windowState)
  );
}

function normalizeHooksForState(hooks, state) {
  return assertFactorioBehaviorHooks(hooks, {
    validElementIds: collectFactorioHookElementIds(state)
  });
}

function currentModelForState(state) {
  if (!state.currentWindow) {
    return null;
  }

  return createWindowModel({
    ...state.currentWindow,
    layoutSettings: state.layoutSettings
  });
}

export function createFactorioEditorApiState(value = {}) {
  const source = isObject(value) ? value : {};
  const design = normalizeDesignState({
    title: source.title,
    windowSize: source.windowSize,
    windowBodyDirection: source.windowBodyDirection,
    currentWindow: source.currentWindow,
    layoutSettings: source.layoutSettings,
    hooks: source.hooks,
    provenance: source.provenance
  });
  const state = {
    ...source,
    title: design.title,
    windowSize: design.windowSize,
    windowBodyDirection: design.windowBodyDirection,
    currentWindow: design.currentWindow,
    layoutSettings: design.layoutSettings,
    hooks: design.hooks,
    provenance: design.provenance
  };

  return {
    ...state,
    selectedAnchor: normalizeSelectedAnchor(source.selectedAnchor ?? source.inspectedAnchor, state)
  };
}

export function validateFactorioEditorApiState(sourceState = {}) {
  const state = createFactorioEditorApiState(sourceState);
  const diagnostics = [];

  if (!state.currentWindow) {
    diagnostics.push(createWarning(
      "missing_window",
      "Create a Window before exporting Lua or a preview mod."
    ));
  } else if (!currentModelForState(state)?.root) {
    diagnostics.push(createDiagnostic(
      "invalid_window_model",
      "The current state could not hydrate a Factorio Window model."
    ));
  }

  try {
    assertFactorioBehaviorHooks(sourceState?.hooks ?? state.hooks, {
      validElementIds: collectFactorioHookElementIds(state)
    });
  } catch (error) {
    diagnostics.push(createDiagnostic(
      "invalid_hooks",
      error instanceof Error ? error.message : "Behavior hooks are invalid.",
      "hooks"
    ));
  }

  return diagnostics;
}

function withWindow(state, command, updater) {
  if (!state.currentWindow) {
    return failure(
      state,
      createDiagnostic(
        "missing_window",
        `${command.type} requires an existing Window.`
      )
    );
  }

  return updater();
}

function withLayoutUpdate(state, command, updater) {
  return withWindow(state, command, () => {
    const layoutState = normalizeLayoutState(state.currentWindow);
    const result = updater(layoutState);
    if (!result?.changed) {
      return failure(
        state,
        createDiagnostic(
          result?.code ?? "unchanged_layout",
          result?.message ?? `${command.type} did not change the layout.`
        )
      );
    }

    const currentWindow = {
      ...state.currentWindow,
      layoutChildren: result.layoutChildren,
      nextLayoutNodeNumber: result.nextLayoutNodeNumber ?? layoutState.nextLayoutNodeNumber
    };
    const nextState = createFactorioEditorApiState({
      ...state,
      selectedAnchor: result.selectedAnchor ?? state.selectedAnchor,
      currentWindow: {
        ...currentWindow,
        luaVariableNames: normalizeWindowLuaVariableNames(currentWindow)
      }
    });

    return success(nextState, {
      mutated: true,
      value: result.value
    });
  });
}

function createWindowCommand(state, command) {
  const title = normalizeTitle(command.title ?? state.title);
  const size = normalizeWindowSize(command.size ?? state.windowSize ?? DEFAULT_WINDOW_SIZE);
  const bodyDirection = normalizeWindowBodyDirection(
    command.bodyDirection ?? state.windowBodyDirection ?? HORIZONTAL_FLOW_DIRECTION
  );
  const layoutState = normalizeLayoutState(state.currentWindow ?? {});
  const currentWindow = {
    title,
    location: state.currentWindow?.location ?? null,
    size,
    bodyDirection,
    layoutChildren: layoutState.layoutChildren,
    nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber
  };

  return success({
    ...state,
    title,
    windowSize: size,
    windowBodyDirection: bodyDirection,
    currentWindow: {
      ...currentWindow,
      luaVariableNames: normalizeWindowLuaVariableNames({
        ...currentWindow,
        luaVariableNames: state.currentWindow?.luaVariableNames
      })
    },
    selectedAnchor: BODY_LAYOUT_ROOT_ID
  }, {
    mutated: true,
    value: { selectedAnchor: BODY_LAYOUT_ROOT_ID }
  });
}

function resetWindowCommand(state) {
  return success({
    ...state,
    currentWindow: null,
    selectedAnchor: null,
    hooks: normalizeFactorioBehaviorHooks()
  }, {
    mutated: true
  });
}

function setTitleCommand(state, command) {
  const title = normalizeTitle(command.title ?? command.value);
  return success({
    ...state,
    title,
    currentWindow: state.currentWindow
      ? { ...state.currentWindow, title }
      : state.currentWindow
  }, {
    mutated: true
  });
}

function setBodyDirectionCommand(state, command) {
  const bodyDirection = normalizeWindowBodyDirection(command.direction ?? command.value);
  return success({
    ...state,
    windowBodyDirection: bodyDirection,
    currentWindow: state.currentWindow
      ? { ...state.currentWindow, bodyDirection }
      : state.currentWindow
  }, {
    mutated: true
  });
}

function setWindowSizeCommand(state, command) {
  const size = normalizeWindowSize({
    ...(state.windowSize ?? DEFAULT_WINDOW_SIZE),
    ...(command.size ?? {}),
    ...(command.width != null ? { width: command.width } : {}),
    ...(command.height != null ? { height: command.height } : {})
  });

  return success({
    ...state,
    windowSize: size,
    currentWindow: state.currentWindow
      ? { ...state.currentWindow, size }
      : state.currentWindow
  }, {
    mutated: true
  });
}

function insertAtomCommand(state, command) {
  return withLayoutUpdate(state, command, (layoutState) => {
    const parentId = command.parentId ?? BODY_LAYOUT_ROOT_ID;
    const parentChildren = parentId === BODY_LAYOUT_ROOT_ID
      ? layoutState.layoutChildren
      : findLayoutNode(layoutState.layoutChildren, parentId)?.node.children;
    const atom = command.atom ??
      defaultLayoutChildAtom(layoutState.layoutChildren, parentId) ??
      FRAME_ATOM_ID;
    const node = createLayoutSpec(atom, layoutState.nextLayoutNodeNumber);

    if (!node) {
      return {
        changed: false,
        code: "unsupported_atom",
        message: `Unsupported atom: ${String(atom)}.`
      };
    }

    if (!parentChildren) {
      return {
        changed: false,
        code: "unknown_parent",
        message: `Unknown parent node: ${String(parentId)}.`
      };
    }

    const index = normalizeIndex(command.index, parentChildren.length);
    const insertion = insertLayoutNode(layoutState.layoutChildren, parentId, index, node);
    if (!insertion.changed) {
      return {
        changed: false,
        code: "invalid_insert",
        message: `${String(atom)} cannot be inserted into ${String(parentId)}.`
      };
    }

    return {
      ...insertion,
      selectedAnchor: node.id,
      nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber + 1,
      value: { nodeId: node.id, parentId, index, atom }
    };
  });
}

function moveAtomCommand(state, command) {
  return withLayoutUpdate(state, command, (layoutState) => {
    const sourceId = command.nodeId ?? command.sourceId;
    const parentId = command.parentId ?? command.targetParentId ?? BODY_LAYOUT_ROOT_ID;
    const parentChildren = parentId === BODY_LAYOUT_ROOT_ID
      ? layoutState.layoutChildren
      : findLayoutNode(layoutState.layoutChildren, parentId)?.node.children;
    if (!parentChildren) {
      return {
        changed: false,
        code: "unknown_parent",
        message: `Unknown parent node: ${String(parentId)}.`
      };
    }

    const movement = moveLayoutNode(
      layoutState.layoutChildren,
      sourceId,
      parentId,
      normalizeIndex(command.index, parentChildren.length)
    );
    return movement.changed
      ? {
          ...movement,
          selectedAnchor: sourceId,
          nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber,
          value: { nodeId: sourceId, parentId }
        }
      : {
          changed: false,
          code: "invalid_move",
          message: `${String(sourceId)} cannot be moved into ${String(parentId)}.`
        };
  });
}

function resizeNodeCommand(state, command) {
  const nodeId = command.nodeId ?? command.targetId ?? command.anchor;
  if (nodeId === "gui_window") {
    return setWindowSizeCommand(state, {
      type: FACTORIO_EDITOR_API_COMMANDS.SET_WINDOW_SIZE,
      size: command.size,
      width: command.width,
      height: command.height
    });
  }

  return withLayoutUpdate(state, command, (layoutState) => {
    const match = findLayoutNode(layoutState.layoutChildren, nodeId);
    if (!match) {
      return {
        changed: false,
        code: "unknown_node",
        message: `Unknown layout node: ${String(nodeId)}.`
      };
    }

    if (![FRAME_ATOM_ID, HORIZONTAL_FLOW_ATOM_ID].includes(match.node.atom)) {
      return {
        changed: false,
        code: "unsupported_resize",
        message: `${String(nodeId)} does not support API resize.`
      };
    }

    const update = updateLayoutNodeSize(layoutState.layoutChildren, nodeId, {
      ...(command.size ?? {}),
      ...(command.minimalWidth != null ? { minimalWidth: command.minimalWidth } : {}),
      ...(command.minimalHeight != null ? { minimalHeight: command.minimalHeight } : {})
    });
    return update.changed
      ? {
          ...update,
          selectedAnchor: nodeId,
          nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber,
          value: { nodeId }
        }
      : {
          changed: false,
          code: "unchanged_resize",
          message: `${String(nodeId)} size is already at the requested value.`
        };
  });
}

function editCaptionCommand(state, command) {
  const nodeId = command.nodeId ?? command.targetId;
  return withLayoutUpdate(state, command, (layoutState) => {
    const match = findLayoutNode(layoutState.layoutChildren, nodeId);
    if (!match) {
      return {
        changed: false,
        code: "unknown_node",
        message: `Unknown layout node: ${String(nodeId)}.`
      };
    }

    if (match.node.atom !== LABEL_ATOM_ID) {
      return {
        changed: false,
        code: "unsupported_caption",
        message: `${String(nodeId)} is not an authored Label.`
      };
    }

    const update = updateLayoutNodeCaption(
      layoutState.layoutChildren,
      nodeId,
      command.caption ?? command.value
    );
    return update.changed
      ? {
          ...update,
          selectedAnchor: nodeId,
          nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber,
          value: { nodeId }
        }
      : {
          changed: false,
          code: "unchanged_caption",
          message: `${String(nodeId)} caption is already at the requested value.`
        };
  });
}

function setLuaVariableNameCommand(state, command) {
  return withWindow(state, command, () => {
    const nodeId = command.nodeId;
    const validation = validateLuaVariableNameEdit(command.name ?? command.value, {
      nodeId,
      nodeIds: collectWindowLuaVariableNodeIds(state.currentWindow),
      luaVariableNames: state.currentWindow.luaVariableNames
    });

    if (!validation.ok) {
      return failure(
        state,
        createDiagnostic("invalid_lua_variable_name", validation.message, "name")
      );
    }

    return success({
      ...state,
      currentWindow: {
        ...state.currentWindow,
        luaVariableNames: validation.luaVariableNames
      },
      selectedAnchor: nodeId
    }, {
      mutated: true,
      value: { nodeId, name: validation.value }
    });
  });
}

function setHooksCommand(state, command) {
  try {
    return success({
      ...state,
      hooks: normalizeHooksForState(command.hooks, state)
    }, {
      mutated: true
    });
  } catch (error) {
    return failure(
      state,
      createDiagnostic(
        "invalid_hooks",
        error instanceof Error ? error.message : "Behavior hooks are invalid.",
        "hooks"
      )
    );
  }
}

function importDesignFileCommand(state, command) {
  try {
    const designFile = typeof command.text === "string"
      ? { design: parseFactorioDesignFileText(command.text) }
      : migrateFactorioDesignFile(command.designFile ?? command.file);
    const design = designFile.design;
    return success({
      ...state,
      title: design.title,
      windowSize: design.windowSize,
      windowBodyDirection: design.windowBodyDirection,
      currentWindow: design.currentWindow,
      layoutSettings: design.layoutSettings,
      hooks: design.hooks,
      provenance: design.provenance,
      selectedAnchor: design.currentWindow ? BODY_LAYOUT_ROOT_ID : null
    }, {
      mutated: true
    });
  } catch (error) {
    return failure(
      state,
      createDiagnostic(
        "invalid_design_file",
        error instanceof Error ? error.message : "The design file is invalid."
      )
    );
  }
}

function exportDesignFileCommand(state) {
  const download = createFactorioDesignFileDownload(state);
  return success(state, {
    value: {
      schema: FACTORIO_DESIGN_FILE_SCHEMA,
      filename: download.filename,
      content: download.content,
      designFile: createFactorioDesignFile(state)
    }
  });
}

function exportLuaCommand(state, command) {
  return withWindow(state, command, () => {
    const model = currentModelForState(state);
    return success(state, {
      exports: {
        lua: renderWindowLua(model)
      }
    });
  });
}

function exportModZipCommand(state, command) {
  return withWindow(state, command, () => {
    const model = currentModelForState(state);
    return success(state, {
      exports: {
        filename: FACTORIO_PREVIEW_MOD_ZIP_FILENAME,
        data: createFactorioModZipData(model, { editorState: state })
      }
    });
  });
}

function validateCommand(state) {
  return success(state, {
    diagnostics: validateFactorioEditorApiState(state)
  });
}

export function runFactorioEditorCommand(sourceState = {}, command = {}) {
  const state = createFactorioEditorApiState(sourceState);
  if (!isObject(command)) {
    return failure(
      state,
      createDiagnostic("invalid_command", "Commands must be JSON objects.")
    );
  }

  switch (command.type) {
    case FACTORIO_EDITOR_API_COMMANDS.CREATE_WINDOW:
      return createWindowCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.RESET_WINDOW:
      return resetWindowCommand(state);
    case FACTORIO_EDITOR_API_COMMANDS.SET_TITLE:
      return setTitleCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.SET_BODY_DIRECTION:
      return setBodyDirectionCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.SET_WINDOW_SIZE:
      return setWindowSizeCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.INSERT_ATOM:
      return insertAtomCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.MOVE_ATOM:
      return moveAtomCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.RESIZE_NODE:
      return resizeNodeCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.EDIT_CAPTION:
      return editCaptionCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.SET_LUA_VARIABLE_NAME:
      return setLuaVariableNameCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.SET_HOOKS:
      return setHooksCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.IMPORT_DESIGN_FILE:
      return importDesignFileCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.EXPORT_DESIGN_FILE:
      return exportDesignFileCommand(state);
    case FACTORIO_EDITOR_API_COMMANDS.EXPORT_LUA:
      return exportLuaCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.EXPORT_MOD_ZIP:
      return exportModZipCommand(state, command);
    case FACTORIO_EDITOR_API_COMMANDS.VALIDATE:
      return validateCommand(state);
    default:
      return failure(
        state,
        createDiagnostic(
          "unsupported_command",
          `Unsupported command type: ${String(command.type ?? "missing")}.`,
          "type"
        )
      );
  }
}

export function runFactorioEditorCommands(sourceState = {}, commands = []) {
  const startState = createFactorioEditorApiState(sourceState);
  if (!Array.isArray(commands)) {
    return failure(
      startState,
      createDiagnostic("invalid_command_batch", "Command batches must be arrays.")
    );
  }

  let state = startState;
  const results = [];
  const diagnostics = [];
  for (let index = 0; index < commands.length; index += 1) {
    const result = runFactorioEditorCommand(state, commands[index]);
    const resultSummary = {
      ok: result.ok,
      type: isObject(commands[index]) ? commands[index].type : null,
      mutated: result.mutated,
      diagnostics: result.diagnostics,
      ...(result.value !== undefined ? { value: result.value } : {}),
      ...(result.exports ? { exports: result.exports } : {})
    };
    results.push(resultSummary);
    diagnostics.push(
      ...result.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        commandIndex: index
      }))
    );

    if (!result.ok) {
      return {
        schema: FACTORIO_EDITOR_API_SCHEMA,
        ok: false,
        mutated: false,
        state: startState,
        results,
        diagnostics
      };
    }

    state = result.state;
  }

  return {
    schema: FACTORIO_EDITOR_API_SCHEMA,
    ok: true,
    mutated: results.some((result) => result.mutated),
    state,
    results,
    diagnostics
  };
}

export function createFactorioEditorApiProvenanceEntry(options = {}) {
  return createFactorioAgentProvenanceEntry(options);
}

export function appendFactorioEditorApiProvenance(state, entry) {
  const normalizedState = createFactorioEditorApiState(state);
  return createFactorioEditorApiState({
    ...normalizedState,
    provenance: appendFactorioAgentProvenanceEntry(normalizedState.provenance, entry)
  });
}

export function isFactorioEditorApiMutatingCommand(command) {
  return MUTATING_COMMANDS.has(command?.type);
}

export const FACTORIO_EDITOR_API_DIRECTIONS = Object.freeze({
  HORIZONTAL: HORIZONTAL_FLOW_DIRECTION,
  VERTICAL: VERTICAL_FLOW_DIRECTION
});

import {
  FACTORIO_EDITOR_API_SCHEMA,
  createFactorioEditorApiState
} from "./factorioEditorApi.js";
import { BODY_LAYOUT_ROOT_ID } from "./factorioLayoutTree.js";

export const FACTORIO_EDITOR_API_SUMMARY_SCHEMA = "labtorio-editor-api-summary.v0";

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function summarizeLayoutNode(node, parentId, index, depth, state) {
  const children = Array.isArray(node.children) ? node.children : [];
  const luaVariableName = state.currentWindow?.luaVariableNames?.[node.id];
  const summary = {
    id: node.id,
    atom: node.atom,
    parentId,
    index,
    depth,
    childIds: children.map((child) => child.id),
    ...(node.styleVariant ? { styleVariant: node.styleVariant } : {}),
    ...(node.primitive ? { primitive: node.primitive } : {}),
    ...(node.style ? { style: node.style } : {}),
    ...(node.caption != null ? { caption: node.caption } : {}),
    ...(node.direction ? { direction: node.direction } : {}),
    ...(node.size ? { size: cloneJson(node.size) } : {}),
    ...(luaVariableName ? { luaVariableName } : {})
  };

  return [
    summary,
    ...children.flatMap((child, childIndex) =>
      summarizeLayoutNode(child, node.id, childIndex, depth + 1, state)
    )
  ];
}

export function summarizeFactorioEditorApiState(sourceState = {}) {
  const state = createFactorioEditorApiState(sourceState);
  const rootChildren = state.currentWindow?.layoutChildren ?? [];
  const nodes = rootChildren.flatMap((node, index) =>
    summarizeLayoutNode(node, BODY_LAYOUT_ROOT_ID, index, 0, state)
  );

  return {
    schema: FACTORIO_EDITOR_API_SUMMARY_SCHEMA,
    apiSchema: FACTORIO_EDITOR_API_SCHEMA,
    title: state.title,
    selectedAnchor: state.selectedAnchor,
    window: state.currentWindow
      ? {
          title: state.currentWindow.title,
          size: cloneJson(state.currentWindow.size),
          bodyDirection: state.currentWindow.bodyDirection,
          bodyId: BODY_LAYOUT_ROOT_ID,
          childIds: rootChildren.map((node) => node.id),
          nextLayoutNodeNumber: state.currentWindow.nextLayoutNodeNumber
        }
      : null,
    layoutSettings: cloneJson(state.layoutSettings),
    hooks: {
      schema: state.hooks?.schema ?? null,
      actionIds: (state.hooks?.actions ?? []).map((action) => action.id)
    },
    nodeCount: nodes.length,
    nodes
  };
}

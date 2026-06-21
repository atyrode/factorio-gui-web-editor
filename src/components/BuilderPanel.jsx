import { Fragment, useEffect, useId, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/react";
import { Code2 } from "lucide-react";

import {
  LAYOUT_BUILDER_DND_TYPE,
  dropTargetData,
  nodeDragData,
  paletteDragData
} from "../factorioLayoutBuilderDnd.js";
import {
  BODY_LAYOUT_ROOT_ID,
  FRAME_ATOM_ID,
  HORIZONTAL_FLOW_ATOM_ID
} from "../factorioLayoutTree.js";
import { FxActionButton, FxFrame } from "./factorioGui.jsx";

function bodyFlowLabel(currentWindow) {
  return currentWindow?.bodyDirection === "vertical"
    ? "Window body Vertical Flow"
    : "Window body Horizontal Flow";
}

function atomLabel(atom) {
  return atom === HORIZONTAL_FLOW_ATOM_ID ? "Horizontal Flow" : "Frame";
}

function atomCode(atom) {
  return atom === HORIZONTAL_FLOW_ATOM_ID ? "flow.horizontal" : "frame";
}

function childLabel(node, locked) {
  if (locked || node.atom === HORIZONTAL_FLOW_ATOM_ID) {
    return "Add Frame";
  }

  return "Add Horizontal Flow";
}

function addAfterLabel(node) {
  return `Add ${atomLabel(node.atom)} after this item`;
}

function removeLabel(node) {
  return `Remove ${atomLabel(node.atom)} subtree`;
}

function collectModelNodes(model) {
  const nodes = new Map();

  function walk(node) {
    if (!node?.id) {
      return;
    }

    nodes.set(node.id, node);
    for (const child of node.children ?? []) {
      walk(child);
    }
  }

  walk(model?.root);
  return nodes;
}

function BuilderLuaVariableEditor({
  nodeId,
  value,
  onEdit
}) {
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [errorMessage, setErrorMessage] = useState(null);
  const inputRef = useRef(null);
  const cancelEditRef = useRef(false);
  const errorId = useId();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setDraftValue(value);
    }
  }, [editing, value]);

  function startEditing(event) {
    event.preventDefault();
    event.stopPropagation();
    cancelEditRef.current = false;
    setDraftValue(value);
    setErrorMessage(null);
    setEditing(true);
  }

  function commitEdit() {
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      return;
    }

    const result = onEdit?.(nodeId, draftValue);
    if (result?.ok === false) {
      setErrorMessage(result.message ?? "Invalid Lua variable name.");
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    setErrorMessage(null);
    setEditing(false);
  }

  function cancelEdit() {
    cancelEditRef.current = true;
    setDraftValue(value);
    setErrorMessage(null);
    setEditing(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  }

  if (editing) {
    return (
      <div className="fx-builder-row__variable-edit">
        <input
          aria-describedby={errorMessage ? errorId : undefined}
          aria-label={`Edit Lua variable for ${nodeId}`}
          aria-invalid={errorMessage ? "true" : undefined}
          className="fx-builder-row__variable-input"
          onBlur={commitEdit}
          onChange={(event) => {
            setDraftValue(event.target.value);
            setErrorMessage(null);
          }}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          value={draftValue}
        />
        {errorMessage ? (
          <span className="fx-builder-row__variable-error" id={errorId} role="alert">
            {errorMessage}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <button
      aria-label={`Edit Lua variable ${value} for ${nodeId}`}
      className="fx-builder-row__variable"
      data-anchor={`builder_lua_variable_${nodeId}`}
      onClick={startEditing}
      title={`Lua variable for ${nodeId}`}
      type="button"
    >
      <Code2 aria-hidden="true" />
      <code>{value}</code>
    </button>
  );
}

function shellNodeLabel(node) {
  if (node?.id === "gui_window") {
    return "Window Frame";
  }

  if (node?.id === "gui_window_titlebar") {
    return "Titlebar Horizontal Flow";
  }

  if (node?.id === "gui_window_title") {
    return "Title Label";
  }

  if (node?.id === "gui_window_drag_handle") {
    return "Header Filler";
  }

  return node?.className ?? "GUI Element";
}

function BuilderDropSlot({
  parentId,
  index,
  dragActive,
  dropTarget,
  surface = "list"
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `builder-${surface}-slot-${parentId}-${index}`,
    type: LAYOUT_BUILDER_DND_TYPE,
    accept: LAYOUT_BUILDER_DND_TYPE,
    disabled: !dragActive,
    data: dropTargetData({ parentId, index, surface })
  });
  const active = isDropTarget || dropTarget?.surface === surface &&
    dropTarget.parentId === parentId &&
    dropTarget.index === index;

  return (
    <li
      ref={ref}
      className={[
        "fx-builder-drop-slot",
        dragActive ? "is-armed" : "",
        active ? "is-active" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {active ? (
        <div className="fx-builder-ghost" data-anchor="builder_ghost_marker" aria-hidden="true" />
      ) : null}
    </li>
  );
}

function BuilderNodeRow({
  node,
  code = node.id,
  draggable = true,
  label = atomLabel(node.atom),
  locked = false,
  luaVariableName = code,
  inspectedAnchor,
  draggingId,
  onAddAfter,
  onAddChild,
  onEditLuaVariableName,
  onRemove,
  onSelect
}) {
  const { ref, handleRef, isDragSource } = useDraggable({
    id: `builder-node-${node.id}`,
    type: LAYOUT_BUILDER_DND_TYPE,
    disabled: !draggable,
    data: nodeDragData(node.id, node.atom)
  });

  return (
    <div
      ref={ref}
      className={[
        "fx-builder-row",
        locked ? "fx-builder-row--locked" : "",
        draggingId === node.id || isDragSource ? "is-dragging" : "",
        inspectedAnchor === node.id ? "is-selected" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(node.id)}
    >
      <div className="fx-builder-row__main">
        <button
          ref={draggable ? handleRef : undefined}
          className="fx-builder-row__label"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(node.id);
          }}
          title={code}
          type="button"
        >
          <span>{label}</span>
        </button>
        <BuilderLuaVariableEditor
          nodeId={node.id}
          onEdit={onEditLuaVariableName}
          value={luaVariableName}
        />
      </div>
      <div className="fx-builder-row__actions" aria-label={`${node.id} actions`}>
        {onAddChild ? (
          <FxActionButton
            icon="add-child"
            label={childLabel(node, locked)}
            onClick={(event) => {
              event.stopPropagation();
              onAddChild(node.id);
            }}
          />
        ) : null}
        {onAddAfter ? (
          <FxActionButton
            icon="add-after"
            label={addAfterLabel(node)}
            onClick={(event) => {
              event.stopPropagation();
              onAddAfter(node.id);
            }}
          />
        ) : null}
        {onRemove ? (
          <FxActionButton
            icon="trash"
            label={removeLabel(node)}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(node.id);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function BuilderNodeList({
  nodes,
  parentId,
  inspectedAnchor,
  dragActive,
  draggingId,
  dropTarget,
  modelNodeById,
  onAddAfter,
  onAddChild,
  onEditLuaVariableName,
  onRemove,
  onSelect
}) {
  return (
    <ul className="fx-builder-tree">
      <BuilderDropSlot
        dragActive={dragActive}
        dropTarget={dropTarget}
        index={0}
        parentId={parentId}
      />
      {nodes.map((node, index) => (
        <Fragment key={node.id}>
          <li className="fx-builder-tree__item">
            <BuilderNodeRow
              draggingId={draggingId}
              inspectedAnchor={inspectedAnchor}
              luaVariableName={modelNodeById.get(node.id)?.luaVariableName ?? node.id}
              node={node}
              onAddAfter={onAddAfter}
              onAddChild={onAddChild}
              onEditLuaVariableName={onEditLuaVariableName}
              onRemove={onRemove}
              onSelect={onSelect}
            />
            <BuilderNodeList
              dragActive={dragActive}
              dropTarget={dropTarget}
              draggingId={draggingId}
              inspectedAnchor={inspectedAnchor}
              nodes={node.children}
              modelNodeById={modelNodeById}
              onAddAfter={onAddAfter}
              onAddChild={onAddChild}
              onEditLuaVariableName={onEditLuaVariableName}
              onRemove={onRemove}
              onSelect={onSelect}
              parentId={node.id}
            />
          </li>
          <BuilderDropSlot
            dragActive={dragActive}
            dropTarget={dropTarget}
            index={index + 1}
            parentId={parentId}
          />
        </Fragment>
      ))}
    </ul>
  );
}

function BuilderBodyTree({
  childrenCount,
  children,
  dragActive,
  dropTarget
}) {
  const { ref, isDropTarget } = useDroppable({
    id: "builder-body-tree-drop-end",
    type: LAYOUT_BUILDER_DND_TYPE,
    accept: LAYOUT_BUILDER_DND_TYPE,
    disabled: !dragActive,
    data: dropTargetData({
      parentId: BODY_LAYOUT_ROOT_ID,
      index: childrenCount,
      surface: "list"
    })
  });
  const active = isDropTarget ||
    dropTarget?.surface === "list" &&
    dropTarget.parentId === BODY_LAYOUT_ROOT_ID &&
    dropTarget.index === childrenCount;

  return (
    <div
      ref={ref}
      className={[
        "fx-builder-body",
        dragActive ? "is-armed" : "",
        active ? "is-drop-target" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-anchor="builder_body_tree"
    >
      {children}
    </div>
  );
}

function BuilderPaletteItem({
  atom,
  currentWindow,
  paletteDraggingAtom
}) {
  const { ref, isDragSource } = useDraggable({
    id: `builder-palette-${atom}`,
    type: LAYOUT_BUILDER_DND_TYPE,
    disabled: !currentWindow,
    data: paletteDragData(atom)
  });
  const anchor =
    atom === HORIZONTAL_FLOW_ATOM_ID
      ? "horizontal_flow_palette_item"
      : "frame_palette_item";

  return (
    <button
      ref={ref}
      className={[
        "fx-builder-palette__item",
        paletteDraggingAtom === atom || isDragSource ? "is-dragging" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-anchor={anchor}
      disabled={!currentWindow}
      type="button"
    >
      <span>{atomLabel(atom)}</span>
      <code>{atomCode(atom)}</code>
    </button>
  );
}

function BuilderShellTree({
  currentWindow,
  inspectedAnchor,
  layoutChildren,
  model,
  dragActive,
  draggingId,
  dropTarget,
  onAddAfter,
  onAddChild,
  onEditLuaVariableName,
  onRemove,
  onSelect
}) {
  const root = model?.root;
  if (!currentWindow || !root) {
    return null;
  }

  const titlebar = root.children?.[0];
  const titleLabel = titlebar?.children?.[0];
  const dragHandle = titlebar?.children?.[1];
  const body = root.children?.[1];
  const modelNodeById = collectModelNodes(model);

  return (
    <ul className="fx-builder-tree fx-builder-tree--body-root">
      <li className="fx-builder-tree__item">
        <BuilderNodeRow
          code={root.id}
          draggable={false}
          inspectedAnchor={inspectedAnchor}
          label={shellNodeLabel(root)}
          locked
          luaVariableName={root.luaVariableName ?? root.id}
          node={root}
          onEditLuaVariableName={onEditLuaVariableName}
          onSelect={onSelect}
        />
        <ul className="fx-builder-tree">
          {titlebar ? (
            <li className="fx-builder-tree__item">
              <BuilderNodeRow
                code={titlebar.id}
                draggable={false}
                inspectedAnchor={inspectedAnchor}
                label={shellNodeLabel(titlebar)}
                locked
                luaVariableName={titlebar.luaVariableName ?? titlebar.id}
                node={titlebar}
                onEditLuaVariableName={onEditLuaVariableName}
                onSelect={onSelect}
              />
              <ul className="fx-builder-tree">
                {[titleLabel, dragHandle].filter(Boolean).map((node) => (
                  <li className="fx-builder-tree__item" key={node.id}>
                    <BuilderNodeRow
                      code={node.id}
                      draggable={false}
                      inspectedAnchor={inspectedAnchor}
                      label={shellNodeLabel(node)}
                      locked
                      luaVariableName={node.luaVariableName ?? node.id}
                      node={node}
                      onEditLuaVariableName={onEditLuaVariableName}
                      onSelect={onSelect}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ) : null}
          {body ? (
            <li className="fx-builder-tree__item">
              <BuilderNodeRow
                code={body.id}
                draggable={false}
                inspectedAnchor={inspectedAnchor}
                label={bodyFlowLabel(currentWindow)}
                locked
                luaVariableName={body.luaVariableName ?? BODY_LAYOUT_ROOT_ID}
                node={{ ...body, atom: HORIZONTAL_FLOW_ATOM_ID }}
                onAddChild={onAddChild}
                onEditLuaVariableName={onEditLuaVariableName}
                onSelect={onSelect}
              />
              <BuilderNodeList
                dragActive={dragActive}
                dropTarget={dropTarget}
                draggingId={draggingId}
                inspectedAnchor={inspectedAnchor}
                modelNodeById={modelNodeById}
                nodes={layoutChildren}
                onAddAfter={onAddAfter}
                onAddChild={onAddChild}
                onEditLuaVariableName={onEditLuaVariableName}
                onRemove={onRemove}
                onSelect={onSelect}
                parentId={BODY_LAYOUT_ROOT_ID}
              />
            </li>
          ) : null}
        </ul>
      </li>
    </ul>
  );
}

export function BuilderPanel({
  currentWindow,
  inspectedAnchor,
  draggingId = null,
  paletteDraggingAtom = null,
  dropTarget,
  model,
  onAddAfter,
  onAddChild,
  onEditLuaVariableName,
  onRemove,
  onSelect
}) {
  const layoutChildren = currentWindow?.layoutChildren ?? [];
  const dragActive = Boolean(draggingId || paletteDraggingAtom);

  return (
    <FxFrame title="Builder" className="fx-editor-panel fx-builder-panel" data-anchor="builder_panel">
      <div className="fx-builder-palette" aria-label="Builder palette">
        {[FRAME_ATOM_ID, HORIZONTAL_FLOW_ATOM_ID].map((atom) => (
          <BuilderPaletteItem
            atom={atom}
            currentWindow={currentWindow}
            key={atom}
            paletteDraggingAtom={paletteDraggingAtom}
          />
        ))}
      </div>
      <BuilderBodyTree
        childrenCount={layoutChildren.length}
        dragActive={dragActive}
        dropTarget={dropTarget}
      >
        <div className="fx-builder-body__header">
          <span>Component tree</span>
        </div>
        <BuilderShellTree
          currentWindow={currentWindow}
          dragActive={dragActive}
          draggingId={draggingId}
          dropTarget={dropTarget}
          inspectedAnchor={inspectedAnchor}
          layoutChildren={layoutChildren}
          model={model}
          onAddAfter={onAddAfter}
          onAddChild={onAddChild}
          onEditLuaVariableName={onEditLuaVariableName}
          onRemove={onRemove}
          onSelect={onSelect}
        />
      </BuilderBodyTree>
    </FxFrame>
  );
}

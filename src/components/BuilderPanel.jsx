import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  dragAndDropFeature,
  hotkeysCoreFeature,
  isOrderedDragTarget,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { useDraggable } from "@dnd-kit/react";
import { Code2, GripVertical } from "lucide-react";

import {
  LAYOUT_BUILDER_DND_TYPE,
  paletteDragData
} from "../factorioLayoutBuilderDnd.js";
import {
  BODY_LAYOUT_ROOT_ID,
  canDropLayoutNode,
  FRAME_ATOM_ID,
  HORIZONTAL_FLOW_ATOM_ID
} from "../factorioLayoutTree.js";
import { FxActionButton, FxFrame } from "./factorioGui.jsx";

const BUILDER_TREE_ROOT_ID = "builder_tree_root";
const PALETTE_TREE_DND_FORMAT = "application/x-factorio-gui-builder-palette";

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

function paletteTreeAtomFormat(atom) {
  return `${PALETTE_TREE_DND_FORMAT}-${atom}`;
}

function dataTransferTypes(dataTransfer) {
  return Array.from(dataTransfer?.types ?? []);
}

function readPaletteTreeAtom(dataTransfer, readPayload = true) {
  if (!dataTransfer) {
    return null;
  }

  if (readPayload) {
    const payload = dataTransfer.getData(PALETTE_TREE_DND_FORMAT);
    if (payload === FRAME_ATOM_ID || payload === HORIZONTAL_FLOW_ATOM_ID) {
      return payload;
    }
  }

  const types = dataTransferTypes(dataTransfer);
  if (types.includes(paletteTreeAtomFormat(FRAME_ATOM_ID))) {
    return FRAME_ATOM_ID;
  }

  if (types.includes(paletteTreeAtomFormat(HORIZONTAL_FLOW_ATOM_ID))) {
    return HORIZONTAL_FLOW_ATOM_ID;
  }

  return null;
}

function dropLocationFromTarget(target) {
  if (!target) {
    return null;
  }

  const parentItem = target.item;
  const parentData = parentItem.getItemData();
  if (!parentData?.canReceiveChildren) {
    return null;
  }

  return {
    parentId: parentData.id,
    index: isOrderedDragTarget(target)
      ? target.insertionIndex
      : parentItem.getChildren().length
  };
}

function createTreePayload({
  id,
  node,
  label,
  code = id,
  atom = node?.atom ?? null,
  locked = false,
  draggable = false,
  canReceiveChildren = false,
  childrenIds = [],
  luaVariableName = code
}) {
  return {
    id,
    node,
    label,
    code,
    atom,
    locked,
    draggable,
    canReceiveChildren,
    childrenIds,
    luaVariableName
  };
}

function buildBuilderTreeData({ currentWindow, layoutChildren, model }) {
  const root = model?.root;
  const modelNodeById = collectModelNodes(model);
  const items = new Map();
  const expandedIds = [BUILDER_TREE_ROOT_ID];

  function addItem(payload) {
    items.set(payload.id, payload);
    if (payload.childrenIds.length || payload.canReceiveChildren) {
      expandedIds.push(payload.id);
    }
  }

  if (!currentWindow || !root) {
    addItem(createTreePayload({
      id: BUILDER_TREE_ROOT_ID,
      label: "Component tree",
      locked: true
    }));
    return { items, expandedIds };
  }

  const titlebar = root.children?.[0];
  const titleLabel = titlebar?.children?.[0];
  const dragHandle = titlebar?.children?.[1];
  const body = root.children?.[1];
  const rootChildrenIds = [titlebar?.id, body?.id].filter(Boolean);
  const titlebarChildrenIds = [titleLabel?.id, dragHandle?.id].filter(Boolean);
  const bodyChildrenIds = layoutChildren.map((node) => node.id);

  addItem(createTreePayload({
    id: BUILDER_TREE_ROOT_ID,
    label: "Component tree",
    locked: true,
    childrenIds: [root.id]
  }));
  addItem(createTreePayload({
    id: root.id,
    node: root,
    label: shellNodeLabel(root),
    locked: true,
    childrenIds: rootChildrenIds,
    luaVariableName: root.luaVariableName ?? root.id
  }));

  if (titlebar) {
    addItem(createTreePayload({
      id: titlebar.id,
      node: titlebar,
      label: shellNodeLabel(titlebar),
      locked: true,
      childrenIds: titlebarChildrenIds,
      luaVariableName: titlebar.luaVariableName ?? titlebar.id
    }));
  }

  for (const node of [titleLabel, dragHandle].filter(Boolean)) {
    addItem(createTreePayload({
      id: node.id,
      node,
      label: shellNodeLabel(node),
      locked: true,
      luaVariableName: node.luaVariableName ?? node.id
    }));
  }

  if (body) {
    addItem(createTreePayload({
      id: body.id,
      node: { ...body, atom: HORIZONTAL_FLOW_ATOM_ID },
      label: bodyFlowLabel(currentWindow),
      atom: HORIZONTAL_FLOW_ATOM_ID,
      locked: true,
      canReceiveChildren: true,
      childrenIds: bodyChildrenIds,
      luaVariableName: body.luaVariableName ?? BODY_LAYOUT_ROOT_ID
    }));
  }

  function addAuthoredNode(node) {
    const modelNode = modelNodeById.get(node.id);
    addItem(createTreePayload({
      id: node.id,
      node,
      label: atomLabel(node.atom),
      atom: node.atom,
      draggable: true,
      canReceiveChildren: true,
      childrenIds: (node.children ?? []).map((child) => child.id),
      luaVariableName: modelNode?.luaVariableName ?? node.id
    }));

    for (const child of node.children ?? []) {
      addAuthoredNode(child);
    }
  }

  for (const node of layoutChildren) {
    addAuthoredNode(node);
  }

  return { items, expandedIds: [...new Set(expandedIds)] };
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

function BuilderNodeRow({
  node,
  code = node.id,
  draggable = true,
  dragHandleProps = null,
  treeItem = null,
  label = atomLabel(node.atom),
  locked = false,
  luaVariableName = code,
  inspectedAnchor,
  dragging = false,
  dropTarget = false,
  invalidDropTarget = false,
  onAddAfter,
  onAddChild,
  onEditLuaVariableName,
  onRemove,
  onSelect,
  rowProps = {}
}) {
  const { className: rowPropClassName, onClick: rowPropOnClick, ...restRowProps } = rowProps;

  function selectFromControl(event) {
    event.stopPropagation();
    treeItem?.setFocused?.();
    treeItem?.primaryAction?.();
    onSelect?.(node.id);
  }

  return (
    <div
      {...restRowProps}
      className={[
        "fx-builder-row",
        locked ? "fx-builder-row--locked" : "",
        dragging ? "is-dragging" : "",
        dropTarget ? "is-drop-target" : "",
        invalidDropTarget ? "is-invalid-drop-target" : "",
        inspectedAnchor === node.id ? "is-selected" : "",
        rowPropClassName
      ]
        .filter(Boolean)
        .join(" ")}
      data-anchor={`builder_tree_item_${node.id}`}
      onClick={rowPropOnClick}
    >
      <button
        {...(dragHandleProps ?? {})}
        aria-label={draggable ? `Drag ${label}` : `${label} is locked`}
        className="fx-builder-row__drag-handle"
        disabled={!draggable}
        onClick={(event) => event.stopPropagation()}
        title={draggable ? `Drag ${label}` : "Generated shell node"}
        type="button"
      >
        <GripVertical aria-hidden="true" />
      </button>
      <div className="fx-builder-row__main">
        <button
          className="fx-builder-row__label"
          onClick={selectFromControl}
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

function BuilderPaletteItem({
  atom,
  currentWindow,
  paletteDraggingAtom
}) {
  const { ref, handleRef, isDragSource } = useDraggable({
    id: `builder-palette-${atom}`,
    type: LAYOUT_BUILDER_DND_TYPE,
    disabled: !currentWindow,
    data: paletteDragData(atom)
  });
  const anchor =
    atom === HORIZONTAL_FLOW_ATOM_ID
      ? "horizontal_flow_palette_item"
      : "frame_palette_item";

  function handleTreeDragStart(event) {
    if (!currentWindow) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.dropEffect = "copy";
    event.dataTransfer.setData(PALETTE_TREE_DND_FORMAT, atom);
    event.dataTransfer.setData(paletteTreeAtomFormat(atom), atom);
  }

  return (
    <div
      ref={ref}
      className={[
        "fx-builder-palette__item",
        paletteDraggingAtom === atom || isDragSource ? "is-dragging" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      aria-disabled={!currentWindow}
      data-anchor={anchor}
    >
      <button
        ref={handleRef}
        className="fx-builder-palette__canvas-handle"
        disabled={!currentWindow}
        type="button"
      >
        <span>{atomLabel(atom)}</span>
        <code>{atomCode(atom)}</code>
      </button>
      <span
        aria-disabled={!currentWindow}
        aria-label={`Drag ${atomLabel(atom)} into component tree`}
        className="fx-builder-palette__tree-handle"
        draggable={Boolean(currentWindow)}
        onDragStart={handleTreeDragStart}
        onPointerDown={(event) => event.stopPropagation()}
        role="button"
        tabIndex={currentWindow ? 0 : -1}
        title={`Drag ${atomLabel(atom)} into component tree`}
      >
        Tree
      </span>
    </div>
  );
}

function BuilderHeadlessTree({
  currentWindow,
  inspectedAnchor,
  layoutChildren,
  model,
  onAddAfter,
  onAddChild,
  onEditLuaVariableName,
  onInsertPalette,
  onMoveNode,
  onRemove,
  onSelect
}) {
  const { items, expandedIds } = useMemo(
    () => buildBuilderTreeData({ currentWindow, layoutChildren, model }),
    [currentWindow, layoutChildren, model]
  );
  const selectedItems = inspectedAnchor && items.has(inspectedAnchor)
    ? [inspectedAnchor]
    : [];
  const focusedItem = selectedItems[0] ?? null;
  const tree = useTree({
    rootItemId: BUILDER_TREE_ROOT_ID,
    indent: 20,
    canReorder: true,
    reorderAreaPercentage: 0.32,
    seperateDragHandle: true,
    draggedItemOverwritesSelection: true,
    state: {
      expandedItems: expandedIds,
      selectedItems,
      focusedItem
    },
    dataLoader: {
      getItem: (itemId) => items.get(itemId) ?? items.get(BUILDER_TREE_ROOT_ID),
      getChildren: (itemId) => items.get(itemId)?.childrenIds ?? []
    },
    getItemName: (item) => item.getItemData()?.label ?? item.getId(),
    isItemFolder: (item) => {
      const itemData = item.getItemData();
      return Boolean(itemData?.childrenIds?.length || itemData?.canReceiveChildren);
    },
    onPrimaryAction: (item) => {
      const itemData = item.getItemData();
      if (itemData?.id && itemData.id !== BUILDER_TREE_ROOT_ID) {
        onSelect?.(itemData.id);
      }
    },
    canDrag: (dragItems) =>
      dragItems.length === 1 && Boolean(dragItems[0].getItemData()?.draggable),
    canDrop: (dragItems, target) => {
      if (dragItems.length !== 1) {
        return false;
      }

      const dragItemData = dragItems[0].getItemData();
      const location = dropLocationFromTarget(target);
      if (!dragItemData?.draggable || !dragItemData.atom || !location) {
        return false;
      }

      return canDropLayoutNode(
        layoutChildren,
        dragItemData.id,
        location.parentId,
        dragItemData.atom
      );
    },
    canDragForeignDragObjectOver: (dataTransfer, target) => {
      const atom = readPaletteTreeAtom(dataTransfer, false);
      const location = dropLocationFromTarget(target);
      return Boolean(
        atom &&
        location &&
        canDropLayoutNode(layoutChildren, null, location.parentId, atom)
      );
    },
    canDropForeignDragObject: (dataTransfer, target) => {
      const atom = readPaletteTreeAtom(dataTransfer, true);
      const location = dropLocationFromTarget(target);
      return Boolean(
        atom &&
        location &&
        canDropLayoutNode(layoutChildren, null, location.parentId, atom)
      );
    },
    onDrop: (dragItems, target) => {
      const dragItemData = dragItems[0]?.getItemData();
      const location = dropLocationFromTarget(target);
      if (dragItemData?.draggable && location) {
        onMoveNode?.(dragItemData.id, location.parentId, location.index);
      }
    },
    onDropForeignDragObject: (dataTransfer, target) => {
      const atom = readPaletteTreeAtom(dataTransfer, true);
      const location = dropLocationFromTarget(target);
      if (atom && location) {
        onInsertPalette?.(location.parentId, location.index, atom);
      }
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
      hotkeysCoreFeature
    ]
  });

  const draggedIds = new Set(
    (tree.getState().dnd?.draggedItems ?? []).map((item) => item.getId())
  );

  return (
    <div
      {...tree.getContainerProps("Generated component tree")}
      className="fx-builder-tree fx-builder-tree--headless"
    >
      {tree.getItems().map((item) => {
        const itemData = item.getItemData();
        const itemMeta = item.getItemMeta();
        const draggable = Boolean(itemData.draggable);
        const dragging = draggedIds.has(item.getId());
        const invalidDropTarget = item.isDraggingOver() && !item.isDragTarget();

        return (
          <div
            className="fx-builder-tree__item"
            data-tree-level={itemMeta.level}
            key={item.getKey()}
            style={{ "--fx-builder-tree-level": itemMeta.level }}
          >
            <BuilderNodeRow
              code={itemData.code}
              draggable={draggable}
              dragHandleProps={draggable ? item.getDragHandleProps() : null}
              dragging={dragging}
              dropTarget={item.isDragTarget()}
              inspectedAnchor={inspectedAnchor}
              invalidDropTarget={invalidDropTarget}
              label={itemData.label}
              locked={itemData.locked}
              luaVariableName={itemData.luaVariableName}
              node={itemData.node}
              onAddAfter={draggable ? onAddAfter : null}
              onAddChild={itemData.canReceiveChildren ? onAddChild : null}
              onEditLuaVariableName={onEditLuaVariableName}
              onRemove={draggable ? onRemove : null}
              onSelect={onSelect}
              rowProps={item.getProps()}
              treeItem={item}
            />
          </div>
        );
      })}
      <div
        className="fx-builder-tree__drag-line"
        data-anchor="builder_tree_drag_line"
        style={tree.getDragLineStyle(0, 0)}
      />
    </div>
  );
}

export function BuilderPanel({
  currentWindow,
  inspectedAnchor,
  paletteDraggingAtom = null,
  model,
  onAddAfter,
  onAddChild,
  onEditLuaVariableName,
  onInsertPalette,
  onMoveNode,
  onRemove,
  onSelect
}) {
  const layoutChildren = currentWindow?.layoutChildren ?? [];

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
      <div className="fx-builder-body" data-anchor="builder_body_tree">
        <div className="fx-builder-body__header">
          <span>Component tree</span>
        </div>
        <BuilderHeadlessTree
          currentWindow={currentWindow}
          inspectedAnchor={inspectedAnchor}
          layoutChildren={layoutChildren}
          model={model}
          onAddAfter={onAddAfter}
          onAddChild={onAddChild}
          onEditLuaVariableName={onEditLuaVariableName}
          onInsertPalette={onInsertPalette}
          onMoveNode={onMoveNode}
          onRemove={onRemove}
          onSelect={onSelect}
        />
      </div>
    </FxFrame>
  );
}

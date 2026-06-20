import { Fragment } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/react";

import {
  HORIZONTAL_FLOW_BUILDER_DND_TYPE,
  dropTargetData,
  nodeDragData,
  paletteDragData
} from "../factorioBuilderDnd.js";
import { BODY_LAYOUT_ROOT_ID } from "../factorioLayoutTree.js";
import { FxActionButton, FxFrame } from "./factorioGui.jsx";

function BuilderDropSlot({
  parentId,
  index,
  dragActive,
  dropTarget,
  surface = "list"
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `builder-${surface}-slot-${parentId}-${index}`,
    type: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    accept: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
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
  inspectedAnchor,
  draggingId,
  onAddAfter,
  onAddChild,
  onRemove,
  onSelect
}) {
  const { ref, handleRef, isDragSource } = useDraggable({
    id: `builder-node-${node.id}`,
    type: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    data: nodeDragData(node.id)
  });

  return (
    <div
      ref={ref}
      className={[
        "fx-builder-row",
        draggingId === node.id || isDragSource ? "is-dragging" : "",
        inspectedAnchor === node.id ? "is-selected" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(node.id)}
    >
      <button
        ref={handleRef}
        className="fx-builder-row__label"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(node.id);
        }}
        type="button"
      >
        <span>Horizontal Flow</span>
        <code>{node.id}</code>
      </button>
      <div className="fx-builder-row__actions" aria-label={`${node.id} actions`}>
        <FxActionButton
          icon="add-child"
          label="Add nested Horizontal Flow"
          onClick={(event) => {
            event.stopPropagation();
            onAddChild(node.id);
          }}
        />
        <FxActionButton
          icon="add-after"
          label="Add Horizontal Flow after this item"
          onClick={(event) => {
            event.stopPropagation();
            onAddAfter(node.id);
          }}
        />
        <FxActionButton
          icon="trash"
          label="Remove Horizontal Flow subtree"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(node.id);
          }}
        />
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
  onAddAfter,
  onAddChild,
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
              node={node}
              onAddAfter={onAddAfter}
              onAddChild={onAddChild}
              onRemove={onRemove}
              onSelect={onSelect}
            />
            <BuilderNodeList
              dragActive={dragActive}
              dropTarget={dropTarget}
              draggingId={draggingId}
              inspectedAnchor={inspectedAnchor}
              nodes={node.children}
              onAddAfter={onAddAfter}
              onAddChild={onAddChild}
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
    type: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    accept: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
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
  currentWindow,
  paletteDragging
}) {
  const { ref, isDragSource } = useDraggable({
    id: "builder-palette-horizontal-flow",
    type: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    disabled: !currentWindow,
    data: paletteDragData()
  });

  return (
    <button
      ref={ref}
      className={[
        "fx-builder-palette__item",
        paletteDragging || isDragSource ? "is-dragging" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-anchor="horizontal_flow_palette_item"
      disabled={!currentWindow}
      type="button"
    >
      <span>Horizontal Flow</span>
      <code>flow.horizontal</code>
    </button>
  );
}

export function BuilderPanel({
  currentWindow,
  inspectedAnchor,
  draggingId = null,
  paletteDragging = false,
  dropTarget,
  onAddAfter,
  onAddChild,
  onRemove,
  onSelect
}) {
  const layoutChildren = currentWindow?.layoutChildren ?? [];
  const dragActive = Boolean(draggingId || paletteDragging);

  return (
    <FxFrame title="Builder" className="fx-editor-panel fx-builder-panel" data-anchor="builder_panel">
      <div className="fx-builder-palette" aria-label="Builder palette">
        <BuilderPaletteItem
          currentWindow={currentWindow}
          paletteDragging={paletteDragging}
        />
      </div>
      <BuilderBodyTree
        childrenCount={layoutChildren.length}
        dragActive={dragActive}
        dropTarget={dropTarget}
      >
        <div className="fx-builder-body__header">
          <span>Window body</span>
        </div>
        <BuilderNodeList
          dragActive={dragActive}
          dropTarget={dropTarget}
          draggingId={draggingId}
          inspectedAnchor={inspectedAnchor}
          nodes={layoutChildren}
          onAddAfter={onAddAfter}
          onAddChild={onAddChild}
          onRemove={onRemove}
          onSelect={onSelect}
          parentId={BODY_LAYOUT_ROOT_ID}
        />
      </BuilderBodyTree>
    </FxFrame>
  );
}

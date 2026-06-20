import { Fragment } from "react";

import { BODY_LAYOUT_ROOT_ID } from "../factorioLayoutTree.js";
import { FxActionButton, FxFrame } from "./factorioGui.jsx";

function BuilderDropSlot({
  parentId,
  index,
  dropTarget,
  onBuilderDragOver,
  onBuilderDrop
}) {
  const active = dropTarget?.surface === "list" &&
    dropTarget.parentId === parentId &&
    dropTarget.index === index;

  return (
    <li
      className={[
        "fx-builder-drop-slot",
        active ? "is-active" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onDragEnter={(event) => onBuilderDragOver(event, { parentId, index, surface: "list" })}
      onDragOver={(event) => onBuilderDragOver(event, { parentId, index, surface: "list" })}
      onDrop={(event) => onBuilderDrop(event, { parentId, index, surface: "list" })}
    >
      {active ? (
        <div className="fx-builder-ghost" data-anchor="builder_ghost_marker" aria-hidden="true" />
      ) : null}
    </li>
  );
}

function BuilderNodeList({
  nodes,
  parentId,
  inspectedAnchor,
  dropTarget,
  onAddAfter,
  onAddChild,
  onBuilderDragOver,
  onBuilderDrop,
  onDragEnd,
  onDragStartNode,
  onRemove,
  onSelect
}) {
  return (
    <ul className="fx-builder-tree">
      <BuilderDropSlot
        dropTarget={dropTarget}
        index={0}
        onBuilderDragOver={onBuilderDragOver}
        onBuilderDrop={onBuilderDrop}
        parentId={parentId}
      />
      {nodes.map((node, index) => (
        <Fragment key={node.id}>
          <li className="fx-builder-tree__item">
            <div
              className={[
                "fx-builder-row",
                inspectedAnchor === node.id ? "is-selected" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              draggable
              onClick={() => onSelect(node.id)}
              onDragEnd={onDragEnd}
              onDragStart={(event) => onDragStartNode(event, node.id)}
            >
              <button
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
            <BuilderNodeList
              dropTarget={dropTarget}
              inspectedAnchor={inspectedAnchor}
              nodes={node.children}
              onAddAfter={onAddAfter}
              onAddChild={onAddChild}
              onBuilderDragOver={onBuilderDragOver}
              onBuilderDrop={onBuilderDrop}
              onDragEnd={onDragEnd}
              onDragStartNode={onDragStartNode}
              onRemove={onRemove}
              onSelect={onSelect}
              parentId={node.id}
            />
          </li>
          <BuilderDropSlot
            dropTarget={dropTarget}
            index={index + 1}
            onBuilderDragOver={onBuilderDragOver}
            onBuilderDrop={onBuilderDrop}
            parentId={parentId}
          />
        </Fragment>
      ))}
    </ul>
  );
}

export function BuilderPanel({
  currentWindow,
  inspectedAnchor,
  dropTarget,
  onAddRoot,
  onAddAfter,
  onAddChild,
  onBuilderDragOver,
  onBuilderDrop,
  onDragEnd,
  onDragStartNode,
  onDragStartPalette,
  onRemove,
  onSelect
}) {
  const layoutChildren = currentWindow?.layoutChildren ?? [];

  return (
    <FxFrame title="Builder" className="fx-editor-panel fx-builder-panel" data-anchor="builder_panel">
      <div className="fx-builder-palette" aria-label="Builder palette">
        <button
          className="fx-builder-palette__item"
          data-anchor="horizontal_flow_palette_item"
          disabled={!currentWindow}
          draggable={Boolean(currentWindow)}
          onClick={onAddRoot}
          onDragEnd={onDragEnd}
          onDragStart={onDragStartPalette}
          type="button"
        >
          <span>Horizontal Flow</span>
          <code>flow.horizontal</code>
        </button>
        <FxActionButton
          disabled={!currentWindow}
          icon="plus"
          label="Add Horizontal Flow to body"
          onClick={onAddRoot}
        />
      </div>
      <div
        className="fx-builder-body"
        data-anchor="builder_body_tree"
        onDragOver={(event) =>
          onBuilderDragOver(event, {
            parentId: BODY_LAYOUT_ROOT_ID,
            index: layoutChildren.length,
            surface: "list"
          })
        }
        onDrop={(event) =>
          onBuilderDrop(event, {
            parentId: BODY_LAYOUT_ROOT_ID,
            index: layoutChildren.length,
            surface: "list"
          })
        }
      >
        <div className="fx-builder-body__header">
          <span>Window body</span>
        </div>
        <BuilderNodeList
          dropTarget={dropTarget}
          inspectedAnchor={inspectedAnchor}
          nodes={layoutChildren}
          onAddAfter={onAddAfter}
          onAddChild={onAddChild}
          onBuilderDragOver={onBuilderDragOver}
          onBuilderDrop={onBuilderDrop}
          onDragEnd={onDragEnd}
          onDragStartNode={onDragStartNode}
          onRemove={onRemove}
          onSelect={onSelect}
          parentId={BODY_LAYOUT_ROOT_ID}
        />
      </div>
    </FxFrame>
  );
}


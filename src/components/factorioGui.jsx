import { useEffect, useRef, useState } from "react";
import {
  ClipboardPaste,
  CornerDownRight,
  Copy,
  ListPlus,
  Pencil,
  Plus,
  Redo2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Search,
  Undo2,
  Unlock
} from "lucide-react";
import { createBuilderDropTarget } from "../factorioLayoutBuilderDnd.js";
import {
  FILLER_ATOM_ID,
  FRAME_ATOM_ID,
  HORIZONTAL_FLOW_ATOM_ID,
  LABEL_ATOM_ID
} from "../factorioLayoutTree.js";
import {
  frameStyleReference,
  getFrameBodySize,
  getFrameClipSize,
  getFrameContentSize,
  getFrameTitlebarClipSize,
  getFrameTitlebarContentSize,
  getFrameTitlebarSize,
  labelStyleVariant
} from "../factorioModel.js";

export function FxButton({
  children,
  variant = "default",
  active = false,
  className = "",
  type = "button",
  ...props
}) {
  const classes = [
    "fx-button",
    variant !== "default" ? `fx-button--${variant}` : "",
    active ? "is-active" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}

const actionButtonIcons = {
  "add-after": ListPlus,
  "add-child": CornerDownRight,
  back: ChevronLeft,
  copy: Copy,
  forward: ChevronRight,
  "lock-closed": Lock,
  "lock-open": Unlock,
  paste: ClipboardPaste,
  "edit-text": Pencil,
  plus: Plus,
  redo: Redo2,
  trash: Trash2,
  search: Search,
  undo: Undo2
};

export function FxActionButton({
  icon,
  label,
  active = false,
  className = "",
  type = "button",
  ...props
}) {
  const Icon = actionButtonIcons[icon] ?? null;

  return (
    <button
      aria-label={label}
      className={[
        "fx-action-button",
        `fx-action-button--${icon}`,
        active ? "is-active" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={active}
      title={label}
      type={type}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" /> : null}
    </button>
  );
}

export function FxCheckbox({
  children,
  checked = false,
  disabled = false,
  readOnly = true,
  onChange,
  className = "",
  ...props
}) {
  return (
    <label className={["fx-checkbox", className].filter(Boolean).join(" ")} {...props}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        readOnly={readOnly}
        onChange={onChange}
      />
      <span className="fx-checkbox__box" aria-hidden="true" />
      <span className="fx-checkbox__label">{children}</span>
    </label>
  );
}

export function FxFrame({
  title,
  titleActions = null,
  children,
  className = "",
  as: Element = "section",
  ...props
}) {
  return (
    <Element className={["fx-frame", className].filter(Boolean).join(" ")} {...props}>
      {title ? (
        titleActions ? (
          <div className="fx-frame__header">
            <h2 className="fx-frame__title">{title}</h2>
            <div className="fx-frame__title-actions">{titleActions}</div>
          </div>
        ) : (
          <h2 className="fx-frame__title">{title}</h2>
        )
      ) : null}
      {children}
    </Element>
  );
}

export function FxInset({ children, variant = "default", className = "", ...props }) {
  const classes = [
    "fx-inset",
    variant !== "default" ? `fx-inset--${variant}` : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function FxNotice({ children, tone = "neutral" }) {
  return <div className={`fx-notice fx-notice--${tone}`}>{children}</div>;
}

export function FxSlotGrid({ slots = 20, filledSlots = [] }) {
  const filledByIndex = new Map(filledSlots.map((slot) => [slot.index, slot]));

  return (
    <div className="fx-slot-grid" role="grid" aria-label="Slot grid">
      {Array.from({ length: slots }, (_, index) => {
        const slot = filledByIndex.get(index);
        return (
          <div className="fx-slot" role="gridcell" key={index}>
            {slot ? (
              <button className="fx-slot__button" type="button" title={slot.label}>
                {slot.shortLabel}
              </button>
            ) : (
              <div className="fx-slot__empty" aria-label="Empty slot" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FxTable({ columns, rows }) {
  return (
    <div className="fx-table-wrap">
      <table className="fx-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={column}>{row[column] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FxTabs({ tabs }) {
  return (
    <ul className="fx-tabs" role="tablist">
      {tabs.map((tab) => (
        <li key={tab.id} role="presentation">
          <button
            type="button"
            className={tab.active ? "is-active" : ""}
            role="tab"
            aria-selected={tab.active}
          >
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function FxTextInput({ className = "", ...props }) {
  return <input className={["fx-text-input", className].filter(Boolean).join(" ")} {...props} />;
}

function inspectorProps({ active, locked, anchor, inspectedAnchor, onInspect, onInspectLock }) {
  if (!active) {
    return {};
  }

  return {
    className: inspectedAnchor === anchor ? "is-inspected" : undefined,
    tabIndex: 0,
    onMouseEnter: () => {
      if (!locked) {
        onInspect?.(anchor);
      }
    },
    onMouseMove: (event) => {
      if (locked) {
        return;
      }

      const target = event.target.closest("[data-anchor]");
      if (target?.dataset.anchor) {
        onInspect?.(target.dataset.anchor);
      }
    },
    onClick: (event) => {
      event.preventDefault();
      event.stopPropagation();
      onInspectLock?.(anchor);
    },
    onFocus: () => {
      if (!locked) {
        onInspect?.(anchor);
      }
    }
  };
}

function pixelStyleValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? `${value}px` : undefined;
}

function labelStyleVariables(styleVariant = {}) {
  return {
    "--fx-label-color": styleVariant.browserColor,
    "--fx-label-disabled-color": styleVariant.browserDisabledColor,
    "--fx-label-hover-color": styleVariant.browserHoveredColor,
    "--fx-label-clicked-color": styleVariant.browserClickedColor,
    "--fx-label-left-padding": pixelStyleValue(styleVariant.leftPadding)
  };
}

export function FxLabel({
  children,
  variant = "label",
  state = "default",
  disabled = false,
  className = "",
  as: Element = "span",
  style = null,
  ...props
}) {
  const styleVariant = labelStyleVariant(variant);
  const classes = [
    "fx-label",
    `fx-label--${styleVariant.id}`,
    state !== "default" ? `is-${state}` : "",
    disabled ? "is-disabled" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Element
      {...props}
      className={classes}
      data-fx-primitive="label"
      data-fx-style={styleVariant.style}
      data-fx-style-variant={styleVariant.id}
      data-fx-style-source={styleVariant.source}
      data-fx-parent-style={styleVariant.parent}
      data-fx-font={styleVariant.font}
      data-fx-font-color={styleVariant.fontColor}
      data-fx-single-line={String(styleVariant.singleLine)}
      data-fx-ignored-by-search={styleVariant.ignoredBySearch}
      data-fx-state={state !== "default" ? state : undefined}
      aria-disabled={disabled ? "true" : undefined}
      style={{
        ...labelStyleVariables(styleVariant),
        ...style
      }}
    >
      {children}
    </Element>
  );
}

function horizontalFlowStyleVariables(styleReference = {}) {
  const reference = styleReference ?? {};

  return {
    "--fx-horizontal-flow-horizontal-spacing": pixelStyleValue(reference.horizontalSpacing),
    "--fx-horizontal-flow-padding-top": pixelStyleValue(reference.topPadding),
    "--fx-horizontal-flow-padding-right": pixelStyleValue(reference.rightPadding),
    "--fx-horizontal-flow-padding-bottom": pixelStyleValue(reference.bottomPadding),
    "--fx-horizontal-flow-padding-left": pixelStyleValue(reference.leftPadding),
    "--fx-horizontal-flow-min-width": pixelStyleValue(reference.minimalWidth),
    "--fx-horizontal-flow-min-height": pixelStyleValue(reference.minimalHeight),
    "--fx-horizontal-flow-child-min-width": pixelStyleValue(reference.childMinimalWidth),
    "--fx-horizontal-flow-child-min-height": pixelStyleValue(reference.childMinimalHeight),
    "--fx-horizontal-flow-child-horizontal-spacing": pixelStyleValue(reference.childHorizontalSpacing),
    "--fx-horizontal-flow-child-padding-top": pixelStyleValue(reference.childTopPadding),
    "--fx-horizontal-flow-child-padding-right": pixelStyleValue(reference.childRightPadding),
    "--fx-horizontal-flow-child-padding-bottom": pixelStyleValue(reference.childBottomPadding),
    "--fx-horizontal-flow-child-padding-left": pixelStyleValue(reference.childLeftPadding)
  };
}

function frameStyleVariables(styleReference = {}) {
  const reference = styleReference ?? {};

  return {
    "--fx-gui-frame-padding-top": pixelStyleValue(reference.topPadding),
    "--fx-gui-frame-padding-right": pixelStyleValue(reference.rightPadding),
    "--fx-gui-frame-padding-bottom": pixelStyleValue(reference.bottomPadding),
    "--fx-gui-frame-padding-left": pixelStyleValue(reference.leftPadding),
    "--fx-gui-frame-min-width": pixelStyleValue(reference.minimalWidth),
    "--fx-gui-frame-min-height": pixelStyleValue(reference.minimalHeight),
    "--fx-gui-frame-child-min-width": pixelStyleValue(reference.childMinimalWidth),
    "--fx-gui-frame-child-min-height": pixelStyleValue(reference.childMinimalHeight),
    "--fx-gui-frame-child-horizontal-spacing": pixelStyleValue(reference.childHorizontalSpacing),
    "--fx-gui-frame-child-padding-top": pixelStyleValue(reference.childTopPadding),
    "--fx-gui-frame-child-padding-right": pixelStyleValue(reference.childRightPadding),
    "--fx-gui-frame-child-padding-bottom": pixelStyleValue(reference.childBottomPadding),
    "--fx-gui-frame-child-padding-left": pixelStyleValue(reference.childLeftPadding)
  };
}

function fillerStyleVariables(styleReference = {}) {
  const reference = styleReference ?? {};

  return {
    "--fx-gui-filler-min-width": pixelStyleValue(reference.minimalWidth),
    "--fx-gui-filler-min-height": pixelStyleValue(reference.minimalHeight)
  };
}

function windowBodyStyleVariables(styleReference = {}) {
  const reference = styleReference ?? {};

  return {
    "--fx-window-body-horizontal-spacing": pixelStyleValue(reference.horizontalSpacing),
    "--fx-window-body-vertical-spacing": pixelStyleValue(reference.verticalSpacing),
    ...horizontalFlowStyleVariables(reference)
  };
}

function createFramePreviewNode(parentStyleReference = {}) {
  const reference = parentStyleReference ?? {};

  return {
    id: "builder_ghost_marker",
    primitive: "frame",
    className: "agui::Frame",
    style: "inside_deep_frame",
    derivedFrom: "frame",
    direction: "vertical",
    role: "body-frame-preview",
    styleReference: {
      variantId: "inside-deep-frame",
      topPadding: 0,
      rightPadding: 0,
      bottomPadding: 0,
      leftPadding: 0,
      minimalWidth: reference.childMinimalWidth,
      minimalHeight: reference.childMinimalHeight,
      childMinimalWidth: 0,
      childMinimalHeight: reference.childMinimalHeight,
      childHorizontalSpacing: reference.childHorizontalSpacing,
      childTopPadding: reference.childTopPadding,
      childRightPadding: reference.childRightPadding,
      childBottomPadding: reference.childBottomPadding,
      childLeftPadding: reference.childLeftPadding,
      horizontallyStretchable: true,
      verticallyStretchable: true
    },
    children: []
  };
}

function createHorizontalFlowPreviewNode(parentStyleReference = {}) {
  const reference = parentStyleReference ?? {};

  return {
    id: "builder_ghost_marker",
    primitive: "flow",
    className: "agui::HorizontalFlow",
    style: "horizontal_flow",
    derivedFrom: "horizontal_flow",
    direction: "horizontal",
    role: "layout-horizontal-flow-preview",
    styleReference: {
      variantId: "generic-horizontal-flow",
      horizontalSpacing: reference.childHorizontalSpacing,
      topPadding: reference.childTopPadding,
      rightPadding: reference.childRightPadding,
      bottomPadding: reference.childBottomPadding,
      leftPadding: reference.childLeftPadding,
      minimalWidth: reference.childMinimalWidth,
      minimalHeight: reference.childMinimalHeight,
      horizontallyStretchable: true,
      verticallyStretchable: true
    },
    children: []
  };
}

function createFillerPreviewNode() {
  return {
    id: "builder_ghost_marker",
    atom: FILLER_ATOM_ID,
    primitive: "empty-widget",
    className: "agui::Filler",
    style: "draggable_space",
    derivedFrom: "draggable_space",
    role: "spacer-preview",
    styleReference: {
      variantId: "draggable-space",
      horizontallyStretchable: true,
      verticallyStretchable: true,
      ignoredByInteraction: true
    },
    children: []
  };
}

function createLabelPreviewNode() {
  return {
    id: "builder_ghost_marker",
    atom: LABEL_ATOM_ID,
    primitive: "label",
    className: "agui::Label",
    style: "label",
    caption: "Label",
    derivedFrom: "label",
    role: "text-label-preview",
    styleReference: {
      variantId: "label",
      source: "wube-factorio-data-style-lua",
      font: "default",
      fontColor: "{1, 1, 1}",
      browserColor: "#ffffff",
      singleLine: true
    },
    children: []
  };
}

function createPreviewNode(previewAtom, parentStyleReference = {}) {
  if (previewAtom === HORIZONTAL_FLOW_ATOM_ID) {
    return createHorizontalFlowPreviewNode(parentStyleReference);
  }

  if (previewAtom === LABEL_ATOM_ID) {
    return createLabelPreviewNode();
  }

  if (previewAtom === FILLER_ATOM_ID) {
    return createFillerPreviewNode(parentStyleReference);
  }

  return createFramePreviewNode(parentStyleReference);
}

function GuiHorizontalFlowShell({
  node,
  className = "",
  children,
  shellRef,
  style,
  ...props
}) {
  const flowStyle = {
    ...horizontalFlowStyleVariables(node.styleReference),
    ...style
  };

  return (
    <div
      ref={shellRef}
      className={["fx-gui-horizontal-flow", className].filter(Boolean).join(" ")}
      data-anchor={node.id}
      data-fx-primitive="flow"
      data-fx-class={node.className}
      data-fx-style={node.style}
      data-fx-derived-from={node.derivedFrom}
      data-fx-direction={node.direction}
      data-fx-horizontal-spacing={node.styleReference?.horizontalSpacing ?? undefined}
      data-fx-minimal-width={node.styleReference?.minimalWidth ?? undefined}
      data-fx-minimal-height={node.styleReference?.minimalHeight ?? undefined}
      data-fx-top-padding={node.styleReference?.topPadding ?? undefined}
      data-fx-right-padding={node.styleReference?.rightPadding ?? undefined}
      data-fx-bottom-padding={node.styleReference?.bottomPadding ?? undefined}
      data-fx-left-padding={node.styleReference?.leftPadding ?? undefined}
      data-fx-horizontally-stretchable={node.styleReference?.horizontallyStretchable ?? undefined}
      data-fx-vertically-stretchable={node.styleReference?.verticallyStretchable ?? undefined}
      data-fx-style-variant={node.styleReference?.variantId ?? undefined}
      data-fx-role={node.role ?? undefined}
      style={flowStyle}
      {...props}
    >
      {children}
    </div>
  );
}

function GuiFrameShell({
  node,
  className = "",
  children,
  shellRef,
  style,
  ...props
}) {
  const frameStyle = {
    ...frameStyleVariables(node.styleReference),
    ...style
  };

  return (
    <div
      ref={shellRef}
      className={["fx-gui-frame", className].filter(Boolean).join(" ")}
      data-anchor={node.id}
      data-fx-primitive="frame"
      data-fx-class={node.className}
      data-fx-style={node.style}
      data-fx-derived-from={node.derivedFrom}
      data-fx-direction={node.direction}
      data-fx-minimal-width={node.styleReference?.minimalWidth ?? undefined}
      data-fx-minimal-height={node.styleReference?.minimalHeight ?? undefined}
      data-fx-top-padding={node.styleReference?.topPadding ?? undefined}
      data-fx-right-padding={node.styleReference?.rightPadding ?? undefined}
      data-fx-bottom-padding={node.styleReference?.bottomPadding ?? undefined}
      data-fx-left-padding={node.styleReference?.leftPadding ?? undefined}
      data-fx-horizontally-stretchable={node.styleReference?.horizontallyStretchable ?? undefined}
      data-fx-vertically-stretchable={node.styleReference?.verticallyStretchable ?? undefined}
      data-fx-style-variant={node.styleReference?.variantId ?? undefined}
      data-fx-role={node.role ?? undefined}
      style={frameStyle}
      {...props}
    >
      {children}
    </div>
  );
}

function GuiLabelShell({
  node,
  className = "",
  children,
  style,
  ...props
}) {
  return (
    <FxLabel
      variant={node.style}
      className={["fx-gui-label", className].filter(Boolean).join(" ")}
      data-anchor={node.id}
      data-fx-atom={node.atom ?? LABEL_ATOM_ID}
      data-fx-class={node.className}
      data-fx-role={node.role ?? undefined}
      style={style}
      {...props}
    >
      {children ?? node.caption}
    </FxLabel>
  );
}

function GuiLabelTextEditor({
  node,
  onCancel,
  onCommit
}) {
  const [draftValue, setDraftValue] = useState(node.caption ?? "");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function commitEdit() {
    onCommit?.(node.id, draftValue);
  }

  function cancelEdit() {
    onCancel?.(node.id);
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

  return (
    <input
      aria-label={`Edit text for ${node.id}`}
      className="fx-gui-label__edit"
      data-anchor={`gui_label_text_edit_${node.id}`}
      onBlur={commitEdit}
      onChange={(event) => setDraftValue(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => event.stopPropagation()}
      ref={inputRef}
      style={{ width: `${Math.max(5, draftValue.length + 1)}ch` }}
      value={draftValue}
    />
  );
}

function GuiFillerShell({
  node,
  className = "",
  shellRef,
  style,
  ...props
}) {
  const fillerStyle = {
    ...fillerStyleVariables(node.styleReference),
    ...style
  };

  return (
    <div
      ref={shellRef}
      className={["fx-gui-filler", className].filter(Boolean).join(" ")}
      data-anchor={node.id}
      data-fx-atom={node.atom ?? FILLER_ATOM_ID}
      data-fx-primitive="empty-widget"
      data-fx-class={node.className}
      data-fx-style={node.style}
      data-fx-derived-from={node.derivedFrom}
      data-fx-style-variant={node.styleReference?.variantId ?? undefined}
      data-fx-role={node.role ?? undefined}
      data-fx-horizontally-stretchable={node.styleReference?.horizontallyStretchable ?? undefined}
      data-fx-vertically-stretchable={node.styleReference?.verticallyStretchable ?? undefined}
      data-fx-ignored-by-interaction={node.styleReference?.ignoredByInteraction ?? undefined}
      style={fillerStyle}
      {...props}
    />
  );
}

function canvasChildElement(parentElement, node) {
  if (!parentElement || !node?.id) {
    return null;
  }

  return parentElement.querySelector(`:scope > [data-anchor="${node.id}"]`);
}

function nearestCanvasDropTarget(event, parentId, nodes = []) {
  const parentElement = event.currentTarget;
  if (!nodes.length) {
    return createBuilderDropTarget({ parentId, index: 0, surface: "canvas" });
  }

  const axis = parentElement.dataset.fxDirection === "vertical" ? "y" : "x";
  const pointer = axis === "y" ? event.clientY : event.clientX;

  for (let index = 0; index < nodes.length; index += 1) {
    const childElement = canvasChildElement(parentElement, nodes[index]);
    if (!childElement) {
      continue;
    }

    const rect = childElement.getBoundingClientRect();
    const childCenter = axis === "y"
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    if (pointer < childCenter) {
      return createBuilderDropTarget({ parentId, index, surface: "canvas" });
    }
  }

  return createBuilderDropTarget({ parentId, index: nodes.length, surface: "canvas" });
}

function canvasDropHandlers({
  dragActive,
  onBuilderDrop,
  onBuilderDropTargetOver,
  resolveTarget
}) {
  function currentTarget(event) {
    return resolveTarget?.(event) ?? null;
  }

  function handleDragOver(event) {
    const target = currentTarget(event);
    if (!dragActive || !target) {
      return;
    }

    const accepted = onBuilderDropTargetOver?.(target, event);
    if (accepted) {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    }
  }

  function handleDrop(event) {
    const target = currentTarget(event);
    if (!dragActive || !target) {
      return;
    }

    const accepted = onBuilderDrop?.(target, event);
    if (accepted) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return {
    onDragEnter: handleDragOver,
    onDragOver: handleDragOver,
    onDrop: handleDrop
  };
}

function isCanvasDropParent(activeTarget, parentId) {
  return activeTarget?.surface === "canvas" && activeTarget.parentId === parentId;
}

function isSameCanvasDropTarget(activeTarget, candidateTarget) {
  return activeTarget?.surface === "canvas" &&
    candidateTarget?.surface === "canvas" &&
    activeTarget.parentId === candidateTarget.parentId &&
    activeTarget.index === candidateTarget.index;
}

function CanvasDropTarget({
  builderDropTarget,
  emptyParent = false,
  parentId,
  index,
  slotCount
}) {
  const target = createBuilderDropTarget({ parentId, index, surface: "canvas" });
  const isStartEdge = !emptyParent && index === 0;
  const isEndEdge = !emptyParent && index === slotCount;
  const isMiddle = !emptyParent && !isStartEdge && !isEndEdge;
  const targetStyle = isMiddle
    ? { left: `${(index / Math.max(slotCount, 1)) * 100}%` }
    : undefined;

  return (
    <div
      className={[
        "fx-gui-flow-drop-target",
        isSameCanvasDropTarget(builderDropTarget, target) ? "is-targeted" : "",
        emptyParent ? "is-empty-parent" : "",
        isStartEdge ? "is-start-edge" : "",
        isEndEdge ? "is-end-edge" : "",
        isMiddle ? "is-middle" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={targetStyle}
    />
  );
}

function CanvasDropPreviewSlot({
  index = 0,
  slotCount = 0,
  emptyParent = false,
  parentPrimitive = "flow",
  parentStyleReference = {},
  previewAtom = FRAME_ATOM_ID
}) {
  const [expanded, setExpanded] = useState(false);
  const isStartEdge = !emptyParent && index === 0;
  const isEndEdge = !emptyParent && index === slotCount;
  const isMiddle = !emptyParent && !isStartEdge && !isEndEdge;
  const previewNode = createPreviewNode(previewAtom, parentStyleReference);
  const PreviewShell = previewNode.primitive === "frame"
    ? GuiFrameShell
    : previewNode.primitive === "flow"
      ? GuiHorizontalFlowShell
      : previewNode.primitive === "label"
        ? GuiLabelShell
        : GuiFillerShell;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setExpanded(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <PreviewShell
      node={previewNode}
      className={[
        "fx-gui-flow-drop-preview-slot",
        expanded ? "is-expanded" : "",
        emptyParent ? "is-empty-parent" : "",
        isStartEdge ? "is-start-edge" : "",
        isEndEdge ? "is-end-edge" : "",
        isMiddle ? "is-middle" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    />
  );
}

function FlowChildren({
  nodes,
  parentId,
  parentPrimitive = "flow",
  inspectorActive,
  inspectorLocked,
  inspectedAnchor,
  onInspect,
  onInspectLock,
  onBuilderDrop,
  onBuilderDropTargetOver,
  builderDragActive,
  builderDropTarget,
  parentStyleReference,
  builderDragAtom = null,
  editingLabelId = null,
  onLabelTextEditCancel,
  onLabelTextEditCommit,
  onLabelTextEditStart
}) {
  const ghostIndex =
    builderDropTarget?.surface === "canvas" && builderDropTarget.parentId === parentId
      ? builderDropTarget.index
      : null;
  const renderedChildren = [];

  if (builderDragActive) {
    for (let index = 0; index <= nodes.length; index += 1) {
      renderedChildren.push(
        <CanvasDropTarget
          builderDropTarget={builderDropTarget}
          emptyParent={nodes.length === 0}
          index={index}
          key={`${parentId}-target-${index}`}
          parentId={parentId}
          slotCount={nodes.length}
        />
      );
    }
  }

  if (ghostIndex === 0) {
    renderedChildren.push(
        <CanvasDropPreviewSlot
          emptyParent={nodes.length === 0}
          index={0}
          key={`${parentId}-preview-0`}
          parentPrimitive={parentPrimitive}
          parentStyleReference={parentStyleReference}
          previewAtom={builderDragAtom ?? FRAME_ATOM_ID}
          slotCount={nodes.length}
        />
    );
  }

  nodes.forEach((node, index) => {
    renderedChildren.push(
      <GuiLayoutNode
        builderDragAtom={builderDragAtom}
        builderDragActive={builderDragActive}
        builderDropTarget={builderDropTarget}
        inspectedAnchor={inspectedAnchor}
        inspectorActive={inspectorActive}
        inspectorLocked={inspectorLocked}
        key={node.id}
        node={node}
        onBuilderDrop={onBuilderDrop}
        onBuilderDropTargetOver={onBuilderDropTargetOver}
        onInspect={onInspect}
        onInspectLock={onInspectLock}
        editingLabelId={editingLabelId}
        onLabelTextEditCancel={onLabelTextEditCancel}
        onLabelTextEditCommit={onLabelTextEditCommit}
        onLabelTextEditStart={onLabelTextEditStart}
      />
    );

    if (ghostIndex === index + 1) {
      renderedChildren.push(
        <CanvasDropPreviewSlot
          index={index + 1}
          key={`${parentId}-preview-${index + 1}`}
          parentPrimitive={parentPrimitive}
          parentStyleReference={parentStyleReference}
          previewAtom={builderDragAtom ?? FRAME_ATOM_ID}
          slotCount={nodes.length}
        />
      );
    }
  });

  return renderedChildren;
}

function GuiLayoutNode(props) {
  if (props.node?.primitive === "frame") {
    return <GuiFrame {...props} />;
  }

  if (props.node?.primitive === "flow") {
    return <GuiHorizontalFlow {...props} />;
  }

  if (props.node?.primitive === "label") {
    return <GuiLabel {...props} />;
  }

  return <GuiFiller {...props} />;
}

export function GuiLabel({
  node,
  inspectorActive = false,
  inspectorLocked = false,
  inspectedAnchor = node.id,
  onInspect,
  onInspectLock,
  editingLabelId = null,
  onLabelTextEditCancel,
  onLabelTextEditCommit,
  onLabelTextEditStart
}) {
  const editing = editingLabelId === node.id;
  const labelInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor: node.id,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });

  function startTextEdit(event) {
    if (!onLabelTextEditStart || editing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onLabelTextEditStart(node.id);
  }

  return (
    <GuiLabelShell
      node={node}
      className={[
        labelInspector.className,
        editing ? "is-editing" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={labelInspector.tabIndex}
      onClick={labelInspector.onClick}
      onDoubleClick={startTextEdit}
      onFocus={labelInspector.onFocus}
      onMouseEnter={labelInspector.onMouseEnter}
      onMouseMove={labelInspector.onMouseMove}
    >
      {editing ? (
        <GuiLabelTextEditor
          node={node}
          onCancel={onLabelTextEditCancel}
          onCommit={onLabelTextEditCommit}
        />
      ) : null}
    </GuiLabelShell>
  );
}

export function GuiFiller({
  node,
  inspectorActive = false,
  inspectorLocked = false,
  inspectedAnchor = node.id,
  onInspect,
  onInspectLock
}) {
  const fillerInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor: node.id,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });

  return (
    <GuiFillerShell
      node={node}
      className={fillerInspector.className}
      tabIndex={fillerInspector.tabIndex}
      onClick={fillerInspector.onClick}
      onFocus={fillerInspector.onFocus}
      onMouseEnter={fillerInspector.onMouseEnter}
      onMouseMove={fillerInspector.onMouseMove}
    />
  );
}

export function GuiFrame({
  node,
  inspectorActive = false,
  inspectorLocked = false,
  inspectedAnchor = node.id,
  onBuilderDrop,
  onBuilderDropTargetOver,
  onInspect,
  onInspectLock,
  builderDragActive = false,
  builderDropTarget = null,
  builderDragAtom = null,
  editingLabelId = null,
  onLabelTextEditCancel,
  onLabelTextEditCommit,
  onLabelTextEditStart
}) {
  const frameInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor: node.id,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });
  const children = node.children ?? [];
  const parentDropTarget = createBuilderDropTarget({
    parentId: node.id,
    index: children.length,
    surface: "canvas"
  });
  const dropHandlers = canvasDropHandlers({
    dragActive: builderDragActive,
    onBuilderDrop,
    onBuilderDropTargetOver,
    resolveTarget: (event) => nearestCanvasDropTarget(event, node.id, children)
  });

  return (
    <GuiFrameShell
      node={node}
      className={[
        isCanvasDropParent(builderDropTarget, parentDropTarget?.parentId)
          ? "is-builder-drop-parent"
          : "",
        frameInspector.className
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={frameInspector.tabIndex}
      onDragEnter={dropHandlers.onDragEnter}
      onDragOver={dropHandlers.onDragOver}
      onDrop={dropHandlers.onDrop}
      onClick={frameInspector.onClick}
      onFocus={frameInspector.onFocus}
      onMouseEnter={frameInspector.onMouseEnter}
      onMouseMove={frameInspector.onMouseMove}
    >
      <FlowChildren
        builderDragActive={builderDragActive}
        builderDragAtom={builderDragAtom}
        builderDropTarget={builderDropTarget}
        inspectedAnchor={inspectedAnchor}
        inspectorActive={inspectorActive}
        inspectorLocked={inspectorLocked}
        nodes={children}
        onBuilderDrop={onBuilderDrop}
        onBuilderDropTargetOver={onBuilderDropTargetOver}
        onInspect={onInspect}
        onInspectLock={onInspectLock}
        editingLabelId={editingLabelId}
        onLabelTextEditCancel={onLabelTextEditCancel}
        onLabelTextEditCommit={onLabelTextEditCommit}
        onLabelTextEditStart={onLabelTextEditStart}
        parentId={node.id}
        parentPrimitive={node.primitive}
        parentStyleReference={node.styleReference}
      />
    </GuiFrameShell>
  );
}

export function GuiHorizontalFlow({
  node,
  inspectorActive = false,
  inspectorLocked = false,
  inspectedAnchor = node.id,
  onBuilderDrop,
  onBuilderDropTargetOver,
  onInspect,
  onInspectLock,
  builderDragActive = false,
  builderDropTarget = null,
  builderDragAtom = null,
  editingLabelId = null,
  onLabelTextEditCancel,
  onLabelTextEditCommit,
  onLabelTextEditStart
}) {
  const flowInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor: node.id,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });
  const children = node.children ?? [];
  const parentDropTarget = createBuilderDropTarget({
    parentId: node.id,
    index: children.length,
    surface: "canvas"
  });
  const dropHandlers = canvasDropHandlers({
    dragActive: builderDragActive,
    onBuilderDrop,
    onBuilderDropTargetOver,
    resolveTarget: (event) => nearestCanvasDropTarget(event, node.id, children)
  });

  return (
    <GuiHorizontalFlowShell
      node={node}
      className={[
        isCanvasDropParent(builderDropTarget, parentDropTarget?.parentId)
          ? "is-builder-drop-parent"
          : "",
        flowInspector.className
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={flowInspector.tabIndex}
      onDragEnter={dropHandlers.onDragEnter}
      onDragOver={dropHandlers.onDragOver}
      onDrop={dropHandlers.onDrop}
      onClick={flowInspector.onClick}
      onFocus={flowInspector.onFocus}
      onMouseEnter={flowInspector.onMouseEnter}
      onMouseMove={flowInspector.onMouseMove}
    >
      <FlowChildren
        builderDragActive={builderDragActive}
        builderDragAtom={builderDragAtom}
        builderDropTarget={builderDropTarget}
        inspectedAnchor={inspectedAnchor}
        inspectorActive={inspectorActive}
        inspectorLocked={inspectorLocked}
        nodes={children}
        onBuilderDrop={onBuilderDrop}
        onBuilderDropTargetOver={onBuilderDropTargetOver}
        onInspect={onInspect}
        onInspectLock={onInspectLock}
        editingLabelId={editingLabelId}
        onLabelTextEditCancel={onLabelTextEditCancel}
        onLabelTextEditCommit={onLabelTextEditCommit}
        onLabelTextEditStart={onLabelTextEditStart}
        parentId={node.id}
        parentPrimitive={node.primitive}
        parentStyleReference={node.styleReference}
      />
    </GuiHorizontalFlowShell>
  );
}

export function GuiWindow({
  title,
  children,
  bodyChildren = [],
  bodyStyleReference = null,
  className = "",
  anchor = "gui_window",
  inspectorActive = false,
  inspectorLocked = false,
  inspectedAnchor = anchor,
  onBuilderDrop,
  onBuilderDropTargetOver,
  onInspect,
  onInspectClear,
  onInspectLock,
  style,
  onTitlebarPointerDown,
  onTitlebarPointerMove,
  onTitlebarPointerUp,
  onTitlebarPointerCancel,
  builderDragActive = false,
  builderDropTarget = null,
  builderDragAtom = null,
  editingLabelId = null,
  onLabelTextEditCancel,
  onLabelTextEditCommit,
  onLabelTextEditStart,
  styleReference = frameStyleReference,
  shadowsVisible = true
}) {
  const contentSize = getFrameContentSize(styleReference);
  const clipSize = getFrameClipSize(styleReference);
  const titlebarSize = getFrameTitlebarSize(styleReference);
  const titlebarContentSize = getFrameTitlebarContentSize(styleReference);
  const titlebarClipSize = getFrameTitlebarClipSize(styleReference);
  const bodySize = getFrameBodySize(styleReference);
  const mergedStyle = {
    "--fx-window-reference-width": `${styleReference.capturedSize.width}px`,
    "--fx-window-reference-height": `${styleReference.capturedSize.height}px`,
    ...style
  };
  const rootInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });
  const titlebarAnchor = `${anchor}_titlebar`;
  const titlebarInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor: titlebarAnchor,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });
  const titleAnchor = `${anchor}_title`;
  const titleInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor: titleAnchor,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });
  const dragAnchor = `${anchor}_drag_handle`;
  const dragInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor: dragAnchor,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });
  const bodyAnchor = `${anchor}_body`;
  const bodyInspector = inspectorProps({
    active: inspectorActive,
    locked: inspectorLocked,
    anchor: bodyAnchor,
    inspectedAnchor,
    onInspect,
    onInspectLock
  });
  const bodyDropTarget = createBuilderDropTarget({
    parentId: bodyAnchor,
    index: bodyChildren.length,
    surface: "canvas"
  });
  const bodyDropHandlers = canvasDropHandlers({
    dragActive: builderDragActive,
    onBuilderDrop,
    onBuilderDropTargetOver,
    resolveTarget: (event) => nearestCanvasDropTarget(event, bodyAnchor, bodyChildren)
  });
  const bodyStyle = windowBodyStyleVariables(bodyStyleReference);

  return (
    <section
      className={[
        "fx-gui-window",
        inspectorActive ? "is-inspecting" : "",
        className,
        rootInspector.className
      ]
        .filter(Boolean)
        .join(" ")}
      data-anchor={anchor}
      data-fx-primitive="frame"
      data-fx-class={styleReference.className}
      data-fx-style={styleReference.style}
      data-fx-derived-from={styleReference.derivedFrom}
      data-fx-width={styleReference.capturedSize.width}
      data-fx-height={styleReference.capturedSize.height}
      data-fx-content-width={contentSize.width}
      data-fx-content-height={contentSize.height}
      data-fx-clip-offset-x={clipSize.offset.x}
      data-fx-clip-offset-y={clipSize.offset.y}
      data-fx-clip-width={clipSize.size.width}
      data-fx-clip-height={clipSize.size.height}
      data-fx-padding-top={styleReference.topPadding}
      data-fx-padding-bottom={styleReference.bottomPadding}
      data-fx-padding-left={styleReference.leftPadding}
      data-fx-padding-right={styleReference.rightPadding}
      data-fx-graphical-border={styleReference.graphicalBorder}
      data-fx-use-header-filler={styleReference.useHeaderFiller}
      data-fx-maximal-height={styleReference.capturedMaximalHeight ?? undefined}
      data-fx-shadows={shadowsVisible ? "visible" : "hidden"}
      style={mergedStyle}
      tabIndex={rootInspector.tabIndex}
      onMouseEnter={rootInspector.onMouseEnter}
      onMouseLeave={() => {
        if (inspectorActive && !inspectorLocked) {
          onInspectClear?.();
        }
      }}
      onMouseMove={rootInspector.onMouseMove}
      onClick={rootInspector.onClick}
      onFocus={rootInspector.onFocus}
    >
      <span className="fx-gui-window__edge fx-gui-window__edge--top" aria-hidden="true" />
      <span className="fx-gui-window__edge fx-gui-window__edge--right" aria-hidden="true" />
      <span className="fx-gui-window__edge fx-gui-window__edge--bottom" aria-hidden="true" />
      <span className="fx-gui-window__edge fx-gui-window__edge--left" aria-hidden="true" />
      <header
        className={["fx-gui-window__titlebar", titlebarInspector.className]
          .filter(Boolean)
          .join(" ")}
        data-anchor={titlebarAnchor}
        data-fx-primitive="flow"
        data-fx-style="frame_header_flow"
        data-fx-direction="horizontal"
        data-fx-width={titlebarSize.width}
        data-fx-height={titlebarSize.height}
        data-fx-content-width={titlebarContentSize.width}
        data-fx-content-height={titlebarContentSize.height}
        data-fx-clip-offset-x={titlebarClipSize.offset.x}
        data-fx-clip-offset-y={titlebarClipSize.offset.y}
        data-fx-clip-width={titlebarClipSize.size.width}
        data-fx-clip-height={titlebarClipSize.size.height}
        data-fx-bottom-padding={styleReference.titlebarBottomPadding}
        data-fx-horizontal-spacing={styleReference.titlebarHorizontalSpacing}
        data-fx-horizontally-stretchable="true"
        data-fx-vertically-stretchable="false"
        tabIndex={titlebarInspector.tabIndex}
        onMouseEnter={titlebarInspector.onMouseEnter}
        onMouseMove={titlebarInspector.onMouseMove}
        onClick={titlebarInspector.onClick}
        onPointerDown={onTitlebarPointerDown}
        onPointerMove={onTitlebarPointerMove}
        onPointerUp={onTitlebarPointerUp}
        onPointerCancel={onTitlebarPointerCancel}
        onFocus={titlebarInspector.onFocus}
      >
        <FxLabel
          as="strong"
          variant={styleReference.titleLabelStyle}
          className={["fx-gui-window__title-label", titleInspector.className]
            .filter(Boolean)
            .join(" ")}
          data-anchor={titleAnchor}
          data-fx-top-margin={styleReference.titleLabelTopMargin}
          data-fx-bottom-padding={styleReference.titleLabelBottomPadding}
          data-fx-horizontally-squashable="true"
          data-fx-vertically-stretchable="true"
          data-fx-ignored-by-interaction="true"
          tabIndex={titleInspector.tabIndex}
          onMouseEnter={titleInspector.onMouseEnter}
          onMouseMove={titleInspector.onMouseMove}
          onClick={titleInspector.onClick}
          onFocus={titleInspector.onFocus}
        >
          {title}
        </FxLabel>
        <div
          className={["fx-gui-window__drag-handle", dragInspector.className]
            .filter(Boolean)
            .join(" ")}
          data-anchor={dragAnchor}
          data-fx-atom="filler"
          data-fx-primitive="empty-widget"
          data-fx-class="agui::Filler"
          data-fx-style={styleReference.dragHandleStyle}
          data-fx-role="header-filler"
          data-fx-height={styleReference.dragHandleHeight}
          data-fx-natural-height={styleReference.dragHandleHeight}
          data-fx-left-margin={styleReference.dragHandleLeftMargin}
          data-fx-right-margin={styleReference.dragHandleRightMargin}
          data-fx-horizontally-stretchable="true"
          data-fx-vertically-stretchable="true"
          data-fx-ignored-by-search={String(styleReference.dragHandleIgnoredBySearch)}
          tabIndex={dragInspector.tabIndex}
          onMouseEnter={dragInspector.onMouseEnter}
          onMouseMove={dragInspector.onMouseMove}
          onClick={dragInspector.onClick}
          onFocus={dragInspector.onFocus}
          aria-label="Drag handle"
        />
      </header>
      <div
        className={[
          "fx-gui-window__body",
          isCanvasDropParent(builderDropTarget, bodyDropTarget?.parentId)
            ? "is-builder-drop-parent"
            : "",
          bodyInspector.className
        ]
          .filter(Boolean)
          .join(" ")}
        data-anchor={bodyAnchor}
        data-fx-primitive="flow"
        data-fx-class={styleReference.bodyClassName}
        data-fx-style={styleReference.bodyStyle}
        data-fx-derived-from={styleReference.bodyDerivedFrom}
        data-fx-direction={styleReference.bodyDirection}
        data-fx-role="window-body"
        data-fx-width={bodySize.width}
        data-fx-height={bodySize.height}
        data-fx-content-width={bodySize.width}
        data-fx-content-height={bodySize.height}
        data-fx-clip-offset-x="0"
        data-fx-clip-offset-y="0"
        data-fx-clip-width={bodySize.width}
        data-fx-clip-height={bodySize.height}
        data-fx-horizontal-spacing={styleReference.bodyHorizontalSpacing ?? undefined}
        data-fx-vertical-spacing={styleReference.bodyVerticalSpacing ?? undefined}
        data-fx-maximum-vertical-squash-size={styleReference.maximumVerticalSquashSize}
        style={bodyStyle}
        tabIndex={bodyInspector.tabIndex}
        onDragEnter={bodyDropHandlers.onDragEnter}
        onDragOver={bodyDropHandlers.onDragOver}
        onDrop={bodyDropHandlers.onDrop}
        onMouseEnter={bodyInspector.onMouseEnter}
        onMouseMove={bodyInspector.onMouseMove}
        onClick={bodyInspector.onClick}
        onFocus={bodyInspector.onFocus}
      >
        <FlowChildren
          builderDragActive={builderDragActive}
          builderDragAtom={builderDragAtom}
          builderDropTarget={builderDropTarget}
          inspectedAnchor={inspectedAnchor}
          inspectorActive={inspectorActive}
          inspectorLocked={inspectorLocked}
          nodes={bodyChildren}
          onBuilderDrop={onBuilderDrop}
          onBuilderDropTargetOver={onBuilderDropTargetOver}
          onInspect={onInspect}
          onInspectLock={onInspectLock}
          editingLabelId={editingLabelId}
          onLabelTextEditCancel={onLabelTextEditCancel}
          onLabelTextEditCommit={onLabelTextEditCommit}
          onLabelTextEditStart={onLabelTextEditStart}
          parentId={bodyAnchor}
          parentPrimitive="flow"
          parentStyleReference={bodyStyleReference}
        />
        {children}
      </div>
    </section>
  );
}

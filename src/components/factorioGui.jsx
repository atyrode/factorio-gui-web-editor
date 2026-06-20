import { useEffect, useState } from "react";
import {
  CornerDownRight,
  ListPlus,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Search,
  Unlock
} from "lucide-react";
import { useDroppable } from "@dnd-kit/react";
import {
  HORIZONTAL_FLOW_BUILDER_DND_TYPE,
  dropTargetData
} from "../factorioBuilderDnd.js";
import {
  frameStyleReference,
  getFrameBodySize,
  getFrameClipSize,
  getFrameContentSize,
  getFrameTitlebarClipSize,
  getFrameTitlebarContentSize,
  getFrameTitlebarSize
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
  forward: ChevronRight,
  "lock-closed": Lock,
  "lock-open": Unlock,
  plus: Plus,
  trash: Trash2,
  search: Search
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

export function FxFrame({ title, children, className = "", as: Element = "section", ...props }) {
  return (
    <Element className={["fx-frame", className].filter(Boolean).join(" ")} {...props}>
      {title ? <h2 className="fx-frame__title">{title}</h2> : null}
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
    role: "builder-horizontal-flow-preview",
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

function createPreviewNode(parentPrimitive, parentStyleReference = {}) {
  return parentPrimitive === "frame"
    ? createHorizontalFlowPreviewNode(parentStyleReference)
    : createFramePreviewNode(parentStyleReference);
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

function CanvasDropTarget({
  dragActive,
  emptyParent = false,
  parentId,
  index,
  slotCount
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `builder-canvas-slot-${parentId}-${index}`,
    type: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    accept: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    disabled: !dragActive,
    collisionPriority: 3,
    data: dropTargetData({ parentId, index, surface: "canvas" })
  });
  const isStartEdge = !emptyParent && index === 0;
  const isEndEdge = !emptyParent && index === slotCount;
  const isMiddle = !emptyParent && !isStartEdge && !isEndEdge;
  const targetStyle = isMiddle
    ? { left: `${(index / Math.max(slotCount, 1)) * 100}%` }
    : undefined;

  return (
    <div
      ref={ref}
      className={[
        "fx-gui-flow-drop-target",
        isDropTarget ? "is-targeted" : "",
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
  parentStyleReference = {}
}) {
  const [expanded, setExpanded] = useState(false);
  const isStartEdge = !emptyParent && index === 0;
  const isEndEdge = !emptyParent && index === slotCount;
  const isMiddle = !emptyParent && !isStartEdge && !isEndEdge;
  const previewNode = createPreviewNode(parentPrimitive, parentStyleReference);
  const PreviewShell =
    previewNode.primitive === "frame" ? GuiFrameShell : GuiHorizontalFlowShell;

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
  builderDragActive,
  builderDropTarget,
  builderDraggingId,
  parentStyleReference
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
          dragActive={builderDragActive}
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
          slotCount={nodes.length}
        />
    );
  }

  nodes.forEach((node, index) => {
    renderedChildren.push(
      <GuiLayoutNode
        builderDragActive={builderDragActive}
        builderDropTarget={builderDropTarget}
        builderDraggingId={builderDraggingId}
        inspectedAnchor={inspectedAnchor}
        inspectorActive={inspectorActive}
        inspectorLocked={inspectorLocked}
        key={node.id}
        node={node}
        onInspect={onInspect}
        onInspectLock={onInspectLock}
      />
    );

    if (ghostIndex === index + 1) {
      renderedChildren.push(
        <CanvasDropPreviewSlot
          index={index + 1}
          key={`${parentId}-preview-${index + 1}`}
          parentPrimitive={parentPrimitive}
          parentStyleReference={parentStyleReference}
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

  return <GuiHorizontalFlow {...props} />;
}

export function GuiFrame({
  node,
  inspectorActive = false,
  inspectorLocked = false,
  inspectedAnchor = node.id,
  onInspect,
  onInspectLock,
  builderDragActive = false,
  builderDropTarget = null,
  builderDraggingId = null
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
  const isDropParent = builderDropTarget?.surface === "canvas" &&
    builderDropTarget.parentId === node.id;
  const isDraggingSource = builderDraggingId === node.id;
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: `builder-canvas-parent-${node.id}`,
    type: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    accept: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    disabled: !builderDragActive,
    collisionPriority: 1,
    data: dropTargetData({
      parentId: node.id,
      index: children.length,
      surface: "canvas"
    })
  });

  return (
    <GuiFrameShell
      node={node}
      shellRef={dropRef}
      className={[
        isDropParent || isDropTarget ? "is-builder-drop-parent" : "",
        isDraggingSource ? "is-builder-dragging-source" : "",
        frameInspector.className
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={frameInspector.tabIndex}
      onClick={frameInspector.onClick}
      onFocus={frameInspector.onFocus}
      onMouseEnter={frameInspector.onMouseEnter}
      onMouseMove={frameInspector.onMouseMove}
    >
      <FlowChildren
        builderDragActive={builderDragActive}
        builderDropTarget={builderDropTarget}
        builderDraggingId={builderDraggingId}
        inspectedAnchor={inspectedAnchor}
        inspectorActive={inspectorActive}
        inspectorLocked={inspectorLocked}
        nodes={children}
        onInspect={onInspect}
        onInspectLock={onInspectLock}
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
  onInspect,
  onInspectLock,
  builderDragActive = false,
  builderDropTarget = null,
  builderDraggingId = null,
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
  const isDropParent = builderDropTarget?.surface === "canvas" &&
    builderDropTarget.parentId === node.id;
  const isDraggingSource = builderDraggingId === node.id;
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: `builder-canvas-parent-${node.id}`,
    type: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    accept: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    disabled: !builderDragActive,
    collisionPriority: 1,
    data: dropTargetData({
      parentId: node.id,
      index: children.length,
      surface: "canvas"
    })
  });

  return (
    <GuiHorizontalFlowShell
      node={node}
      shellRef={dropRef}
      className={[
        isDropParent || isDropTarget ? "is-builder-drop-parent" : "",
        isDraggingSource ? "is-builder-dragging-source" : "",
        flowInspector.className
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={flowInspector.tabIndex}
      onClick={flowInspector.onClick}
      onFocus={flowInspector.onFocus}
      onMouseEnter={flowInspector.onMouseEnter}
      onMouseMove={flowInspector.onMouseMove}
    >
      <FlowChildren
        builderDragActive={builderDragActive}
        builderDropTarget={builderDropTarget}
        builderDraggingId={builderDraggingId}
        inspectedAnchor={inspectedAnchor}
        inspectorActive={inspectorActive}
        inspectorLocked={inspectorLocked}
        nodes={children}
        onInspect={onInspect}
        onInspectLock={onInspectLock}
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
  builderDraggingId = null,
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
  const { ref: bodyDropRef, isDropTarget: isBodyDropTarget } = useDroppable({
    id: `builder-canvas-parent-${bodyAnchor}`,
    type: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    accept: HORIZONTAL_FLOW_BUILDER_DND_TYPE,
    disabled: !builderDragActive,
    collisionPriority: 1,
    data: dropTargetData({
      parentId: bodyAnchor,
      index: bodyChildren.length,
      surface: "canvas"
    })
  });
  const bodyDropClass = builderDropTarget?.surface === "canvas" &&
    builderDropTarget.parentId === bodyAnchor
    ? "is-builder-drop-parent"
    : "";
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
        <strong
          className={["fx-gui-window__title-label", titleInspector.className]
            .filter(Boolean)
            .join(" ")}
          data-anchor={titleAnchor}
          data-fx-primitive="label"
          data-fx-style={styleReference.titleLabelStyle}
          data-fx-top-margin={styleReference.titleLabelTopMargin}
          data-fx-bottom-padding={styleReference.titleLabelBottomPadding}
          data-fx-horizontally-squashable="true"
          data-fx-vertically-stretchable="true"
          tabIndex={titleInspector.tabIndex}
          onMouseEnter={titleInspector.onMouseEnter}
          onMouseMove={titleInspector.onMouseMove}
          onClick={titleInspector.onClick}
          onFocus={titleInspector.onFocus}
        >
          {title}
        </strong>
        <div
          className={["fx-gui-window__drag-handle", dragInspector.className]
            .filter(Boolean)
            .join(" ")}
          data-anchor={dragAnchor}
          data-fx-primitive="empty-widget"
          data-fx-style={styleReference.dragHandleStyle}
          data-fx-role="header-filler"
          data-fx-height={styleReference.dragHandleHeight}
          data-fx-natural-height={styleReference.dragHandleHeight}
          data-fx-left-margin={styleReference.dragHandleLeftMargin}
          data-fx-right-margin={styleReference.dragHandleRightMargin}
          data-fx-horizontally-stretchable="true"
          data-fx-vertically-stretchable="true"
          tabIndex={dragInspector.tabIndex}
          onMouseEnter={dragInspector.onMouseEnter}
          onMouseMove={dragInspector.onMouseMove}
          onClick={dragInspector.onClick}
          onFocus={dragInspector.onFocus}
          aria-label="Drag handle"
        />
      </header>
      <div
        ref={bodyDropRef}
        className={[
          "fx-gui-window__body",
          bodyDropClass || isBodyDropTarget ? "is-builder-drop-parent" : "",
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
        onMouseEnter={bodyInspector.onMouseEnter}
        onMouseMove={bodyInspector.onMouseMove}
        onClick={bodyInspector.onClick}
        onFocus={bodyInspector.onFocus}
      >
        <FlowChildren
          builderDragActive={builderDragActive}
          builderDropTarget={builderDropTarget}
          builderDraggingId={builderDraggingId}
          inspectedAnchor={inspectedAnchor}
          inspectorActive={inspectorActive}
          inspectorLocked={inspectorLocked}
          nodes={bodyChildren}
          onInspect={onInspect}
          onInspectLock={onInspectLock}
          parentId={bodyAnchor}
          parentPrimitive="flow"
          parentStyleReference={bodyStyleReference}
        />
        {children}
      </div>
    </section>
  );
}

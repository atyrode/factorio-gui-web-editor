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
  className = ""
}) {
  return (
    <label className={["fx-checkbox", className].filter(Boolean).join(" ")}>
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

function BuilderGhostBlock() {
  return (
    <div
      className="fx-builder-ghost"
      data-anchor="builder_ghost_marker"
      aria-hidden="true"
    />
  );
}

function builderDropProps({
  active,
  parentId,
  index,
  onBuilderDragOver,
  onBuilderDrop
}) {
  if (!active) {
    return {};
  }

  return {
    onDragOver: (event) => {
      event.preventDefault();
      event.stopPropagation();
      onBuilderDragOver?.({ parentId, index, surface: "canvas" });
    },
    onDrop: (event) => {
      event.preventDefault();
      event.stopPropagation();
      onBuilderDrop?.(event, { parentId, index, surface: "canvas" });
    }
  };
}

function FlowChildren({
  nodes,
  parentId,
  inspectorActive,
  inspectorLocked,
  inspectedAnchor,
  onInspect,
  onInspectLock,
  builderDragActive,
  builderDropTarget,
  onBuilderDragOver,
  onBuilderDrop
}) {
  const ghostIndex =
    builderDropTarget?.surface === "canvas" && builderDropTarget.parentId === parentId
      ? builderDropTarget.index
      : null;
  const renderedChildren = [];

  nodes.forEach((node, index) => {
    if (ghostIndex === index) {
      renderedChildren.push(<BuilderGhostBlock key={`${parentId}-ghost-${index}`} />);
    }

    renderedChildren.push(
      <GuiHorizontalFlow
        builderDragActive={builderDragActive}
        builderDropTarget={builderDropTarget}
        inspectedAnchor={inspectedAnchor}
        inspectorActive={inspectorActive}
        inspectorLocked={inspectorLocked}
        key={node.id}
        node={node}
        onBuilderDragOver={onBuilderDragOver}
        onBuilderDrop={onBuilderDrop}
        onInspect={onInspect}
        onInspectLock={onInspectLock}
      />
    );
  });

  if (ghostIndex === nodes.length) {
    renderedChildren.push(<BuilderGhostBlock key={`${parentId}-ghost-${nodes.length}`} />);
  }

  return renderedChildren;
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
  onBuilderDragOver,
  onBuilderDrop
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
  const dropProps = builderDropProps({
    active: builderDragActive,
    parentId: node.id,
    index: children.length,
    onBuilderDragOver,
    onBuilderDrop
  });

  return (
    <div
      className={["fx-gui-horizontal-flow", flowInspector.className]
        .filter(Boolean)
        .join(" ")}
      data-anchor={node.id}
      data-fx-primitive="flow"
      data-fx-class={node.className}
      data-fx-style={node.style}
      data-fx-derived-from={node.derivedFrom}
      data-fx-direction={node.direction}
      data-fx-horizontal-spacing={node.styleReference?.horizontalSpacing ?? undefined}
      data-fx-style-variant={node.styleReference?.variantId ?? undefined}
      data-fx-role={node.role ?? undefined}
      tabIndex={flowInspector.tabIndex}
      onClick={flowInspector.onClick}
      onFocus={flowInspector.onFocus}
      onMouseEnter={flowInspector.onMouseEnter}
      onMouseMove={flowInspector.onMouseMove}
      {...dropProps}
    >
      <FlowChildren
        builderDragActive={builderDragActive}
        builderDropTarget={builderDropTarget}
        inspectedAnchor={inspectedAnchor}
        inspectorActive={inspectorActive}
        inspectorLocked={inspectorLocked}
        nodes={children}
        onBuilderDragOver={onBuilderDragOver}
        onBuilderDrop={onBuilderDrop}
        onInspect={onInspect}
        onInspectLock={onInspectLock}
        parentId={node.id}
      />
    </div>
  );
}

export function GuiWindow({
  title,
  children,
  bodyChildren = [],
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
  onBuilderDragOver,
  onBuilderDrop,
  styleReference = frameStyleReference
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
  const bodyDropProps = builderDropProps({
    active: builderDragActive,
    parentId: bodyAnchor,
    index: bodyChildren.length,
    onBuilderDragOver,
    onBuilderDrop
  });

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
        className={["fx-gui-window__body", bodyInspector.className].filter(Boolean).join(" ")}
        data-anchor={bodyAnchor}
        data-fx-primitive="flow"
        data-fx-style={styleReference.bodyStyle}
        data-fx-direction={styleReference.bodyDirection}
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
        tabIndex={bodyInspector.tabIndex}
        onMouseEnter={bodyInspector.onMouseEnter}
        onMouseMove={bodyInspector.onMouseMove}
        onClick={bodyInspector.onClick}
        onFocus={bodyInspector.onFocus}
        {...bodyDropProps}
      >
        <FlowChildren
          builderDragActive={builderDragActive}
          builderDropTarget={builderDropTarget}
          inspectedAnchor={inspectedAnchor}
          inspectorActive={inspectorActive}
          inspectorLocked={inspectorLocked}
          nodes={bodyChildren}
          onBuilderDragOver={onBuilderDragOver}
          onBuilderDrop={onBuilderDrop}
          onInspect={onInspect}
          onInspectLock={onInspectLock}
          parentId={bodyAnchor}
        />
        {children}
      </div>
    </section>
  );
}

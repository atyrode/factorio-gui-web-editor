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

export function GuiWindow({
  title,
  children,
  className = "",
  anchor = "gui_window",
  inspectorActive = false,
  inspectorLocked = false,
  inspectedAnchor = anchor,
  onInspect,
  onInspectLock,
  style,
  onTitlebarPointerDown,
  onTitlebarPointerMove,
  onTitlebarPointerUp,
  onTitlebarPointerCancel
}) {
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
      data-fx-class="agui::Window"
      data-fx-style="inset_frame_container_frame"
      data-fx-derived-from="frame"
      data-fx-padding-top="6"
      data-fx-padding-bottom="12"
      data-fx-padding-left="12"
      data-fx-padding-right="12"
      data-fx-graphical-border="6"
      data-fx-use-header-filler="true"
      style={style}
      tabIndex={rootInspector.tabIndex}
      onMouseEnter={rootInspector.onMouseEnter}
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
        data-fx-height="48"
        data-fx-bottom-padding="6"
        data-fx-horizontal-spacing="12"
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
          data-fx-style="frame_title"
          data-fx-top-margin="-4"
          data-fx-bottom-padding="4"
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
          data-fx-style="draggable_space_header"
          data-fx-role="header-filler"
          data-fx-height="36"
          data-fx-natural-height="36"
          data-fx-left-margin="6"
          data-fx-right-margin="6"
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
        data-fx-style="inside_deep_frame"
        data-fx-direction="vertical"
        data-fx-vertical-spacing="0"
        data-fx-maximum-vertical-squash-size="18"
        tabIndex={bodyInspector.tabIndex}
        onMouseEnter={bodyInspector.onMouseEnter}
        onMouseMove={bodyInspector.onMouseMove}
        onClick={bodyInspector.onClick}
        onFocus={bodyInspector.onFocus}
      >
        {children}
      </div>
    </section>
  );
}

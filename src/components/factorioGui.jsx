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

export function GuiWindow({ title, children }) {
  return (
    <section
      className="fx-gui-window"
      data-anchor="gui_window"
      data-fx-primitive="frame"
      data-fx-style="frame"
    >
      <header
        className="fx-gui-window__titlebar"
        data-anchor="gui_window_titlebar"
        data-fx-primitive="flow"
        data-fx-direction="horizontal"
      >
        <strong>{title}</strong>
        <div
          className="fx-gui-window__drag-handle"
          data-anchor="gui_window_drag_handle"
          data-fx-primitive="empty-widget"
          aria-label="Drag handle"
        />
      </header>
      <div
        className="fx-gui-window__body"
        data-anchor="gui_window_body"
        data-fx-primitive="flow"
        data-fx-direction="vertical"
      >
        {children}
      </div>
    </section>
  );
}

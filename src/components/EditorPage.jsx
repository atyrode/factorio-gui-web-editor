import { useEffect, useRef, useState } from "react";
import { FxButton, FxCheckbox, FxFrame, FxTextInput, GuiWindow } from "./factorioGui.jsx";
import {
  createWindowModel,
  getWindowInspectorRows,
  renderWindowLua
} from "../factorioExport.js";

function windowTitle(value) {
  return value.trim() || "Untitled window";
}

const EDITOR_STORAGE_KEY = "labtorio.editorState.v1";
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 640;
const SIDEBAR_STAGE_MIN_WIDTH = 420;
const DEFAULT_EDITOR_STATE = {
  title: "Untitled window",
  currentWindow: null,
  showInspector: false,
  showLuaOutput: true,
  inspectorLocked: false,
  inspectedAnchor: "gui_window",
  sidebarWidth: 280
};

function normalizeLocation(location) {
  if (
    !location ||
    typeof location.x !== "number" ||
    typeof location.y !== "number" ||
    !Number.isFinite(location.x) ||
    !Number.isFinite(location.y)
  ) {
    return null;
  }

  return {
    x: Math.max(0, Math.round(location.x)),
    y: Math.max(0, Math.round(location.y))
  };
}

function normalizeWindow(value) {
  if (!value) {
    return null;
  }

  return {
    title: windowTitle(String(value.title ?? DEFAULT_EDITOR_STATE.title)),
    location: normalizeLocation(value.location)
  };
}

function clampSidebarWidth(value, shellWidth) {
  const requestedWidth = Number(value);
  const safeWidth = Number.isFinite(requestedWidth)
    ? requestedWidth
    : DEFAULT_EDITOR_STATE.sidebarWidth;
  const availableMax =
    typeof shellWidth === "number" && Number.isFinite(shellWidth)
      ? shellWidth - SIDEBAR_STAGE_MIN_WIDTH
      : SIDEBAR_MAX_WIDTH;
  const maxWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, availableMax));

  return Math.min(Math.max(SIDEBAR_MIN_WIDTH, Math.round(safeWidth)), maxWidth);
}

function readCachedEditorState() {
  try {
    const rawValue = window.localStorage.getItem(EDITOR_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_EDITOR_STATE;
    }

    const parsedValue = JSON.parse(rawValue);
    return {
      title: String(parsedValue.title ?? DEFAULT_EDITOR_STATE.title),
      currentWindow: normalizeWindow(parsedValue.currentWindow),
      showInspector: Boolean(parsedValue.showInspector),
      showLuaOutput:
        typeof parsedValue.showLuaOutput === "boolean"
          ? parsedValue.showLuaOutput
          : DEFAULT_EDITOR_STATE.showLuaOutput,
      inspectorLocked: Boolean(parsedValue.inspectorLocked),
      inspectedAnchor:
        typeof parsedValue.inspectedAnchor === "string"
          ? parsedValue.inspectedAnchor
          : DEFAULT_EDITOR_STATE.inspectedAnchor,
      sidebarWidth: clampSidebarWidth(
        Number(parsedValue.sidebarWidth ?? DEFAULT_EDITOR_STATE.sidebarWidth)
      )
    };
  } catch {
    return DEFAULT_EDITOR_STATE;
  }
}

function writeCachedEditorState(editorState) {
  try {
    window.localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(editorState));
  } catch {
    // Local storage can be unavailable in private or locked-down browser contexts.
  }
}

function EditorCanvas({
  currentWindow,
  inspectorActive,
  inspectorLocked,
  inspectedAnchor,
  onInspect,
  onInspectLock,
  onWindowLocationChange
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  function startWindowDrag(event) {
    if (inspectorActive || event.button !== 0 || !currentWindow || !canvasRef.current) {
      return;
    }

    const windowElement = event.currentTarget.closest(".fx-gui-window");
    if (!windowElement) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const windowRect = windowElement.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startX: currentWindow.location?.x ?? windowRect.left - canvasRect.left,
      startY: currentWindow.location?.y ?? windowRect.top - canvasRect.top,
      maxX: Math.max(0, canvasRect.width - windowRect.width),
      maxY: Math.max(0, canvasRect.height - windowRect.height)
    };
  }

  function moveWindowDrag(event) {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const nextX = dragState.startX + event.clientX - dragState.originX;
    const nextY = dragState.startY + event.clientY - dragState.originY;
    onWindowLocationChange({
      x: Math.min(Math.max(0, Math.round(nextX)), dragState.maxX),
      y: Math.min(Math.max(0, Math.round(nextY)), dragState.maxY)
    });
  }

  function endWindowDrag(event) {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const location = currentWindow?.location;
  const windowStyle = location ? { left: `${location.x}px`, top: `${location.y}px` } : undefined;
  const windowClassName = [
    "fx-editor-preview-window",
    location ? "is-positioned" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fx-editor-canvas" data-anchor="editor_canvas" ref={canvasRef}>
      {currentWindow ? (
        <GuiWindow
          title={currentWindow.title}
          className={windowClassName}
          inspectorActive={inspectorActive}
          inspectorLocked={inspectorLocked}
          inspectedAnchor={inspectedAnchor}
          onInspect={onInspect}
          onInspectLock={onInspectLock}
          style={windowStyle}
          onTitlebarPointerDown={startWindowDrag}
          onTitlebarPointerMove={moveWindowDrag}
          onTitlebarPointerUp={endWindowDrag}
          onTitlebarPointerCancel={endWindowDrag}
        />
      ) : (
        <div className="fx-editor-empty" data-anchor="editor_empty_state">
          No window
        </div>
      )}
    </div>
  );
}

function LuaOutput({ model }) {
  const code = renderWindowLua(model);

  return (
    <FxFrame title="Lua Output" className="fx-editor-output" as="section">
      <div className="fx-editor-output__file" data-anchor="lua_output_file">
        gui.lua
      </div>
      <pre className="fx-editor-output__code">
        <code>{code}</code>
      </pre>
    </FxFrame>
  );
}

const NOT_IMPLEMENTED = "not implemented";

function valueOrMissing(value) {
  return value === undefined || value === null ? NOT_IMPLEMENTED : value;
}

function inspectorValueTone(label, value) {
  if (value === NOT_IMPLEMENTED) {
    return "missing";
  }

  if (label === "Style" || label === "Derived from" || label === "Derived from") {
    return "style";
  }

  if (
    typeof value === "boolean" ||
    typeof value === "number" ||
    value === "true" ||
    value === "false" ||
    value === "on" ||
    value === "off" ||
    (typeof value === "string" && value.startsWith("{") && value.endsWith("}"))
  ) {
    return "property";
  }

  return "default";
}

function InspectorValue({ label, value, indent = 0 }) {
  const normalizedValue = valueOrMissing(value);
  const isGroupLabel = normalizedValue === "";
  const stringValue = String(normalizedValue);
  const tone = inspectorValueTone(label, normalizedValue);

  return (
    <div className="fx-inspector-row" data-indent={indent}>
      <span className="fx-inspector-row__key" title={label}>
        {label}
      </span>
      <span className="fx-inspector-row__colon">:</span>
      {isGroupLabel ? null : (
        <span className={`fx-inspector-row__value fx-inspector-row__value--${tone}`} title={stringValue}>
          {stringValue}
        </span>
      )}
    </div>
  );
}

function normalizeInspectorRow(row) {
  if (Array.isArray(row)) {
    return { label: row[0], value: row[1], indent: row[2] ?? 0 };
  }

  return {
    label: row?.label ?? "",
    value: row?.value ?? "",
    indent: row?.indent ?? 0
  };
}

function InspectorRows({ rows }) {
  return rows.map((row, index) => {
    const { label, value, indent } = normalizeInspectorRow(row);
    return (
      <InspectorValue label={label} value={value} indent={indent} key={`${label}-${index}`} />
    );
  });
}

function InspectorCard({ item, locked, onUnlock }) {
  return (
    <section className="fx-inspector-card" data-anchor={`inspector_${item.id}`}>
      <div className="fx-inspector-card__header">
        <h3 title={item.title}>{item.title}</h3>
        {locked ? (
          <button type="button" onClick={onUnlock}>
            Unlock
          </button>
        ) : null}
      </div>
      <dl>
        <InspectorValue label="relative" value={item.relative} />
        <InspectorValue label="size" value={item.size} />
        <InspectorValue label="content_size" value={item.contentSize} />
        <InspectorValue label="clip_size" value={item.clipSize} />
        <InspectorValue label="size_before_stretching" value={item.sizeBeforeStretching} />
        <InspectorValue
          label="maximum_horizontal_squash_size"
          value={item.maximumHorizontalSquashSize}
        />
        <InspectorValue label="maximum_vertical_squash_size" value={item.maximumVerticalSquashSize} />
        <InspectorValue label="Style" value={item.style} />
        <InspectorValue label="Derived from" value={item.derivedFrom} />
        <InspectorRows rows={item.properties ?? []} />
      </dl>
      {item.childRows?.length ? (
        <dl className="fx-inspector-children">
          <InspectorRows rows={item.childRows} />
        </dl>
      ) : null}
    </section>
  );
}

function componentClassName(node) {
  if (node.className) {
    return node.className;
  }

  if (node.id?.endsWith("_titlebar")) {
    return "agui::HorizontalFlow";
  }

  if (node.id?.endsWith("_title")) {
    return "agui::Label";
  }

  if (node.role === "header-filler") {
    return "agui::Filler";
  }

  if (node.id?.endsWith("_body")) {
    return "agui::VerticalFlow";
  }

  return node.primitive ?? "agui::Element";
}

function ComponentTreeNode({ node, inspectedAnchor, onSelectComponent }) {
  const children = node.children ?? [];
  const selected = inspectedAnchor === node.id;

  return (
    <li>
      <button
        className={selected ? "is-selected" : ""}
        type="button"
        onClick={() => onSelectComponent(node.id)}
      >
        <span>{componentClassName(node)}</span>
        <code>{node.id}</code>
      </button>
      {children.length ? (
        <ul>
          {children.map((child) => (
            <ComponentTreeNode
              inspectedAnchor={inspectedAnchor}
              key={child.id}
              node={child}
              onSelectComponent={onSelectComponent}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ComponentTree({ model, inspectedAnchor, onSelectComponent }) {
  if (!model?.root) {
    return null;
  }

  return (
    <section className="fx-component-tree" data-anchor="component_tree">
      <h3>Components</h3>
      <ul>
        <ComponentTreeNode
          inspectedAnchor={inspectedAnchor}
          node={model.root}
          onSelectComponent={onSelectComponent}
        />
      </ul>
    </section>
  );
}

function StyleInspector({ model, inspectedAnchor, locked, onUnlock, onSelectComponent }) {
  const rows = getWindowInspectorRows(model);
  const item = rows.find((row) => row.id === inspectedAnchor) ?? rows[0];

  if (!item) {
    return (
      <div className="fx-inspector-empty" data-anchor="style_inspector_empty">
        Create a window to inspect GUI parts.
      </div>
    );
  }

  return (
    <div className="fx-style-inspector" data-anchor="style_inspector_panel">
      <InspectorCard item={item} locked={locked} onUnlock={onUnlock} />
      <ComponentTree
        inspectedAnchor={inspectedAnchor}
        model={model}
        onSelectComponent={onSelectComponent}
      />
    </div>
  );
}

export function EditorPage() {
  const [editorState, setEditorState] = useState(readCachedEditorState);
  const shellRef = useRef(null);
  const sidebarResizeRef = useRef(null);
  const {
    title,
    currentWindow,
    showInspector,
    showLuaOutput,
    inspectorLocked,
    inspectedAnchor,
    sidebarWidth
  } = editorState;
  const currentModel = currentWindow ? createWindowModel(currentWindow) : null;

  useEffect(() => {
    writeCachedEditorState(editorState);
  }, [editorState]);

  function createWindow() {
    setEditorState((state) => ({
      ...state,
      currentWindow: {
        title: windowTitle(state.title),
        location: state.currentWindow?.location ?? null
      },
      inspectorLocked: false,
      inspectedAnchor: "gui_window"
    }));
  }

  function resetWindow() {
    setEditorState((state) => ({
      ...state,
      currentWindow: null,
      inspectorLocked: false,
      inspectedAnchor: "gui_window"
    }));
  }

  function updateTitle(event) {
    const nextTitle = event.target.value;
    setEditorState((state) => ({
      ...state,
      title: nextTitle,
      currentWindow: state.currentWindow
        ? { ...state.currentWindow, title: windowTitle(nextTitle) }
        : null
    }));
  }

  function updateInspectorEnabled(event) {
    setEditorState((state) => ({
      ...state,
      showInspector: event.target.checked,
      inspectorLocked: event.target.checked ? state.inspectorLocked : false
    }));
  }

  function updateLuaOutputEnabled(event) {
    setEditorState((state) => ({
      ...state,
      showLuaOutput: event.target.checked
    }));
  }

  function updateInspectedAnchor(nextAnchor) {
    setEditorState((state) => ({
      ...state,
      inspectedAnchor: state.inspectorLocked ? state.inspectedAnchor : nextAnchor
    }));
  }

  function lockInspectedAnchor(nextAnchor) {
    setEditorState((state) => ({
      ...state,
      inspectedAnchor: nextAnchor,
      inspectorLocked: state.inspectedAnchor === nextAnchor ? !state.inspectorLocked : true
    }));
  }

  function unlockInspector() {
    setEditorState((state) => ({
      ...state,
      inspectorLocked: false
    }));
  }

  function selectInspectorComponent(nextAnchor) {
    setEditorState((state) => ({
      ...state,
      inspectedAnchor: nextAnchor,
      inspectorLocked: true
    }));
  }

  function updateWindowLocation(location) {
    setEditorState((state) =>
      state.currentWindow
        ? {
            ...state,
            currentWindow: {
              ...state.currentWindow,
              location: normalizeLocation(location)
            }
          }
        : state
    );
  }

  function startSidebarResize(event) {
    if (event.button !== 0 || !shellRef.current) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    sidebarResizeRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      startWidth: sidebarWidth,
      shellWidth: shellRef.current.getBoundingClientRect().width
    };
  }

  function moveSidebarResize(event) {
    const resizeState = sidebarResizeRef.current;
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    const nextWidth = resizeState.startWidth + event.clientX - resizeState.originX;
    setEditorState((state) => ({
      ...state,
      sidebarWidth: clampSidebarWidth(nextWidth, resizeState.shellWidth)
    }));
  }

  function endSidebarResize(event) {
    const resizeState = sidebarResizeRef.current;
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    sidebarResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resizeSidebarBy(delta) {
    const shellWidth = shellRef.current?.getBoundingClientRect().width;
    setEditorState((state) => ({
      ...state,
      sidebarWidth: clampSidebarWidth(state.sidebarWidth + delta, shellWidth)
    }));
  }

  function handleSidebarResizeKey(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      resizeSidebarBy(-24);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      resizeSidebarBy(24);
    } else if (event.key === "Home") {
      event.preventDefault();
      setEditorState((state) => ({
        ...state,
        sidebarWidth: SIDEBAR_MIN_WIDTH
      }));
    } else if (event.key === "End") {
      event.preventDefault();
      const shellWidth = shellRef.current?.getBoundingClientRect().width;
      setEditorState((state) => ({
        ...state,
        sidebarWidth: clampSidebarWidth(SIDEBAR_MAX_WIDTH, shellWidth)
      }));
    }
  }

  return (
    <main
      className="fx-editor-shell"
      ref={shellRef}
      style={{ "--fx-editor-sidebar-width": `${sidebarWidth}px` }}
    >
      <aside className="fx-editor-rail" aria-label="Editor controls">
        <FxFrame title="Window" className="fx-editor-panel">
          <label className="fx-field">
            <span>Title</span>
            <FxTextInput
              id="window-title"
              type="text"
              value={title}
              autoComplete="off"
              disabled={!currentWindow}
              onChange={updateTitle}
            />
          </label>
          <div className="fx-actions">
            <FxButton id="create-window" onClick={createWindow}>
              {currentWindow ? "Recreate window" : "Create window"}
            </FxButton>
            <FxButton id="reset-window" disabled={!currentWindow} onClick={resetWindow}>
              Reset
            </FxButton>
          </div>
        </FxFrame>

        <FxFrame title="Inspector" className="fx-editor-panel fx-editor-panel--inspector">
          <FxCheckbox
            checked={showInspector}
            readOnly={false}
            onChange={updateInspectorEnabled}
          >
            Ctrl+F6 style inspector
          </FxCheckbox>
          <FxCheckbox
            checked={showLuaOutput}
            readOnly={false}
            onChange={updateLuaOutputEnabled}
          >
            Lua output
          </FxCheckbox>
          {showInspector ? (
            <StyleInspector
              model={currentModel}
              inspectedAnchor={inspectedAnchor}
              locked={inspectorLocked}
              onSelectComponent={selectInspectorComponent}
              onUnlock={unlockInspector}
            />
          ) : null}
        </FxFrame>
        <div
          aria-label="Resize editor sidebar"
          aria-orientation="vertical"
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuenow={sidebarWidth}
          className="fx-editor-rail__resize"
          onKeyDown={handleSidebarResizeKey}
          onPointerCancel={endSidebarResize}
          onPointerDown={startSidebarResize}
          onPointerMove={moveSidebarResize}
          onPointerUp={endSidebarResize}
          role="separator"
          tabIndex={0}
        />
      </aside>

      <section className="fx-editor-stage" aria-label="Editor canvas">
        <div id="editor-root">
          <EditorCanvas
            currentWindow={currentWindow}
            inspectorActive={showInspector}
            inspectorLocked={inspectorLocked}
            inspectedAnchor={inspectedAnchor}
            onInspect={updateInspectedAnchor}
            onInspectLock={lockInspectedAnchor}
            onWindowLocationChange={updateWindowLocation}
          />
        </div>
      </section>
      {showLuaOutput ? <LuaOutput model={currentModel} /> : null}
    </main>
  );
}

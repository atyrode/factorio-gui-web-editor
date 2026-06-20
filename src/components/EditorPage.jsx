import { useEffect, useRef, useState } from "react";
import {
  FxActionButton,
  FxButton,
  FxCheckbox,
  FxFrame,
  FxTextInput,
  GuiWindow
} from "./factorioGui.jsx";
import {
  createWindowModel,
  DEFAULT_WINDOW_SIZE,
  getWindowInspectorRows,
  normalizeWindowSize,
  renderWindowLua,
  WINDOW_SIZE_LIMITS
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
  windowSize: DEFAULT_WINDOW_SIZE,
  currentWindow: null,
  showInspector: false,
  showLuaOutput: true,
  inspectorLocked: false,
  inspectedAnchor: null,
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

  const size = normalizeWindowSize(value.size);

  return {
    title: windowTitle(String(value.title ?? DEFAULT_EDITOR_STATE.title)),
    location: normalizeLocation(value.location),
    size
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
    const currentWindow = normalizeWindow(parsedValue.currentWindow);
    return {
      title: String(parsedValue.title ?? DEFAULT_EDITOR_STATE.title),
      windowSize: normalizeWindowSize(parsedValue.windowSize ?? currentWindow?.size),
      currentWindow,
      showInspector: Boolean(parsedValue.showInspector),
      showLuaOutput:
        typeof parsedValue.showLuaOutput === "boolean"
          ? parsedValue.showLuaOutput
          : DEFAULT_EDITOR_STATE.showLuaOutput,
      inspectorLocked: Boolean(parsedValue.inspectorLocked),
      inspectedAnchor:
        Boolean(parsedValue.inspectorLocked) && typeof parsedValue.inspectedAnchor === "string"
          ? parsedValue.inspectedAnchor
          : null,
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
  model,
  inspectorActive,
  inspectorLocked,
  inspectedAnchor,
  inspectorPreview,
  onInspect,
  onInspectClear,
  onInspectLock,
  onWindowLocationChange
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [measurementBox, setMeasurementBox] = useState(null);

  useEffect(() => {
    if (!inspectorActive || inspectorPreview?.kind !== "geometry" || !canvasRef.current) {
      setMeasurementBox(null);
      return undefined;
    }

    const canvas = canvasRef.current;

    function pixelValue(value) {
      const parsedValue = Number.parseFloat(value);
      return Number.isFinite(parsedValue) ? parsedValue : 0;
    }

    function dataNumber(target, key) {
      const parsedValue = Number.parseFloat(target.dataset[key]);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    function measureTarget() {
      const target = canvas.querySelector(`[data-anchor="${inspectorPreview.anchor}"]`);
      if (!target) {
        setMeasurementBox(null);
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(target);
      let left = targetRect.left - canvasRect.left + canvas.scrollLeft;
      let top = targetRect.top - canvasRect.top + canvas.scrollTop;
      let width = targetRect.width;
      let height = targetRect.height;

      if (inspectorPreview.metric === "content_size") {
        const insetLeft =
          pixelValue(computedStyle.borderLeftWidth) + pixelValue(computedStyle.paddingLeft);
        const insetRight =
          pixelValue(computedStyle.borderRightWidth) + pixelValue(computedStyle.paddingRight);
        const insetTop =
          pixelValue(computedStyle.borderTopWidth) + pixelValue(computedStyle.paddingTop);
        const insetBottom =
          pixelValue(computedStyle.borderBottomWidth) + pixelValue(computedStyle.paddingBottom);

        left += insetLeft;
        top += insetTop;
        width = Math.max(0, width - insetLeft - insetRight);
        height = Math.max(0, height - insetTop - insetBottom);
      } else if (inspectorPreview.metric === "clip_size") {
        left += dataNumber(target, "fxClipOffsetX") ?? 0;
        top += dataNumber(target, "fxClipOffsetY") ?? 0;
        width = dataNumber(target, "fxClipWidth") ?? width;
        height = dataNumber(target, "fxClipHeight") ?? height;
      }

      setMeasurementBox({
        label: inspectorPreview.label,
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height)
      });
    }

    measureTarget();
    window.addEventListener("resize", measureTarget);

    return () => {
      window.removeEventListener("resize", measureTarget);
    };
  }, [currentWindow, inspectorActive, inspectorPreview]);

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
  const styleReference = model?.root?.styleReference;
  const previewAnchor = inspectorPreview?.anchor ?? inspectedAnchor;
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
          styleReference={styleReference}
          inspectorActive={inspectorActive}
          inspectorLocked={inspectorLocked}
          inspectedAnchor={previewAnchor}
          onInspect={onInspect}
          onInspectClear={onInspectClear}
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
      {measurementBox ? (
        <div
          className="fx-inspector-measure"
          style={{
            left: `${measurementBox.left}px`,
            top: `${measurementBox.top}px`,
            width: `${measurementBox.width}px`,
            height: `${measurementBox.height}px`
          }}
        >
          <span>{measurementBox.label}</span>
        </div>
      ) : null}
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

function inspectorValueTone(label, value, explicitTone = null) {
  if (value === NOT_IMPLEMENTED) {
    return "missing";
  }

  if (explicitTone) {
    return explicitTone;
  }

  if (label === "Style" || label === "Derived from") {
    return "style";
  }

  return "default";
}

function InspectorValue({
  label,
  value,
  indent = 0,
  tone: explicitTone = null,
  targetId = null,
  preview = null,
  editable = null,
  onPreview,
  onClearPreview,
  onNavigate,
  onEdit
}) {
  const normalizedValue = valueOrMissing(value);
  const isGroupLabel = normalizedValue === "";
  const stringValue = String(normalizedValue);
  const tone = inspectorValueTone(label, normalizedValue, explicitTone);
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(stringValue);
  const editRef = useRef(null);
  const cancelEditRef = useRef(false);
  const rowPreview = preview ?? (
    targetId
      ? {
          kind: "reference",
          anchor: targetId,
          label: `${label}: ${stringValue}`
        }
      : null
  );
  const rowClassName = [
    "fx-inspector-row",
    rowPreview ? "has-preview" : "",
    targetId ? "has-target" : "",
    editable ? "is-editable" : ""
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
      editRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setDraftValue(stringValue);
    }
  }, [editing, stringValue]);

  function previewRow() {
    if (rowPreview) {
      onPreview?.(rowPreview);
    }
  }

  function clearPreview() {
    if (rowPreview) {
      onClearPreview?.();
    }
  }

  function navigateRow() {
    if (targetId) {
      onNavigate?.(targetId);
    }
  }

  function handleKeyDown(event) {
    if (!targetId || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    navigateRow();
  }

  function startEditing(event) {
    if (!editable) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    cancelEditRef.current = false;
    setDraftValue(stringValue);
    setEditing(true);
  }

  function commitEdit() {
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      return;
    }

    onEdit?.(editable, draftValue);
    setEditing(false);
  }

  function cancelEdit() {
    cancelEditRef.current = true;
    setDraftValue(stringValue);
    setEditing(false);
  }

  function handleEditKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  }

  return (
    <div
      className={rowClassName}
      data-indent={indent}
      onClick={navigateRow}
      onKeyDown={handleKeyDown}
      onMouseEnter={previewRow}
      onMouseLeave={clearPreview}
      role={targetId ? "button" : undefined}
      tabIndex={targetId ? 0 : undefined}
    >
      <span className="fx-inspector-row__key" title={label}>
        {label}
      </span>
      <span className="fx-inspector-row__colon">:</span>
      {isGroupLabel ? null : (
        editable && editing ? (
          <input
            aria-label={`Edit ${label}`}
            className={`fx-inspector-row__edit fx-inspector-row__value--${tone}`}
            onBlur={commitEdit}
            onChange={(event) => setDraftValue(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleEditKeyDown}
            ref={editRef}
            value={draftValue}
          />
        ) : editable ? (
          <button
            className={`fx-inspector-row__value fx-inspector-row__value-button fx-inspector-row__value--${tone}`}
            onClick={startEditing}
            title={`Edit ${label}: ${stringValue}`}
            type="button"
          >
            {stringValue}
          </button>
        ) : (
          <span
            className={`fx-inspector-row__value fx-inspector-row__value--${tone}`}
            title={stringValue}
          >
            {stringValue}
          </span>
        )
      )}
    </div>
  );
}

function normalizeInspectorRow(row) {
  if (Array.isArray(row)) {
    return { label: row[0], value: row[1], indent: row[2] ?? 0, tone: row[3] ?? null };
  }

  return {
    label: row?.label ?? "",
    value: row?.value ?? "",
    indent: row?.indent ?? 0,
    tone: row?.tone ?? null,
    targetId: row?.targetId ?? null,
    editable: row?.editable ?? null,
    preview: row?.preview ?? null
  };
}

function InspectorRows({
  rows,
  defaultTone = null,
  onPreview,
  onClearPreview,
  onNavigate,
  onEdit
}) {
  return rows.map((row, index) => {
    const { label, value, indent, tone, targetId, editable, preview } = normalizeInspectorRow(row);
    return (
      <InspectorValue
        editable={editable}
        label={label}
        indent={indent}
        key={`${label}-${index}`}
        onClearPreview={onClearPreview}
        onEdit={onEdit}
        onNavigate={onNavigate}
        onPreview={onPreview}
        preview={preview}
        targetId={targetId}
        tone={tone ?? defaultTone}
        value={value}
      />
    );
  });
}

function measurementPreview(item, label, value, metric) {
  return {
    kind: "geometry",
    anchor: item.id,
    metric,
    label: `${label}: ${value}`
  };
}

function InspectorCard({
  canGoBack,
  canGoForward,
  item,
  locked,
  onBack,
  onForward,
  onToggleLock,
  onPreview,
  onClearPreview,
  onNavigate,
  onEdit
}) {
  return (
    <section className="fx-inspector-card" data-anchor={`inspector_${item.id}`}>
      <div className="fx-inspector-card__header">
        <h3 title={item.title}>{item.title}</h3>
        <div className="fx-inspector-actions" aria-label="Inspector actions">
          <FxActionButton icon="back" label="Back" disabled={!canGoBack} onClick={onBack} />
          <FxActionButton
            icon="forward"
            label="Forward"
            disabled={!canGoForward}
            onClick={onForward}
          />
          <FxActionButton
            active={locked}
            disabled={!locked}
            icon={locked ? "lock-closed" : "lock-open"}
            label={locked ? "Unlock inspector" : "No locked component"}
            onClick={onToggleLock}
          />
        </div>
      </div>
      <div className="fx-inspector-lines">
        <InspectorValue label="relative" value={item.relative} />
        <InspectorValue
          label="size"
          onClearPreview={onClearPreview}
          onPreview={onPreview}
          preview={measurementPreview(item, "size", item.size, "size")}
          value={item.size}
        />
        <InspectorValue
          label="content_size"
          onClearPreview={onClearPreview}
          onPreview={onPreview}
          preview={measurementPreview(item, "content_size", item.contentSize, "content_size")}
          value={item.contentSize}
        />
        <InspectorValue
          label="clip_size"
          onClearPreview={onClearPreview}
          onPreview={onPreview}
          preview={measurementPreview(item, "clip_size", item.clipSize, "clip_size")}
          value={item.clipSize}
        />
        <InspectorValue
          label="size_before_stretching"
          onClearPreview={onClearPreview}
          onPreview={onPreview}
          preview={measurementPreview(
            item,
            "size_before_stretching",
            item.sizeBeforeStretching,
            "size_before_stretching"
          )}
          value={item.sizeBeforeStretching}
        />
        <InspectorValue
          label="maximum_horizontal_squash_size"
          value={item.maximumHorizontalSquashSize}
        />
        <InspectorValue label="maximum_vertical_squash_size" value={item.maximumVerticalSquashSize} />
        {item.maximalHeight !== undefined && item.maximalHeight !== null ? (
          <InspectorValue label="maximal_height" value={item.maximalHeight} />
        ) : null}
        <InspectorValue label="Style" value={item.style} />
        <InspectorValue label="Derived from" value={item.derivedFrom} />
        <InspectorRows
          rows={item.properties ?? []}
          defaultTone="property"
          onClearPreview={onClearPreview}
          onEdit={onEdit}
          onNavigate={onNavigate}
          onPreview={onPreview}
        />
      </div>
      {item.childRows?.length ? (
        <div className="fx-inspector-lines fx-inspector-children">
          <InspectorRows
            rows={item.childRows}
            onClearPreview={onClearPreview}
            onEdit={onEdit}
            onNavigate={onNavigate}
            onPreview={onPreview}
          />
        </div>
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

function ComponentTreeNode({
  node,
  inspectedAnchor,
  onClearPreview,
  onPreviewComponent,
  onSelectComponent
}) {
  const children = node.children ?? [];
  const selected = inspectedAnchor === node.id;

  return (
    <li>
      <button
        className={selected ? "is-selected" : ""}
        type="button"
        onClick={() => onSelectComponent(node.id)}
        onMouseEnter={() => onPreviewComponent(node.id)}
        onMouseLeave={onClearPreview}
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
              onClearPreview={onClearPreview}
              onPreviewComponent={onPreviewComponent}
              onSelectComponent={onSelectComponent}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ComponentTree({
  model,
  inspectedAnchor,
  onClearPreview,
  onPreviewComponent,
  onSelectComponent
}) {
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
          onClearPreview={onClearPreview}
          onPreviewComponent={onPreviewComponent}
          onSelectComponent={onSelectComponent}
        />
      </ul>
    </section>
  );
}

function StyleInspector({
  canGoBack,
  canGoForward,
  model,
  inspectedAnchor,
  locked,
  onBack,
  onClearPreview,
  onEdit,
  onForward,
  onNavigate,
  onPreview,
  onPreviewComponent,
  onSelectComponent,
  onToggleLock
}) {
  const rows = getWindowInspectorRows(model);
  const item = inspectedAnchor ? rows.find((row) => row.id === inspectedAnchor) : null;

  if (!model?.root) {
    return (
      <div className="fx-inspector-empty" data-anchor="style_inspector_empty">
        Create a window to inspect GUI parts.
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fx-style-inspector" data-anchor="style_inspector_panel">
        <div className="fx-inspector-empty" data-anchor="style_inspector_idle">
          Hover a GUI part or select a component to inspect it.
        </div>
        <ComponentTree
          inspectedAnchor={inspectedAnchor}
          model={model}
          onClearPreview={onClearPreview}
          onPreviewComponent={onPreviewComponent}
          onSelectComponent={onSelectComponent}
        />
      </div>
    );
  }

  return (
    <div className="fx-style-inspector" data-anchor="style_inspector_panel">
      <InspectorCard
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        item={item}
        locked={locked}
        onBack={onBack}
        onClearPreview={onClearPreview}
        onEdit={onEdit}
        onForward={onForward}
        onNavigate={onNavigate}
        onPreview={onPreview}
        onToggleLock={onToggleLock}
      />
      <ComponentTree
        inspectedAnchor={inspectedAnchor}
        model={model}
        onClearPreview={onClearPreview}
        onPreviewComponent={onPreviewComponent}
        onSelectComponent={onSelectComponent}
      />
    </div>
  );
}

export function EditorPage() {
  const [editorState, setEditorState] = useState(readCachedEditorState);
  const [inspectorHistory, setInspectorHistory] = useState({ back: [], forward: [] });
  const [inspectorPreview, setInspectorPreview] = useState(null);
  const shellRef = useRef(null);
  const sidebarResizeRef = useRef(null);
  const {
    title,
    windowSize,
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
    setInspectorHistory({ back: [], forward: [] });
    setInspectorPreview(null);
    setEditorState((state) => ({
      ...state,
      currentWindow: {
        title: windowTitle(state.title),
        location: state.currentWindow?.location ?? null,
        size: normalizeWindowSize(state.windowSize)
      },
      inspectorLocked: false,
      inspectedAnchor: null
    }));
  }

  function resetWindow() {
    setInspectorHistory({ back: [], forward: [] });
    setInspectorPreview(null);
    setEditorState((state) => ({
      ...state,
      currentWindow: null,
      inspectorLocked: false,
      inspectedAnchor: null
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

  function updateWindowSize(dimension, value) {
    setEditorState((state) => {
      const nextSize = normalizeWindowSize({
        ...state.windowSize,
        [dimension]: value
      });

      return {
        ...state,
        windowSize: nextSize,
        currentWindow: state.currentWindow
          ? {
              ...state.currentWindow,
              size: nextSize
            }
          : null
      };
    });
  }

  function updateWindowWidth(event) {
    updateWindowSize("width", event.target.value);
  }

  function updateWindowHeight(event) {
    updateWindowSize("height", event.target.value);
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

  function clearHoveredInspection() {
    setInspectorPreview(null);
    setEditorState((state) => ({
      ...state,
      inspectedAnchor: state.inspectorLocked ? state.inspectedAnchor : null
    }));
  }

  function lockInspectedAnchor(nextAnchor) {
    if (!nextAnchor) {
      return;
    }

    setInspectorPreview(null);
    setEditorState((state) => ({
      ...state,
      inspectedAnchor: nextAnchor,
      inspectorLocked: state.inspectedAnchor === nextAnchor ? !state.inspectorLocked : true
    }));
  }

  function selectInspectorComponent(nextAnchor) {
    if (!nextAnchor) {
      return;
    }

    setInspectorPreview(null);
    setEditorState((state) => ({
      ...state,
      inspectedAnchor: nextAnchor,
      inspectorLocked: true
    }));
  }

  function navigateInspector(nextAnchor) {
    if (!nextAnchor) {
      return;
    }

    setInspectorPreview(null);
    if (inspectedAnchor && inspectedAnchor !== nextAnchor) {
      setInspectorHistory((history) => ({
        back: [...history.back, inspectedAnchor].slice(-40),
        forward: []
      }));
    }

    setEditorState((state) => ({
      ...state,
      inspectedAnchor: nextAnchor,
      inspectorLocked: true
    }));
  }

  function goInspectorBack() {
    const nextAnchor = inspectorHistory.back.at(-1);
    if (!nextAnchor) {
      return;
    }

    setInspectorPreview(null);
    setInspectorHistory((history) => ({
      back: history.back.slice(0, -1),
      forward: inspectedAnchor
        ? [inspectedAnchor, ...history.forward].slice(0, 40)
        : history.forward
    }));
    setEditorState((state) => ({
      ...state,
      inspectedAnchor: nextAnchor,
      inspectorLocked: true
    }));
  }

  function goInspectorForward() {
    const nextAnchor = inspectorHistory.forward[0];
    if (!nextAnchor) {
      return;
    }

    setInspectorPreview(null);
    setInspectorHistory((history) => ({
      back: inspectedAnchor ? [...history.back, inspectedAnchor].slice(-40) : history.back,
      forward: history.forward.slice(1)
    }));
    setEditorState((state) => ({
      ...state,
      inspectedAnchor: nextAnchor,
      inspectorLocked: true
    }));
  }

  function previewInspector(preview) {
    setInspectorPreview(preview);
  }

  function previewInspectorComponent(nextAnchor) {
    setInspectorPreview({
      kind: "reference",
      anchor: nextAnchor,
      label: nextAnchor
    });
  }

  function clearInspectorPreview() {
    setInspectorPreview(null);
  }

  function updateInspectorEditableValue(editable, value) {
    if (editable?.field !== "title") {
      return;
    }

    setEditorState((state) => ({
      ...state,
      title: value,
      currentWindow: state.currentWindow
        ? { ...state.currentWindow, title: windowTitle(value) }
        : state.currentWindow
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
              onChange={updateTitle}
            />
          </label>
          <div className="fx-field-grid fx-field-grid--two">
            <label className="fx-field">
              <span>Width</span>
              <FxTextInput
                id="window-width"
                type="number"
                min={WINDOW_SIZE_LIMITS.minWidth}
                max={WINDOW_SIZE_LIMITS.maxWidth}
                step="10"
                value={windowSize.width}
                onChange={updateWindowWidth}
              />
            </label>
            <label className="fx-field">
              <span>Height</span>
              <FxTextInput
                id="window-height"
                type="number"
                min={WINDOW_SIZE_LIMITS.minHeight}
                max={WINDOW_SIZE_LIMITS.maxHeight}
                step="10"
                value={windowSize.height}
                onChange={updateWindowHeight}
              />
            </label>
          </div>
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
              canGoBack={inspectorHistory.back.length > 0}
              canGoForward={inspectorHistory.forward.length > 0}
              model={currentModel}
              inspectedAnchor={inspectedAnchor}
              locked={inspectorLocked}
              onBack={goInspectorBack}
              onClearPreview={clearInspectorPreview}
              onEdit={updateInspectorEditableValue}
              onForward={goInspectorForward}
              onNavigate={navigateInspector}
              onPreview={previewInspector}
              onPreviewComponent={previewInspectorComponent}
              onSelectComponent={selectInspectorComponent}
              onToggleLock={() => lockInspectedAnchor(inspectedAnchor)}
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
            model={currentModel}
            inspectorActive={showInspector}
            inspectorLocked={inspectorLocked}
            inspectedAnchor={inspectedAnchor}
            inspectorPreview={inspectorPreview}
            onInspect={updateInspectedAnchor}
            onInspectClear={clearHoveredInspection}
            onInspectLock={lockInspectedAnchor}
            onWindowLocationChange={updateWindowLocation}
          />
        </div>
      </section>
      {showLuaOutput ? <LuaOutput model={currentModel} /> : null}
    </main>
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Download, SlidersHorizontal } from "lucide-react";
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
  findModelNode,
  getWindowInspectorRows,
  HORIZONTAL_FLOW_DIRECTION,
  normalizeWindowBodyDirection,
  normalizeWindowSize,
  renderWindowLua,
  VERTICAL_FLOW_DIRECTION,
  WINDOW_SIZE_LIMITS
} from "../factorioExport.js";
import { createFactorioModDownload } from "../factorioModExport.js";
import {
  BODY_LAYOUT_ROOT_ID,
  acceptedLayoutChildAtom,
  canDropLayoutNode,
  createFrameSpec,
  createHorizontalFlowSpec,
  FRAME_ATOM_ID,
  findLayoutNode,
  findLayoutParentChildren,
  HORIZONTAL_FLOW_ATOM_ID,
  insertLayoutNode,
  LAYOUT_NODE_SIZE_LIMITS,
  moveLayoutNode,
  normalizeLayoutState,
  removeLayoutNode,
  updateLayoutNodeSize
} from "../factorioLayoutTree.js";
import {
  readBuilderPaletteDrag
} from "../factorioLayoutBuilderDnd.js";
import {
  DEFAULT_LAYOUT_SETTINGS,
  LAYOUT_SETTING_LIMITS,
  isDefaultLayoutSettings,
  normalizeLayoutSettings
} from "../factorioEditorSettings.js";
import {
  collectWindowLuaVariableNodeIds,
  normalizeLuaVariableNames,
  validateLuaVariableNameEdit
} from "../factorioLuaNames.js";
import { BuilderPanel } from "./BuilderPanel.jsx";

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
  windowBodyDirection: HORIZONTAL_FLOW_DIRECTION,
  currentWindow: null,
  showInspector: false,
  showLuaOutput: true,
  showGuiShadows: true,
  resizeMode: false,
  inspectorLocked: false,
  inspectedAnchor: null,
  showLayoutSettings: false,
  showComponentTreeShell: false,
  layoutSettings: DEFAULT_LAYOUT_SETTINGS,
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
  const layoutState = normalizeLayoutState(value);
  const luaVariableNames = normalizeLuaVariableNames(
    value.luaVariableNames,
    collectWindowLuaVariableNodeIds(layoutState)
  );

  return {
    title: windowTitle(String(value.title ?? DEFAULT_EDITOR_STATE.title)),
    location: normalizeLocation(value.location),
    size,
    bodyDirection: normalizeWindowBodyDirection(value.bodyDirection),
    layoutChildren: layoutState.layoutChildren,
    nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber,
    luaVariableNames
  };
}

function normalizeWindowLuaVariableNames(windowState) {
  return normalizeLuaVariableNames(
    windowState?.luaVariableNames,
    collectWindowLuaVariableNodeIds(windowState)
  );
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
      windowBodyDirection: normalizeWindowBodyDirection(
        parsedValue.windowBodyDirection ?? currentWindow?.bodyDirection
      ),
      currentWindow,
      showInspector: Boolean(parsedValue.showInspector),
      showLuaOutput:
        typeof parsedValue.showLuaOutput === "boolean"
          ? parsedValue.showLuaOutput
          : DEFAULT_EDITOR_STATE.showLuaOutput,
      showGuiShadows:
        typeof parsedValue.showGuiShadows === "boolean"
          ? parsedValue.showGuiShadows
          : DEFAULT_EDITOR_STATE.showGuiShadows,
      resizeMode:
        typeof parsedValue.resizeMode === "boolean"
          ? parsedValue.resizeMode
          : DEFAULT_EDITOR_STATE.resizeMode,
      inspectorLocked: Boolean(parsedValue.inspectorLocked),
      inspectedAnchor:
        Boolean(parsedValue.inspectorLocked) && typeof parsedValue.inspectedAnchor === "string"
          ? parsedValue.inspectedAnchor
          : null,
      showLayoutSettings: Boolean(parsedValue.showLayoutSettings),
      showComponentTreeShell:
        typeof parsedValue.showComponentTreeShell === "boolean"
          ? parsedValue.showComponentTreeShell
          : DEFAULT_EDITOR_STATE.showComponentTreeShell,
      layoutSettings: normalizeLayoutSettings(parsedValue.layoutSettings),
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

function currentWindowWithResizeDraft(currentWindow, draft) {
  if (!currentWindow || !draft?.anchor) {
    return currentWindow;
  }

  if (draft.kind === "window" && draft.anchor === "gui_window") {
    return {
      ...currentWindow,
      size: normalizeWindowSize(draft.size)
    };
  }

  if (draft.kind !== "layout-node") {
    return currentWindow;
  }

  const update = updateLayoutNodeSize(
    currentWindow.layoutChildren ?? [],
    draft.anchor,
    draft.size
  );

  return update.changed
    ? { ...currentWindow, layoutChildren: update.layoutChildren }
    : currentWindow;
}

function resizeCapabilityForAnchor({ anchor, currentWindow, model }) {
  if (!anchor || !currentWindow || !model?.root) {
    return null;
  }

  const node = findModelNode(model, anchor);
  if (!node) {
    return null;
  }

  if (anchor === "gui_window") {
    const size = normalizeWindowSize(currentWindow.size);
    return {
      anchor,
      kind: "window",
      supported: true,
      widthField: "width",
      heightField: "height",
      width: size.width,
      height: size.height,
      widthLimits: {
        min: WINDOW_SIZE_LIMITS.minWidth,
        max: WINDOW_SIZE_LIMITS.maxWidth
      },
      heightLimits: {
        min: WINDOW_SIZE_LIMITS.minHeight,
        max: WINDOW_SIZE_LIMITS.maxHeight
      }
    };
  }

  const layoutMatch = findLayoutNode(currentWindow.layoutChildren ?? [], anchor);
  if (
    layoutMatch &&
    (layoutMatch.node.atom === FRAME_ATOM_ID ||
      layoutMatch.node.atom === HORIZONTAL_FLOW_ATOM_ID)
  ) {
    return {
      anchor,
      kind: "layout-node",
      supported: true,
      widthField: "minimalWidth",
      heightField: "minimalHeight",
      width: node.styleReference?.minimalWidth ?? LAYOUT_NODE_SIZE_LIMITS.minimalWidth.min,
      height: node.styleReference?.minimalHeight ?? LAYOUT_NODE_SIZE_LIMITS.minimalHeight.min,
      widthLimits: LAYOUT_NODE_SIZE_LIMITS.minimalWidth,
      heightLimits: LAYOUT_NODE_SIZE_LIMITS.minimalHeight
    };
  }

  return {
    anchor,
    kind: "unsupported",
    supported: false
  };
}

function clampResizeValue(value, limits) {
  const numberValue = Number(value);
  const safeValue = Number.isFinite(numberValue) ? numberValue : limits.min;
  return Math.min(limits.max, Math.max(limits.min, Math.round(safeValue)));
}

const RESIZE_HANDLES = Object.freeze([
  { id: "nw", label: "Resize northwest" },
  { id: "n", label: "Resize north" },
  { id: "ne", label: "Resize northeast" },
  { id: "e", label: "Resize east" },
  { id: "se", label: "Resize southeast" },
  { id: "s", label: "Resize south" },
  { id: "sw", label: "Resize southwest" },
  { id: "w", label: "Resize west" }
]);

function resizeDraftForPointer(drag, event) {
  const deltaX = event.clientX - drag.originX;
  const deltaY = event.clientY - drag.originY;
  const horizontalSign =
    drag.handle.includes("e") ? 1 : drag.handle.includes("w") ? -1 : 0;
  const verticalSign =
    drag.handle.includes("s") ? 1 : drag.handle.includes("n") ? -1 : 0;

  return {
    anchor: drag.capability.anchor,
    kind: drag.capability.kind,
    size: {
      [drag.capability.widthField]: clampResizeValue(
        drag.capability.width + deltaX * horizontalSign,
        drag.capability.widthLimits
      ),
      [drag.capability.heightField]: clampResizeValue(
        drag.capability.height + deltaY * verticalSign,
        drag.capability.heightLimits
      )
    }
  };
}

function ResizeOverlay({
  active,
  anchor,
  builderDragActive,
  canvasRef,
  currentWindow,
  model,
  onCancel,
  onCommit,
  onDraft
}) {
  const resizeDragRef = useRef(null);
  const [box, setBox] = useState(null);
  const capability = resizeCapabilityForAnchor({ anchor, currentWindow, model });
  const visible = Boolean(active && !builderDragActive && anchor && capability);

  useEffect(() => {
    if (!visible || !canvasRef.current) {
      setBox(null);
      return undefined;
    }

    const canvas = canvasRef.current;

    function measureTarget() {
      const target = canvas.querySelector(`[data-anchor="${anchor}"]`);
      if (!target) {
        setBox(null);
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setBox({
        left: Math.round(targetRect.left - canvasRect.left + canvas.scrollLeft),
        top: Math.round(targetRect.top - canvasRect.top + canvas.scrollTop),
        width: Math.round(targetRect.width),
        height: Math.round(targetRect.height)
      });
    }

    measureTarget();
    window.addEventListener("resize", measureTarget);
    canvas.addEventListener("scroll", measureTarget);

    return () => {
      window.removeEventListener("resize", measureTarget);
      canvas.removeEventListener("scroll", measureTarget);
    };
  }, [anchor, canvasRef, currentWindow, model, visible]);

  if (!visible || !box) {
    return null;
  }

  function startResize(event) {
    if (event.button !== 0 || !capability?.supported) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeDragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      handle: event.currentTarget.dataset.resizeHandle,
      capability,
      latestDraft: null
    };
  }

  function moveResize(event) {
    const drag = resizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const draft = resizeDraftForPointer(drag, event);
    drag.latestDraft = draft;
    onDraft?.(draft);
  }

  function endResize(event) {
    const drag = resizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    resizeDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit?.(drag.latestDraft);
  }

  function cancelResize(event) {
    const drag = resizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    resizeDragRef.current = null;
    onCancel?.();
  }

  return (
    <div
      className={[
        "fx-resize-overlay",
        capability.supported ? "is-supported" : "is-disabled"
      ]
        .filter(Boolean)
        .join(" ")}
      data-anchor="resize_overlay"
      data-resize-anchor={anchor}
      data-resize-supported={capability.supported ? "true" : "false"}
      style={{
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`
      }}
    >
      {capability.supported ? (
        RESIZE_HANDLES.map((handle) => (
          <button
            aria-label={handle.label}
            className={`fx-resize-overlay__handle fx-resize-overlay__handle--${handle.id}`}
            data-resize-handle={handle.id}
            key={handle.id}
            onPointerCancel={cancelResize}
            onPointerDown={startResize}
            onPointerMove={moveResize}
            onPointerUp={endResize}
            title={handle.label}
            type="button"
          />
        ))
      ) : (
        <span className="fx-resize-overlay__disabled">Resize unavailable</span>
      )}
    </div>
  );
}

function EditorCanvas({
  currentWindow,
  model,
  inspectorActive,
  selectionActive = inspectorActive,
  inspectorLocked,
  inspectedAnchor,
  inspectorPreview,
  onBuilderDrop,
  onBuilderDropTargetOver,
  onInspect,
  onInspectClear,
  onInspectLock,
  onResizeCancel,
  onResizeCommit,
  onResizeDraft,
  onWindowLocationChange,
  builderDragActive,
  builderDropTarget,
  resizeMode = false,
  shadowsVisible = true
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
  const bodyChildren = model?.root?.children?.[1]?.children ?? [];
  const bodyStyleReference = model?.root?.children?.[1]?.styleReference ?? null;

  return (
    <div className="fx-editor-canvas" data-anchor="editor_canvas" ref={canvasRef}>
      {currentWindow ? (
        <GuiWindow
          title={currentWindow.title}
          className={windowClassName}
          styleReference={styleReference}
          inspectorActive={selectionActive}
          inspectorLocked={inspectorLocked}
          inspectedAnchor={previewAnchor}
          onInspect={onInspect}
          onInspectClear={onInspectClear}
          onInspectLock={onInspectLock}
          onBuilderDrop={onBuilderDrop}
          onBuilderDropTargetOver={onBuilderDropTargetOver}
          style={windowStyle}
          onTitlebarPointerDown={startWindowDrag}
          onTitlebarPointerMove={moveWindowDrag}
          onTitlebarPointerUp={endWindowDrag}
          onTitlebarPointerCancel={endWindowDrag}
          bodyChildren={bodyChildren}
          bodyStyleReference={bodyStyleReference}
          builderDragActive={builderDragActive}
          builderDropTarget={builderDropTarget}
          shadowsVisible={shadowsVisible}
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
      <ResizeOverlay
        active={resizeMode}
        anchor={inspectedAnchor}
        builderDragActive={builderDragActive}
        canvasRef={canvasRef}
        currentWindow={currentWindow}
        model={model}
        onCancel={onResizeCancel}
        onCommit={onResizeCommit}
        onDraft={onResizeDraft}
      />
    </div>
  );
}

function LuaOutput({ model }) {
  const code = renderWindowLua(model);
  const canExportMod = Boolean(model?.root);

  function downloadFactorioMod() {
    if (!model?.root) {
      return;
    }

    const { filename, data } = createFactorioModDownload(model);
    const blob = new Blob([data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  }

  return (
    <FxFrame title="Lua Output" className="fx-editor-output" as="section">
      <div className="fx-editor-output__bar">
        <div className="fx-editor-output__file" data-anchor="lua_output_file">
          gui.lua
        </div>
        <FxButton
          className="fx-editor-output__download"
          data-anchor="factorio_mod_download"
          disabled={!canExportMod}
          onClick={downloadFactorioMod}
        >
          <Download aria-hidden="true" />
          <span>Download mod</span>
        </FxButton>
      </div>
      <pre className="fx-editor-output__code">
        <code>{code}</code>
      </pre>
    </FxFrame>
  );
}

function atomLabel(atom) {
  if (atom === HORIZONTAL_FLOW_ATOM_ID) {
    return "Horizontal Flow";
  }
  if (atom === FRAME_ATOM_ID) {
    return "Frame";
  }
  return "Component";
}

function atomCode(atom) {
  if (atom === HORIZONTAL_FLOW_ATOM_ID) {
    return "flow.horizontal";
  }
  if (atom === FRAME_ATOM_ID) {
    return "frame";
  }
  return "layout";
}

function createSpecForAtom(atom, nodeNumber) {
  return atom === HORIZONTAL_FLOW_ATOM_ID
    ? createHorizontalFlowSpec(nodeNumber)
    : createFrameSpec(nodeNumber);
}

function dragAtom(drag) {
  return drag?.atom ?? null;
}

const LAYOUT_SETTING_FIELDS = Object.freeze([
  {
    key: "horizontalFlowSpacing",
    label: "Flow spacing",
    anchor: "layout_setting_horizontal_flow_spacing"
  },
  {
    key: "horizontalFlowMinimumWidth",
    label: "Min width",
    anchor: "layout_setting_horizontal_flow_min_width"
  },
  {
    key: "nestedHorizontalFlowMinimumWidth",
    label: "Nested min width",
    anchor: "layout_setting_nested_horizontal_flow_min_width"
  },
  {
    key: "horizontalFlowMinimumHeight",
    label: "Min height",
    anchor: "layout_setting_horizontal_flow_min_height"
  },
  {
    key: "horizontalFlowPadding",
    label: "Padding",
    anchor: "layout_setting_horizontal_flow_padding"
  }
]);

function LayoutSettingsPanel({
  expanded,
  onToggle,
  settings,
  onChange,
  onReset,
  showComponentTreeShell,
  onShowComponentTreeShellChange
}) {
  const normalizedSettings = normalizeLayoutSettings(settings);
  const ToggleIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <FxFrame className="fx-editor-panel fx-layout-settings" data-anchor="layout_settings_panel">
      <button
        aria-expanded={expanded}
        className="fx-layout-settings__toggle"
        data-anchor="layout_settings_toggle"
        onClick={onToggle}
        type="button"
      >
        <SlidersHorizontal aria-hidden="true" />
        <span>Settings</span>
        <ToggleIcon aria-hidden="true" />
      </button>
      {expanded ? (
        <>
          <FxCheckbox
            checked={showComponentTreeShell}
            data-anchor="component_tree_shell_toggle"
            readOnly={false}
            onChange={onShowComponentTreeShellChange}
          >
            Show generated Window shell
          </FxCheckbox>
          <div className="fx-layout-settings__grid">
            {LAYOUT_SETTING_FIELDS.map((field) => {
              const limits = LAYOUT_SETTING_LIMITS[field.key];
              return (
                <label className="fx-field" data-anchor={field.anchor} key={field.key}>
                  <span>{field.label}</span>
                  <FxTextInput
                    max={limits.max}
                    min={limits.min}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    step="1"
                    type="number"
                    value={normalizedSettings[field.key]}
                  />
                </label>
              );
            })}
          </div>
          <div className="fx-actions">
            <FxButton
              disabled={isDefaultLayoutSettings(normalizedSettings)}
              onClick={onReset}
            >
              Reset defaults
            </FxButton>
          </div>
        </>
      ) : null}
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
  const [errorMessage, setErrorMessage] = useState(null);
  const editRef = useRef(null);
  const cancelEditRef = useRef(false);
  const errorId = useId();
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
    editable ? "is-editable" : "",
    errorMessage ? "has-error" : ""
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
    setErrorMessage(null);
    setEditing(true);
  }

  function commitEdit() {
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      return;
    }

    const result = onEdit?.(editable, draftValue);
    if (result?.ok === false) {
      setErrorMessage(result.message ?? "Invalid value.");
      window.setTimeout(() => editRef.current?.focus(), 0);
      return;
    }

    setErrorMessage(null);
    setEditing(false);
  }

  function cancelEdit() {
    cancelEditRef.current = true;
    setDraftValue(stringValue);
    setErrorMessage(null);
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
            aria-describedby={errorMessage ? errorId : undefined}
            aria-label={`Edit ${label}`}
            aria-invalid={errorMessage ? "true" : undefined}
            className={`fx-inspector-row__edit fx-inspector-row__value--${tone}`}
            onBlur={commitEdit}
            onChange={(event) => {
              setDraftValue(event.target.value);
              setErrorMessage(null);
            }}
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
      {errorMessage ? (
        <span className="fx-inspector-row__error" id={errorId} role="alert">
          {errorMessage}
        </span>
      ) : null}
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
    </div>
  );
}

export function EditorPage() {
  const [editorState, setEditorState] = useState(readCachedEditorState);
  const [inspectorHistory, setInspectorHistory] = useState({ back: [], forward: [] });
  const [inspectorPreview, setInspectorPreview] = useState(null);
  const [builderDrag, setBuilderDrag] = useState(null);
  const [builderDropTarget, setBuilderDropTarget] = useState(null);
  const [resizeDraft, setResizeDraft] = useState(null);
  const shellRef = useRef(null);
  const sidebarResizeRef = useRef(null);
  const {
    title,
    windowSize,
    windowBodyDirection,
    currentWindow,
    showInspector,
    showLuaOutput,
    showGuiShadows,
    resizeMode,
    inspectorLocked,
    inspectedAnchor,
    showLayoutSettings,
    showComponentTreeShell,
    layoutSettings,
    sidebarWidth
  } = editorState;
  const normalizedLayoutSettings = normalizeLayoutSettings(layoutSettings);
  const previewWindow = currentWindowWithResizeDraft(currentWindow, resizeDraft);
  const currentModel = previewWindow
    ? createWindowModel({
        ...previewWindow,
        layoutSettings: normalizedLayoutSettings
      })
    : null;
  const selectedBodyDirection = normalizeWindowBodyDirection(windowBodyDirection);

  useEffect(() => {
    writeCachedEditorState(editorState);
  }, [editorState]);

  useEffect(() => {
    if (!builderDrag) {
      return undefined;
    }

    function handleNativeDragEnd() {
      clearBuilderDrag();
    }

    window.addEventListener("dragend", handleNativeDragEnd);
    return () => {
      window.removeEventListener("dragend", handleNativeDragEnd);
    };
  }, [builderDrag]);

  function createWindow() {
    setInspectorHistory({ back: [], forward: [] });
    setInspectorPreview(null);
    setResizeDraft(null);
    setEditorState((state) => {
      const layoutState = normalizeLayoutState(state.currentWindow ?? {});
      const currentWindow = {
        title: windowTitle(state.title),
        location: state.currentWindow?.location ?? null,
        size: normalizeWindowSize(state.windowSize),
        bodyDirection: normalizeWindowBodyDirection(state.windowBodyDirection),
        ...layoutState
      };
      return {
        ...state,
        currentWindow: {
          ...currentWindow,
          luaVariableNames: normalizeWindowLuaVariableNames({
            ...currentWindow,
            luaVariableNames: state.currentWindow?.luaVariableNames
          })
        },
        inspectorLocked: false,
        inspectedAnchor: BODY_LAYOUT_ROOT_ID
      };
    });
  }

  function updateWindowBodyDirection(direction) {
    setEditorState((state) => ({
      ...state,
      windowBodyDirection: normalizeWindowBodyDirection(direction)
    }));
  }

  function resetWindow() {
    setInspectorHistory({ back: [], forward: [] });
    setInspectorPreview(null);
    setBuilderDrag(null);
    setBuilderDropTarget(null);
    setResizeDraft(null);
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

  function updateGuiShadowsEnabled(event) {
    setEditorState((state) => ({
      ...state,
      showGuiShadows: event.target.checked
    }));
  }

  function updateResizeModeEnabled(event) {
    const enabled = event.target.checked;
    setResizeDraft(null);
    setEditorState((state) => ({
      ...state,
      resizeMode: enabled,
      inspectedAnchor:
        enabled && state.currentWindow && !state.inspectedAnchor
          ? "gui_window"
          : state.inspectedAnchor,
      inspectorLocked:
        enabled && state.currentWindow && !state.inspectedAnchor
          ? true
          : state.inspectorLocked
    }));
  }

  function commitResizeDraft(draft) {
    setResizeDraft(null);
    if (!draft?.anchor) {
      return;
    }

    setEditorState((state) => {
      if (!state.currentWindow) {
        return state;
      }

      if (draft.kind === "window" && draft.anchor === "gui_window") {
        const nextSize = normalizeWindowSize(draft.size);
        return {
          ...state,
          windowSize: nextSize,
          currentWindow: {
            ...state.currentWindow,
            size: nextSize
          }
        };
      }

      if (draft.kind !== "layout-node") {
        return state;
      }

      const layoutState = normalizeLayoutState(state.currentWindow);
      const update = updateLayoutNodeSize(
        layoutState.layoutChildren,
        draft.anchor,
        draft.size
      );
      if (!update.changed) {
        return state;
      }

      const currentWindow = {
        ...state.currentWindow,
        layoutChildren: update.layoutChildren,
        nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber
      };

      return {
        ...state,
        currentWindow: {
          ...currentWindow,
          luaVariableNames: normalizeWindowLuaVariableNames(currentWindow)
        }
      };
    });
  }

  function updateComponentTreeShellVisible(event) {
    setEditorState((state) => ({
      ...state,
      showComponentTreeShell: event.target.checked
    }));
  }

  function updateLayoutSetting(key, value) {
    setEditorState((state) => ({
      ...state,
      layoutSettings: normalizeLayoutSettings({
        ...state.layoutSettings,
        [key]: value
      })
    }));
  }

  function resetLayoutSettings() {
    setEditorState((state) => ({
      ...state,
      layoutSettings: DEFAULT_LAYOUT_SETTINGS
    }));
  }

  function toggleLayoutSettings() {
    setEditorState((state) => ({
      ...state,
      showLayoutSettings: !state.showLayoutSettings
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

  function clearInspectorPreview() {
    setInspectorPreview(null);
  }

  function updateInspectorEditableValue(editable, value) {
    if (editable?.field !== "title") {
      return { ok: true };
    }

    setEditorState((state) => ({
      ...state,
      title: value,
      currentWindow: state.currentWindow
        ? { ...state.currentWindow, title: windowTitle(value) }
        : state.currentWindow
    }));

    return { ok: true };
  }

  function updateLuaVariableName(nodeId, value) {
    const validation = validateLuaVariableNameEdit(value, {
      nodeId,
      nodeIds: collectWindowLuaVariableNodeIds(currentWindow),
      luaVariableNames: currentWindow?.luaVariableNames
    });

    if (!validation.ok) {
      return validation;
    }

    setEditorState((state) => {
      if (!state.currentWindow) {
        return state;
      }

      const nextValidation = validateLuaVariableNameEdit(value, {
        nodeId,
        nodeIds: collectWindowLuaVariableNodeIds(state.currentWindow),
        luaVariableNames: state.currentWindow.luaVariableNames
      });
      if (!nextValidation.ok) {
        return state;
      }

      return {
        ...state,
        currentWindow: {
          ...state.currentWindow,
          luaVariableNames: nextValidation.luaVariableNames
        }
      };
    });

    return { ok: true };
  }

  function selectBuilderNode(nodeId) {
    selectInspectorComponent(nodeId);
  }

  function normalizeDropTarget(
    target,
    drag = builderDrag,
    layoutChildren = currentWindow?.layoutChildren ?? []
  ) {
    if (
      !target ||
      !drag ||
      !canDropLayoutNode(
        layoutChildren,
        null,
        target.parentId,
        dragAtom(drag)
      )
    ) {
      return null;
    }

    const parentChildren = findLayoutParentChildren(layoutChildren, target.parentId);
    if (!parentChildren) {
      return null;
    }

    const index = Math.min(
      Math.max(0, Math.round(Number(target.index) || 0)),
      parentChildren.length
    );

    return { parentId: target.parentId, index, surface: target.surface };
  }

  function updateBuilderDropTarget(target, drag = builderDrag) {
    if (!drag || !currentWindow) {
      return false;
    }

    const normalizedTarget = normalizeDropTarget(target, drag);
    if (normalizedTarget) {
      setBuilderDropTarget(normalizedTarget);
      return true;
    }

    return false;
  }

  function clearBuilderDrag() {
    setBuilderDrag(null);
    setBuilderDropTarget(null);
  }

  function handlePaletteDragStart(drag) {
    if (!drag || !currentWindow) {
      clearBuilderDrag();
      return;
    }

    setResizeDraft(null);
    setBuilderDrag(drag);
    setBuilderDropTarget(null);
  }

  function handleCanvasDropTargetOver(target, event) {
    const drag = readBuilderPaletteDrag(event?.dataTransfer, false) ?? builderDrag;

    if (!drag) {
      return false;
    }

    return updateBuilderDropTarget(target, drag);
  }

  function handleCanvasDrop(target, event) {
    const drag = readBuilderPaletteDrag(event?.dataTransfer, true) ?? builderDrag;
    return commitBuilderDrop(target, drag);
  }

  function applyLayoutUpdate(updater) {
    setInspectorPreview(null);
    setResizeDraft(null);
    setEditorState((state) => {
      if (!state.currentWindow) {
        return state;
      }

      const layoutState = normalizeLayoutState(state.currentWindow);
      const result = updater(layoutState);
      if (!result?.changed) {
        return state;
      }

      const currentWindow = {
        ...state.currentWindow,
        layoutChildren: result.layoutChildren,
        nextLayoutNodeNumber: result.nextLayoutNodeNumber ?? layoutState.nextLayoutNodeNumber
      };

      return {
        ...state,
        inspectedAnchor: result.selectedAnchor ?? state.inspectedAnchor,
        inspectorLocked: result.selectedAnchor ? true : state.inspectorLocked,
        currentWindow: {
          ...currentWindow,
          luaVariableNames: normalizeWindowLuaVariableNames(currentWindow)
        }
      };
    });
  }

  function addLayoutNode(parentId = BODY_LAYOUT_ROOT_ID, index = Infinity, requestedAtom = null) {
    applyLayoutUpdate((layoutState) => {
      const atom =
        requestedAtom ??
        acceptedLayoutChildAtom(layoutState.layoutChildren, parentId) ??
        FRAME_ATOM_ID;
      const node = createSpecForAtom(atom, layoutState.nextLayoutNodeNumber);
      const insertion = insertLayoutNode(layoutState.layoutChildren, parentId, index, node);
      return {
        ...insertion,
        selectedAnchor: node.id,
        nextLayoutNodeNumber: insertion.changed
          ? layoutState.nextLayoutNodeNumber + 1
          : layoutState.nextLayoutNodeNumber
      };
    });
  }

  function addLayoutNodeAfter(nodeId) {
    const match = findLayoutNode(currentWindow?.layoutChildren ?? [], nodeId);
    if (!match) {
      return;
    }

    addLayoutNode(match.parentId, match.index + 1, match.node.atom);
  }

  function addLayoutNodeChild(nodeId) {
    const children = findLayoutParentChildren(currentWindow?.layoutChildren ?? [], nodeId);
    addLayoutNode(nodeId, children?.length ?? Infinity);
  }

  function insertPaletteLayoutNode(parentId, index, requestedAtom) {
    addLayoutNode(parentId, index, requestedAtom);
  }

  function moveLayoutNodeFromTree(sourceId, parentId, index) {
    applyLayoutUpdate((layoutState) => {
      const movement = moveLayoutNode(
        layoutState.layoutChildren,
        sourceId,
        parentId,
        index
      );
      return {
        ...movement,
        selectedAnchor: sourceId,
        nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber
      };
    });
  }

  function removeLayoutSubtree(nodeId) {
    applyLayoutUpdate((layoutState) => {
      const removal = removeLayoutNode(layoutState.layoutChildren, nodeId);
      return {
        ...removal,
        selectedAnchor: BODY_LAYOUT_ROOT_ID,
        nextLayoutNodeNumber: layoutState.nextLayoutNodeNumber
      };
    });
  }

  function commitBuilderDrop(target = builderDropTarget, drag = builderDrag) {
    if (!drag) {
      return false;
    }

    const normalizedTarget = normalizeDropTarget(target, drag);
    if (!normalizedTarget) {
      return false;
    }

    applyLayoutUpdate((layoutState) => {
      const currentTarget = normalizeDropTarget(normalizedTarget, drag, layoutState.layoutChildren);
      if (!currentTarget) {
        return { changed: false };
      }

      if (drag.kind === "palette") {
        const node = createSpecForAtom(drag.atom, layoutState.nextLayoutNodeNumber);
        const insertion = insertLayoutNode(
          layoutState.layoutChildren,
          currentTarget.parentId,
          currentTarget.index,
          node
        );
        return {
          ...insertion,
          selectedAnchor: node.id,
          nextLayoutNodeNumber: insertion.changed
            ? layoutState.nextLayoutNodeNumber + 1
            : layoutState.nextLayoutNodeNumber
        };
      }

      return { changed: false };
    });

    clearBuilderDrag();
    return true;
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
            <div className="fx-window-create-row">
              <FxButton id="create-window" onClick={createWindow}>
                {currentWindow ? "Recreate window" : "Create window"}
              </FxButton>
              <div className="fx-body-direction-toggle" role="group" aria-label="Default body flow">
                <button
                  aria-pressed={selectedBodyDirection === HORIZONTAL_FLOW_DIRECTION}
                  className={selectedBodyDirection === HORIZONTAL_FLOW_DIRECTION ? "is-active" : ""}
                  onClick={() => updateWindowBodyDirection(HORIZONTAL_FLOW_DIRECTION)}
                  type="button"
                >
                  Horizontal
                </button>
                <button
                  aria-pressed={selectedBodyDirection === VERTICAL_FLOW_DIRECTION}
                  className={selectedBodyDirection === VERTICAL_FLOW_DIRECTION ? "is-active" : ""}
                  onClick={() => updateWindowBodyDirection(VERTICAL_FLOW_DIRECTION)}
                  type="button"
                >
                  Vertical
                </button>
              </div>
            </div>
            <div className="fx-actions">
              <FxButton id="reset-window" disabled={!currentWindow} onClick={resetWindow}>
                Reset
              </FxButton>
            </div>
          </FxFrame>

          <BuilderPanel
            currentWindow={currentWindow}
            inspectedAnchor={inspectedAnchor}
            onAddAfter={addLayoutNodeAfter}
            onAddChild={addLayoutNodeChild}
            onEditLuaVariableName={updateLuaVariableName}
            onInsertPalette={insertPaletteLayoutNode}
            onMoveNode={moveLayoutNodeFromTree}
            onPaletteDragEnd={clearBuilderDrag}
            onPaletteDragStart={handlePaletteDragStart}
            onRemove={removeLayoutSubtree}
            paletteDraggingAtom={builderDrag?.kind === "palette" ? builderDrag.atom : null}
            onSelect={selectBuilderNode}
            model={currentModel}
            showGeneratedShell={showComponentTreeShell}
          />

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
            <FxCheckbox
              checked={showGuiShadows}
              data-anchor="gui_shadow_toggle"
              readOnly={false}
              onChange={updateGuiShadowsEnabled}
            >
              GUI shadows
            </FxCheckbox>
            <FxCheckbox
              checked={resizeMode}
              data-anchor="resize_mode_toggle"
              readOnly={false}
              onChange={updateResizeModeEnabled}
            >
              Resize mode
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
          <LayoutSettingsPanel
            expanded={showLayoutSettings}
            onChange={updateLayoutSetting}
            onReset={resetLayoutSettings}
            onShowComponentTreeShellChange={updateComponentTreeShellVisible}
            onToggle={toggleLayoutSettings}
            settings={normalizedLayoutSettings}
            showComponentTreeShell={showComponentTreeShell}
          />
        </aside>

        <section className="fx-editor-stage" aria-label="Editor canvas">
          <div id="editor-root">
            <EditorCanvas
              currentWindow={previewWindow}
              model={currentModel}
              inspectorActive={showInspector}
              selectionActive={showInspector || resizeMode}
              inspectorLocked={inspectorLocked}
              inspectedAnchor={inspectedAnchor}
              inspectorPreview={inspectorPreview}
              onInspect={updateInspectedAnchor}
              onInspectClear={clearHoveredInspection}
              onInspectLock={lockInspectedAnchor}
              onBuilderDrop={handleCanvasDrop}
              onBuilderDropTargetOver={handleCanvasDropTargetOver}
              onResizeCancel={() => setResizeDraft(null)}
              onResizeCommit={commitResizeDraft}
              onResizeDraft={setResizeDraft}
              onWindowLocationChange={updateWindowLocation}
              builderDragActive={Boolean(builderDrag)}
              builderDropTarget={builderDropTarget}
              resizeMode={resizeMode}
              shadowsVisible={showGuiShadows}
            />
          </div>
        </section>
        {showLuaOutput ? <LuaOutput model={currentModel} /> : null}
      </main>
  );
}

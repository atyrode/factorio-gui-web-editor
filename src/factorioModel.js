export const FACTORIO_GUI_MODEL_SCHEMA = "factorio-gui-layout.v0";
export const FACTORIO_NOT_IMPLEMENTED = "not implemented";

const FRAME_GRAPHICAL_BORDER = 6;
const FRAME_CLIP_TOP_OVERFLOW = 4;
export const HORIZONTAL_FLOW_DIRECTION = "horizontal";
export const DEFAULT_WINDOW_REFERENCE_ID = "editor-default-window";
export const DEFAULT_WINDOW_SIZE = Object.freeze({ width: 680, height: 480 });
export const WINDOW_SIZE_LIMITS = Object.freeze({
  minWidth: 320,
  maxWidth: 1600,
  minHeight: 180,
  maxHeight: 1200
});

function freezeSize(size) {
  return Object.freeze({ width: size.width, height: size.height });
}

function clampInteger(value, min, max, fallback) {
  const numberValue = Number(value);
  const safeValue = Number.isFinite(numberValue) ? numberValue : fallback;
  return Math.min(max, Math.max(min, Math.round(safeValue)));
}

export function normalizeWindowSize(size = DEFAULT_WINDOW_SIZE) {
  return freezeSize({
    width: clampInteger(
      size?.width,
      WINDOW_SIZE_LIMITS.minWidth,
      WINDOW_SIZE_LIMITS.maxWidth,
      DEFAULT_WINDOW_SIZE.width
    ),
    height: clampInteger(
      size?.height,
      WINDOW_SIZE_LIMITS.minHeight,
      WINDOW_SIZE_LIMITS.maxHeight,
      DEFAULT_WINDOW_SIZE.height
    )
  });
}

function freezeOptionalSize(size) {
  return size ? freezeSize(size) : null;
}

function freezeRectangle(rectangle) {
  return Object.freeze({
    offset: Object.freeze({ x: rectangle.offset.x, y: rectangle.offset.y }),
    size: freezeSize(rectangle.size)
  });
}

function freezeOptionalRectangle(rectangle) {
  return rectangle ? freezeRectangle(rectangle) : null;
}

function freezeVector(vector) {
  return Object.freeze({ x: vector.x, y: vector.y });
}

function freezeVectorList(vectors = []) {
  return Object.freeze(vectors.map((vector) => freezeVector(vector)));
}

function freezeCaptureRows(rows = []) {
  return Object.freeze(rows.map((row) => Object.freeze({ ...row })));
}

function freezeStyleVariant(variant) {
  return Object.freeze({
    ...variant,
    capturedSize: freezeOptionalSize(variant.capturedSize)
  });
}

export const horizontalFlowStyleVariants = Object.freeze({
  frameHeader: freezeStyleVariant({
    id: "frame-header-flow",
    role: "window-titlebar",
    className: "agui::HorizontalFlow",
    style: "frame_header_flow",
    styleDescription: "Part of frame definition",
    derivedFrom: "frame_header_flow",
    horizontalSpacing: 12,
    inheritedHorizontalSpacing: 6,
    bottomPadding: 6,
    horizontallyStretchable: true,
    verticallyStretchable: false,
    ignoredBySearch: true,
    captureId: "blueprint-library-header-flow"
  }),
  insetFrameContainer: freezeStyleVariant({
    id: "inset-frame-container-horizontal-flow",
    role: "window-body",
    className: "agui::HorizontalFlow",
    style: "inset_frame_container_horizontal_flow",
    styleDescription: "Part of inset_frame_container_frame definition",
    derivedFrom: "inset_frame_container_horizontal_flow",
    horizontalSpacing: 18,
    inheritedHorizontalSpacing: 6,
    captureId: "blueprint-library-content-flow"
  }),
  headerActionGroup: freezeStyleVariant({
    id: "header-action-group-flow",
    role: "header-action-group",
    className: "agui::HorizontalFlow",
    style: null,
    styleDescription: "Captured child role; exact style not implemented yet",
    derivedFrom: "horizontal_flow",
    capturedSize: { width: 72, height: 36 },
    captureId: "blueprint-library-header-flow"
  })
});

function freezeHorizontalFlowStyleReference(styleReference = {}) {
  return Object.freeze({
    ...styleReference,
    direction: HORIZONTAL_FLOW_DIRECTION,
    horizontalSpacing: styleReference.horizontalSpacing ?? null,
    inheritedHorizontalSpacing: styleReference.inheritedHorizontalSpacing ?? null,
    verticalSpacing: styleReference.verticalSpacing ?? null,
    inheritedVerticalSpacing: styleReference.inheritedVerticalSpacing ?? null,
    bottomPadding: styleReference.bottomPadding ?? null,
    horizontallyStretchable: styleReference.horizontallyStretchable ?? null,
    verticallyStretchable: styleReference.verticallyStretchable ?? null,
    ignoredBySearch: styleReference.ignoredBySearch ?? null,
    maximumVerticalSquashSize: styleReference.maximumVerticalSquashSize ?? null
  });
}

export function createHorizontalFlowNode({
  id,
  className = "agui::HorizontalFlow",
  style,
  styleDescription = null,
  derivedFrom = "horizontal_flow",
  role = null,
  referenceSize = null,
  styleReference = {},
  children = []
}) {
  return {
    id,
    primitive: "flow",
    className,
    style,
    styleDescription,
    derivedFrom,
    direction: HORIZONTAL_FLOW_DIRECTION,
    role,
    referenceSize: referenceSize ? { ...referenceSize } : undefined,
    styleReference: freezeHorizontalFlowStyleReference({
      role,
      ...styleReference
    }),
    children
  };
}

function freezeHeaderChildCapture(child = null) {
  if (!child) {
    return null;
  }

  return Object.freeze({
    ...child,
    relative: child.relative ? freezeVector(child.relative) : null,
    capturedSize: freezeOptionalSize(child.capturedSize),
    capturedContentSize: freezeOptionalSize(child.capturedContentSize),
    capturedClipSize: freezeOptionalRectangle(child.capturedClipSize),
    capturedSizeBeforeStretching: freezeOptionalSize(child.capturedSizeBeforeStretching)
  });
}

function freezeHeaderCapture(header = null) {
  if (!header) {
    return Object.freeze({
      childRows: Object.freeze([]),
      optionalSlotRows: Object.freeze([])
    });
  }

  return Object.freeze({
    className: header.className ?? "agui::HorizontalFlow",
    style: header.style ?? "frame_header_flow",
    styleDescription: header.styleDescription ?? "Part of frame definition",
    derivedFrom: header.derivedFrom ?? "frame_header_flow",
    relative: freezeVector(header.relative ?? { x: 0, y: 0 }),
    capturedSize: freezeOptionalSize(header.capturedSize),
    capturedContentSize: freezeOptionalSize(header.capturedContentSize),
    capturedClipSize: freezeOptionalRectangle(header.capturedClipSize),
    capturedSizeBeforeStretching: freezeOptionalSize(header.capturedSizeBeforeStretching),
    maximumHorizontalSquashSize: header.maximumHorizontalSquashSize ?? null,
    maximumVerticalSquashSize: header.maximumVerticalSquashSize ?? 0,
    horizontalSpacing: header.horizontalSpacing ?? 12,
    inheritedHorizontalSpacing: header.inheritedHorizontalSpacing ?? 6,
    bottomPadding: header.bottomPadding ?? 6,
    horizontallyStretchable: header.horizontallyStretchable ?? true,
    verticallyStretchable: header.verticallyStretchable ?? false,
    ignoredBySearch: header.ignoredBySearch ?? true,
    titleLabel: freezeHeaderChildCapture(header.titleLabel),
    dragHandle: freezeHeaderChildCapture(header.dragHandle),
    childRows: freezeCaptureRows(header.childRows),
    optionalSlotRows: freezeCaptureRows(header.optionalSlotRows)
  });
}

function frameContentSize({
  outerSize,
  graphicalBorder = FRAME_GRAPHICAL_BORDER,
  topPadding,
  rightPadding,
  bottomPadding,
  leftPadding
}) {
  return freezeSize({
    width: outerSize.width - graphicalBorder * 2 - leftPadding - rightPadding,
    height: outerSize.height - graphicalBorder * 2 - topPadding - bottomPadding
  });
}

function windowReferenceWithAuthoredSize(reference, size) {
  if (!size) {
    return reference;
  }

  const capturedSize = normalizeWindowSize(size);
  const capturedContentSize = frameContentSize({
    outerSize: capturedSize,
    graphicalBorder: FRAME_GRAPHICAL_BORDER,
    topPadding: reference.padding.top,
    rightPadding: reference.padding.right,
    bottomPadding: reference.padding.bottom,
    leftPadding: reference.padding.left
  });
  const capturedClipSize = frameClipSize({ outerSize: capturedSize });
  const titlebarHeight = reference.header.capturedSize?.height ?? 48;
  const bodySize = freezeSize({
    width: capturedContentSize.width,
    height: Math.max(0, capturedContentSize.height - titlebarHeight)
  });

  return Object.freeze({
    ...reference,
    referenceTitle: null,
    captureContext: Object.freeze({
      ...(reference.captureContext ?? {}),
      source: "editor-authored size"
    }),
    capturedSize,
    capturedContentSize,
    capturedClipSize,
    capturedSizeBeforeStretching: capturedSize,
    capturedMaximalHeight: null,
    maximumHorizontalSquashSize: 0,
    maximumVerticalSquashSize: 0,
    header: freezeHeaderCapture({
      className: reference.header.className,
      style: reference.header.style,
      styleDescription: reference.header.styleDescription,
      derivedFrom: reference.header.derivedFrom,
      relative: reference.header.relative,
      capturedSize: { width: capturedContentSize.width, height: titlebarHeight },
      capturedContentSize: {
        width: capturedContentSize.width,
        height: reference.header.capturedContentSize?.height ?? 42
      },
      capturedClipSize: {
        offset: { x: 0, y: -FRAME_CLIP_TOP_OVERFLOW },
        size: {
          width: capturedContentSize.width,
          height: titlebarHeight + FRAME_CLIP_TOP_OVERFLOW
        }
      },
      capturedSizeBeforeStretching: null,
      maximumHorizontalSquashSize: null,
      maximumVerticalSquashSize: 0,
      horizontalSpacing: reference.header.horizontalSpacing,
      inheritedHorizontalSpacing: reference.header.inheritedHorizontalSpacing,
      bottomPadding: reference.header.bottomPadding,
      horizontallyStretchable: reference.header.horizontallyStretchable,
      verticallyStretchable: reference.header.verticallyStretchable,
      ignoredBySearch: reference.header.ignoredBySearch
    }),
    body: Object.freeze({
      ...reference.body,
      capturedSize: bodySize,
      capturedContentSize: bodySize,
      capturedClipSize: freezeRectangle({
        offset: { x: 0, y: 0 },
        size: bodySize
      }),
      capturedSizeBeforeStretching: bodySize,
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: 0,
      childRows: Object.freeze([...(reference.body.childRows ?? [])])
    })
  });
}

function frameClipSize({
  outerSize,
  clipTopOverflow = FRAME_CLIP_TOP_OVERFLOW
}) {
  return freezeRectangle({
    offset: { x: 0, y: -clipTopOverflow },
    size: {
      width: outerSize.width,
      height: outerSize.height + clipTopOverflow
    }
  });
}

function windowReferenceCapture({
  id,
  label,
  referenceTitle = label,
  captureContext = null,
  rootRelativeSamples = [],
  className,
  style,
  derivedFrom = "frame",
  capturedSize,
  capturedContentSize,
  capturedClipSize,
  capturedSizeBeforeStretching = capturedSize,
  capturedMaximalHeight = null,
  maximumHorizontalSquashSize = 0,
  maximumVerticalSquashSize,
  padding,
  useHeaderFiller = true,
  header = null,
  body
}) {
  return Object.freeze({
    id,
    label,
    referenceTitle,
    captureContext: captureContext ? Object.freeze({ ...captureContext }) : null,
    rootRelativeSamples: freezeVectorList(rootRelativeSamples),
    className,
    style,
    derivedFrom,
    capturedSize: freezeSize(capturedSize),
    capturedContentSize: freezeSize(capturedContentSize),
    capturedClipSize: freezeRectangle(capturedClipSize),
    capturedSizeBeforeStretching: freezeSize(capturedSizeBeforeStretching),
    capturedMaximalHeight,
    maximumHorizontalSquashSize,
    maximumVerticalSquashSize,
    padding: Object.freeze({ ...padding }),
    useHeaderFiller,
    header: freezeHeaderCapture(header),
    body: Object.freeze({
      ...body,
      relative: freezeVector(body.relative ?? { x: 0, y: 48 }),
      capturedSize: freezeSize(body.capturedSize),
      capturedContentSize: freezeOptionalSize(body.capturedContentSize ?? body.capturedSize),
      capturedClipSize: freezeOptionalRectangle(
        body.capturedClipSize ?? {
          offset: { x: 0, y: 0 },
          size: body.capturedSize
        }
      ),
      capturedSizeBeforeStretching: freezeOptionalSize(
        body.capturedSizeBeforeStretching ?? body.capturedSize
      ),
      childRows: Object.freeze([...(body.childRows ?? [])])
    })
  });
}

export const windowReferenceCaptures = Object.freeze([
  windowReferenceCapture({
    id: "editor-default-window",
    label: "Editor default Window",
    referenceTitle: "Untitled window",
    captureContext: {
      source: "editor-authored default"
    },
    className: "agui::Window",
    style: "inset_frame_container_frame",
    capturedSize: { width: 680, height: 480 },
    capturedContentSize: { width: 644, height: 450 },
    capturedClipSize: {
      offset: { x: 0, y: -4 },
      size: { width: 680, height: 484 }
    },
    maximumVerticalSquashSize: 0,
    padding: { top: 6, right: 12, bottom: 12, left: 12 },
    body: {
      className: "agui::HorizontalFlow",
      style: "inset_frame_container_horizontal_flow",
      styleDescription: "Part of inset_frame_container_frame definition",
      derivedFrom: "inset_frame_container_horizontal_flow",
      direction: "horizontal",
      relative: { x: 0, y: 48 },
      capturedSize: { width: 644, height: 402 },
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: 0,
      horizontalSpacing: 18,
      inheritedHorizontalSpacing: 6,
      verticalSpacing: null,
      inheritedVerticalSpacing: null,
      childRows: []
    }
  }),
  windowReferenceCapture({
    id: "blueprint-library-window",
    label: "Blueprint Library Window",
    referenceTitle: "Blueprint library",
    captureContext: {
      uiScale: "Manual (pixels) 150%"
    },
    rootRelativeSamples: [{ x: 0, y: 0 }],
    className: "agui::Window",
    style: "inset_frame_container_frame",
    capturedSize: { width: 1476, height: 870 },
    capturedContentSize: { width: 1440, height: 840 },
    capturedClipSize: {
      offset: { x: 0, y: -4 },
      size: { width: 1476, height: 874 }
    },
    maximumVerticalSquashSize: 540,
    padding: { top: 6, right: 12, bottom: 12, left: 12 },
    header: {
      className: "agui::HorizontalFlow",
      style: "frame_header_flow",
      styleDescription: "Part of frame definition",
      derivedFrom: "frame_header_flow",
      relative: { x: 0, y: 0 },
      capturedSize: { width: 1440, height: 48 },
      capturedContentSize: { width: 1440, height: 42 },
      capturedClipSize: {
        offset: { x: 0, y: -4 },
        size: { width: 1440, height: 52 }
      },
      capturedSizeBeforeStretching: { width: 395, height: 48 },
      maximumHorizontalSquashSize: 1236,
      maximumVerticalSquashSize: 0,
      horizontalSpacing: 12,
      inheritedHorizontalSpacing: 6,
      bottomPadding: 6,
      horizontallyStretchable: true,
      verticallyStretchable: false,
      ignoredBySearch: true,
      titleLabel: {
        className: "agui::Label",
        style: "frame_title",
        relative: { x: 0, y: -4 },
        capturedSize: { width: 191, height: 46 },
        capturedContentSize: { width: 191, height: 42 },
        capturedClipSize: {
          offset: { x: 0, y: 0 },
          size: { width: 191, height: 46 }
        },
        capturedSizeBeforeStretching: { width: 191, height: 46 },
        maximumHorizontalSquashSize: 191,
        maximumVerticalSquashSize: 0
      },
      dragHandle: {
        className: "agui::Filler",
        style: "draggable_space_header",
        relative: { x: 209, y: 0 },
        capturedSize: { width: 1045, height: 36 },
        capturedContentSize: { width: 1045, height: 36 },
        capturedClipSize: {
          offset: { x: 0, y: 0 },
          size: { width: 1045, height: 36 }
        },
        capturedSizeBeforeStretching: { width: 0, height: 36 },
        maximumHorizontalSquashSize: 1045,
        maximumVerticalSquashSize: 0
      },
      childRows: [
        { role: "title", label: "class agui::Label", value: "191 x 46" },
        { role: "filler", label: "class agui::Filler", value: "1045 x 36" },
        { role: "slot", label: "class SearchBar", value: "36 x 36" },
        {
          role: "slot",
          label: "class agui::HorizontalFlow",
          value: "72 x 36",
          note: "Browse-arrow group"
        },
        { role: "slot", label: "class CloseButton", value: "36 x 36" }
      ],
      optionalSlotRows: [
        {
          className: "SearchBar",
          style: "frame_action_button",
          relative: "[1272, 0]",
          size: "36 x 36",
          contentSize: "24 x 24"
        },
        {
          className: "agui::HorizontalFlow",
          style: "frame_header_flow",
          relative: "[1320, 0]",
          size: "72 x 36",
          note: "Browse-arrow group inferred from spacing between SearchBar and CloseButton"
        },
        {
          className: "CloseButton",
          style: "close_button",
          relative: "[1404, 0]",
          size: "36 x 36",
          contentSize: "24 x 24"
        }
      ]
    },
    body: {
      className: "agui::HorizontalFlow",
      style: "inset_frame_container_horizontal_flow",
      styleDescription: "Part of inset_frame_container_frame definition",
      derivedFrom: "inset_frame_container_horizontal_flow",
      direction: "horizontal",
      relative: { x: 0, y: 48 },
      capturedSize: { width: 1440, height: 792 },
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: 540,
      horizontalSpacing: 18,
      inheritedHorizontalSpacing: 6,
      verticalSpacing: null,
      inheritedVerticalSpacing: null,
      childRows: [
        { label: "class agui::Frame", value: FACTORIO_NOT_IMPLEMENTED },
        { label: "class FrameWithSubheader", value: FACTORIO_NOT_IMPLEMENTED },
        { label: "class agui::VerticalFlow", value: FACTORIO_NOT_IMPLEMENTED }
      ]
    }
  }),
  windowReferenceCapture({
    id: "factoriopedia-root-window",
    label: "Factoriopedia root Window",
    referenceTitle: "Factoriopedia",
    captureContext: {
      uiScale: "Manual (pixels) 150%"
    },
    rootRelativeSamples: [
      { x: 289, y: 18 },
      { x: 388, y: 106 },
      { x: 382, y: 220 },
      { x: 1142, y: 315 }
    ],
    className: "Factoriopedia",
    style: "inset_frame_container_frame",
    capturedSize: { width: 1341, height: 973 },
    capturedContentSize: { width: 1305, height: 943 },
    capturedClipSize: {
      offset: { x: 0, y: -4 },
      size: { width: 1341, height: 977 }
    },
    capturedMaximalHeight: 973,
    maximumVerticalSquashSize: 619,
    padding: { top: 6, right: 12, bottom: 12, left: 12 },
    body: {
      className: "agui::HorizontalFlow",
      style: "inset_frame_container_horizontal_flow",
      styleDescription: "Part of inset_frame_container_frame definition",
      derivedFrom: "inset_frame_container_horizontal_flow",
      direction: "horizontal",
      relative: { x: 0, y: 48 },
      capturedSize: { width: 1305, height: 895 },
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: 619,
      horizontalSpacing: 18,
      inheritedHorizontalSpacing: 6,
      verticalSpacing: null,
      inheritedVerticalSpacing: null,
      childRows: [
        { label: "class agui::HorizontalFlow", value: "1305 x 48" },
        { label: "class SearchPopup", value: "168 x 42" },
        { label: "class agui::HorizontalFlow", value: "1305 x 895" }
      ]
    }
  }),
  windowReferenceCapture({
    id: "filter-select-root-window",
    label: "Filter selection root Window",
    className: "FilterSelectGui<class IDWithQualityFilter<class ID<...>",
    style: "frame",
    capturedSize: { width: 672, height: 973 },
    capturedContentSize: { width: 636, height: 943 },
    capturedClipSize: {
      offset: { x: 0, y: -4 },
      size: { width: 672, height: 977 }
    },
    capturedMaximalHeight: 973,
    maximumVerticalSquashSize: 673,
    padding: { top: 6, right: 12, bottom: 12, left: 12 },
    body: {
      className: "agui::VerticalFlow",
      style: "inside_deep_frame",
      styleDescription: "Part of inside_deep_frame definition",
      derivedFrom: "inside_deep_frame",
      direction: "vertical",
      relative: { x: 0, y: 48 },
      capturedSize: { width: 636, height: 895 },
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: 673,
      horizontalSpacing: null,
      inheritedHorizontalSpacing: null,
      verticalSpacing: 0,
      inheritedVerticalSpacing: 6,
      childRows: [
        { label: "class agui::TabbedPane", value: FACTORIO_NOT_IMPLEMENTED }
      ]
    }
  })
]);

export function getWindowReferenceCapture(referenceId = DEFAULT_WINDOW_REFERENCE_ID) {
  return (
    windowReferenceCaptures.find((reference) => reference.id === referenceId) ??
    windowReferenceCaptures.find((reference) => reference.id === DEFAULT_WINDOW_REFERENCE_ID)
  );
}

function createFrameStyleReference(reference = getWindowReferenceCapture()) {
  return Object.freeze({
    referenceId: reference.id,
    referenceLabel: reference.label,
    referenceTitle: reference.referenceTitle,
    captureContext: reference.captureContext,
    rootRelativeSamples: reference.rootRelativeSamples,
    className: reference.className,
    style: reference.style,
    derivedFrom: reference.derivedFrom,
    capturedSize: reference.capturedSize,
    capturedContentSize: reference.capturedContentSize,
    capturedClipSize: reference.capturedClipSize,
    capturedSizeBeforeStretching: reference.capturedSizeBeforeStretching,
    capturedMaximalHeight: reference.capturedMaximalHeight,
    topPadding: reference.padding.top,
    rightPadding: reference.padding.right,
    bottomPadding: reference.padding.bottom,
    leftPadding: reference.padding.left,
    graphicalBorder: FRAME_GRAPHICAL_BORDER,
    clipTopOverflow: FRAME_CLIP_TOP_OVERFLOW,
    useHeaderFiller: reference.useHeaderFiller,
    titlebarClassName: reference.header.className ?? "agui::HorizontalFlow",
    titlebarStyle: reference.header.style ?? "frame_header_flow",
    titlebarStyleDescription: reference.header.styleDescription ?? "Part of frame definition",
    titlebarDerivedFrom: reference.header.derivedFrom ?? "frame_header_flow",
    titlebarRelative: reference.header.relative ?? Object.freeze({ x: 0, y: 0 }),
    titlebarCapturedSize: reference.header.capturedSize,
    titlebarCapturedContentSize: reference.header.capturedContentSize,
    titlebarCapturedClipSize: reference.header.capturedClipSize,
    titlebarCapturedSizeBeforeStretching: reference.header.capturedSizeBeforeStretching,
    titlebarMaximumHorizontalSquashSize: reference.header.maximumHorizontalSquashSize,
    titlebarMaximumVerticalSquashSize: reference.header.maximumVerticalSquashSize ?? 0,
    titlebarHeight: reference.header.capturedSize?.height ?? 48,
    titlebarContentHeight: reference.header.capturedContentSize?.height ?? 42,
    titlebarBottomPadding: reference.header.bottomPadding ?? 6,
    titlebarHorizontalSpacing: reference.header.horizontalSpacing ?? 12,
    titlebarInheritedHorizontalSpacing: reference.header.inheritedHorizontalSpacing ?? 6,
    titlebarHorizontallyStretchable: reference.header.horizontallyStretchable ?? true,
    titlebarVerticallyStretchable: reference.header.verticallyStretchable ?? false,
    titlebarIgnoredBySearch: reference.header.ignoredBySearch ?? true,
    titlebarChildRows: reference.header.childRows ?? Object.freeze([]),
    titlebarOptionalSlotRows: reference.header.optionalSlotRows ?? Object.freeze([]),
    titleLabelStyle: "frame_title",
    titleLabelCapturedSize: reference.header.titleLabel?.capturedSize,
    titleLabelCapturedContentSize: reference.header.titleLabel?.capturedContentSize,
    titleLabelCapturedClipSize: reference.header.titleLabel?.capturedClipSize,
    titleLabelCapturedSizeBeforeStretching:
      reference.header.titleLabel?.capturedSizeBeforeStretching,
    titleLabelMaximumHorizontalSquashSize:
      reference.header.titleLabel?.maximumHorizontalSquashSize,
    titleLabelMaximumVerticalSquashSize:
      reference.header.titleLabel?.maximumVerticalSquashSize,
    titleLabelRelative: reference.header.titleLabel?.relative ?? Object.freeze({ x: 0, y: -4 }),
    titleLabelHeight: reference.header.titleLabel?.capturedSize?.height ?? 46,
    titleLabelContentHeight: reference.header.titleLabel?.capturedContentSize?.height ?? 42,
    titleLabelTopMargin: -4,
    titleLabelBottomPadding: 4,
    dragHandleStyle: "draggable_space_header",
    dragHandleCapturedSize: reference.header.dragHandle?.capturedSize,
    dragHandleCapturedContentSize: reference.header.dragHandle?.capturedContentSize,
    dragHandleCapturedClipSize: reference.header.dragHandle?.capturedClipSize,
    dragHandleCapturedSizeBeforeStretching:
      reference.header.dragHandle?.capturedSizeBeforeStretching,
    dragHandleMaximumHorizontalSquashSize:
      reference.header.dragHandle?.maximumHorizontalSquashSize,
    dragHandleMaximumVerticalSquashSize:
      reference.header.dragHandle?.maximumVerticalSquashSize,
    dragHandleRelative: reference.header.dragHandle?.relative,
    dragHandleHeight: reference.header.dragHandle?.capturedSize?.height ?? 36,
    dragHandleLeftMargin: 6,
    dragHandleRightMargin: 6,
    bodyClassName: reference.body.className,
    bodyStyle: reference.body.style,
    bodyStyleDescription: reference.body.styleDescription,
    bodyDerivedFrom: reference.body.derivedFrom,
    bodyDirection: reference.body.direction,
    bodyRelative: reference.body.relative,
    bodyCapturedSize: reference.body.capturedSize,
    bodyCapturedContentSize: reference.body.capturedContentSize,
    bodyCapturedClipSize: reference.body.capturedClipSize,
    bodyCapturedSizeBeforeStretching: reference.body.capturedSizeBeforeStretching,
    bodyHorizontalSpacing: reference.body.horizontalSpacing,
    bodyInheritedHorizontalSpacing: reference.body.inheritedHorizontalSpacing,
    bodyVerticalSpacing: reference.body.verticalSpacing,
    bodyInheritedVerticalSpacing: reference.body.inheritedVerticalSpacing,
    bodyChildRows: reference.body.childRows,
    maximumHorizontalSquashSize: reference.maximumHorizontalSquashSize,
    maximumVerticalSquashSize: reference.maximumVerticalSquashSize
  });
}

export const frameStyleReference = createFrameStyleReference();

function estimateTitleLabelWidth(caption) {
  return Math.max(1, Math.round(String(caption).length * 11.2));
}

function titleMatchesReference(style, caption) {
  return (
    style.referenceTitle &&
    String(style.referenceTitle).trim().toLowerCase() ===
      String(caption).trim().toLowerCase()
  );
}

function getFrameTitleLabelWidth(style, caption) {
  if (titleMatchesReference(style, caption) && style.titleLabelCapturedSize) {
    return style.titleLabelCapturedSize.width;
  }

  return estimateTitleLabelWidth(caption);
}

export function getFrameContentSize(style = frameStyleReference) {
  if (style.capturedContentSize) {
    return style.capturedContentSize;
  }

  return frameContentSize({
    outerSize: style.capturedSize,
    graphicalBorder: style.graphicalBorder,
    topPadding: style.topPadding,
    rightPadding: style.rightPadding,
    bottomPadding: style.bottomPadding,
    leftPadding: style.leftPadding
  });
}

export function getFrameClipSize(style = frameStyleReference) {
  if (style.capturedClipSize) {
    return style.capturedClipSize;
  }

  return frameClipSize({
    outerSize: style.capturedSize,
    clipTopOverflow: style.clipTopOverflow
  });
}

export function getFrameTitlebarSize(style = frameStyleReference) {
  if (style.titlebarCapturedSize) {
    return style.titlebarCapturedSize;
  }

  const contentSize = getFrameContentSize(style);
  return freezeSize({
    width: contentSize.width,
    height: style.titlebarHeight
  });
}

export function getFrameTitlebarContentSize(style = frameStyleReference) {
  if (style.titlebarCapturedContentSize) {
    return style.titlebarCapturedContentSize;
  }

  const titlebarSize = getFrameTitlebarSize(style);
  return freezeSize({
    width: titlebarSize.width,
    height: style.titlebarContentHeight
  });
}

export function getFrameTitlebarClipSize(style = frameStyleReference) {
  if (style.titlebarCapturedClipSize) {
    return style.titlebarCapturedClipSize;
  }

  const titlebarSize = getFrameTitlebarSize(style);
  return freezeRectangle({
    offset: { x: 0, y: -style.clipTopOverflow },
    size: {
      width: titlebarSize.width,
      height: titlebarSize.height + style.clipTopOverflow
    }
  });
}

export function getFrameBodySize(style = frameStyleReference) {
  if (style.bodyCapturedSize) {
    return style.bodyCapturedSize;
  }

  const contentSize = getFrameContentSize(style);
  return freezeSize({
    width: contentSize.width,
    height: Math.max(0, contentSize.height - style.titlebarHeight)
  });
}

function getFrameBodyContentSize(style) {
  return style.bodyCapturedContentSize ?? getFrameBodySize(style);
}

function getFrameBodyClipSize(style) {
  return (
    style.bodyCapturedClipSize ??
    freezeRectangle({
      offset: { x: 0, y: 0 },
      size: getFrameBodySize(style)
    })
  );
}

function getFrameBodySizeBeforeStretching(style) {
  return style.bodyCapturedSizeBeforeStretching ?? getFrameBodySize(style);
}

function getFrameDragHandleWidth(style, titleLabelWidth, caption) {
  if (titleMatchesReference(style, caption) && style.dragHandleCapturedSize) {
    return style.dragHandleCapturedSize.width;
  }

  const titlebarSize = getFrameTitlebarSize(style);
  return Math.max(
    0,
    titlebarSize.width -
      titleLabelWidth -
      style.titlebarHorizontalSpacing -
      style.dragHandleLeftMargin -
      style.dragHandleRightMargin
  );
}

function getFrameTitlebarSizeBeforeStretching(style, titleLabelWidth, caption) {
  if (
    titleMatchesReference(style, caption) &&
    style.titlebarCapturedSizeBeforeStretching
  ) {
    return style.titlebarCapturedSizeBeforeStretching;
  }

  return freezeSize({
    width:
      titleLabelWidth +
      style.titlebarHorizontalSpacing +
      style.dragHandleLeftMargin +
      style.dragHandleRightMargin,
    height: style.titlebarHeight
  });
}

function getFrameDragHandleRelative(style, titleLabelWidth, caption) {
  if (titleMatchesReference(style, caption) && style.dragHandleRelative) {
    return style.dragHandleRelative;
  }

  return {
    x: titleLabelWidth + style.titlebarHorizontalSpacing + style.dragHandleLeftMargin,
    y: 0
  };
}

function getFlowSpacingProperties(flowStyleReference) {
  const properties = [];

  if (flowStyleReference.horizontalSpacing != null) {
    properties.push({
      label: "horizontal_spacing",
      value: flowStyleReference.horizontalSpacing
    });
  }

  if (flowStyleReference.inheritedHorizontalSpacing != null) {
    properties.push({
      label: "horizontal_spacing",
      value: flowStyleReference.inheritedHorizontalSpacing,
      indent: 1
    });
  }

  if (flowStyleReference.verticalSpacing != null) {
    properties.push({
      label: "vertical_spacing",
      value: flowStyleReference.verticalSpacing
    });
  }

  if (flowStyleReference.inheritedVerticalSpacing != null) {
    properties.push({
      label: "vertical_spacing",
      value: flowStyleReference.inheritedVerticalSpacing,
      indent: 1
    });
  }

  return properties;
}

function getTitlebarChildRows({
  style,
  titleLabel,
  titleLabelWidth,
  dragHandle,
  dragHandleWidth
}) {
  if (style.titlebarChildRows.length) {
    return style.titlebarChildRows.map((row) => {
      const childRow = { ...row, indent: 1 };
      if (row.role === "title") {
        childRow.value = `${titleLabelWidth} x ${titleLabel.referenceSize.height}`;
        childRow.targetId = titleLabel.id;
      }
      if (row.role === "filler") {
        childRow.value = `${dragHandleWidth} x ${dragHandle.referenceSize.height}`;
        childRow.targetId = dragHandle.id;
      }
      if (row.role === "slot") {
        childRow.value = `${row.value} slot`;
      }
      delete childRow.role;
      return childRow;
    });
  }

  return [
    {
      label: "class agui::Label",
      value: `${titleLabelWidth} x ${titleLabel.referenceSize.height}`,
      indent: 1,
      targetId: titleLabel.id
    },
    {
      label: "class agui::Filler",
      value: `${dragHandleWidth} x ${dragHandle.referenceSize.height}`,
      indent: 1,
      targetId: dragHandle.id
    }
  ];
}

function sizePair({ width, height }) {
  return `{${width}, ${height}}`;
}

function onOff(value) {
  return value ? "on" : "off";
}

function normalizeModelLocation(location) {
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

export function createWindowModel({
  title = "Untitled window",
  location: sourceLocation = null,
  referenceId = DEFAULT_WINDOW_REFERENCE_ID,
  size = null
} = {}) {
  const caption = title.trim() || "Untitled window";
  const location = normalizeModelLocation(sourceLocation);
  const authoredSize =
    size ?? (referenceId === DEFAULT_WINDOW_REFERENCE_ID ? DEFAULT_WINDOW_SIZE : null);
  const reference = windowReferenceWithAuthoredSize(
    getWindowReferenceCapture(referenceId),
    authoredSize ? normalizeWindowSize(authoredSize) : null
  );
  const styleReference = createFrameStyleReference(reference);
  const titleLabelWidth = getFrameTitleLabelWidth(styleReference, caption);
  const dragHandleWidth = getFrameDragHandleWidth(
    styleReference,
    titleLabelWidth,
    caption
  );
  const bodyStyleReference = {
    variantId:
      styleReference.bodyDirection === HORIZONTAL_FLOW_DIRECTION
        ? horizontalFlowStyleVariants.insetFrameContainer.id
        : null,
    horizontalSpacing: styleReference.bodyHorizontalSpacing,
    inheritedHorizontalSpacing: styleReference.bodyInheritedHorizontalSpacing,
    verticalSpacing: styleReference.bodyVerticalSpacing,
    inheritedVerticalSpacing: styleReference.bodyInheritedVerticalSpacing,
    horizontallyStretchable: true,
    maximumVerticalSquashSize: styleReference.maximumVerticalSquashSize
  };
  const bodyFlowNode =
    styleReference.bodyDirection === HORIZONTAL_FLOW_DIRECTION
      ? createHorizontalFlowNode({
          id: "gui_window_body",
          className: styleReference.bodyClassName,
          style: styleReference.bodyStyle,
          styleDescription: styleReference.bodyStyleDescription,
          derivedFrom: styleReference.bodyDerivedFrom,
          role: horizontalFlowStyleVariants.insetFrameContainer.role,
          styleReference: bodyStyleReference,
          children: []
        })
      : {
          id: "gui_window_body",
          primitive: "flow",
          className: styleReference.bodyClassName,
          style: styleReference.bodyStyle,
          styleDescription: styleReference.bodyStyleDescription,
          derivedFrom: styleReference.bodyDerivedFrom,
          direction: styleReference.bodyDirection,
          styleReference: bodyStyleReference,
          children: []
        };

  return {
    schema: FACTORIO_GUI_MODEL_SCHEMA,
    root: {
      id: "gui_window",
      primitive: "frame",
      className: styleReference.className,
      style: styleReference.style,
      derivedFrom: styleReference.derivedFrom,
      direction: "vertical",
      location,
      referenceSize: {
        ...styleReference.capturedSize,
        contentWidth: styleReference.capturedContentSize.width,
        contentHeight: styleReference.capturedContentSize.height
      },
      styleReference,
      children: [
        createHorizontalFlowNode({
          id: "gui_window_titlebar",
          className: styleReference.titlebarClassName,
          style: styleReference.titlebarStyle,
          styleDescription: styleReference.titlebarStyleDescription,
          derivedFrom: styleReference.titlebarDerivedFrom,
          role: horizontalFlowStyleVariants.frameHeader.role,
          referenceSize: { height: styleReference.titlebarHeight },
          styleReference: {
            variantId: horizontalFlowStyleVariants.frameHeader.id,
            bottomPadding: styleReference.titlebarBottomPadding,
            horizontalSpacing: styleReference.titlebarHorizontalSpacing,
            inheritedHorizontalSpacing: styleReference.titlebarInheritedHorizontalSpacing,
            horizontallyStretchable: styleReference.titlebarHorizontallyStretchable,
            verticallyStretchable: styleReference.titlebarVerticallyStretchable,
            ignoredBySearch: styleReference.titlebarIgnoredBySearch
          },
          children: [
            {
              id: "gui_window_title",
              primitive: "label",
              className: "agui::Label",
              caption,
              style: styleReference.titleLabelStyle,
              referenceSize: {
                width: titleLabelWidth,
                height: styleReference.titleLabelHeight,
                contentHeight: styleReference.titleLabelContentHeight
              },
              styleReference: {
                topMargin: styleReference.titleLabelTopMargin,
                bottomPadding: styleReference.titleLabelBottomPadding,
                verticallyStretchable: true,
                horizontallySquashable: true,
                font: "heading-1",
                fontColor: "{1, 0.901961, 0.752941}",
                singleLine: true
              }
            },
            {
              id: "gui_window_drag_handle",
              primitive: "empty-widget",
              className: "agui::Filler",
              style: styleReference.dragHandleStyle,
              referenceSize: {
                width: dragHandleWidth,
                height: styleReference.dragHandleHeight,
                naturalHeight: styleReference.dragHandleHeight
              },
              styleReference: {
                leftMargin: styleReference.dragHandleLeftMargin,
                rightMargin: styleReference.dragHandleRightMargin,
                horizontallyStretchable: true,
                verticallyStretchable: true,
                ignoredBySearch: true
              },
              role: "header-filler"
            }
          ]
        }),
        bodyFlowNode
      ]
    },
    constraints: [
      "top_level_frame",
      "no_absolute_positioning",
      "titlebar_has_drag_handle",
      "header_filler_stretches",
      "body_is_window_content_flow"
    ]
  };
}

export function walkModelNodes(node, visitor, depth = 0, parent = null) {
  if (!node) {
    return;
  }

  visitor(node, { depth, parent });
  for (const child of node.children ?? []) {
    walkModelNodes(child, visitor, depth + 1, node);
  }
}

export function findModelNode(model, id) {
  let match = null;
  walkModelNodes(model?.root, (node) => {
    if (node.id === id) {
      match = node;
    }
  });
  return match;
}

export function getWindowInspectorRows(model) {
  if (!model?.root) {
    return [];
  }

  const root = model.root;
  const titlebar = root.children[0];
  const titleLabel = titlebar.children[0];
  const dragHandle = titlebar.children[1];
  const body = root.children[1];
  const style = root.styleReference;
  const titleLabelWidth = titleLabel.referenceSize.width;
  const contentSize = getFrameContentSize(style);
  const clipSize = getFrameClipSize(style);
  const titlebarSize = getFrameTitlebarSize(style);
  const titlebarContentSize = getFrameTitlebarContentSize(style);
  const titlebarClipSize = getFrameTitlebarClipSize(style);
  const bodySize = getFrameBodySize(style);
  const bodyContentSize = getFrameBodyContentSize(style);
  const bodyClipSize = getFrameBodyClipSize(style);
  const bodySizeBeforeStretching = getFrameBodySizeBeforeStretching(style);
  const dragHandleWidth = getFrameDragHandleWidth(
    style,
    titleLabelWidth,
    titleLabel.caption
  );
  const titlebarSizeBeforeStretching = getFrameTitlebarSizeBeforeStretching(
    style,
    titleLabelWidth,
    titleLabel.caption
  );
  const dragHandleRelative = getFrameDragHandleRelative(
    style,
    titleLabelWidth,
    titleLabel.caption
  );
  const titlebarChildRows = getTitlebarChildRows({
    style,
    titleLabel,
    titleLabelWidth,
    dragHandle,
    dragHandleWidth
  });

  return [
    {
      id: root.id,
      title: `class ${root.className}`,
      style: root.style,
      derivedFrom: root.derivedFrom,
      relative: "[0, 0]",
      size: sizePair(style.capturedSize),
      contentSize: sizePair(contentSize),
      clipSize: `{{${clipSize.offset.x}, ${clipSize.offset.y}}, {${clipSize.size.width}, ${clipSize.size.height}}}`,
      sizeBeforeStretching: sizePair(style.capturedSizeBeforeStretching),
      maximumHorizontalSquashSize: style.maximumHorizontalSquashSize,
      maximumVerticalSquashSize: style.maximumVerticalSquashSize,
      maximalHeight: style.capturedMaximalHeight,
      properties: [
        { label: "top_padding", value: style.topPadding, indent: 1 },
        { label: "right_padding", value: style.rightPadding, indent: 1 },
        { label: "bottom_padding", value: style.bottomPadding, indent: 1 },
        { label: "left_padding", value: style.leftPadding, indent: 1 },
        { label: "use_header_filler", value: style.useHeaderFiller, indent: 1 }
      ],
      childRows: [
        { label: "children", value: "" },
        {
          label: "class agui::HorizontalFlow",
          value: `${titlebarSize.width} x ${titlebarSize.height}`,
          indent: 1,
          targetId: titlebar.id
        },
        {
          label: `class ${body.className}`,
          value: `${bodySize.width} x ${bodySize.height}`,
          indent: 1,
          targetId: body.id
        }
      ]
    },
    {
      id: titlebar.id,
      title: `class ${titlebar.className}`,
      style: style.titlebarStyleDescription,
      derivedFrom: style.titlebarDerivedFrom,
      relative: `[${style.titlebarRelative.x}, ${style.titlebarRelative.y}]`,
      size: sizePair(titlebarSize),
      contentSize: sizePair(titlebarContentSize),
      clipSize: `{{${titlebarClipSize.offset.x}, ${titlebarClipSize.offset.y}}, {${titlebarClipSize.size.width}, ${titlebarClipSize.size.height}}}`,
      sizeBeforeStretching: sizePair(titlebarSizeBeforeStretching),
      maximumHorizontalSquashSize:
        titleMatchesReference(style, titleLabel.caption) &&
        style.titlebarMaximumHorizontalSquashSize != null
          ? style.titlebarMaximumHorizontalSquashSize
          : dragHandleWidth,
      maximumVerticalSquashSize: style.titlebarMaximumVerticalSquashSize,
      properties: [
        { label: "ignored_by_search", value: titlebar.styleReference.ignoredBySearch, indent: 1 },
        { label: "bottom_padding", value: titlebar.styleReference.bottomPadding, indent: 1 },
        {
          label: "horizontally_stretchable",
          value: onOff(titlebar.styleReference.horizontallyStretchable)
        },
        { label: "horizontal_spacing", value: titlebar.styleReference.horizontalSpacing },
        {
          label: "horizontal_spacing",
          value: titlebar.styleReference.inheritedHorizontalSpacing,
          indent: 1
        },
        {
          label: "vertically_stretchable",
          value: onOff(titlebar.styleReference.verticallyStretchable)
        }
      ],
      childRows: [
        { label: "children", value: "" },
        ...titlebarChildRows
      ]
    },
    {
      id: titleLabel.id,
      title: "class agui::Label",
      style: "Part of frame definition",
      derivedFrom: titleLabel.style,
      relative: `[${style.titleLabelRelative.x}, ${style.titleLabelRelative.y}]`,
      size: `{${titleLabelWidth}, ${titleLabel.referenceSize.height}}`,
      contentSize: `{${titleLabelWidth}, ${titleLabel.referenceSize.contentHeight}}`,
      clipSize: `{{0, 0}, {${titleLabelWidth}, ${titleLabel.referenceSize.height}}}`,
      sizeBeforeStretching: `{${titleLabelWidth}, ${titleLabel.referenceSize.height}}`,
      maximumHorizontalSquashSize:
        style.titleLabelMaximumHorizontalSquashSize ?? titleLabelWidth,
      maximumVerticalSquashSize: style.titleLabelMaximumVerticalSquashSize ?? 0,
      properties: [
        { label: "caption", value: titleLabel.caption, editable: { field: "title" }, tone: "default" },
        {
          label: "vertically_stretchable",
          value: onOff(titleLabel.styleReference.verticallyStretchable)
        },
        {
          label: "horizontally_squashable",
          value: onOff(titleLabel.styleReference.horizontallySquashable)
        },
        { label: "bottom_padding", value: titleLabel.styleReference.bottomPadding, indent: 1 },
        { label: "top_margin", value: titleLabel.styleReference.topMargin, indent: 1 },
        { label: "font", value: titleLabel.styleReference.font, indent: 1 },
        { label: "font_color", value: titleLabel.styleReference.fontColor, indent: 1 },
        { label: "font", value: "default", indent: 1 },
        { label: "font_color", value: "{1, 1, 1}", indent: 1 },
        { label: "disabled_font_color", value: "{0.5, 0.5, 0.5, 0.5}", indent: 1 },
        { label: "parent_hovered_font_color", value: "{0, 0, 0}", indent: 1 },
        { label: "game_controller_hovered_font_color", value: "{1, 0.68, 0}", indent: 1 },
        { label: "single_line", value: titleLabel.styleReference.singleLine, indent: 1 }
      ]
    },
    {
      id: dragHandle.id,
      title: "class agui::Filler",
      style: "Part of frame definition",
      derivedFrom: "draggable_space_header",
      relative: `[${dragHandleRelative.x}, ${dragHandleRelative.y}]`,
      size: `{${dragHandleWidth}, 36}`,
      contentSize: `{${dragHandleWidth}, 36}`,
      clipSize: `{{0, 0}, {${dragHandleWidth}, 36}}`,
      sizeBeforeStretching: "{0, 36}",
      maximumHorizontalSquashSize:
        style.dragHandleMaximumHorizontalSquashSize ?? dragHandleWidth,
      maximumVerticalSquashSize: style.dragHandleMaximumVerticalSquashSize ?? 0,
      properties: [
        { label: "right_margin", value: dragHandle.styleReference.rightMargin },
        { label: "height", value: dragHandle.referenceSize.height },
        { label: "natural_height", value: dragHandle.referenceSize.naturalHeight },
        {
          label: "horizontally_stretchable",
          value: onOff(dragHandle.styleReference.horizontallyStretchable)
        },
        {
          label: "vertically_stretchable",
          value: onOff(dragHandle.styleReference.verticallyStretchable)
        },
        { label: "left_margin", value: dragHandle.styleReference.leftMargin },
        { label: "ignored_by_search", value: true }
      ]
    },
    {
      id: body.id,
      title: `class ${body.className}`,
      style: style.bodyStyleDescription,
      derivedFrom: style.bodyDerivedFrom,
      relative: `[${style.bodyRelative.x}, ${style.bodyRelative.y}]`,
      size: sizePair(bodySize),
      contentSize: sizePair(bodyContentSize),
      clipSize: `{{${bodyClipSize.offset.x}, ${bodyClipSize.offset.y}}, {${bodyClipSize.size.width}, ${bodyClipSize.size.height}}}`,
      sizeBeforeStretching: sizePair(bodySizeBeforeStretching),
      maximumHorizontalSquashSize: 0,
      maximumVerticalSquashSize: style.maximumVerticalSquashSize,
      properties: getFlowSpacingProperties(body.styleReference),
      childRows: [
        { label: "children", value: "" },
        ...style.bodyChildRows.map((row) => ({ ...row, indent: 1 }))
      ]
    }
  ];
}

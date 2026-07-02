export const BODY_LAYOUT_ROOT_ID = "gui_window_body";
export const FRAME_ATOM_ID = "frame";
export const INSIDE_DEEP_FRAME_STYLE_VARIANT = "inside-deep-frame";
export const FRAME_ID_PREFIX = "gui_frame_";
export const HORIZONTAL_FLOW_ATOM_ID = "horizontal-flow";
export const GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT = "generic-horizontal-flow";
export const HORIZONTAL_FLOW_ID_PREFIX = "gui_horizontal_flow_";
export const LABEL_ATOM_ID = "label";
export const GENERIC_LABEL_STYLE_VARIANT = "label";
export const LABEL_ID_PREFIX = "gui_label_";
export const DEFAULT_LABEL_CAPTION = "Label";
export const FILLER_ATOM_ID = "filler";
export const GENERIC_FILLER_STYLE_VARIANT = "draggable-space";
export const FILLER_ID_PREFIX = "gui_filler_";
export const LAYOUT_NODE_SIZE_LIMITS = Object.freeze({
  minimalWidth: Object.freeze({ min: 48, max: 800 }),
  minimalHeight: Object.freeze({ min: 48, max: 600 })
});

function createLayoutSpecFromMetadata(metadata, nodeNumber) {
  const safeNumber = normalizeNextNumber(nodeNumber);

  return {
    id: `${metadata.idPrefix}${safeNumber}`,
    atom: metadata.atom,
    styleVariant: metadata.defaultStyleVariant,
    ...(metadata.defaultCaption != null ? { caption: metadata.defaultCaption } : {}),
    children: []
  };
}

function defineBuilderAtomMetadata(config) {
  return Object.freeze({
    ...config,
    createSpec: (nodeNumber) => createLayoutSpecFromMetadata(config, nodeNumber)
  });
}

export const BUILDER_ATOM_METADATA = Object.freeze({
  [FRAME_ATOM_ID]: defineBuilderAtomMetadata({
    atom: FRAME_ATOM_ID,
    idPrefix: FRAME_ID_PREFIX,
    defaultStyleVariant: INSIDE_DEEP_FRAME_STYLE_VARIANT,
    paletteLabel: "Frame",
    paletteCode: "frame",
    canHaveChildren: true,
    defaultChildAtom: FRAME_ATOM_ID,
    allowedChildren: Object.freeze([
      FRAME_ATOM_ID,
      HORIZONTAL_FLOW_ATOM_ID,
      LABEL_ATOM_ID,
      FILLER_ATOM_ID
    ])
  }),
  [HORIZONTAL_FLOW_ATOM_ID]: defineBuilderAtomMetadata({
    atom: HORIZONTAL_FLOW_ATOM_ID,
    idPrefix: HORIZONTAL_FLOW_ID_PREFIX,
    defaultStyleVariant: GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
    paletteLabel: "Horizontal Flow",
    paletteCode: "flow.horizontal",
    canHaveChildren: true,
    defaultChildAtom: FRAME_ATOM_ID,
    allowedChildren: Object.freeze([
      FRAME_ATOM_ID,
      HORIZONTAL_FLOW_ATOM_ID,
      LABEL_ATOM_ID,
      FILLER_ATOM_ID
    ])
  }),
  [LABEL_ATOM_ID]: defineBuilderAtomMetadata({
    atom: LABEL_ATOM_ID,
    idPrefix: LABEL_ID_PREFIX,
    defaultStyleVariant: GENERIC_LABEL_STYLE_VARIANT,
    defaultCaption: DEFAULT_LABEL_CAPTION,
    paletteLabel: "Label",
    paletteCode: "label",
    canHaveChildren: false,
    defaultChildAtom: null,
    allowedChildren: Object.freeze([])
  }),
  [FILLER_ATOM_ID]: defineBuilderAtomMetadata({
    atom: FILLER_ATOM_ID,
    idPrefix: FILLER_ID_PREFIX,
    defaultStyleVariant: GENERIC_FILLER_STYLE_VARIANT,
    paletteLabel: "Filler",
    paletteCode: "empty-widget",
    canHaveChildren: false,
    defaultChildAtom: null,
    allowedChildren: Object.freeze([])
  })
});
export const BUILDER_PALETTE_ATOMS = Object.freeze([
  FRAME_ATOM_ID,
  HORIZONTAL_FLOW_ATOM_ID,
  LABEL_ATOM_ID,
  FILLER_ATOM_ID
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nodeNumberFromId(id, prefix) {
  if (typeof id !== "string" || !id.startsWith(prefix)) {
    return null;
  }

  const rawValue = id.slice(prefix.length);
  if (!/^\d+$/.test(rawValue)) {
    return null;
  }

  const numberValue = Number(rawValue);
  return Number.isSafeInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function normalizeNextNumber(value) {
  const numberValue = Number(value);
  return Number.isSafeInteger(numberValue) && numberValue > 0 ? numberValue : 1;
}

function clampInteger(value, { min, max }) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function normalizeLayoutNodeCaption(value, fallback = null) {
  if (fallback == null) {
    return null;
  }

  const trimmedValue = String(value ?? "").trim();
  return trimmedValue || fallback;
}

export function builderAtomMetadata(atom) {
  return BUILDER_ATOM_METADATA[atom] ?? null;
}

export function builderAtomLabel(atom) {
  return builderAtomMetadata(atom)?.paletteLabel ?? "Component";
}

export function builderAtomCode(atom) {
  return builderAtomMetadata(atom)?.paletteCode ?? "layout";
}

export function isKnownLayoutAtom(atom) {
  return Boolean(builderAtomMetadata(atom));
}

export function canLayoutAtomHaveChildren(atom) {
  return Boolean(builderAtomMetadata(atom)?.canHaveChildren);
}

function canonicalStyleVariant(atom) {
  return builderAtomMetadata(atom)?.defaultStyleVariant ?? null;
}

function prefixForAtom(atom) {
  return builderAtomMetadata(atom)?.idPrefix ?? null;
}

function normalizeAtom(atom) {
  return isKnownLayoutAtom(atom) ? atom : null;
}

function canParentAtomAcceptChildAtom(parentAtom, childAtom) {
  if (!isKnownLayoutAtom(childAtom)) {
    return false;
  }

  if (parentAtom === BODY_LAYOUT_ROOT_ID) {
    return true;
  }

  const parent = builderAtomMetadata(parentAtom);
  return Boolean(parent?.canHaveChildren && parent.allowedChildren.includes(childAtom));
}

function cloneNode(node) {
  const size = normalizeLayoutNodeSize(node.size);
  const caption = normalizeLayoutNodeCaption(
    node.caption,
    builderAtomMetadata(node.atom)?.defaultCaption
  );
  return {
    id: node.id,
    atom: node.atom,
    styleVariant: canonicalStyleVariant(node.atom),
    ...(caption != null ? { caption } : {}),
    ...(size ? { size } : {}),
    children: canLayoutAtomHaveChildren(node.atom)
      ? (node.children ?? []).map(cloneNode)
      : []
  };
}

function clampInsertionIndex(index, length) {
  const numberValue = Number(index);
  if (!Number.isFinite(numberValue)) {
    return length;
  }

  return Math.min(Math.max(0, Math.round(numberValue)), length);
}

export function createLayoutSpec(atom, nodeNumber) {
  return builderAtomMetadata(atom)?.createSpec(nodeNumber) ?? null;
}

export function createFrameSpec(nodeNumber) {
  return createLayoutSpec(FRAME_ATOM_ID, nodeNumber);
}

export function createHorizontalFlowSpec(nodeNumber) {
  return createLayoutSpec(HORIZONTAL_FLOW_ATOM_ID, nodeNumber);
}

export function createFillerSpec(nodeNumber) {
  return createLayoutSpec(FILLER_ATOM_ID, nodeNumber);
}

export function createLabelSpec(nodeNumber) {
  return createLayoutSpec(LABEL_ATOM_ID, nodeNumber);
}

export function normalizeLayoutNodeSize(value = null) {
  if (!isObject(value)) {
    return null;
  }

  const size = {};
  for (const key of Object.keys(LAYOUT_NODE_SIZE_LIMITS)) {
    if (!Object.hasOwn(value, key)) {
      continue;
    }

    const normalizedValue = clampInteger(value[key], LAYOUT_NODE_SIZE_LIMITS[key]);
    if (normalizedValue != null) {
      size[key] = normalizedValue;
    }
  }

  return Object.keys(size).length ? Object.freeze(size) : null;
}

export function normalizeLayoutState(value = {}) {
  const usedIds = new Set();
  let nextNumber = normalizeNextNumber(value?.nextLayoutNodeNumber);

  function allocateId(atom) {
    const prefix = prefixForAtom(atom);
    let id = `${prefix}${nextNumber}`;
    while (usedIds.has(id)) {
      nextNumber += 1;
      id = `${prefix}${nextNumber}`;
    }
    usedIds.add(id);
    nextNumber += 1;
    return id;
  }

  function normalizeNode(node, parentAtom = BODY_LAYOUT_ROOT_ID) {
    if (!isObject(node)) {
      return null;
    }

    const atom = normalizeAtom(node.atom);
    if (atom == null) {
      return null;
    }

    if (!canParentAtomAcceptChildAtom(parentAtom, atom)) {
      return null;
    }

    const idNumber = nodeNumberFromId(node.id, prefixForAtom(atom));
    let id = null;
    if (typeof node.id === "string" && idNumber != null && !usedIds.has(node.id)) {
      id = node.id;
      usedIds.add(id);
      nextNumber = Math.max(nextNumber, idNumber + 1);
    } else {
      id = allocateId(atom);
    }

    const children = canLayoutAtomHaveChildren(atom) && Array.isArray(node.children)
      ? node.children.map((child) => normalizeNode(child, atom)).filter(Boolean)
      : [];

    const size = normalizeLayoutNodeSize(node.size);
    const caption = normalizeLayoutNodeCaption(
      node.caption,
      builderAtomMetadata(atom)?.defaultCaption
    );

    return {
      id,
      atom,
      styleVariant: canonicalStyleVariant(atom),
      ...(caption != null ? { caption } : {}),
      ...(size ? { size } : {}),
      children
    };
  }

  const layoutChildren = Array.isArray(value?.layoutChildren)
    ? value.layoutChildren
        .map((node) => normalizeNode(node, BODY_LAYOUT_ROOT_ID))
        .filter(Boolean)
    : [];

  return {
    layoutChildren,
    nextLayoutNodeNumber: nextNumber
  };
}

export function findLayoutNode(layoutChildren = [], nodeId, parentId = BODY_LAYOUT_ROOT_ID) {
  for (let index = 0; index < layoutChildren.length; index += 1) {
    const node = layoutChildren[index];
    if (node.id === nodeId) {
      return { node, parentId, index };
    }

    const childMatch = findLayoutNode(node.children, nodeId, node.id);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

export function findLayoutParentChildren(layoutChildren = [], parentId) {
  if (parentId === BODY_LAYOUT_ROOT_ID) {
    return layoutChildren;
  }

  return findLayoutNode(layoutChildren, parentId)?.node.children ?? null;
}

export function findLayoutParentAtom(layoutChildren = [], parentId) {
  if (parentId === BODY_LAYOUT_ROOT_ID) {
    return BODY_LAYOUT_ROOT_ID;
  }

  return findLayoutNode(layoutChildren, parentId)?.node.atom ?? null;
}

export function canParentAcceptAtom(layoutChildren = [], parentId, childAtom) {
  const parentAtom = findLayoutParentAtom(layoutChildren, parentId);
  return canParentAtomAcceptChildAtom(parentAtom, childAtom);
}

export function defaultLayoutChildAtom(layoutChildren = [], parentId) {
  const parentAtom = findLayoutParentAtom(layoutChildren, parentId);
  if (parentAtom === BODY_LAYOUT_ROOT_ID) {
    return FRAME_ATOM_ID;
  }

  return builderAtomMetadata(parentAtom)?.defaultChildAtom ?? null;
}

export function isLayoutDescendant(layoutChildren = [], ancestorId, nodeId) {
  const ancestor = findLayoutNode(layoutChildren, ancestorId)?.node;
  if (!ancestor) {
    return false;
  }

  return Boolean(findLayoutNode(ancestor.children, nodeId, ancestor.id));
}

export function canDropLayoutNode(
  layoutChildren = [],
  sourceId,
  targetParentId,
  sourceAtom = null
) {
  const targetChildren = findLayoutParentChildren(layoutChildren, targetParentId);
  if (!targetChildren) {
    return false;
  }

  const draggedAtom = sourceAtom ?? (
    sourceId ? findLayoutNode(layoutChildren, sourceId)?.node.atom : FRAME_ATOM_ID
  );
  if (!canParentAcceptAtom(layoutChildren, targetParentId, draggedAtom)) {
    return false;
  }

  if (!sourceId) {
    return true;
  }

  if (!findLayoutNode(layoutChildren, sourceId)) {
    return false;
  }

  return sourceId !== targetParentId && !isLayoutDescendant(layoutChildren, sourceId, targetParentId);
}

export function insertLayoutNode(layoutChildren = [], parentId, index, node) {
  if (!node || !canDropLayoutNode(layoutChildren, null, parentId, node.atom)) {
    return { layoutChildren, changed: false };
  }

  const normalizedNode = cloneNode({
    atom: node.atom,
    ...node,
    children: Array.isArray(node.children) ? node.children : []
  });

  if (parentId === BODY_LAYOUT_ROOT_ID) {
    const nextChildren = layoutChildren.map(cloneNode);
    nextChildren.splice(clampInsertionIndex(index, nextChildren.length), 0, normalizedNode);
    return { layoutChildren: nextChildren, changed: true };
  }

  let changed = false;
  function insertInto(nodes) {
    return nodes.map((entry) => {
      if (entry.id === parentId) {
        const children = entry.children.map(cloneNode);
        children.splice(clampInsertionIndex(index, children.length), 0, normalizedNode);
        changed = true;
        return { ...cloneNode(entry), children };
      }

      return { ...cloneNode(entry), children: insertInto(entry.children) };
    });
  }

  const nextChildren = insertInto(layoutChildren);
  return { layoutChildren: nextChildren, changed };
}

export function removeLayoutNode(layoutChildren = [], nodeId) {
  let removedNode = null;

  function removeFrom(nodes) {
    const nextNodes = [];
    for (const node of nodes) {
      if (node.id === nodeId) {
        removedNode = cloneNode(node);
        continue;
      }

      nextNodes.push({ ...cloneNode(node), children: removeFrom(node.children) });
    }

    return nextNodes;
  }

  const nextChildren = removeFrom(layoutChildren);
  return {
    layoutChildren: removedNode ? nextChildren : layoutChildren,
    removedNode,
    changed: Boolean(removedNode)
  };
}

export function moveLayoutNode(layoutChildren = [], sourceId, targetParentId, index) {
  if (!canDropLayoutNode(layoutChildren, sourceId, targetParentId)) {
    return { layoutChildren, changed: false };
  }

  const sourceMatch = findLayoutNode(layoutChildren, sourceId);
  if (!sourceMatch) {
    return { layoutChildren, changed: false };
  }

  const targetChildren = findLayoutParentChildren(layoutChildren, targetParentId);
  const normalizedIndex = clampInsertionIndex(index, targetChildren?.length ?? 0);
  if (
    sourceMatch.parentId === targetParentId &&
    (normalizedIndex === sourceMatch.index || normalizedIndex === sourceMatch.index + 1)
  ) {
    return { layoutChildren, changed: false };
  }

  const adjustedIndex =
    sourceMatch.parentId === targetParentId && sourceMatch.index < normalizedIndex
      ? normalizedIndex - 1
      : normalizedIndex;
  const removal = removeLayoutNode(layoutChildren, sourceId);
  if (!removal.changed) {
    return { layoutChildren, changed: false };
  }

  const insertion = insertLayoutNode(
    removal.layoutChildren,
    targetParentId,
    adjustedIndex,
    removal.removedNode
  );

  return insertion.changed ? insertion : { layoutChildren, changed: false };
}

export function updateLayoutNodeSize(layoutChildren = [], nodeId, sizePatch = {}) {
  if (!nodeId) {
    return { layoutChildren, changed: false };
  }

  let changed = false;
  function updateIn(nodes) {
    return nodes.map((entry) => {
      const cloned = cloneNode(entry);
      if (entry.id !== nodeId) {
        return { ...cloned, children: updateIn(entry.children) };
      }

      const nextSize = normalizeLayoutNodeSize({
        ...(entry.size ?? {}),
        ...sizePatch
      });
      changed =
        (entry.size?.minimalWidth ?? null) !== (nextSize?.minimalWidth ?? null) ||
        (entry.size?.minimalHeight ?? null) !== (nextSize?.minimalHeight ?? null);

      if (!nextSize) {
        const { size: _size, ...withoutSize } = cloned;
        return withoutSize;
      }

      return { ...cloned, size: nextSize };
    });
  }

  const nextChildren = updateIn(layoutChildren);
  return changed ? { layoutChildren: nextChildren, changed } : { layoutChildren, changed: false };
}

export function updateLayoutNodeCaption(layoutChildren = [], nodeId, caption) {
  if (!nodeId) {
    return { layoutChildren, changed: false };
  }

  let changed = false;
  function updateIn(nodes) {
    return nodes.map((entry) => {
      const cloned = cloneNode(entry);
      if (entry.id !== nodeId) {
        return { ...cloned, children: updateIn(entry.children) };
      }

      if (entry.atom !== LABEL_ATOM_ID) {
        return cloned;
      }

      const nextCaption = normalizeLayoutNodeCaption(caption, DEFAULT_LABEL_CAPTION);
      changed = cloned.caption !== nextCaption;
      return changed ? { ...cloned, caption: nextCaption } : cloned;
    });
  }

  const nextChildren = updateIn(layoutChildren);
  return changed ? { layoutChildren: nextChildren, changed } : { layoutChildren, changed: false };
}

function collectLayoutNodeIds(layoutChildren = [], usedIds = new Set()) {
  for (const node of layoutChildren) {
    if (node?.id) {
      usedIds.add(node.id);
    }
    collectLayoutNodeIds(node?.children, usedIds);
  }

  return usedIds;
}

export function duplicateLayoutSubtree(
  layoutChildren = [],
  sourceNode,
  nextLayoutNodeNumber = 1
) {
  const sourceAtom = normalizeAtom(sourceNode?.atom);
  if (!sourceAtom) {
    return {
      node: null,
      nextLayoutNodeNumber: normalizeNextNumber(nextLayoutNodeNumber)
    };
  }

  const usedIds = collectLayoutNodeIds(layoutChildren);
  let nextNumber = normalizeNextNumber(nextLayoutNodeNumber);

  function allocateId(atom) {
    const prefix = prefixForAtom(atom);
    let id = `${prefix}${nextNumber}`;
    while (usedIds.has(id)) {
      nextNumber += 1;
      id = `${prefix}${nextNumber}`;
    }
    usedIds.add(id);
    nextNumber += 1;
    return id;
  }

  function duplicateNode(node, parentAtom = BODY_LAYOUT_ROOT_ID) {
    const atom = normalizeAtom(node?.atom);
    if (!atom || !canParentAtomAcceptChildAtom(parentAtom, atom)) {
      return null;
    }

    const id = allocateId(atom);
    const size = normalizeLayoutNodeSize(node.size);
    const caption = normalizeLayoutNodeCaption(
      node.caption,
      builderAtomMetadata(atom)?.defaultCaption
    );
    const children = canLayoutAtomHaveChildren(atom) && Array.isArray(node.children)
      ? node.children
          .map((child) => duplicateNode(child, atom))
          .filter(Boolean)
      : [];

    return {
      id,
      atom,
      styleVariant: canonicalStyleVariant(atom),
      ...(caption != null ? { caption } : {}),
      ...(size ? { size } : {}),
      children
    };
  }

  return {
    node: duplicateNode(sourceNode),
    nextLayoutNodeNumber: nextNumber
  };
}

export function resolveLayoutPasteTarget(
  layoutChildren = [],
  selectedAnchor = BODY_LAYOUT_ROOT_ID,
  sourceAtom = null
) {
  const atom = normalizeAtom(sourceAtom);
  if (!atom) {
    return null;
  }

  const selectedParentChildren = findLayoutParentChildren(layoutChildren, selectedAnchor);
  if (
    selectedParentChildren &&
    canParentAcceptAtom(layoutChildren, selectedAnchor, atom)
  ) {
    return {
      parentId: selectedAnchor,
      index: selectedParentChildren.length
    };
  }

  const selectedNode = findLayoutNode(layoutChildren, selectedAnchor);
  if (
    selectedNode &&
    canParentAcceptAtom(layoutChildren, selectedNode.parentId, atom)
  ) {
    return {
      parentId: selectedNode.parentId,
      index: selectedNode.index + 1
    };
  }

  return canParentAcceptAtom(layoutChildren, BODY_LAYOUT_ROOT_ID, atom)
    ? {
        parentId: BODY_LAYOUT_ROOT_ID,
        index: layoutChildren.length
      }
    : null;
}

export function pasteLayoutSubtree(
  layoutChildren = [],
  sourceNode,
  selectedAnchor = BODY_LAYOUT_ROOT_ID,
  nextLayoutNodeNumber = 1
) {
  const target = resolveLayoutPasteTarget(layoutChildren, selectedAnchor, sourceNode?.atom);
  if (!target) {
    return {
      layoutChildren,
      changed: false,
      pastedNode: null,
      nextLayoutNodeNumber: normalizeNextNumber(nextLayoutNodeNumber)
    };
  }

  const duplication = duplicateLayoutSubtree(layoutChildren, sourceNode, nextLayoutNodeNumber);
  if (!duplication.node) {
    return {
      layoutChildren,
      changed: false,
      pastedNode: null,
      nextLayoutNodeNumber: duplication.nextLayoutNodeNumber
    };
  }

  const insertion = insertLayoutNode(
    layoutChildren,
    target.parentId,
    target.index,
    duplication.node
  );

  return insertion.changed
    ? {
        ...insertion,
        pastedNode: duplication.node,
        nextLayoutNodeNumber: duplication.nextLayoutNodeNumber
      }
    : {
        layoutChildren,
        changed: false,
        pastedNode: null,
        nextLayoutNodeNumber: normalizeNextNumber(nextLayoutNodeNumber)
      };
}

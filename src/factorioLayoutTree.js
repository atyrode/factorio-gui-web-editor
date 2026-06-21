export const BODY_LAYOUT_ROOT_ID = "gui_window_body";
export const FRAME_ATOM_ID = "frame";
export const INSIDE_DEEP_FRAME_STYLE_VARIANT = "inside-deep-frame";
export const FRAME_ID_PREFIX = "gui_frame_";
export const HORIZONTAL_FLOW_ATOM_ID = "horizontal-flow";
export const GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT = "generic-horizontal-flow";
export const HORIZONTAL_FLOW_ID_PREFIX = "gui_horizontal_flow_";
export const LAYOUT_NODE_SIZE_LIMITS = Object.freeze({
  minimalWidth: Object.freeze({ min: 48, max: 800 }),
  minimalHeight: Object.freeze({ min: 48, max: 600 })
});

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

function canonicalStyleVariant(atom) {
  return atom === FRAME_ATOM_ID
    ? INSIDE_DEEP_FRAME_STYLE_VARIANT
    : GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT;
}

function prefixForAtom(atom) {
  return atom === FRAME_ATOM_ID
    ? FRAME_ID_PREFIX
    : HORIZONTAL_FLOW_ID_PREFIX;
}

function normalizeAtom(atom, parentAtom) {
  if (atom === FRAME_ATOM_ID || atom === HORIZONTAL_FLOW_ATOM_ID) {
    return atom;
  }

  if (atom != null) {
    return null;
  }

  return parentAtom === FRAME_ATOM_ID
    ? HORIZONTAL_FLOW_ATOM_ID
    : FRAME_ATOM_ID;
}

function cloneNode(node) {
  const size = normalizeLayoutNodeSize(node.size);
  return {
    id: node.id,
    atom: node.atom,
    styleVariant: canonicalStyleVariant(node.atom),
    ...(size ? { size } : {}),
    children: node.children.map(cloneNode)
  };
}

function clampInsertionIndex(index, length) {
  const numberValue = Number(index);
  if (!Number.isFinite(numberValue)) {
    return length;
  }

  return Math.min(Math.max(0, Math.round(numberValue)), length);
}

function createLayoutSpec(atom, nodeNumber) {
  const safeNumber = normalizeNextNumber(nodeNumber);

  return {
    id: `${prefixForAtom(atom)}${safeNumber}`,
    atom,
    styleVariant: canonicalStyleVariant(atom),
    children: []
  };
}

export function createFrameSpec(nodeNumber) {
  return createLayoutSpec(FRAME_ATOM_ID, nodeNumber);
}

export function createHorizontalFlowSpec(nodeNumber) {
  return createLayoutSpec(HORIZONTAL_FLOW_ATOM_ID, nodeNumber);
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

  function normalizeNode(node, parentAtom = HORIZONTAL_FLOW_ATOM_ID) {
    if (!isObject(node)) {
      return null;
    }

    let atom = normalizeAtom(node.atom, parentAtom);
    if (atom == null) {
      return null;
    }

    const acceptedAtom = parentAtom === FRAME_ATOM_ID
      ? HORIZONTAL_FLOW_ATOM_ID
      : FRAME_ATOM_ID;
    if (acceptedAtom && atom !== acceptedAtom) {
      atom = acceptedAtom;
    }

    if (atom !== FRAME_ATOM_ID && atom !== HORIZONTAL_FLOW_ATOM_ID) {
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

    const children = Array.isArray(node.children)
      ? node.children.map((child) => normalizeNode(child, atom)).filter(Boolean)
      : [];

    const size = normalizeLayoutNodeSize(node.size);

    return {
      id,
      atom,
      styleVariant: canonicalStyleVariant(atom),
      ...(size ? { size } : {}),
      children
    };
  }

  const layoutChildren = Array.isArray(value?.layoutChildren)
    ? value.layoutChildren
        .map((node) => normalizeNode(node, HORIZONTAL_FLOW_ATOM_ID))
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
    return HORIZONTAL_FLOW_ATOM_ID;
  }

  return findLayoutNode(layoutChildren, parentId)?.node.atom ?? null;
}

export function acceptedLayoutChildAtom(layoutChildren = [], parentId) {
  const parentAtom = findLayoutParentAtom(layoutChildren, parentId);

  if (parentAtom === HORIZONTAL_FLOW_ATOM_ID) {
    return FRAME_ATOM_ID;
  }

  if (parentAtom === FRAME_ATOM_ID) {
    return HORIZONTAL_FLOW_ATOM_ID;
  }

  return null;
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
  if (draggedAtom !== acceptedLayoutChildAtom(layoutChildren, targetParentId)) {
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

  const adjustedIndex =
    sourceMatch.parentId === targetParentId && sourceMatch.index < index ? index - 1 : index;
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

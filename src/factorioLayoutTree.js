export const BODY_LAYOUT_ROOT_ID = "gui_window_body";
export const HORIZONTAL_FLOW_ATOM_ID = "horizontal-flow";
export const GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT = "generic-horizontal-flow";
export const HORIZONTAL_FLOW_ID_PREFIX = "gui_horizontal_flow_";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nodeNumberFromId(id) {
  if (typeof id !== "string" || !id.startsWith(HORIZONTAL_FLOW_ID_PREFIX)) {
    return null;
  }

  const rawValue = id.slice(HORIZONTAL_FLOW_ID_PREFIX.length);
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

function cloneNode(node) {
  return {
    id: node.id,
    atom: HORIZONTAL_FLOW_ATOM_ID,
    styleVariant: GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
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

export function createHorizontalFlowSpec(nodeNumber) {
  const safeNumber = normalizeNextNumber(nodeNumber);

  return {
    id: `${HORIZONTAL_FLOW_ID_PREFIX}${safeNumber}`,
    atom: HORIZONTAL_FLOW_ATOM_ID,
    styleVariant: GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
    children: []
  };
}

export function normalizeLayoutState(value = {}) {
  const usedIds = new Set();
  let nextNumber = normalizeNextNumber(value?.nextLayoutNodeNumber);

  function allocateId() {
    let id = `${HORIZONTAL_FLOW_ID_PREFIX}${nextNumber}`;
    while (usedIds.has(id)) {
      nextNumber += 1;
      id = `${HORIZONTAL_FLOW_ID_PREFIX}${nextNumber}`;
    }
    usedIds.add(id);
    nextNumber += 1;
    return id;
  }

  function normalizeNode(node) {
    if (!isObject(node) || node.atom !== HORIZONTAL_FLOW_ATOM_ID) {
      return null;
    }

    const idNumber = nodeNumberFromId(node.id);
    let id = null;
    if (idNumber != null && !usedIds.has(node.id)) {
      id = node.id;
      usedIds.add(id);
      nextNumber = Math.max(nextNumber, idNumber + 1);
    } else {
      id = allocateId();
    }

    const children = Array.isArray(node.children)
      ? node.children.map(normalizeNode).filter(Boolean)
      : [];

    return {
      id,
      atom: HORIZONTAL_FLOW_ATOM_ID,
      styleVariant: GENERIC_HORIZONTAL_FLOW_STYLE_VARIANT,
      children
    };
  }

  const layoutChildren = Array.isArray(value?.layoutChildren)
    ? value.layoutChildren.map(normalizeNode).filter(Boolean)
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

export function isLayoutDescendant(layoutChildren = [], ancestorId, nodeId) {
  const ancestor = findLayoutNode(layoutChildren, ancestorId)?.node;
  if (!ancestor) {
    return false;
  }

  return Boolean(findLayoutNode(ancestor.children, nodeId, ancestor.id));
}

export function canDropLayoutNode(layoutChildren = [], sourceId, targetParentId) {
  if (targetParentId !== BODY_LAYOUT_ROOT_ID && !findLayoutNode(layoutChildren, targetParentId)) {
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
  if (!node || !canDropLayoutNode(layoutChildren, null, parentId)) {
    return { layoutChildren, changed: false };
  }

  const normalizedNode = cloneNode({
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


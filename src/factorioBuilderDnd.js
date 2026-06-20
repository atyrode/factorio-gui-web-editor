export const HORIZONTAL_FLOW_BUILDER_DND_TYPE = "horizontal-flow-builder";

const VALID_DROP_SURFACES = new Set(["list", "canvas"]);

export function paletteDragData() {
  return {
    builderDrag: {
      kind: "palette"
    }
  };
}

export function nodeDragData(sourceId) {
  return {
    builderDrag: {
      kind: "node",
      sourceId
    }
  };
}

export function dropTargetData({ parentId, index, surface }) {
  return {
    builderDropTarget: {
      parentId,
      index,
      surface
    }
  };
}

export function readBuilderDrag(source) {
  const drag = source?.data?.builderDrag;

  if (drag?.kind === "palette") {
    return { kind: "palette" };
  }

  if (drag?.kind === "node" && typeof drag.sourceId === "string") {
    return { kind: "node", sourceId: drag.sourceId };
  }

  return null;
}

export function readBuilderDropTarget(target) {
  const dropTarget = target?.data?.builderDropTarget;

  if (
    !dropTarget ||
    typeof dropTarget.parentId !== "string" ||
    !VALID_DROP_SURFACES.has(dropTarget.surface)
  ) {
    return null;
  }

  return {
    parentId: dropTarget.parentId,
    index: Number(dropTarget.index),
    surface: dropTarget.surface
  };
}

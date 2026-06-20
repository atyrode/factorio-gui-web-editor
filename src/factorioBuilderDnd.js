export const HORIZONTAL_FLOW_BUILDER_DND_TYPE = "horizontal-flow-builder";

const VALID_DROP_SURFACES = new Set(["list", "canvas"]);
const VALID_PALETTE_ATOMS = new Set(["frame", "horizontal-flow"]);

export function paletteDragData(atom = "frame") {
  return {
    builderDrag: {
      kind: "palette",
      atom
    }
  };
}

export function nodeDragData(sourceId, atom = null) {
  return {
    builderDrag: {
      kind: "node",
      sourceId,
      atom
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
    return {
      kind: "palette",
      atom: VALID_PALETTE_ATOMS.has(drag.atom) ? drag.atom : "frame"
    };
  }

  if (drag?.kind === "node" && typeof drag.sourceId === "string") {
    return {
      kind: "node",
      sourceId: drag.sourceId,
      atom: VALID_PALETTE_ATOMS.has(drag.atom) ? drag.atom : null
    };
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

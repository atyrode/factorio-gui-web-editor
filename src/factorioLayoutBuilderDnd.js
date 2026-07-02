import { BUILDER_PALETTE_ATOMS } from "./factorioLayoutTree.js";

export const LAYOUT_BUILDER_DND_TYPE = "application/x-factorio-gui-builder-palette";
export const LAYOUT_BUILDER_NODE_DND_TYPE = "application/x-factorio-gui-builder-node";

const VALID_DROP_SURFACES = new Set(["list", "canvas"]);
const VALID_PALETTE_ATOMS = new Set(BUILDER_PALETTE_ATOMS);

function dataTransferTypes(dataTransfer) {
  return Array.from(dataTransfer?.types ?? []);
}

export function normalizeBuilderPaletteAtom(atom = "frame") {
  return VALID_PALETTE_ATOMS.has(atom) ? atom : null;
}

export function paletteAtomDataTransferFormat(atom = "frame") {
  return `${LAYOUT_BUILDER_DND_TYPE}-${normalizeBuilderPaletteAtom(atom) ?? "frame"}`;
}

export function builderNodeDataTransferFormat(sourceId, atom = "frame") {
  const normalizedAtom = normalizeBuilderPaletteAtom(atom);
  return typeof sourceId === "string" && normalizedAtom
    ? `${LAYOUT_BUILDER_NODE_DND_TYPE}-${sourceId}-${normalizedAtom}`
    : LAYOUT_BUILDER_NODE_DND_TYPE;
}

export function writeBuilderPaletteDrag(dataTransfer, atom = "frame") {
  const normalizedAtom = normalizeBuilderPaletteAtom(atom);
  if (!dataTransfer || !normalizedAtom) {
    return null;
  }

  dataTransfer.effectAllowed = "copy";
  dataTransfer.dropEffect = "copy";
  dataTransfer.setData(LAYOUT_BUILDER_DND_TYPE, normalizedAtom);
  dataTransfer.setData(paletteAtomDataTransferFormat(normalizedAtom), normalizedAtom);
  dataTransfer.setData("text/plain", normalizedAtom);

  return { kind: "palette", atom: normalizedAtom };
}

export function readBuilderPaletteDrag(dataTransfer, readPayload = true) {
  if (!dataTransfer) {
    return null;
  }

  if (readPayload) {
    const atom = normalizeBuilderPaletteAtom(dataTransfer.getData(LAYOUT_BUILDER_DND_TYPE));
    if (atom) {
      return { kind: "palette", atom };
    }
  }

  const types = dataTransferTypes(dataTransfer);
  for (const atom of VALID_PALETTE_ATOMS) {
    if (types.includes(paletteAtomDataTransferFormat(atom))) {
      return { kind: "palette", atom };
    }
  }

  return null;
}

export function writeBuilderNodeDrag(dataTransfer, { sourceId, atom } = {}) {
  const normalizedAtom = normalizeBuilderPaletteAtom(atom);
  if (!dataTransfer || typeof sourceId !== "string" || !normalizedAtom) {
    return null;
  }

  const payload = JSON.stringify({ sourceId, atom: normalizedAtom });
  dataTransfer.effectAllowed = "move";
  dataTransfer.dropEffect = "move";
  dataTransfer.setData(LAYOUT_BUILDER_NODE_DND_TYPE, payload);
  dataTransfer.setData(builderNodeDataTransferFormat(sourceId, normalizedAtom), payload);
  dataTransfer.setData("text/plain", sourceId);

  return { kind: "canvas", sourceId, atom: normalizedAtom };
}

export function readBuilderNodeDrag(dataTransfer, readPayload = true) {
  if (!dataTransfer) {
    return null;
  }

  if (readPayload) {
    try {
      const payload = JSON.parse(dataTransfer.getData(LAYOUT_BUILDER_NODE_DND_TYPE) || "null");
      const atom = normalizeBuilderPaletteAtom(payload?.atom);
      if (typeof payload?.sourceId === "string" && atom) {
        return { kind: "canvas", sourceId: payload.sourceId, atom };
      }
    } catch {
      return null;
    }
  }

  const types = dataTransferTypes(dataTransfer);
  for (const type of types) {
    if (!type.startsWith(`${LAYOUT_BUILDER_NODE_DND_TYPE}-`)) {
      continue;
    }

    for (const atom of VALID_PALETTE_ATOMS) {
      const suffix = `-${atom}`;
      if (!type.endsWith(suffix)) {
        continue;
      }

      const sourceId = type.slice(LAYOUT_BUILDER_NODE_DND_TYPE.length + 1, -suffix.length);
      if (sourceId) {
        return { kind: "canvas", sourceId, atom };
      }
    }
  }

  return null;
}

export function createBuilderDropTarget({ parentId, index, surface = "canvas" }) {
  if (
    typeof parentId !== "string" ||
    !VALID_DROP_SURFACES.has(surface)
  ) {
    return null;
  }

  return {
    parentId,
    index: Number(index),
    surface
  };
}

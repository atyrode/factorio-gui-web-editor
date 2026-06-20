export const atomFieldStates = Object.freeze({
  captured: {
    label: "Captured",
    description: "Observed from Factorio captures or another trusted runtime source."
  },
  official: {
    label: "Official",
    description: "Confirmed by official Factorio API documentation."
  },
  hardcoded: {
    label: "Hardcoded",
    description: "Temporarily fixed to a captured fixture value; needs model or renderer logic."
  },
  inferred: {
    label: "Inferred",
    description: "Reasoned from captures but not yet confirmed by enough examples or official docs."
  },
  editorOwned: {
    label: "Editor-owned",
    description: "Owned by the web editor model rather than copied from Factorio runtime output."
  },
  implemented: {
    label: "Implemented",
    description: "Represented in the editor model, renderer, inspector, and export for the current scope."
  },
  missing: {
    label: "Missing",
    description: "Known field or behavior whose meaning or implementation is not determined yet."
  },
  notImplemented: {
    label: "Not implemented",
    description: "Captured or known in Factorio, but not represented in the editor yet."
  },
  planned: {
    label: "Planned",
    description: "Required for the editor, but not part of the current implementation pass."
  },
  notApplicable: {
    label: "N/A",
    description: "Not applicable for this atom."
  }
});

export const atomValueTypes = Object.freeze({
  boolean: "boolean",
  className: "factorio-class-name",
  color: "factorio-color",
  cssLength: "css-length",
  guiPrimitive: "gui-primitive",
  integer: "integer",
  nodeList: "gui-node-list",
  nodeReference: "gui-node-reference",
  rectangle2i: "rectangle2i",
  size2i: "size2i",
  string: "string",
  styleName: "factorio-style-name",
  unknown: "unknown",
  vector2i: "vector2i"
});

export const atomProgressDimensions = Object.freeze([
  {
    id: "evidence",
    label: "Evidence",
    description: "How much useful in-game/API evidence has been captured and transcribed."
  },
  {
    id: "model",
    label: "Model",
    description: "How much of the atom is represented in the structured editor model."
  },
  {
    id: "renderer",
    label: "Renderer",
    description: "How closely the browser preview implements the atom."
  },
  {
    id: "luaExport",
    label: "Lua",
    description: "How much of the atom can be emitted as Factorio Lua structure/style."
  },
  {
    id: "behavior",
    label: "Behavior",
    description: "How much runtime interaction behavior is modeled."
  }
]);

export const atomProgressCheckStates = Object.freeze({
  done: {
    label: "Done",
    score: 1
  },
  partial: {
    label: "Partial",
    score: 0.5
  },
  todo: {
    label: "Todo",
    score: 0
  },
  blocked: {
    label: "Blocked",
    score: 0
  }
});

function assertKnownState(state) {
  if (!atomFieldStates[state]) {
    throw new Error(`Unknown atom field state: ${state}`);
  }
}

function assertKnownType(type) {
  if (!Object.values(atomValueTypes).includes(type)) {
    throw new Error(`Unknown atom field type: ${type}`);
  }
}

function assertKnownProgressDimension(dimension) {
  if (!atomProgressDimensions.some((entry) => entry.id === dimension)) {
    throw new Error(`Unknown atom progress dimension: ${dimension}`);
  }
}

function assertKnownProgressCheckState(state) {
  if (!atomProgressCheckStates[state]) {
    throw new Error(`Unknown atom progress check state: ${state}`);
  }
}

function freezeArray(value) {
  return Object.freeze([...(value ?? [])]);
}

function clampPercent(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function capturedFieldPercent(fields) {
  const relevantFields = fields.filter((entry) => entry.state !== "notApplicable");
  const capturedFields = relevantFields.filter((entry) => entry.state === "captured");
  if (!relevantFields.length) {
    return 0;
  }

  return Math.round((capturedFields.length / relevantFields.length) * 100);
}

function progressCheckPercent(checks) {
  if (!checks.length) {
    return null;
  }

  const score = checks.reduce(
    (sum, check) => sum + atomProgressCheckStates[check.state].score,
    0
  );
  return Math.round((score / checks.length) * 100);
}

function normalizeAtomProgress(fields, progress = {}, progressChecks = []) {
  const fallbackEvidence = capturedFieldPercent(fields);
  return Object.freeze(
    atomProgressDimensions.map((dimension) => {
      const dimensionChecks = progressChecks.filter(
        (check) => check.dimension === dimension.id
      );
      const checkPercent = progressCheckPercent(dimensionChecks);

      return {
        ...dimension,
        value: clampPercent(
          checkPercent ??
            progress[dimension.id] ??
            (dimension.id === "evidence" ? fallbackEvidence : 0)
        )
      };
    })
  );
}

export class AtomFieldDefinition {
  constructor({
    name,
    state = "missing",
    type = atomValueTypes.unknown,
    example = null,
    nullable = true,
    note = "",
    source = null
  }) {
    assertKnownState(state);
    assertKnownType(type);

    this.name = name;
    this.state = state;
    this.type = type;
    this.example = example;
    this.nullable = nullable;
    this.note = note;
    this.source = source;

    Object.freeze(this);
  }
}

export class AtomCaptureDefinition {
  constructor({
    id,
    label,
    source = "Ctrl+F6",
    screenTitle = null,
    className = null,
    style = null,
    rows = [],
    children = []
  }) {
    this.id = id;
    this.label = label;
    this.source = source;
    this.screenTitle = screenTitle;
    this.className = className;
    this.style = style;
    this.rows = freezeArray(rows);
    this.children = freezeArray(children);

    Object.freeze(this);
  }
}

export class AtomProgressCheckDefinition {
  constructor({
    dimension,
    label,
    state = "todo",
    note = ""
  }) {
    assertKnownProgressDimension(dimension);
    assertKnownProgressCheckState(state);

    this.dimension = dimension;
    this.label = label;
    this.state = state;
    this.note = note;

    Object.freeze(this);
  }
}

export class FactorioAtomDefinition {
  constructor({
    id,
    name,
    primitive,
    style,
    availability,
    summary,
    className = null,
    derivedFrom = null,
    fields = [],
    captures = [],
    progress = {},
    progressChecks = [],
    tracking = {}
  }) {
    const normalizedFields = freezeArray(fields);
    const normalizedProgressChecks = freezeArray(progressChecks);

    this.id = id;
    this.name = name;
    this.primitive = primitive;
    this.style = style;
    this.availability = availability;
    this.summary = summary;
    this.className = className;
    this.derivedFrom = derivedFrom;
    this.fields = normalizedFields;
    this.captures = freezeArray(captures);
    this.progressChecks = normalizedProgressChecks;
    this.progress = normalizeAtomProgress(
      normalizedFields,
      progress,
      normalizedProgressChecks
    );
    this.tracking = Object.freeze({
      document: null,
      implemented: [],
      assumptions: [],
      hardcoded: [],
      missing: [],
      notes: [],
      ...tracking
    });

    Object.freeze(this);
  }
}

export function atomField(name, state, note, options = {}) {
  return new AtomFieldDefinition({
    name,
    state,
    note,
    ...options
  });
}

export function atomCapture(options) {
  return new AtomCaptureDefinition(options);
}

export function atomProgressCheck(options) {
  return new AtomProgressCheckDefinition(options);
}

export function atomDefinition(options) {
  return new FactorioAtomDefinition(options);
}

export function atomCompletion(atom) {
  if (!atom?.progress?.length) {
    return 0;
  }

  const total = atom.progress.reduce((sum, dimension) => sum + dimension.value, 0);
  return Math.round(total / atom.progress.length);
}

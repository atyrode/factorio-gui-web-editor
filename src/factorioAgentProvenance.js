export const FACTORIO_AGENT_PROVENANCE_SCHEMA = "labtorio-agent-provenance.v0";
export const FACTORIO_AGENT_PROVENANCE_AUTHOR_AGENT = "agent";
export const FACTORIO_AGENT_PROVENANCE_AUTHOR_OPERATOR = "operator";

const MAX_PROVENANCE_ENTRIES = 40;
const MAX_TEXT_LENGTH = 120;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, MAX_TEXT_LENGTH);
}

function normalizeIsoTime(value, fallback = null) {
  const text = typeof value === "string" ? value : "";
  const parsed = Date.parse(text);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }

  return fallback;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const text = value.trim();
    if (!text || seen.has(text)) {
      continue;
    }

    seen.add(text);
    result.push(text.slice(0, MAX_TEXT_LENGTH));
  }

  return result;
}

function normalizeEntry(value) {
  if (!isObject(value)) {
    return null;
  }

  const at = normalizeIsoTime(value.at);
  if (!at) {
    return null;
  }

  return {
    at,
    author: value.author === FACTORIO_AGENT_PROVENANCE_AUTHOR_OPERATOR
      ? FACTORIO_AGENT_PROVENANCE_AUTHOR_OPERATOR
      : FACTORIO_AGENT_PROVENANCE_AUTHOR_AGENT,
    label: normalizeText(value.label, "Agent"),
    commandTypes: uniqueStrings(value.commandTypes),
    touchedNodeIds: uniqueStrings(value.touchedNodeIds),
    summary: normalizeText(value.summary, "Updated through the editor API.")
  };
}

export function normalizeFactorioAgentProvenance(value = null) {
  const source = isObject(value) ? value : {};
  const entries = Array.isArray(source.entries)
    ? source.entries.map(normalizeEntry).filter(Boolean).slice(-MAX_PROVENANCE_ENTRIES)
    : [];

  return {
    schema: FACTORIO_AGENT_PROVENANCE_SCHEMA,
    entries
  };
}

function touchedNodeIdsFromCommand(command = {}, result = {}) {
  return uniqueStrings([
    command.nodeId,
    command.sourceId,
    command.targetId,
    command.anchor,
    command.parentId,
    command.targetParentId,
    result.value?.nodeId,
    result.value?.parentId,
    result.value?.selectedAnchor
  ]);
}

export function createFactorioAgentProvenanceEntry({
  commands = [],
  results = [],
  at = new Date(),
  author = FACTORIO_AGENT_PROVENANCE_AUTHOR_AGENT,
  label = "Agent API",
  summary = null
} = {}) {
  const commandTypes = uniqueStrings(commands.map((command) => command?.type));
  const touchedNodeIds = uniqueStrings(
    commands.flatMap((command, index) => touchedNodeIdsFromCommand(command, results[index]))
  );

  return normalizeEntry({
    at: at instanceof Date ? at.toISOString() : at,
    author,
    label,
    commandTypes,
    touchedNodeIds,
    summary: summary ??
      `${commandTypes.length || commands.length} command type${(commandTypes.length || commands.length) === 1 ? "" : "s"} applied through the editor API.`
  });
}

export function appendFactorioAgentProvenanceEntry(provenance, entry) {
  const normalized = normalizeFactorioAgentProvenance(provenance);
  const normalizedEntry = normalizeEntry(entry);
  if (!normalizedEntry) {
    return normalized;
  }

  return normalizeFactorioAgentProvenance({
    entries: [
      ...normalized.entries,
      normalizedEntry
    ]
  });
}

export function latestFactorioAgentProvenanceEntry(provenance) {
  const normalized = normalizeFactorioAgentProvenance(provenance);
  return normalized.entries.at(-1) ?? null;
}

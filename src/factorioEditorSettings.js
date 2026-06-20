export const DEFAULT_LAYOUT_SETTINGS = Object.freeze({
  horizontalFlowSpacing: 6,
  horizontalFlowMinimumWidth: 168,
  nestedHorizontalFlowMinimumWidth: 144,
  horizontalFlowMinimumHeight: 72,
  horizontalFlowPadding: 8
});

export const LAYOUT_SETTING_LIMITS = Object.freeze({
  horizontalFlowSpacing: Object.freeze({ min: 0, max: 64 }),
  horizontalFlowMinimumWidth: Object.freeze({ min: 48, max: 800 }),
  nestedHorizontalFlowMinimumWidth: Object.freeze({ min: 48, max: 800 }),
  horizontalFlowMinimumHeight: Object.freeze({ min: 0, max: 600 }),
  horizontalFlowPadding: Object.freeze({ min: 0, max: 64 })
});

function clampInteger(value, { min, max }, fallback) {
  const numberValue = Number(value);
  const safeValue = Number.isFinite(numberValue) ? numberValue : fallback;
  return Math.min(max, Math.max(min, Math.round(safeValue)));
}

export function normalizeLayoutSettings(value = {}) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(DEFAULT_LAYOUT_SETTINGS).map(([key, fallback]) => [
        key,
        clampInteger(value?.[key], LAYOUT_SETTING_LIMITS[key], fallback)
      ])
    )
  );
}

export function isDefaultLayoutSettings(value = {}) {
  const normalized = normalizeLayoutSettings(value);
  return Object.entries(DEFAULT_LAYOUT_SETTINGS).every(
    ([key, defaultValue]) => normalized[key] === defaultValue
  );
}

import catalogData from "./generated/factorioStyleCatalog.generated.json";

export const FACTORIO_STYLE_CATALOG_SCHEMA = "factorio-style-catalog.v0";

export const factorioStyleCatalog = Object.freeze(catalogData);

export function getFactorioStyle(styleName) {
  return factorioStyleCatalog.styles[styleName] ?? null;
}

export function listFactorioStyles() {
  return Object.values(factorioStyleCatalog.styles);
}

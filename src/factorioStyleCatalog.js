export const FACTORIO_STYLE_CATALOG_SCHEMA = "factorio-style-catalog.v0";

export const factorioStyleCatalog = Object.freeze({
  schema: FACTORIO_STYLE_CATALOG_SCHEMA,
  styles: Object.freeze({})
});

export function getFactorioStyle(styleName) {
  return factorioStyleCatalog.styles[styleName] ?? null;
}

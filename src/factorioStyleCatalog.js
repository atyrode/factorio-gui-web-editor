import catalogData from "./generated/factorioStyleCatalog.generated.json" with { type: "json" };

export const FACTORIO_STYLE_CATALOG_SCHEMA = "factorio-style-catalog.v0";
export const FACTORIO_STYLE_CATALOG_SOURCE = "factorio-style-catalog";

export const factorioStyleCatalog = Object.freeze(catalogData);

export function getFactorioStyle(styleName) {
  return factorioStyleCatalog.styles[styleName] ?? null;
}

export function getFactorioStyleDeclared(styleName) {
  return getFactorioStyle(styleName)?.declared ?? null;
}

export function getFactorioStyleDeclaredFields(styleName) {
  return getFactorioStyleDeclared(styleName)?.fields ?? {};
}

export function getFactorioStyleResolvedFields(styleName) {
  return getFactorioStyle(styleName)?.resolvedFields ?? {};
}

export function getFactorioStyleType(styleName) {
  return getFactorioStyleDeclared(styleName)?.type ?? null;
}

export function getFactorioStyleParent(styleName) {
  return getFactorioStyleDeclared(styleName)?.parent ?? null;
}

export function listFactorioStyles() {
  return Object.values(factorioStyleCatalog.styles);
}

import type { ProductSnapshot, ShopSnapshot, DataQualityField } from "@shopee-research/shared";

export interface DataQualityResult extends DataQualityField {
  fieldName: string;
}

export function checkDataQuality(input: {
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
}): DataQualityResult[] {
  return [
    checkField("priceMin", input.product.priceMin),
    checkField("priceMax", input.product.priceMax),
    checkField("rating", input.product.rating),
    checkField("reviewCount", input.product.reviewCount),
    checkField("soldCount", input.product.soldCount),
    checkField("favoriteCount", input.product.favoriteCount),
    checkField("stock", input.product.stock),
    checkField("shippedFrom", input.product.shippedFrom),
    checkField("description", input.product.description),
    checkField("imageUrl", input.product.imageUrl),
    checkField("brand", input.product.brand),
    checkField("category", input.product.category),
    checkField("specificationJson", input.product.specificationJson),
    checkField("weight", input.product.weight.value),
    checkField("features", input.product.features.length > 0 ? `${input.product.features.length} features` : null),
    checkShopField("shopName", input.shop?.name ?? null),
    checkShopField("shopRating", input.shop?.rating ?? null),
    checkShopField("shopResponseRate", input.shop?.responseRate ?? null),
    checkShopField("shopStatus", input.shop?.primaryStatus ?? null),
  ];
}

function checkField(fieldName: string, value: unknown): DataQualityResult {
  const valueText = formatValue(value);
  let status: "available" | "unavailable" | "partial";
  if (value === null || value === undefined) {
    status = "unavailable";
  } else if (Array.isArray(value) && value.length === 0) {
    status = "unavailable";
  } else if (typeof value === "string" && value.trim().length === 0) {
    status = "unavailable";
  } else {
    status = "available";
  }
  return {
    fieldName,
    value: valueText,
    source: "extracted",
    confidence: status === "available" ? 0.9 : 0,
    status,
  };
}

function checkShopField(fieldName: string, value: unknown): DataQualityResult {
  const field = checkField(fieldName, value);
  return { ...field, source: "shop-extracted" };
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(value);
}

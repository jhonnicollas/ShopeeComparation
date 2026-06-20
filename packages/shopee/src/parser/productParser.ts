import type { ProductSnapshot, WeightExtraction } from "@shopee-research/shared";

export interface ParseProductInput {
  html?: string;
  json?: unknown;
  shopId: string;
  itemId: string;
  canonicalUrl: string;
}

const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
  /bearer\s+\S+/gi,
  /authorization\s*[:=]\s*\S+/gi,
];

function sanitizeForLog(msg: string): string {
  let sanitized = msg;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized.slice(0, 200);
}

function emptyWeight(): WeightExtraction {
  return { value: null, unit: null, rawText: null, source: null, confidence: 0 };
}

function emptyProduct(shopId: string, itemId: string, url: string): ProductSnapshot {
  return {
    shopeeItemId: itemId,
    shopeeShopId: shopId,
    title: null,
    brand: null,
    category: null,
    originalUrl: url,
    canonicalUrl: url,
    imageUrl: null,
    galleryJson: null,
    videoUrl: null,
    priceMin: null,
    priceMax: null,
    priceBeforeDiscount: null,
    discountText: null,
    rating: null,
    reviewCount: null,
    soldCount: null,
    favoriteCount: null,
    stock: null,
    shippedFrom: null,
    description: null,
    specificationJson: null,
    variationJson: null,
    weight: emptyWeight(),
    features: [],
    confidenceScore: 0,
  };
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function findJsonLdProduct(text: string): Record<string, unknown> | null {
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = jsonLdRegex.exec(text)) !== null) {
    const data = tryParseJson(match[1] ?? "");
    if (!data) continue;
    if (Array.isArray(data)) {
      for (const item of data) {
        const itemObj = item as Record<string, unknown> | null;
        if (itemObj && itemObj["@type"] === "Product") {
          return itemObj;
        }
      }
    } else if (typeof data === "object" && data !== null) {
      const dataObj = data as Record<string, unknown>;
      if (dataObj["@type"] === "Product") {
        return dataObj;
      }
    }
  }
  return null;
}

function extractPriceNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.,]/g, "").replace(/[.,]/g, "");
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.price === "number") return obj.price;
    if (typeof obj.price === "string") return extractPriceNumber(obj.price);
    if (typeof obj.lowPrice === "number") return obj.lowPrice;
    if (typeof obj.highPrice === "number") return obj.highPrice;
    if (typeof obj.value === "number") return obj.value;
  }
  return null;
}

function extractAggregateRating(obj: Record<string, unknown>): { rating: number | null; reviewCount: number | null } {
  const agg = obj["aggregateRating"];
  if (!agg || typeof agg !== "object") return { rating: null, reviewCount: null };
  const a = agg as Record<string, unknown>;
  return {
    rating: typeof a.ratingValue === "number" ? a.ratingValue : null,
    reviewCount: typeof a.reviewCount === "number" ? a.reviewCount : null,
  };
}

function extractFromJsonLd(obj: Record<string, unknown>, snapshot: ProductSnapshot): ProductSnapshot {
  const result: ProductSnapshot = { ...snapshot };
  if (typeof obj.name === "string") result.title = obj.name;
  if (typeof obj.brand === "string") result.brand = obj.brand;
  if (typeof obj.description === "string") result.description = obj.description;
  if (typeof obj.sku === "string") result.shopeeItemId = obj.sku;
  if (typeof obj.category === "string") result.category = obj.category;
  if (typeof obj.image === "string") result.imageUrl = obj.image;
  if (Array.isArray(obj.image)) {
    const first = obj.image[0];
    if (typeof first === "string") result.imageUrl = first;
    if (Array.isArray(first) && typeof first[0] === "string") result.imageUrl = first[0] as string;
  }
  const price = extractPriceNumber(obj.offers);
  if (price !== null) {
    result.priceMin = price;
    result.priceMax = price;
  }
  const { rating, reviewCount } = extractAggregateRating(obj);
  if (rating !== null) result.rating = rating;
  if (reviewCount !== null) result.reviewCount = reviewCount;
  return result;
}

function extractFromHtml(html: string, snapshot: ProductSnapshot): ProductSnapshot {
  const result: ProductSnapshot = { ...snapshot };
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch?.[1]) result.title = titleMatch[1].trim();
  const priceMatches = [...html.matchAll(/Rp\s*([\d.,]+)/gi)];
  if (priceMatches.length > 0) {
    const prices = priceMatches
      .map((m) => Number(m[1]?.replace(/[.,]/g, "") ?? ""))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length > 0) {
      result.priceMin = Math.min(...prices);
      result.priceMax = Math.max(...prices);
    }
  }
  const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:rating|bintang|stars?)/i);
  if (ratingMatch?.[1]) result.rating = Number(ratingMatch[1]);
  const reviewMatch = html.match(/(\d+)\s*(?:review|ulasan)/i);
  if (reviewMatch?.[1]) result.reviewCount = Number(reviewMatch[1]);
  const soldMatch = html.match(/(\d+)\s*(?:terjual|sold)/i);
  if (soldMatch?.[1]) result.soldCount = Number(soldMatch[1]);
  const brandMatch = html.match(/<meta[^>]+(?:property|name)=["']product:brand["'][^>]+content=["']([^"']+)/i);
  if (brandMatch?.[1]) result.brand = brandMatch[1];
  const catMatch = html.match(/<meta[^>]+(?:property|name)=["']product:category["'][^>]+content=["']([^"']+)/i);
  if (catMatch?.[1]) result.category = catMatch[1];
  const descMatch = html.match(/<meta[^>]+(?:property|name)=["']description["'][^>]+content=["']([^"']+)/i);
  if (descMatch?.[1]) result.description = descMatch[1];
  const imgMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)/i);
  if (imgMatch?.[1]) result.imageUrl = imgMatch[1];
  const stockMatch = html.match(/(\d+)\s*(?:stok|stock)\s*(?:tersedia|tersisa|available)/i);
  if (stockMatch?.[1]) result.stock = Number(stockMatch[1]);
  const shipMatch = html.match(/(?:dikirim|dari|shipped\s*from)["'\s:]+([^<"']+)/i);
  if (shipMatch?.[1]) result.shippedFrom = shipMatch[1].trim();
  return result;
}

function calculateConfidence(snapshot: ProductSnapshot): number {
  const fields = [snapshot.title, snapshot.priceMin, snapshot.rating, snapshot.reviewCount, snapshot.soldCount];
  const present = fields.filter((f) => f !== null).length;
  return present / fields.length;
}

export class ProductParser {
  parseProduct(input: ParseProductInput): ProductSnapshot {
    const base = emptyProduct(input.shopId, input.itemId, input.canonicalUrl);
    let result = base;
    try {
      if (input.html) {
        const jsonLd = findJsonLdProduct(input.html);
        if (jsonLd) {
          result = extractFromJsonLd(jsonLd, result);
          if (result.title || result.priceMin) {
            result.confidenceScore = Math.max(result.confidenceScore, 0.85);
          }
        }
        result = extractFromHtml(input.html, result);
        if (result.title || result.priceMin) {
          result.confidenceScore = Math.max(result.confidenceScore, 0.6);
        }
      }
      if (input.json && typeof input.json === "object" && input.json !== null) {
        const jsonObj = input.json as Record<string, unknown>;
        if (jsonObj["@type"] === "Product") {
          result = extractFromJsonLd(jsonObj, result);
          result.confidenceScore = Math.max(result.confidenceScore, 0.9);
        } else if (jsonObj.data && typeof jsonObj.data === "object") {
          result = extractFromJsonLd(jsonObj.data as Record<string, unknown>, result);
          result.confidenceScore = Math.max(result.confidenceScore, 0.85);
        } else if (jsonObj.item && typeof jsonObj.item === "object") {
          const item = jsonObj.item as Record<string, unknown>;
          if (typeof item.title === "string") result.title = item.title;
          if (typeof item.price === "number") {
            result.priceMin = item.price;
            result.priceMax = item.price;
          }
          if (typeof item.rating === "number") result.rating = item.rating;
          if (typeof item.sold === "number") result.soldCount = item.sold;
          if (typeof item.brand === "string") result.brand = item.brand;
          if (typeof item.category === "string") result.category = item.category;
          if (typeof item.image === "string") result.imageUrl = item.image;
          result.confidenceScore = Math.max(result.confidenceScore, 0.7);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("ProductParser error:", sanitizeForLog(msg));
    }
    if (result.confidenceScore === 0) {
      result.confidenceScore = calculateConfidence(result);
    }
    return result;
  }
}

export const productParser = new ProductParser();
export { extractFromHtml, extractFromJsonLd, findJsonLdProduct };

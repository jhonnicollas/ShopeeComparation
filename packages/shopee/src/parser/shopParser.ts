import type { ShopSnapshot, ShopStatus } from "@shopee-research/shared";

export interface ParseShopInput {
  html?: string;
  json?: unknown;
  shopId: string;
}

function emptyShop(shopId: string): ShopSnapshot {
  return {
    shopeeShopId: shopId,
    name: null,
    shopUrl: `https://shopee.co.id/shop/${shopId}`,
    statusLabels: [],
    primaryStatus: "UNKNOWN",
    rating: null,
    ratingCount: null,
    responseRate: null,
    responseTime: null,
    followerCount: null,
    productCount: null,
    joinedAgeText: null,
    location: null,
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

function findJsonLdShop(text: string): Record<string, unknown> | null {
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = jsonLdRegex.exec(text)) !== null) {
    const data = tryParseJson(match[1] ?? "");
    if (!data) continue;
    if (Array.isArray(data)) {
      for (const item of data) {
        const obj = item as Record<string, unknown> | null;
        if (obj && obj["@type"] === "Store") {
          return obj;
        }
        if (obj && obj["@type"] === "Organization" && obj["@id"]) {
          return obj;
        }
      }
    } else if (typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>;
      if (obj["@type"] === "Store" || obj["@type"] === "Organization") {
        return obj;
      }
    }
  }
  return null;
}

function extractFromJsonLd(obj: Record<string, unknown>, snapshot: ShopSnapshot): ShopSnapshot {
  const result: ShopSnapshot = { ...snapshot };
  if (typeof obj.name === "string") result.name = obj.name;
  if (typeof obj.url === "string") result.shopUrl = obj.url;
  if (typeof obj.description === "string") result.location = obj.description;
  if (typeof obj.image === "string") result.name = result.name ?? obj.image;
  if (obj.address && typeof obj.address === "object") {
    const addr = obj.address as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof addr.addressLocality === "string") parts.push(addr.addressLocality);
    if (typeof addr.addressRegion === "string") parts.push(addr.addressRegion);
    if (typeof addr.addressCountry === "string") parts.push(addr.addressCountry);
    if (parts.length > 0) result.location = parts.join(", ");
  }
  const agg = obj.aggregateRating;
  if (agg && typeof agg === "object") {
    const a = agg as Record<string, unknown>;
    if (typeof a.ratingValue === "number") result.rating = a.ratingValue;
    if (typeof a.reviewCount === "number") result.ratingCount = a.reviewCount;
  }
  return result;
}

function detectShopStatusFromText(text: string): { status: ShopStatus; matched: string } | null {
  const lower = text.toLowerCase();
  if (/shopee\s*mall|mall\b/i.test(lower)) {
    return { status: "MALL", matched: "Shopee Mall" };
  }
  if (/star\s*\+|starplus/i.test(lower)) {
    return { status: "STARPLUS", matched: "Star+" };
  }
  if (/star\s*seller/i.test(lower)) {
    return { status: "STAR", matched: "Star Seller" };
  }
  if (/official\s*store|official/i.test(lower)) {
    return { status: "OFFICIAL", matched: "Official Store" };
  }
  if (/preferred\s*seller|preferred/i.test(lower)) {
    return { status: "PREFERRED", matched: "Preferred Seller" };
  }
  return null;
}

function extractFromHtml(html: string, snapshot: ShopSnapshot): ShopSnapshot {
  const result: ShopSnapshot = { ...snapshot, statusLabels: [...snapshot.statusLabels] };
  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (nameMatch?.[1]) result.name = nameMatch[1].trim();
  const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:rating|bintang|stars?)/i);
  if (ratingMatch?.[1]) result.rating = Number(ratingMatch[1]);
  const ratingCountMatch = html.match(/(\d+(?:[.,]\d+)*)\s*(?:penilaian|ratings?)/i);
  if (ratingCountMatch?.[1]) result.ratingCount = Number(ratingCountMatch[1].replace(/[.,]/g, ""));
  const responseRateMatch = html.match(/(\d+(?:[.,]\d+)*)\s*%\s*(?:response\s*rate|tingkat\s*respons)/i);
  if (responseRateMatch?.[1]) result.responseRate = Number(responseRateMatch[1].replace(",", "."));
  const responseTimeMatch = html.match(/response\s*time["'\s:]+([^<"']+)/i);
  if (responseTimeMatch?.[1]) result.responseTime = responseTimeMatch[1].trim();
  const followerMatch = html.match(/(\d+(?:[.,]\d+)*)\s*(?:follower|pengikut)/i);
  if (followerMatch?.[1]) result.followerCount = Number(followerMatch[1].replace(/[.,]/g, ""));
  const productMatch = html.match(/(\d+(?:[.,]\d+)*)\s*(?:produk|products?)/i);
  if (productMatch?.[1]) result.productCount = Number(productMatch[1].replace(/[.,]/g, ""));
  const joinedMatch = html.match(/(?:joined|bergabung)["'\s:]+([^<"']+)/i);
  if (joinedMatch?.[1]) result.joinedAgeText = joinedMatch[1].trim();
  const locationMatch = html.match(/(?:location|lokasi)["'\s:]+([^<"']+)/i);
  if (locationMatch?.[1]) result.location = locationMatch[1].trim();
  const statusDetected = detectShopStatusFromText(html);
  if (statusDetected) {
    result.primaryStatus = statusDetected.status;
    result.statusLabels.push(statusDetected.matched);
  }
  return result;
}

function calculateConfidence(snapshot: ShopSnapshot): number {
  const fields = [snapshot.name, snapshot.rating, snapshot.followerCount, snapshot.responseRate];
  const present = fields.filter((f) => f !== null).length;
  let score = present / fields.length;
  if (snapshot.primaryStatus !== "UNKNOWN") score += 0.1;
  return Math.min(score, 1);
}

export class ShopParser {
  parseShop(input: ParseShopInput): ShopSnapshot {
    const base = emptyShop(input.shopId);
    let result = base;
    try {
      if (input.html) {
        const jsonLd = findJsonLdShop(input.html);
        if (jsonLd) {
          result = extractFromJsonLd(jsonLd, result);
          if (result.name) result.confidenceScore = Math.max(result.confidenceScore, 0.8);
        }
        result = extractFromHtml(input.html, result);
        if (result.name) result.confidenceScore = Math.max(result.confidenceScore, 0.6);
      }
      if (input.json && typeof input.json === "object" && input.json !== null) {
        const jsonObj = input.json as Record<string, unknown>;
        if (jsonObj["@type"] === "Store" || jsonObj["@type"] === "Organization") {
          result = extractFromJsonLd(jsonObj, result);
          result.confidenceScore = Math.max(result.confidenceScore, 0.9);
        } else if (jsonObj.shop && typeof jsonObj.shop === "object") {
          const shop = jsonObj.shop as Record<string, unknown>;
          if (typeof shop.name === "string") result.name = shop.name;
          if (typeof shop.rating === "number") result.rating = shop.rating;
          if (typeof shop.follower === "number") result.followerCount = shop.follower;
          if (typeof shop.responseRate === "number") result.responseRate = shop.responseRate;
          if (typeof shop.responseTime === "string") result.responseTime = shop.responseTime;
          if (typeof shop.productCount === "number") result.productCount = shop.productCount;
          if (typeof shop.joinedAgeText === "string") result.joinedAgeText = shop.joinedAgeText;
          if (typeof shop.location === "string") result.location = shop.location;
          if (typeof shop.status === "string") {
            const detected = detectShopStatusFromText(shop.status);
            if (detected) {
              result.primaryStatus = detected.status;
              result.statusLabels.push(detected.matched);
            }
          }
          result.confidenceScore = Math.max(result.confidenceScore, 0.7);
        }
      }
    } catch (error) {
      console.error("ShopParser error:", error instanceof Error ? error.message : "Unknown error");
    }
    if (result.confidenceScore === 0) {
      result.confidenceScore = calculateConfidence(result);
    }
    return result;
  }
}

export const shopParser = new ShopParser();
export { detectShopStatusFromText };

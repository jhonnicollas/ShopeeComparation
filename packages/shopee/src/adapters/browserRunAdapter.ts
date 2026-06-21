import type {
  ExtractProductInput,
  ExtractShopInput,
  ProductSnapshot,
  ResolveUrlInput,
  ResolveUrlResult,
  SearchInput,
  SearchResultCandidate,
  ShopSnapshot,
} from "@shopee-research/shared";
import * as cheerio from "cheerio";
import { findSearchProviderByKey } from "@shopee-research/db";

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

export interface BrowserRunConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  providerKey: string;
}

export interface BrowserRunAdapterOptions {
  config: BrowserRunConfig;
  fetchImpl?: typeof fetch;
}

export class BrowserRunAdapter {
  name = "browserRun";
  private config: BrowserRunConfig;
  private fetchImpl: typeof fetch;

  constructor(options: BrowserRunAdapterOptions) {
    this.config = options.config;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult> {
    try {
      const html = await this.browserFetch(input.url);
      if (!html) {
        return {
          originalUrl: input.url,
          finalUrl: null,
          canonicalUrl: null,
          shopId: null,
          itemId: null,
          resolveMethod: "browserRun",
          status: "failed",
          errorMessage: "Browser Run returned empty response",
        };
      }
      const $ = cheerio.load(html);
      const canonicalHref =
        $('link[rel="canonical"]').first().attr("href") ??
        $('meta[property="og:url"]').first().attr("content") ??
        null;
      const canonicalUrl = canonicalHref || extractProductPathFromHtml(html);
      const fromPath = canonicalUrl ? parseShopeePath(canonicalUrl) : null;
      const shopId = fromPath?.shopId ?? null;
      const itemId = fromPath?.itemId ?? null;
      if (!itemId) {
        return {
          originalUrl: input.url,
          finalUrl: canonicalHref,
          canonicalUrl: canonicalHref,
          shopId,
          itemId: null,
          resolveMethod: "browserRun",
          status: "failed",
          errorMessage: "Could not extract itemId from Browser Run response",
        };
      }
      return {
        originalUrl: input.url,
        finalUrl: canonicalHref,
        canonicalUrl: canonicalHref ?? (shopId
          ? `https://shopee.co.id/product/${shopId}/${itemId}`
          : `https://shopee.co.id/product/-/i${itemId}.${itemId}`),
        shopId,
        itemId,
        resolveMethod: "browserRun",
        status: "resolved",
      };
    } catch (error) {
      return {
        originalUrl: input.url,
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "browserRun",
        status: "failed",
        errorMessage: sanitizeForLog(error instanceof Error ? error.message : "Unknown error"),
      };
    }
  }

  async searchProducts(input: SearchInput): Promise<SearchResultCandidate[]> {
    const searchUrl = `https://shopee.co.id/search?keyword=${encodeURIComponent(input.keyword)}&shippedFrom=${encodeURIComponent(input.shippedFrom)}&limit=${input.limit}`;
    const html = await this.browserFetch(searchUrl);
    if (!html) return [];
    return this.parseSearchResults(html, input);
  }

  async extractProduct(input: ExtractProductInput): Promise<ProductSnapshot> {
    const url = input.canonicalUrl ?? `https://shopee.co.id/product/${input.shopId}/${input.itemId}`;
    const html = await this.browserFetch(url);
    if (!html) {
      return this.emptyProductSnapshot(input.shopId, input.itemId, url);
    }
    return this.parseProductHtml(html, input.shopId, input.itemId, url);
  }

  async extractShop(input: ExtractShopInput): Promise<ShopSnapshot> {
    const url = `https://shopee.co.id/shop/${input.shopId}`;
    const html = await this.browserFetch(url);
    if (!html) {
      return this.emptyShopSnapshot(input.shopId);
    }
    return this.parseShopHtml(html, input.shopId);
  }

  private async browserFetch(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (this.config.apiKey) {
        headers.authorization = `Bearer ${this.config.apiKey}`;
      }
      const response = await this.fetchImpl(`${this.config.baseUrl.replace(/\/$/, "")}/content`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url, renderJs: true }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Browser Run HTTP ${response.status}`);
      }
      const data = (await response.json()) as { html?: string; content?: string };
      return data.html ?? data.content ?? "";
    } catch (error) {
      clearTimeout(timeoutId);
      throw new Error(sanitizeForLog(error instanceof Error ? error.message : "Unknown error"));
    }
  }

  private parseSearchResults(html: string, input: SearchInput): SearchResultCandidate[] {
    const $ = cheerio.load(html);
    const results: SearchResultCandidate[] = [];
    const seen = new Set<string>();

    $('a[href*="shopee.co.id"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const parsed = parseShopeePath(href);
      if (!parsed || !parsed.itemId) return;
      const key = `${parsed.shopId}:${parsed.itemId}`;
      if (seen.has(key)) return;
      seen.add(key);
      const title = $(el).find('[data-testid="spu-name"], [class*="title"]').first().text().trim() || null;
      const priceText = $(el).find('[class*="price"], [data-testid="spu-price"]').first().text().trim() || null;
      const priceMin = priceText ? parseRupiah(priceText) : null;
      const canonicalUrl = `https://shopee.co.id/product/${parsed.shopId}/${parsed.itemId}`;
      results.push({
        title: title || null,
        originalUrl: href,
        canonicalUrl,
        itemId: parsed.itemId,
        shopId: parsed.shopId,
        priceMin,
        priceMax: priceMin,
        rating: null,
        reviewCount: null,
        soldCount: null,
        shippedFrom: input.shippedFrom,
        shopName: null,
        source: this.name,
        confidence: title ? 0.7 : 0.4,
      });
      if (results.length >= input.limit) return false;
      return undefined;
    });

    if (results.length === 0) {
      const regex = /shopee\.co\.id\/[^"'\s]+\/(\d+)\/(\d+)/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(html)) !== null) {
        const shopId = m[1] ?? "";
        const itemId = m[2] ?? "";
        const key = `${shopId}:${itemId}`;
        if (seen.has(key) || !itemId) continue;
        seen.add(key);
        results.push({
          title: null,
          originalUrl: null,
          canonicalUrl: `https://shopee.co.id/product/${shopId}/${itemId}`,
          itemId,
          shopId,
          priceMin: null,
          priceMax: null,
          rating: null,
          reviewCount: null,
          soldCount: null,
          shippedFrom: input.shippedFrom,
          shopName: null,
          source: this.name,
          confidence: 0.4,
        });
        if (results.length >= input.limit) break;
      }
    }

    return results;
  }

  private parseProductHtml(html: string, shopId: string, itemId: string, url: string): ProductSnapshot {
    const $ = cheerio.load(html);
    const snapshot: ProductSnapshot = this.emptyProductSnapshot(shopId, itemId, url);

    const jsonLd = findJsonLd($, "Product");
    if (jsonLd) {
      Object.assign(snapshot, extractFromJsonLdProduct(jsonLd));
      if (snapshot.title || snapshot.priceMin !== null) {
        snapshot.confidenceScore = Math.max(snapshot.confidenceScore, 0.85);
      }
    }

    const titleText =
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').first().attr("content") ||
      null;
    if (titleText && !snapshot.title) snapshot.title = titleText;

    let parsedPrice: number | null = null;
    const priceEl = $('[class*="price"]').first();
    if (priceEl.length > 0) {
      parsedPrice = parseRupiah(priceEl.text().trim());
    }
    if (parsedPrice === null) {
      const metaPrice = $('meta[property="product:price:amount"]').first().attr("content");
      if (metaPrice) parsedPrice = parseRupiah(metaPrice);
    }
    if (parsedPrice === null) {
      $("div, span, p").each((_, el) => {
        if (parsedPrice !== null) return false;
        const text = $(el).contents().not($(el).find("*")).text().trim();
        if (/^Rp\s*[\d.,]+$/.test(text)) {
          parsedPrice = parseRupiah(text);
        }
        return undefined;
      });
    }
    if (parsedPrice !== null && snapshot.priceMin === null) {
      snapshot.priceMin = parsedPrice;
      snapshot.priceMax = parsedPrice;
    }

    const bodyText = $("body").text();
    if (snapshot.rating === null) {
      const ratingMatch = bodyText.match(/(\d+(?:\.\d+)?)\s*(?:rating|bintang|star)/i);
      if (ratingMatch && ratingMatch[1]) {
        snapshot.rating = Number(ratingMatch[1]);
      }
    }
    if (snapshot.reviewCount === null) {
      const reviewMatch = bodyText.match(/(\d+(?:[.,]\d+)*)\s*(?:review|ulasan)/i);
      if (reviewMatch && reviewMatch[1]) {
        snapshot.reviewCount = Number(reviewMatch[1].replace(/[.,]/g, ""));
      }
    }
    if (snapshot.soldCount === null) {
      const soldMatch = bodyText.match(/(\d+(?:[.,]\d+)*)\s*(?:terjual|sold)/i);
      if (soldMatch && soldMatch[1]) {
        snapshot.soldCount = Number(soldMatch[1].replace(/[.,]/g, ""));
      }
    }

    const descText =
      $('meta[name="description"]').first().attr("content") ||
      $('meta[property="og:description"]').first().attr("content") ||
      null;
    if (descText && !snapshot.description) snapshot.description = descText;

    const imgText =
      $('meta[property="og:image"]').first().attr("content") ||
      $('img[class*="product"]').first().attr("src") ||
      null;
    if (imgText && !snapshot.imageUrl) snapshot.imageUrl = imgText;

    if (snapshot.confidenceScore < 0.5 && snapshot.title) {
      snapshot.confidenceScore = 0.55;
    }
    return snapshot;
  }

  private parseShopHtml(html: string, shopId: string): ShopSnapshot {
    const $ = cheerio.load(html);
    const snapshot = this.emptyShopSnapshot(shopId);
    const jsonLd = findJsonLd($, "Store") || findJsonLd($, "Organization");
    if (jsonLd) {
      const name = pickString(jsonLd, ["name"]);
      if (name && !snapshot.name) snapshot.name = name;
      const rating = pickNumber(jsonLd, ["aggregateRating", "ratingValue"]);
      if (rating !== null && snapshot.rating === null) snapshot.rating = rating;
    }

    const nameText =
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').first().attr("content") ||
      null;
    if (nameText && !snapshot.name) snapshot.name = nameText;

    const bodyText = $("body").text();
    if (snapshot.rating === null) {
      const m = bodyText.match(/(\d+(?:\.\d+)?)\s*(?:rating|bintang)/i);
      if (m && m[1]) snapshot.rating = Number(m[1]);
    }
    if (snapshot.followerCount === null) {
      const m = bodyText.match(/(\d+(?:[.,]\d+)*)\s*(?:follower|pengikut)/i);
      if (m && m[1]) snapshot.followerCount = Number(m[1].replace(/[.,]/g, ""));
    }
    if (snapshot.productCount === null) {
      const m = bodyText.match(/(\d+(?:[.,]\d+)*)\s*(?:produk|product)/i);
      if (m && m[1]) snapshot.productCount = Number(m[1].replace(/[.,]/g, ""));
    }
    if (snapshot.responseRate === null) {
      const m = bodyText.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:response\s*rate|tingkat\s*respons)/i);
      if (m && m[1]) snapshot.responseRate = Number(m[1].replace(",", "."));
    }

    const status = detectShopStatusFromText(bodyText);
    if (status) {
      snapshot.primaryStatus = status.status;
      snapshot.statusLabels.push(status.matched);
    }
    if (snapshot.name) snapshot.confidenceScore = Math.max(snapshot.confidenceScore, 0.6);
    return snapshot;
  }

  private emptyProductSnapshot(shopId: string, itemId: string, url: string): ProductSnapshot {
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
      weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
      features: [],
      confidenceScore: 0,
    };
  }

  private emptyShopSnapshot(shopId: string): ShopSnapshot {
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
}

function findJsonLd($: ReturnType<typeof cheerio.load>, type: string): Record<string, unknown> | null {
  let found: Record<string, unknown> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return false;
    const raw = $(el).html() ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return undefined;
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const it of items) {
      if (it && typeof it === "object" && (it as { "@type"?: unknown })["@type"] === type) {
        found = it as Record<string, unknown>;
        return false;
      }
    }
    return undefined;
  });
  return found;
}

function extractFromJsonLdProduct(obj: Record<string, unknown>): Partial<ProductSnapshot> {
  const out: Partial<ProductSnapshot> = {};
  if (typeof obj.name === "string") out.title = obj.name;
  if (typeof obj.brand === "string") out.brand = obj.brand;
  if (typeof obj.description === "string") out.description = obj.description;
  if (typeof obj.sku === "string") out.shopeeItemId = obj.sku;
  if (typeof obj.category === "string") out.category = obj.category;
  if (typeof obj.image === "string") out.imageUrl = obj.image;
  if (Array.isArray(obj.image)) {
    const first = obj.image[0];
    if (typeof first === "string") out.imageUrl = first;
  }
  const price = pickNumber(obj, ["offers", "price"]) ?? pickNumber(obj, ["offers", "lowPrice"]);
  if (price !== null) {
    out.priceMin = price;
    out.priceMax = price;
  }
  const rating = pickNumber(obj, ["aggregateRating", "ratingValue"]);
  if (rating !== null) out.rating = rating;
  const review = pickNumber(obj, ["aggregateRating", "reviewCount"]);
  if (review !== null) out.reviewCount = review;
  return out;
}

function pickString(obj: unknown, path: string[]): string | null {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "string" ? cur : null;
}

function pickNumber(obj: unknown, path: string[]): number | null {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  if (typeof cur === "number" && Number.isFinite(cur)) return cur;
  if (typeof cur === "string") {
    const n = Number(cur.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseRupiah(text: string): number | null {
  const cleaned = text.replace(/[^0-9.,]/g, "").replace(/[.,]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractProductPathFromHtml(html: string): string | null {
  const m = html.match(/shopee\.co\.id\/[^"'\s]+\/(\d+)\/(\d+)/);
  return m ? `https://shopee.co.id/product/${m[1]}/${m[2]}` : null;
}

function parseShopeePath(url: string): { shopId: string; itemId: string } | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/?[^/]*\.?(\d+)\.(\d+)\/?$/) || u.pathname.match(/\/(\d+)\/(\d+)/);
    if (!m) return null;
    const shopId = m[1] ?? "";
    const itemId = m[2] ?? "";
    if (!shopId || !itemId) return null;
    return { shopId, itemId };
  } catch {
    return null;
  }
}

function detectShopStatusFromText(text: string): { status: "MALL" | "OFFICIAL" | "STAR" | "STARPLUS" | "PREFERRED" | "REGULAR" | "UNKNOWN"; matched: string } | null {
  const lower = text.toLowerCase();
  if (/shopee\s*mall|mall\b/i.test(lower)) return { status: "MALL", matched: "Shopee Mall" };
  if (/star\s*\+|starplus/i.test(lower)) return { status: "STARPLUS", matched: "Star+" };
  if (/star\s*seller/i.test(lower)) return { status: "STAR", matched: "Star Seller" };
  if (/official\s*store|official/i.test(lower)) return { status: "OFFICIAL", matched: "Official Store" };
  if (/preferred\s*seller|preferred/i.test(lower)) return { status: "PREFERRED", matched: "Preferred Seller" };
  return null;
}

export async function loadBrowserRunConfig(
  db: D1Database,
  providerKey: string,
  env: Record<string, string | undefined>
): Promise<BrowserRunConfig | null> {
  const provider = await findSearchProviderByKey(db, providerKey);
  if (!provider || !provider.isEnabled || provider.providerType !== "browserRun") {
    return null;
  }
  let apiKey = "";
  if (provider.secretRef) {
    apiKey = env[provider.secretRef] ?? "";
  }
  return {
    baseUrl: provider.baseUrl ?? "",
    apiKey,
    timeoutMs: provider.timeoutMs ?? 30000,
    providerKey: provider.providerKey,
  };
}

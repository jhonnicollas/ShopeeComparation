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
      const productMatch = html.match(/\/(\d+)\/(\d+)/);
      const shopId = productMatch?.[1] ?? null;
      const itemId = productMatch?.[2] ?? null;
      if (!itemId) {
        return {
          originalUrl: input.url,
          finalUrl: null,
          canonicalUrl: null,
          shopId,
          itemId: null,
          resolveMethod: "browserRun",
          status: "failed",
          errorMessage: "Could not extract itemId from Browser Run response",
        };
      }
      const canonicalUrl = this.extractFinalUrl(html) ?? (shopId
        ? `https://shopee.co.id/product/${shopId}/${itemId}`
        : `https://shopee.co.id/product/-/i${itemId}.${itemId}`);
      return {
        originalUrl: input.url,
        finalUrl: canonicalUrl,
        canonicalUrl,
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
    const searchUrl = `https://shopee.co.id/search?keyword=${encodeURIComponent(input.keyword)}`;
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

  private extractFinalUrl(html: string): string | null {
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
    if (canonical?.[1]) return canonical[1];
    const ogUrl = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i);
    if (ogUrl?.[1]) return ogUrl[1];
    return null;
  }

  private parseSearchResults(html: string, input: SearchInput): SearchResultCandidate[] {
    const results: SearchResultCandidate[] = [];
    const productPattern = /shopee\.co\.id\/[^"'\s]+\/(\d+)\/(\d+)/g;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = productPattern.exec(html)) !== null) {
      const shopId = match[1] ?? "";
      const itemId = match[2] ?? "";
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
        confidence: 0.6,
      });
      if (results.length >= input.limit) break;
    }
    return results;
  }

  private parseProductHtml(html: string, shopId: string, itemId: string, url: string): ProductSnapshot {
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const priceMatch = html.match(/Rp\s*([\d.,]+)/);
    const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:rating|stars?)/i);
    const soldMatch = html.match(/(\d+)\s*(?:terjual|sold)/i);
    const title = titleMatch?.[1]?.trim() ?? null;
    const priceText = priceMatch?.[1]?.replace(/[.,]/g, "") ?? null;
    const priceMin = priceText ? Number(priceText) : null;
    return {
      shopeeItemId: itemId,
      shopeeShopId: shopId,
      title,
      brand: null,
      category: null,
      originalUrl: url,
      canonicalUrl: this.extractFinalUrl(html) ?? url,
      imageUrl: null,
      galleryJson: null,
      videoUrl: null,
      priceMin,
      priceMax: priceMin,
      priceBeforeDiscount: null,
      discountText: null,
      rating: ratingMatch?.[1] ? Number(ratingMatch[1]) : null,
      reviewCount: null,
      soldCount: soldMatch?.[1] ? Number(soldMatch[1]) : null,
      favoriteCount: null,
      stock: null,
      shippedFrom: null,
      description: null,
      specificationJson: null,
      variationJson: null,
      weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
      features: [],
      confidenceScore: title ? 0.8 : 0.5,
    };
  }

  private parseShopHtml(html: string, shopId: string): ShopSnapshot {
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:rating|stars?)/i);
    const followerMatch = html.match(/(\d+(?:[.,]\d+)*)\s*(?:follower|pengikut)/i);
    const mallMatch = /shopee\s*mall/i.test(html);
    const starMatch = /star\s*seller/i.test(html);
    const starPlusMatch = /star\s*\+/i.test(html);
    return {
      shopeeShopId: shopId,
      name: nameMatch?.[1]?.trim() ?? null,
      shopUrl: `https://shopee.co.id/shop/${shopId}`,
      statusLabels: [],
      primaryStatus: mallMatch
        ? "MALL"
        : starPlusMatch
          ? "STARPLUS"
          : starMatch
            ? "STAR"
            : "UNKNOWN",
      rating: ratingMatch?.[1] ? Number(ratingMatch[1]) : null,
      ratingCount: null,
      responseRate: null,
      responseTime: null,
      followerCount: followerMatch?.[1] ? Number(followerMatch[1].replace(/[.,]/g, "")) : null,
      productCount: null,
      joinedAgeText: null,
      location: null,
      confidenceScore: nameMatch ? 0.8 : 0.5,
    };
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

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

export interface NineRouterFetchConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  timeoutMs: number;
  retryCount: number;
  providerKey: string;
}

export interface NineRouterFetchAdapterOptions {
  config: NineRouterFetchConfig;
  fetchImpl?: typeof fetch;
}

export class NineRouterFetchAdapter {
  name = "nineRouterFetch";
  private config: NineRouterFetchConfig;
  private fetchImpl: typeof fetch;

  constructor(options: NineRouterFetchAdapterOptions) {
    this.config = options.config;
    if (options.fetchImpl) {
      this.fetchImpl = options.fetchImpl.bind(globalThis);
    } else {
      this.fetchImpl = ((url, init) => fetch(url, init)) as typeof fetch;
    }
  }

  async resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult> {
    try {
      const text = await this.webFetch(input.url);
      if (!text) {
        return {
          originalUrl: input.url,
          finalUrl: null,
          canonicalUrl: null,
          shopId: null,
          itemId: null,
          resolveMethod: "webFetch",
          status: "failed",
          errorMessage: "9router web fetch returned empty response",
        };
      }
      const productMatch = text.match(/\/(\d+)\/(\d+)/);
      const shopId = productMatch?.[1] ?? null;
      const itemId = productMatch?.[2] ?? null;
      if (!itemId) {
        return {
          originalUrl: input.url,
          finalUrl: null,
          canonicalUrl: null,
          shopId,
          itemId: null,
          resolveMethod: "webFetch",
          status: "failed",
          errorMessage: "Could not extract itemId from 9router web fetch response",
        };
      }
      const canonicalUrl = shopId
        ? `https://shopee.co.id/product/${shopId}/${itemId}`
        : `https://shopee.co.id/product/-/i${itemId}.${itemId}`;
      return {
        originalUrl: input.url,
        finalUrl: canonicalUrl,
        canonicalUrl,
        shopId,
        itemId,
        resolveMethod: "webFetch",
        status: "resolved",
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        originalUrl: input.url,
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "webFetch",
        status: "failed",
        errorMessage: sanitizeForLog(msg),
      };
    }
  }

  async searchProducts(input: SearchInput): Promise<SearchResultCandidate[]> {
    const text = await this.webFetch(
      `https://shopee.co.id/search?keyword=${encodeURIComponent(input.keyword)}&shippedFrom=${encodeURIComponent(input.shippedFrom)}&limit=${input.limit}`
    );
    if (!text) return [];
    return this.parseSearchResults(text, input);
  }

  async extractProduct(input: ExtractProductInput): Promise<ProductSnapshot> {
    const url = input.canonicalUrl ?? `https://shopee.co.id/product/${input.shopId}/${input.itemId}`;
    const text = await this.webFetch(url);
    if (!text) {
      return this.emptyProductSnapshot(input.shopId, input.itemId, url);
    }
    return this.parseProductText(text, input.shopId, input.itemId, url);
  }

  async extractShop(input: ExtractShopInput): Promise<ShopSnapshot> {
    const url = `https://shopee.co.id/shop/${input.shopId}`;
    const text = await this.webFetch(url);
    if (!text) {
      return this.emptyShopSnapshot(input.shopId);
    }
    return this.parseShopText(text, input.shopId);
  }

  private async webFetch(url: string): Promise<string> {
    const body = {
      model: this.config.modelName,
      messages: [
        {
          role: "user",
          content: `Fetch the content of this URL and return the raw HTML/text: ${url}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "web_fetch",
            description: "Fetch a web page and return its content",
            parameters: {
              type: "object",
              properties: { url: { type: "string" } },
              required: ["url"],
            },
          },
        },
      ],
    };
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.config.apiKey) {
      headers.authorization = `Bearer ${this.config.apiKey}`;
    }
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (fetchErr) {
      throw new Error(`Web fetch failed: ${sanitizeForLog(fetchErr instanceof Error ? fetchErr.message : String(fetchErr))}`);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    let data: {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }>; content?: string } }>;
    };
    try {
      data = (await response.json()) as typeof data;
    } catch (parseErr) {
      throw new Error(`JSON parse failed: ${sanitizeForLog(parseErr instanceof Error ? parseErr.message : String(parseErr))}`);
    }
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (toolCall) {
      try {
        const parsed = JSON.parse(toolCall) as { content?: string };
        if (parsed.content) return parsed.content;
      } catch {
        return toolCall;
      }
    }
    return data.choices?.[0]?.message?.content ?? "";
  }

  private parseSearchResults(text: string, input: SearchInput): SearchResultCandidate[] {
    const results: SearchResultCandidate[] = [];
    const productPattern = /shopee\.co\.id\/[^"'\s]+\/(\d+)\/(\d+)/g;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = productPattern.exec(text)) !== null) {
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
        confidence: 0.5,
      });
      if (results.length >= input.limit) break;
    }
    return results;
  }

  private parseProductText(text: string, shopId: string, itemId: string, url: string): ProductSnapshot {
    const titleMatch = text.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const priceMatch = text.match(/Rp\s*([\d.,]+)/);
    const ratingMatch = text.match(/(\d+\.?\d*)\s*(?:rating|stars?)/i);
    const soldMatch = text.match(/(\d+)\s*(?:terjual|sold)/i);
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
      canonicalUrl: url,
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
      confidenceScore: title ? 0.7 : 0.4,
    };
  }

  private parseShopText(text: string, shopId: string): ShopSnapshot {
    const nameMatch = text.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const ratingMatch = text.match(/(\d+\.?\d*)\s*(?:rating|stars?)/i);
    const followerMatch = text.match(/(\d+(?:[.,]\d+)*)\s*(?:follower|pengikut)/i);
    const mallMatch = /shopee\s*mall/i.test(text);
    const starMatch = /star\s*seller/i.test(text);
    return {
      shopeeShopId: shopId,
      name: nameMatch?.[1]?.trim() ?? null,
      shopUrl: `https://shopee.co.id/shop/${shopId}`,
      statusLabels: [],
      primaryStatus: mallMatch ? "MALL" : starMatch ? "STAR" : "UNKNOWN",
      rating: ratingMatch?.[1] ? Number(ratingMatch[1]) : null,
      ratingCount: null,
      responseRate: null,
      responseTime: null,
      followerCount: followerMatch?.[1] ? Number(followerMatch[1].replace(/[.,]/g, "")) : null,
      productCount: null,
      joinedAgeText: null,
      location: null,
      confidenceScore: nameMatch ? 0.7 : 0.4,
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

export async function loadSearchProviderConfig(
  db: D1Database,
  providerKey: string,
  env: Record<string, string | undefined>
): Promise<NineRouterFetchConfig | null> {
  const provider = await findSearchProviderByKey(db, providerKey);
  if (!provider || !provider.isEnabled) {
    return null;
  }
  let apiKey = "";
  if (provider.secretRef) {
    apiKey = env[provider.secretRef] ?? "";
  }
  return {
    baseUrl: provider.baseUrl ?? "",
    apiKey,
    modelName: provider.providerKey,
    timeoutMs: provider.timeoutMs ?? 30000,
    retryCount: provider.retryCount ?? 1,
    providerKey: provider.providerKey,
  };
}

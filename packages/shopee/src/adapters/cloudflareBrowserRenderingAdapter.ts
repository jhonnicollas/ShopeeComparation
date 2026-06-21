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
import { parseResponseBody } from "@shopee-research/shared";

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

export interface CloudflareBrowserRenderingConfig {
  accountId: string;
  apiToken: string;
  timeoutMs: number;
  providerKey: string;
}

export interface CloudflareBrowserRenderingAdapterOptions {
  config: CloudflareBrowserRenderingConfig;
  fetchImpl?: typeof fetch;
}

export class CloudflareBrowserRenderingAdapter {
  name = "cloudflareBrowserRendering";
  private config: CloudflareBrowserRenderingConfig;
  private fetchImpl: typeof fetch;

  constructor(options: CloudflareBrowserRenderingAdapterOptions) {
    this.config = options.config;
    this.fetchImpl = options.fetchImpl ?? ((url, init) => fetch(url, init));
  }

  private async renderHtml(url: string): Promise<string> {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/browser-rendering/snapshot`;
    const body = {
      url,
      viewport: { width: 1366, height: 900 },
      gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
      waitForTimeout: 3000,
      addScriptTag: [
        {
          content:
            "for(let i=0;i<5;i++){setTimeout(()=>window.scrollTo(0,800*(i+1)),i*400);}",
        },
      ],
    };
    let response: Response;
    try {
      response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.apiToken}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (fetchErr) {
      throw new Error(`Browser Render fetch failed: ${sanitizeForLog(fetchErr instanceof Error ? fetchErr.message : String(fetchErr))}`);
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Browser Render HTTP ${response.status}: ${text.slice(0, 200)}`);
    }
    let data: { result?: { content?: string }; success?: boolean; errors?: unknown };
    try {
      data = parseResponseBody(await response.text()) as typeof data;
    } catch (parseErr) {
      throw new Error(`Browser Render JSON parse failed: ${sanitizeForLog(parseErr instanceof Error ? parseErr.message : String(parseErr))}`);
    }
    if (!data.success || !data.result?.content) {
      throw new Error(`Browser Render returned no content: ${JSON.stringify(data.errors ?? {}).slice(0, 200)}`);
    }
    return data.result.content;
  }

  async resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult> {
    try {
      const html = await this.renderHtml(input.url);
      const $ = cheerio.load(html);
      const links = $("a[href*='shopee.co.id']")
        .map((_, el) => $(el).attr("href"))
        .get();
      const pattern = /shopee\.co\.id\/[^/]+\/(\d+)\/(\d+)/;
      for (const href of links) {
        const m = href?.match(pattern);
        if (m) {
          return {
            originalUrl: input.url,
            finalUrl: href,
            canonicalUrl: `https://shopee.co.id/product/${m[1]}/${m[2]}`,
            shopId: m[1] ?? null,
            itemId: m[2] ?? null,
            resolveMethod: "browserRun",
            status: "resolved",
          };
        }
      }
      return {
        originalUrl: input.url,
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "browserRun",
        status: "failed",
        errorMessage: "Could not extract product URL from rendered page",
      };
    } catch (err) {
      return {
        originalUrl: input.url,
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "browserRun",
        status: "failed",
        errorMessage: sanitizeForLog(err instanceof Error ? err.message : String(err)),
      };
    }
  }

  async searchProducts(input: SearchInput): Promise<SearchResultCandidate[]> {
    const html = await this.renderHtml(
      `https://shopee.co.id/search?keyword=${encodeURIComponent(input.keyword)}&shipped_from=${encodeURIComponent(input.shippedFrom)}&limit=${input.limit}`
    );
    const $ = cheerio.load(html);
    const results: SearchResultCandidate[] = [];
    const seen = new Set<string>();
    $("a[href*='shopee.co.id']").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const m = href.match(/shopee\.co\.id\/[^/]+\/(\d+)\/(\d+)/);
      if (!m || !m[1] || !m[2]) return;
      const key = `${m[1]}:${m[2]}`;
      if (seen.has(key)) return;
      seen.add(key);
      const title = $(el).find("[data-testid='spu-name'], [class*='title']").first().text().trim() || null;
      const priceText = $(el).find("[class*='price'], [data-testid='spu-price']").first().text().trim() || null;
      const priceMatch = priceText?.match(/[\d.,]+/);
      const priceMin = priceMatch ? Number(priceMatch[0].replace(/[.,]/g, "")) : null;
      results.push({
        title: title || null,
        originalUrl: href,
        canonicalUrl: `https://shopee.co.id/product/${m[1]}/${m[2]}`,
        itemId: m[2],
        shopId: m[1],
        priceMin: Number.isFinite(priceMin) ? priceMin : null,
        priceMax: null,
        rating: null,
        reviewCount: null,
        soldCount: null,
        shippedFrom: input.shippedFrom,
        shopName: null,
        source: this.name,
        confidence: 0.5,
      });
      if (results.length >= input.limit) return false;
      return undefined;
    });
    return results;
  }

  async extractProduct(input: ExtractProductInput): Promise<ProductSnapshot> {
    const html = await this.renderHtml(
      input.canonicalUrl ?? `https://shopee.co.id/product/${input.shopId}/${input.itemId}`
    );
    const $ = cheerio.load(html);
    const title = $("h1, [class*='title']").first().text().trim() || null;
    const priceText = $("[class*='price']").first().text().trim();
    const priceMatch = priceText.match(/[\d.,]+/);
    const priceMin = priceMatch ? Number(priceMatch[0].replace(/[.,]/g, "")) : null;
    return {
      shopeeItemId: input.itemId,
      shopeeShopId: input.shopId,
      title,
      brand: null,
      category: null,
      originalUrl: input.canonicalUrl ?? null,
      canonicalUrl: input.canonicalUrl ?? `https://shopee.co.id/product/${input.shopId}/${input.itemId}`,
      imageUrl: null,
      galleryJson: null,
      videoUrl: null,
      priceMin: Number.isFinite(priceMin) ? priceMin : null,
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
      weight: { value: null, unit: null, rawText: null, source: "specification", confidence: 0 },
      features: [],
      confidenceScore: title ? 0.3 : 0,
    };
  }

  async extractShop(input: ExtractShopInput): Promise<ShopSnapshot> {
    const html = await this.renderHtml(`https://shopee.co.id/shop/${input.shopId}`);
    const $ = cheerio.load(html);
    const name = $("h1, [class*='shop-name']").first().text().trim() || null;
    return {
      shopeeShopId: input.shopId,
      name,
      shopUrl: `https://shopee.co.id/shop/${input.shopId}`,
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
      confidenceScore: name ? 0.3 : 0,
    };
  }
}

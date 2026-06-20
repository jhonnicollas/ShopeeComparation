import type {
  ExtractProductInput,
  ExtractShopInput,
  ProductSnapshot,
  ResolveUrlInput,
  ResolveUrlResult,
  SearchInput,
  SearchResultCandidate,
  ShopSnapshot,
  WeightExtraction,
} from "@shopee-research/shared";

export interface ExtractorAttempt {
  adapter: string;
  resolveMethod: string;
  status: "resolved" | "failed";
  errorMessage?: string;
  durationMs: number;
}

export interface ExtractorDiagnostics {
  attempts: ExtractorAttempt[];
  partialSuccess: boolean;
}

export interface FallbackShopeeExtractorOptions {
  adapters: ShopeeExtractorLike[];
}

export interface ShopeeExtractorLike {
  name: string;
  resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult>;
  searchProducts(input: SearchInput): Promise<SearchResultCandidate[]>;
  extractProduct(input: ExtractProductInput): Promise<ProductSnapshot>;
  extractShop(input: ExtractShopInput): Promise<ShopSnapshot>;
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

function mergeWeight(target: WeightExtraction, source: WeightExtraction): WeightExtraction {
  if (source.value !== null && target.value === null) {
    return { ...source, source: source.source ?? target.source };
  }
  if (source.confidence > target.confidence) {
    return { ...source, value: source.value ?? target.value };
  }
  return target;
}

function mergeProduct(target: ProductSnapshot, source: ProductSnapshot): ProductSnapshot {
  const merged: ProductSnapshot = { ...target };
  if (source.title !== null && merged.title === null) merged.title = source.title;
  if (source.brand !== null && merged.brand === null) merged.brand = source.brand;
  if (source.category !== null && merged.category === null) merged.category = source.category;
  if (source.imageUrl !== null && merged.imageUrl === null) merged.imageUrl = source.imageUrl;
  if (source.galleryJson !== null && merged.galleryJson === null) merged.galleryJson = source.galleryJson;
  if (source.videoUrl !== null && merged.videoUrl === null) merged.videoUrl = source.videoUrl;
  if (source.priceMin !== null && merged.priceMin === null) merged.priceMin = source.priceMin;
  if (source.priceMax !== null && merged.priceMax === null) merged.priceMax = source.priceMax;
  if (source.priceBeforeDiscount !== null && merged.priceBeforeDiscount === null) {
    merged.priceBeforeDiscount = source.priceBeforeDiscount;
  }
  if (source.discountText !== null && merged.discountText === null) merged.discountText = source.discountText;
  if (source.rating !== null && merged.rating === null) merged.rating = source.rating;
  if (source.reviewCount !== null && merged.reviewCount === null) merged.reviewCount = source.reviewCount;
  if (source.soldCount !== null && merged.soldCount === null) merged.soldCount = source.soldCount;
  if (source.favoriteCount !== null && merged.favoriteCount === null) merged.favoriteCount = source.favoriteCount;
  if (source.stock !== null && merged.stock === null) merged.stock = source.stock;
  if (source.shippedFrom !== null && merged.shippedFrom === null) merged.shippedFrom = source.shippedFrom;
  if (source.description !== null && merged.description === null) merged.description = source.description;
  if (source.specificationJson !== null && merged.specificationJson === null) {
    merged.specificationJson = source.specificationJson;
  }
  if (source.variationJson !== null && merged.variationJson === null) {
    merged.variationJson = source.variationJson;
  }
  merged.weight = mergeWeight(merged.weight, source.weight);
  const seenFeatures = new Set(merged.features.map((f) => `${f.name}:${f.value}`));
  for (const f of source.features) {
    const key = `${f.name}:${f.value}`;
    if (!seenFeatures.has(key)) {
      merged.features.push(f);
      seenFeatures.add(key);
    }
  }
  merged.confidenceScore = Math.max(merged.confidenceScore, source.confidenceScore);
  if (source.canonicalUrl && !merged.canonicalUrl) merged.canonicalUrl = source.canonicalUrl;
  if (source.originalUrl && !merged.originalUrl) merged.originalUrl = source.originalUrl;
  return merged;
}

function mergeShop(target: ShopSnapshot, source: ShopSnapshot): ShopSnapshot {
  const merged: ShopSnapshot = { ...target };
  if (source.name !== null && merged.name === null) merged.name = source.name;
  if (source.rating !== null && merged.rating === null) merged.rating = source.rating;
  if (source.ratingCount !== null && merged.ratingCount === null) merged.ratingCount = source.ratingCount;
  if (source.responseRate !== null && merged.responseRate === null) merged.responseRate = source.responseRate;
  if (source.responseTime !== null && merged.responseTime === null) merged.responseTime = source.responseTime;
  if (source.followerCount !== null && merged.followerCount === null) merged.followerCount = source.followerCount;
  if (source.productCount !== null && merged.productCount === null) merged.productCount = source.productCount;
  if (source.joinedAgeText !== null && merged.joinedAgeText === null) merged.joinedAgeText = source.joinedAgeText;
  if (source.location !== null && merged.location === null) merged.location = source.location;
  if (source.shopUrl && !merged.shopUrl) merged.shopUrl = source.shopUrl;
  if (source.statusLabels.length > 0 && merged.statusLabels.length === 0) {
    merged.statusLabels = [...source.statusLabels];
  }
  if (source.primaryStatus && source.primaryStatus !== "UNKNOWN" && merged.primaryStatus === "UNKNOWN") {
    merged.primaryStatus = source.primaryStatus;
  }
  merged.confidenceScore = Math.max(merged.confidenceScore, source.confidenceScore);
  return merged;
}

function sanitizeError(msg: string | undefined): string | undefined {
  if (!msg) return msg;
  return msg
    .replace(/api[_-]?key\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/token\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/secret\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/bearer\s+\S+/gi, "[REDACTED]")
    .slice(0, 200);
}

export class FallbackShopeeExtractor implements ShopeeExtractorLike {
  name = "fallback";
  private adapters: ShopeeExtractorLike[];

  constructor(options: FallbackShopeeExtractorOptions) {
    this.adapters = options.adapters;
  }

  async resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult> {
    for (const adapter of this.adapters) {
      try {
        const result = await adapter.resolveUrl(input);
        if (result.status === "resolved") {
          return result;
        }
      } catch {
        // continue to next adapter
      }
    }
    return {
      originalUrl: input.url,
      finalUrl: null,
      canonicalUrl: null,
      shopId: null,
      itemId: null,
      resolveMethod: "manual",
      status: "failed",
      errorMessage: "All adapters failed",
    };
  }

  async searchProducts(input: SearchInput): Promise<SearchResultCandidate[]> {
    const results: SearchResultCandidate[] = [];
    const seen = new Set<string>();
    for (const adapter of this.adapters) {
      try {
        const candidates = await adapter.searchProducts(input);
        for (const c of candidates) {
          const key = `${c.shopId ?? ""}:${c.itemId ?? ""}:${c.canonicalUrl ?? c.originalUrl ?? ""}`;
          if (seen.has(key)) continue;
          seen.add(key);
          results.push(c);
          if (results.length >= input.limit) break;
        }
        if (results.length >= input.limit) break;
      } catch {
        // continue to next adapter
      }
    }
    return results;
  }

  async extractProduct(
    input: ExtractProductInput
  ): Promise<ProductSnapshot & { diagnostics: ExtractorDiagnostics }> {
    let merged = emptyProduct(input.shopId, input.itemId, input.canonicalUrl ?? "");
    const attempts: ExtractorAttempt[] = [];
    let anySuccess = false;
    for (const adapter of this.adapters) {
      const start = Date.now();
      try {
        const result = await adapter.extractProduct(input);
        const durationMs = Date.now() - start;
        const hasData = result.title !== null || result.priceMin !== null || result.rating !== null;
        attempts.push({
          adapter: adapter.name,
          resolveMethod: "extraction",
          status: hasData ? "resolved" : "failed",
          ...(result.confidenceScore === 0
            ? { errorMessage: "no data extracted" }
            : {}),
          durationMs,
        });
        if (hasData) anySuccess = true;
        merged = mergeProduct(merged, result);
      } catch (error) {
        attempts.push({
          adapter: adapter.name,
          resolveMethod: "extraction",
          status: "failed",
          errorMessage: sanitizeError(error instanceof Error ? error.message : "Unknown error"),
          durationMs: Date.now() - start,
        });
      }
    }
    if (!anySuccess) {
      merged.confidenceScore = 0;
    }
    return {
      ...merged,
      diagnostics: { attempts, partialSuccess: anySuccess },
    };
  }

  async extractShop(
    input: ExtractShopInput
  ): Promise<ShopSnapshot & { diagnostics: ExtractorDiagnostics }> {
    let merged = emptyShop(input.shopId);
    const attempts: ExtractorAttempt[] = [];
    let anySuccess = false;
    for (const adapter of this.adapters) {
      const start = Date.now();
      try {
        const result = await adapter.extractShop(input);
        const durationMs = Date.now() - start;
        const hasData = result.name !== null || result.rating !== null || result.primaryStatus !== "UNKNOWN";
        attempts.push({
          adapter: adapter.name,
          resolveMethod: "extraction",
          status: hasData ? "resolved" : "failed",
          ...(result.confidenceScore === 0
            ? { errorMessage: "no data extracted" }
            : {}),
          durationMs,
        });
        if (hasData) anySuccess = true;
        merged = mergeShop(merged, result);
      } catch (error) {
        attempts.push({
          adapter: adapter.name,
          resolveMethod: "extraction",
          status: "failed",
          errorMessage: sanitizeError(error instanceof Error ? error.message : "Unknown error"),
          durationMs: Date.now() - start,
        });
      }
    }
    if (!anySuccess) {
      merged.confidenceScore = 0;
    }
    return {
      ...merged,
      diagnostics: { attempts, partialSuccess: anySuccess },
    };
  }
}

export { mergeProduct, mergeShop, mergeWeight, emptyProduct, emptyShop, emptyWeight };

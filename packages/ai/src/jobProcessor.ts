import type { QueueMessage, ProductSnapshot, ShopSnapshot, RiskItem, ExtractProductInput, ExtractShopInput } from "@shopee-research/shared";
import {
  createComparison,
  createComparisonItem,
  upsertAiReport,
  upsertProduct,
  upsertShop,
  updateJobStatus,
  updateResearchSessionStatus,
  createJobLog,
  saveProductWeight,
  saveProductFeatures,
  findShopByShopeeId,
  createExtractionFailure,
  listEnabledSearchProviders,
} from "@shopee-research/db";
import {
  parseShopeeUrl,
  BrowserRunAdapter,
  type ShopeeExtractorLike,
} from "@shopee-research/shopee";
import { calculateProductScore, detectRisks, rankProducts } from "@shopee-research/core";
import { runResearchWorkflow } from "./mastra/researchWorkflow.js";
import { researchMode, jobStatus } from "@shopee-research/shared";

export interface JobProcessorEnv {
  DB: D1Database;
  LOGS: R2Bucket;
  NINEROUTER_BASE_URL?: string;
  NINEROUTER_API_KEY?: string;
  BROWSER_RUN_BASE_URL?: string;
  BROWSER_RUN_API_KEY?: string;
}

export interface ProcessJobResult {
  comparisonId: string | null;
  bestProductId: string | null;
  totalProducts: number;
  failed: number;
  partial: boolean;
}

function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `${prefix}_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

function sanitizeError(msg: string | undefined): string {
  if (!msg) return "Unknown error";
  return msg
    .replace(/api[_-]?key\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/token\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/secret\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/bearer\s+\S+/gi, "[REDACTED]")
    .slice(0, 200);
}

export interface ExtractedItem {
  productId: string;
  shopId: string | null;
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
  shopeeShopId: string;
  shopeeItemId: string;
}

async function loadBrowserRunConfig(
  env: JobProcessorEnv
): Promise<{ baseUrl: string; apiKey: string } | null> {
  if (env.BROWSER_RUN_BASE_URL) {
    return { baseUrl: env.BROWSER_RUN_BASE_URL, apiKey: env.BROWSER_RUN_API_KEY ?? "" };
  }
  try {
    const providers = await listEnabledSearchProviders(env.DB);
    const browserRun = providers.find((p) => p.providerType === "browserRun" && p.baseUrl);
    if (!browserRun) return null;
    const apiKey = browserRun.secretRef ? env[browserRun.secretRef as keyof JobProcessorEnv] as string ?? "" : "";
    return { baseUrl: browserRun.baseUrl!, apiKey };
  } catch {
    return null;
  }
}

async function resolveInputUrl(url: string): Promise<{ shopId: string; itemId: string; canonicalUrl: string } | null> {
  const parsed = parseShopeeUrl({ url });
  if (!parsed.isValid) return null;
  if (parsed.shopId && parsed.itemId) {
    return { shopId: parsed.shopId, itemId: parsed.itemId, canonicalUrl: parsed.normalizedUrl ?? url };
  }
  if (parsed.isShortUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
      clearTimeout(timeout);
      const finalUrl = res.url || url;
      const finalParsed = parseShopeeUrl({ url: finalUrl });
      if (finalParsed.shopId && finalParsed.itemId) {
        return { shopId: finalParsed.shopId, itemId: finalParsed.itemId, canonicalUrl: finalParsed.normalizedUrl ?? finalUrl };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

async function extractOneUrl(
  env: JobProcessorEnv,
  url: string,
  extractor: ShopeeExtractorLike
): Promise<ExtractedItem | null> {
  const resolved = await resolveInputUrl(url);
  if (!resolved) return null;
  const productInput: ExtractProductInput = {
    shopId: resolved.shopId,
    itemId: resolved.itemId,
    canonicalUrl: resolved.canonicalUrl,
  };
  const productResult = await extractor.extractProduct(productInput);
  let shopSnapshot: ShopSnapshot | null = null;
  try {
    const shopResult = await extractor.extractShop({ shopId: resolved.shopId } as ExtractShopInput);
    shopSnapshot = {
      shopeeShopId: shopResult.shopeeShopId,
      name: shopResult.name,
      shopUrl: shopResult.shopUrl,
      statusLabels: shopResult.statusLabels,
      primaryStatus: shopResult.primaryStatus,
      rating: shopResult.rating,
      ratingCount: shopResult.ratingCount,
      responseRate: shopResult.responseRate,
      responseTime: shopResult.responseTime,
      followerCount: shopResult.followerCount,
      productCount: shopResult.productCount,
      joinedAgeText: shopResult.joinedAgeText,
      location: shopResult.location,
      confidenceScore: shopResult.confidenceScore,
    };
  } catch {
    shopSnapshot = null;
  }
  return {
    productId: generateId("prd"),
    shopId: null,
    product: {
      shopeeItemId: productResult.shopeeItemId,
      shopeeShopId: productResult.shopeeShopId,
      title: productResult.title,
      brand: productResult.brand,
      category: productResult.category,
      originalUrl: url,
      canonicalUrl: resolved.canonicalUrl,
      imageUrl: productResult.imageUrl,
      galleryJson: productResult.galleryJson,
      videoUrl: productResult.videoUrl,
      priceMin: productResult.priceMin,
      priceMax: productResult.priceMax,
      priceBeforeDiscount: productResult.priceBeforeDiscount,
      discountText: productResult.discountText,
      rating: productResult.rating,
      reviewCount: productResult.reviewCount,
      soldCount: productResult.soldCount,
      favoriteCount: productResult.favoriteCount,
      stock: productResult.stock,
      shippedFrom: productResult.shippedFrom,
      description: productResult.description,
      specificationJson: productResult.specificationJson,
      variationJson: productResult.variationJson,
      weight: productResult.weight,
      features: productResult.features,
      confidenceScore: productResult.confidenceScore,
    },
    shop: shopSnapshot,
    shopeeShopId: resolved.shopId,
    shopeeItemId: resolved.itemId,
  };
}

async function extractSearchCandidates(
  env: JobProcessorEnv,
  keyword: string,
  shippedFrom: string,
  limit: number,
  extractor: ShopeeExtractorLike
): Promise<ExtractedItem[]> {
  const candidates = await extractor.searchProducts({
    keyword,
    shippedFrom,
    limit: limit * 3,
  });
  const items: ExtractedItem[] = [];
  for (const cand of candidates) {
    if (!cand.itemId || !cand.shopId) continue;
    try {
      const productResult = await extractor.extractProduct({
        shopId: cand.shopId,
        itemId: cand.itemId,
        canonicalUrl: cand.canonicalUrl ?? cand.originalUrl ?? undefined,
      });
      items.push({
        productId: generateId("prd"),
        shopId: null,
        product: {
          shopeeItemId: productResult.shopeeItemId,
          shopeeShopId: productResult.shopeeShopId,
          title: productResult.title ?? cand.title,
          brand: productResult.brand,
          category: productResult.category,
          originalUrl: cand.originalUrl,
          canonicalUrl: cand.canonicalUrl ?? cand.originalUrl,
          imageUrl: productResult.imageUrl,
          galleryJson: productResult.galleryJson,
          videoUrl: productResult.videoUrl,
          priceMin: productResult.priceMin ?? cand.priceMin,
          priceMax: productResult.priceMax ?? cand.priceMax,
          priceBeforeDiscount: productResult.priceBeforeDiscount,
          discountText: productResult.discountText,
          rating: productResult.rating ?? cand.rating,
          reviewCount: productResult.reviewCount ?? cand.reviewCount,
          soldCount: productResult.soldCount ?? cand.soldCount,
          favoriteCount: productResult.favoriteCount,
          stock: productResult.stock,
          shippedFrom: productResult.shippedFrom ?? cand.shippedFrom ?? shippedFrom,
          description: productResult.description,
          specificationJson: productResult.specificationJson,
          variationJson: productResult.variationJson,
          weight: productResult.weight,
          features: productResult.features,
          confidenceScore: productResult.confidenceScore,
        },
        shop: null,
        shopeeShopId: cand.shopId,
        shopeeItemId: cand.itemId,
      });
      if (items.length >= limit) break;
    } catch {
      // skip candidate on failure
    }
  }
  return items;
}

async function persistExtractedItem(
  env: JobProcessorEnv,
  item: ExtractedItem
): Promise<{ productId: string; shopId: string | null }> {
  const shopeeShopId = item.shopeeShopId;
  let shopId = item.shopId;
  if (!shopId) {
    const existing = await findShopByShopeeId(env.DB, shopeeShopId);
    shopId = existing ? existing.id : generateId("shp");
  }

  if (item.shop) {
    await upsertShop(env.DB, {
      id: shopId,
      shopeeShopId,
      name: item.shop.name,
      shopUrl: item.shop.shopUrl,
      statusJson: item.shop.statusLabels,
      primaryStatus: item.shop.primaryStatus ?? "UNKNOWN",
      rating: item.shop.rating,
      ratingCount: item.shop.ratingCount,
      responseRate: item.shop.responseRate,
      responseTime: item.shop.responseTime,
      followerCount: item.shop.followerCount,
      productCount: item.shop.productCount,
      joinedAgeText: item.shop.joinedAgeText,
      location: item.shop.location,
      confidenceScore: item.shop.confidenceScore,
    });
  } else {
    await upsertShop(env.DB, {
      id: shopId,
      shopeeShopId,
      name: null,
      shopUrl: `https://shopee.co.id/shop/${shopeeShopId}`,
      statusJson: null,
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
    });
  }

  await upsertProduct(env.DB, {
    id: item.productId,
    shopeeItemId: item.product.shopeeItemId ?? item.shopeeItemId,
    shopeeShopId: item.product.shopeeShopId ?? shopeeShopId,
    title: item.product.title,
    brand: item.product.brand,
    category: item.product.category,
    originalUrl: item.product.originalUrl,
    canonicalUrl: item.product.canonicalUrl,
    imageUrl: item.product.imageUrl,
    galleryJson: item.product.galleryJson,
    videoUrl: item.product.videoUrl,
    priceMin: item.product.priceMin,
    priceMax: item.product.priceMax,
    priceBeforeDiscount: item.product.priceBeforeDiscount,
    discountText: item.product.discountText,
    rating: item.product.rating,
    reviewCount: item.product.reviewCount,
    soldCount: item.product.soldCount,
    favoriteCount: item.product.favoriteCount,
    stock: item.product.stock,
    shippedFrom: item.product.shippedFrom,
    description: item.product.description,
    specificationJson: item.product.specificationJson,
    variationJson: item.product.variationJson,
    confidenceScore: item.product.confidenceScore,
  });

  if (item.product.weight && (item.product.weight.value !== null || item.product.weight.rawText !== null)) {
    await saveProductWeight(env.DB, {
      id: generateId("wgt"),
      productId: item.productId,
      weight: item.product.weight,
    });
  }
  if (item.product.features && item.product.features.length > 0) {
    await saveProductFeatures(env.DB, { productId: item.productId, features: item.product.features });
  }

  return { productId: item.productId, shopId };
}

interface ScoredItem {
  productId: string;
  shopId: string | null;
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
  scoring: ReturnType<typeof calculateProductScore>;
  risks: RiskItem[];
}

function scoreItem(item: ExtractedItem, persistedShopId: string | null): ScoredItem {
  const shopSnapshot: ShopSnapshot = item.shop ?? {
    shopeeShopId: item.shopeeShopId,
    name: null,
    shopUrl: `https://shopee.co.id/shop/${item.shopeeShopId}`,
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
  const risks = detectRisks({ product: item.product, shop: shopSnapshot });
  const scoring = calculateProductScore({
    productId: item.productId,
    rating: item.product.rating,
    reviewCount: item.product.reviewCount,
    soldCount: item.product.soldCount,
    priceMin: item.product.priceMin,
    priceMax: item.product.priceMax,
    shopStatus: shopSnapshot.primaryStatus,
    shopRating: shopSnapshot.rating,
    responseRate: shopSnapshot.responseRate,
    featureCount: item.product.features?.length ?? 0,
    featureMatchCount: item.product.features?.length ?? 0,
    risks,
  });
  return {
    productId: item.productId,
    shopId: persistedShopId,
    product: item.product,
    shop: shopSnapshot,
    scoring,
    risks,
  };
}

function generateBestReason(scored: ScoredItem[]): string {
  if (scored.length === 0) return "";
  const best = scored[0];
  if (!best) return "";
  const parts: string[] = [];
  if (best.product.rating && best.product.rating >= 4.5) parts.push(`rating ${best.product.rating}/5`);
  if (best.product.reviewCount && best.product.reviewCount >= 500) parts.push(`${best.product.reviewCount} review`);
  if (best.product.soldCount && best.product.soldCount >= 1000) parts.push(`${best.product.soldCount} terjual`);
  if (best.shop?.primaryStatus && best.shop.primaryStatus !== "REGULAR" && best.shop.primaryStatus !== "UNKNOWN") {
    parts.push(`toko ${best.shop.primaryStatus}`);
  }
  if (parts.length === 0) parts.push(`skor ${(best.scoring.finalScore * 100).toFixed(1)}/100`);
  return parts.join(", ");
}

export async function processJobSync(
  env: JobProcessorEnv,
  message: QueueMessage,
  jobId: string
): Promise<ProcessJobResult> {
  const log = async (level: "info" | "warn" | "error", msg: string, metadata?: unknown) => {
    await createJobLog(env.DB, {
      id: generateId("log"),
      jobId,
      level,
      message: msg,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
    });
  };

  await log("info", `Job ${jobId} started for session ${message.researchSessionId} (${message.mode})`, {
    mode: message.mode,
    keyword: message.keyword ?? null,
    linkCount: message.links?.length ?? 0,
  });

  const browserConfig = await loadBrowserRunConfig(env);
  if (!browserConfig) {
    const msg = "Konfigurasi Browser Run belum tersedia. Set di admin UI (/settings/config) atau env BROWSER_RUN_BASE_URL.";
    await log("error", msg);
    await updateJobStatus(env.DB, jobId, jobStatus.failed, {
      currentStep: "configMissing",
      errorMessage: msg,
    });
    await updateResearchSessionStatus(env.DB, message.researchSessionId, jobStatus.failed, {
      errorMessage: msg,
    });
    return { comparisonId: null, bestProductId: null, totalProducts: 0, failed: 1, partial: false };
  }

  const extractor: ShopeeExtractorLike = new BrowserRunAdapter({
    config: {
      baseUrl: browserConfig.baseUrl,
      apiKey: browserConfig.apiKey,
      timeoutMs: 30000,
      providerKey: "browserRun",
    },
  });

  await updateJobStatus(env.DB, jobId, jobStatus.processing, {
    currentStep: "extracting",
    progressCurrent: 0,
  });

  const items: ExtractedItem[] = [];
  let failed = 0;

  if (message.mode === researchMode.compareLinks) {
    const links = message.links ?? [];
    for (let i = 0; i < links.length; i++) {
      const url = links[i]!;
      await log("info", `Mengekstrak ${i + 1}/${links.length}: ${url}`);
      try {
        const result = await extractOneUrl(env, url, extractor);
        if (result) {
          items.push(result);
        } else {
          failed++;
          await createExtractionFailure(env.DB, {
            id: generateId("efl"),
            ownerId: message.researchSessionId,
            ownerType: "session",
            adapter: "browserRun",
            url,
            errorMessage: "Gagal resolve URL atau ekstrak produk",
          });
        }
      } catch (err) {
        failed++;
        const safe = sanitizeError(err instanceof Error ? err.message : String(err));
        await log("error", `Gagal ekstrak ${url}: ${safe}`);
        await createExtractionFailure(env.DB, {
          id: generateId("efl"),
          ownerId: message.researchSessionId,
          ownerType: "session",
          adapter: "browserRun",
          url,
          errorMessage: safe,
        });
      }
      await updateJobStatus(env.DB, jobId, jobStatus.processing, {
        progressCurrent: i + 1,
        progressTotal: links.length,
        currentStep: "extracting",
      });
    }
  } else if (message.mode === researchMode.keywordSearch) {
    const keyword = message.keyword ?? "";
    const shippedFrom = message.shippedFrom ?? "DKI Jakarta";
    const limit = message.limit ?? 10;
    await log("info", `Mencari produk untuk keyword "${keyword}" (limit ${limit}, shippedFrom ${shippedFrom})`);
    try {
      const candidates = await extractSearchCandidates(env, keyword, shippedFrom, limit, extractor);
      items.push(...candidates);
      failed = Math.max(0, limit - candidates.length);
    } catch (err) {
      failed++;
      const safe = sanitizeError(err instanceof Error ? err.message : String(err));
      await log("error", `Pencarian gagal: ${safe}`);
      await createExtractionFailure(env.DB, {
        id: generateId("efl"),
        ownerId: message.researchSessionId,
        ownerType: "session",
        adapter: "browserRun.search",
        url: `keyword:${keyword}`,
        errorMessage: safe,
      });
    }
  } else {
    await log("error", `Unknown mode: ${String(message.mode)}`);
  }

  if (items.length === 0) {
    await updateJobStatus(env.DB, jobId, jobStatus.failed, {
      currentStep: "noData",
      errorMessage: "Tidak ada produk yang berhasil diekstrak",
    });
    await updateResearchSessionStatus(env.DB, message.researchSessionId, jobStatus.failed, {
      errorMessage: "Tidak ada produk yang berhasil diekstrak",
    });
    return { comparisonId: null, bestProductId: null, totalProducts: 0, failed, partial: false };
  }

  await log("info", `Menyimpan ${items.length} produk ke D1`);
  const scored: ScoredItem[] = [];
  for (const item of items) {
    try {
      const persisted = await persistExtractedItem(env, item);
      scored.push(scoreItem(item, persisted.shopId));
    } catch (err) {
      failed++;
      const safe = sanitizeError(err instanceof Error ? err.message : String(err));
      await log("error", `Persist produk gagal: ${safe}`);
    }
  }

  if (scored.length === 0) {
    await updateJobStatus(env.DB, jobId, jobStatus.failed, {
      currentStep: "persistFailed",
      errorMessage: "Semua produk gagal disimpan",
    });
    await updateResearchSessionStatus(env.DB, message.researchSessionId, jobStatus.failed, {
      errorMessage: "Semua produk gagal disimpan",
    });
    return { comparisonId: null, bestProductId: null, totalProducts: 0, failed, partial: false };
  }

  scored.sort((a, b) => b.scoring.finalScore - a.scoring.finalScore);
  const ranked = rankProducts(
    scored.map((s) => ({ product: s.product as never, scoring: s.scoring }))
  );

  const keyword = message.keyword ?? null;
  const shippedFrom = message.shippedFrom ?? null;
  const title = message.mode === researchMode.keywordSearch
    ? `Top ${scored.length} untuk "${keyword}"`
    : `Perbandingan ${scored.length} produk`;

  await log("info", `Membuat perbandingan untuk ${scored.length} produk`);
  const comparisonId = generateId("cmp");
  const best = scored[0];
  const bestProductId = best?.productId ?? null;
  try {
    await createComparison(env.DB, {
      id: comparisonId,
      researchSessionId: message.researchSessionId,
      userId: message.userId,
      title,
      mode: message.mode,
      keyword,
      shippedFrom,
      bestProductId,
      summary: null,
    });
  } catch (err) {
    const safe = sanitizeError(err instanceof Error ? err.message : String(err));
    await log("error", `Gagal membuat comparison: ${safe}`);
    throw err;
  }

  for (let i = 0; i < ranked.length; i++) {
    const item = ranked[i]!;
    const candidateScored = scored.find((s) => s.productId === (item.product as { shopeeItemId?: string | null }).shopeeItemId) || scored[i];
    if (!candidateScored) continue;
    await createComparisonItem(env.DB, {
      id: generateId("cim"),
      comparisonId,
      productId: candidateScored.productId,
      shopId: candidateScored.shopId,
      rank: i + 1,
      finalScore: candidateScored.scoring.finalScore,
      ratingScore: candidateScored.scoring.ratingScore,
      reviewCountScore: candidateScored.scoring.reviewCountScore,
      soldCountScore: candidateScored.scoring.soldCountScore,
      priceScore: candidateScored.scoring.priceScore,
      shopTrustScore: candidateScored.scoring.shopTrustScore,
      responseRateScore: candidateScored.scoring.responseRateScore,
      featureMatchScore: candidateScored.scoring.featureMatchScore,
      riskPenalty: candidateScored.scoring.riskPenalty,
      prosJson: null,
      consJson: null,
      riskJson: candidateScored.risks.map((r) => JSON.stringify(r)),
    });
  }

  await log("info", `Membuat rekomendasi AI via Mastra workflow`);
  try {
    const workflowResult = await runResearchWorkflow({
      db: env.DB,
      env: env as unknown as Record<string, string | undefined>,
      userQuery: message.keyword ?? `Perbandingan ${scored.length} produk Shopee`,
      bestReason: generateBestReason(scored),
      products: scored.map((s) => s.product),
      shops: new Map(scored.filter((s) => s.shop).map((s) => [s.product.shopeeShopId ?? "", s.shop as ShopSnapshot])),
    });
    await upsertAiReport(env.DB, {
      id: generateId("air"),
      comparisonId,
      userId: message.userId,
      model: env.NINEROUTER_BASE_URL ? "9router-primary" : "deterministic",
      provider: env.NINEROUTER_BASE_URL ? "9router" : "deterministic",
      promptVersion: "v1",
      report: workflowResult.report,
      confidence: workflowResult.report.confidence ?? 0,
      rawResponseR2Key: null,
    });
    await log("info", `Mastra workflow selesai (${workflowResult.workflowId}, ${workflowResult.stepCount} steps, usedMastra=${workflowResult.usedMastra})`);
  } catch (err) {
    const safe = sanitizeError(err instanceof Error ? err.message : String(err));
    await log("warn", `Mastra workflow gagal, lanjut dengan report kosong: ${safe}`);
  }

  const finalStatus = failed > 0 ? jobStatus.partialSuccess : jobStatus.completed;
  await updateResearchSessionStatus(env.DB, message.researchSessionId, finalStatus, {
    bestProductId: bestProductId ?? undefined,
    totalProducts: scored.length,
    completedProducts: scored.length,
  });
  await updateJobStatus(env.DB, jobId, finalStatus, {
    progressCurrent: scored.length,
    progressTotal: scored.length,
    currentStep: "completed",
  });
  await log("info", `Job selesai. Produk terbaik: ${bestProductId ?? "N/A"}. Failed: ${failed}`);

  return {
    comparisonId,
    bestProductId,
    totalProducts: scored.length,
    failed,
    partial: failed > 0,
  };
}

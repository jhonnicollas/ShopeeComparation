import type { QueueMessage } from "@shopee-research/shared";
import {
  createComparison,
  createComparisonItem,
  upsertAiReport,
  upsertProduct,
  upsertShop,
  updateJobStatus,
  updateResearchSessionStatus,
  createJobLog,
} from "@shopee-research/db";
import { findShopFixtureById, productFixtures, type ProductFixture, type ShopFixture } from "@shopee-research/shopee";
import { calculateProductScore, detectRisks, rankProducts } from "@shopee-research/core";
import { generateRecommendation } from "./agents/recommendationWriter.js";
import { researchMode, jobStatus } from "@shopee-research/shared";

export interface JobProcessorEnv {
  DB: D1Database;
  NINEROUTER_BASE_URL?: string;
}

export interface ProcessJobResult {
  comparisonId: string;
  bestProductId: string | null;
  totalProducts: number;
}

interface SelectedFixture {
  productFixture: ProductFixture;
  shopFixture: ShopFixture;
  productId: string;
  shopId: string;
}

function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `${prefix}_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

function selectFixtureByUrl(url: string, shopIdMap?: Map<string, string>): SelectedFixture | null {
  const productFixture = productFixtures.find((p) => p.originalUrl === url) ?? productFixtures[0];
  if (!productFixture) return null;
  const shopFixture = findShopFixtureById(productFixture.shopId);
  if (!shopFixture) return null;
  let shopId = shopIdMap?.get(productFixture.shopId);
  if (!shopId) {
    shopId = generateId("shp");
    shopIdMap?.set(productFixture.shopId, shopId);
  }
  return {
    productFixture,
    shopFixture,
    productId: generateId("prd"),
    shopId,
  };
}

function selectFixturesByKeyword(keyword: string, limit: number): SelectedFixture[] {
  const normalized = keyword.toLowerCase().trim();
  const filtered = productFixtures.filter((p: ProductFixture) => {
    const text = `${p.title} ${p.brand} ${p.category}`.toLowerCase();
    return text.includes(normalized) || normalized.length === 0;
  });
  const source = filtered.length > 0 ? filtered : productFixtures;
  const shopIdMap = new Map<string, string>();
  return source.slice(0, limit).map((productFixture: ProductFixture) => {
    const result = selectFixtureByUrl(productFixture.originalUrl, shopIdMap);
    if (!result) throw new Error(`Failed to select fixture for ${productFixture.itemId}`);
    return result;
  });
}

async function persistFixtures(env: JobProcessorEnv, fixtures: SelectedFixture[]): Promise<void> {
  const seenShopKeys = new Set<string>();
  for (const f of fixtures) {
    const pf = f.productFixture;
    await upsertProduct(env.DB, {
      id: f.productId,
      shopeeItemId: pf.itemId,
      shopeeShopId: pf.shopId,
      title: pf.title,
      brand: pf.brand,
      category: pf.category,
      originalUrl: pf.originalUrl,
      canonicalUrl: pf.originalUrl,
      imageUrl: pf.imageUrl,
      galleryJson: pf.galleryJson,
      videoUrl: null,
      priceMin: pf.priceMin,
      priceMax: pf.priceMax,
      priceBeforeDiscount: pf.priceBeforeDiscount,
      discountText: pf.discountText,
      rating: pf.rating,
      reviewCount: pf.reviewCount,
      soldCount: pf.soldCount,
      favoriteCount: pf.favoriteCount,
      stock: pf.stock,
      shippedFrom: pf.shippedFrom,
      description: pf.description,
      specificationJson: pf.specificationJson,
      variationJson: null,
      confidenceScore: 1.0,
    });

    if (seenShopKeys.has(f.shopId)) continue;
    seenShopKeys.add(f.shopId);

    const sf = f.shopFixture;
    await upsertShop(env.DB, {
      id: f.shopId,
      shopeeShopId: sf.shopId,
      name: sf.name,
      shopUrl: sf.shopUrl,
      statusJson: sf.statusLabels,
      primaryStatus: sf.primaryStatus,
      rating: sf.rating,
      ratingCount: sf.ratingCount,
      responseRate: sf.responseRate,
      responseTime: sf.responseTime,
      followerCount: sf.followerCount,
      productCount: sf.productCount,
      joinedAgeText: sf.joinedAgeText,
      location: sf.location,
      confidenceScore: 1.0,
    });
  }

  const shopKeyToId = new Map<string, string>();
  const shopResult = await env.DB
    .prepare("SELECT id, shopeeShopId FROM sh_shops")
    .all<{ id: string; shopeeShopId: string }>();
  for (const row of shopResult.results ?? []) {
    if (row.shopeeShopId) {
      shopKeyToId.set(row.shopeeShopId, row.id);
    }
  }
  for (const f of fixtures) {
    const actualId = shopKeyToId.get(f.productFixture.shopId);
    if (actualId) {
      f.shopId = actualId;
    }
  }
}

interface ScoredItem {
  fixture: SelectedFixture;
  scoring: ReturnType<typeof calculateProductScore>;
}

function scoreFixtures(fixtures: SelectedFixture[]): ScoredItem[] {
  return fixtures.map((f) => {
    const pf = f.productFixture;
    const sf = f.shopFixture;
    const riskItems = detectRisks({
      product: {
        shopeeItemId: pf.itemId,
        shopeeShopId: pf.shopId,
        title: pf.title,
        brand: pf.brand,
        category: pf.category,
        originalUrl: pf.originalUrl,
        canonicalUrl: pf.originalUrl,
        imageUrl: pf.imageUrl,
        galleryJson: pf.galleryJson,
        videoUrl: null,
        priceMin: pf.priceMin,
        priceMax: pf.priceMax,
        priceBeforeDiscount: pf.priceBeforeDiscount,
        discountText: pf.discountText,
        rating: pf.rating,
        reviewCount: pf.reviewCount,
        soldCount: pf.soldCount,
        favoriteCount: pf.favoriteCount,
        stock: pf.stock,
        shippedFrom: pf.shippedFrom,
        description: pf.description,
        specificationJson: pf.specificationJson,
        variationJson: null,
        weight: {
          value: pf.weight.value,
          unit: pf.weight.unit,
          rawText: pf.weight.rawText,
          source: pf.weight.source,
          confidence: pf.weight.confidence,
        },
        features: pf.features,
        confidenceScore: 1.0,
      },
      shop: {
        shopeeShopId: sf.shopId,
        name: sf.name,
        shopUrl: sf.shopUrl,
        statusLabels: sf.statusLabels,
        primaryStatus: sf.primaryStatus,
        rating: sf.rating,
        ratingCount: sf.ratingCount,
        responseRate: sf.responseRate,
        responseTime: sf.responseTime,
        followerCount: sf.followerCount,
        productCount: sf.productCount,
        joinedAgeText: sf.joinedAgeText,
        location: sf.location,
        confidenceScore: 1.0,
      },
    });

    const scoreInput: Parameters<typeof calculateProductScore>[0] = {
      productId: f.productId,
      rating: pf.rating,
      reviewCount: pf.reviewCount,
      soldCount: pf.soldCount,
      priceMin: pf.priceMin,
      priceMax: pf.priceMax,
      shopStatus: sf.primaryStatus,
      shopRating: sf.rating,
      responseRate: sf.responseRate,
      featureCount: pf.features.length,
      featureMatchCount: pf.features.length,
      risks: riskItems,
    };
    return { fixture: f, scoring: calculateProductScore(scoreInput) };
  });
}

async function saveComparison(
  env: JobProcessorEnv,
  message: QueueMessage,
  title: string,
  scored: ScoredItem[],
  ranked: ReturnType<typeof rankProducts>,
  keyword: string | null,
  shippedFrom: string | null
): Promise<string> {
  const comparisonId = generateId("cmp");
  const bestProductId = ranked.length > 0 ? scored[0]!.fixture.productId : null;
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

  for (let i = 0; i < ranked.length; i++) {
    const scoredItem = scored[i]!;
    const fixture = scoredItem.fixture;
    const sf = fixture.shopFixture;
    const riskItems = detectRisks({
      product: {
        shopeeItemId: fixture.productFixture.itemId,
        shopeeShopId: fixture.productFixture.shopId,
        title: fixture.productFixture.title,
        brand: fixture.productFixture.brand,
        category: fixture.productFixture.category,
        originalUrl: fixture.productFixture.originalUrl,
        canonicalUrl: fixture.productFixture.originalUrl,
        imageUrl: fixture.productFixture.imageUrl,
        galleryJson: fixture.productFixture.galleryJson,
        videoUrl: null,
        priceMin: fixture.productFixture.priceMin,
        priceMax: fixture.productFixture.priceMax,
        priceBeforeDiscount: fixture.productFixture.priceBeforeDiscount,
        discountText: fixture.productFixture.discountText,
        rating: fixture.productFixture.rating,
        reviewCount: fixture.productFixture.reviewCount,
        soldCount: fixture.productFixture.soldCount,
        favoriteCount: fixture.productFixture.favoriteCount,
        stock: fixture.productFixture.stock,
        shippedFrom: fixture.productFixture.shippedFrom,
        description: fixture.productFixture.description,
        specificationJson: fixture.productFixture.specificationJson,
        variationJson: null,
        weight: {
          value: fixture.productFixture.weight.value,
          unit: fixture.productFixture.weight.unit,
          rawText: fixture.productFixture.weight.rawText,
          source: fixture.productFixture.weight.source,
          confidence: fixture.productFixture.weight.confidence,
        },
        features: fixture.productFixture.features,
        confidenceScore: 1.0,
      },
      shop: {
        shopeeShopId: sf.shopId,
        name: sf.name,
        shopUrl: sf.shopUrl,
        statusLabels: sf.statusLabels,
        primaryStatus: sf.primaryStatus,
        rating: sf.rating,
        ratingCount: sf.ratingCount,
        responseRate: sf.responseRate,
        responseTime: sf.responseTime,
        followerCount: sf.followerCount,
        productCount: sf.productCount,
        joinedAgeText: sf.joinedAgeText,
        location: sf.location,
        confidenceScore: 1.0,
      },
    });
    await createComparisonItem(env.DB, {
      id: generateId("cim"),
      comparisonId,
      productId: fixture.productId,
      shopId: fixture.shopId,
      rank: i + 1,
      finalScore: scoredItem.scoring.finalScore,
      ratingScore: scoredItem.scoring.ratingScore,
      reviewCountScore: scoredItem.scoring.reviewCountScore,
      soldCountScore: scoredItem.scoring.soldCountScore,
      priceScore: scoredItem.scoring.priceScore,
      shopTrustScore: scoredItem.scoring.shopTrustScore,
      responseRateScore: scoredItem.scoring.responseRateScore,
      featureMatchScore: scoredItem.scoring.featureMatchScore,
      riskPenalty: scoredItem.scoring.riskPenalty,
      prosJson: null,
      consJson: null,
      riskJson: riskItems.map((r) => JSON.stringify(r)),
    });
  }

  return comparisonId;
}

async function generateAiReport(
  env: JobProcessorEnv,
  message: QueueMessage,
  comparisonId: string,
  scored: ScoredItem[]
): Promise<void> {
  try {
    const aiReport = await generateRecommendation(env.DB, env as unknown as Record<string, string | undefined>, {
      userQuery: message.keyword ?? `Compare ${message.links?.length ?? 0} products`,
      products: scored.map((s) => ({
        shopeeItemId: s.fixture.productFixture.itemId,
        shopeeShopId: s.fixture.productFixture.shopId,
        title: s.fixture.productFixture.title,
        originalUrl: s.fixture.productFixture.originalUrl,
        canonicalUrl: s.fixture.productFixture.originalUrl,
        priceMin: s.fixture.productFixture.priceMin,
        priceMax: s.fixture.productFixture.priceMax,
        rating: s.fixture.productFixture.rating,
        reviewCount: s.fixture.productFixture.reviewCount,
        soldCount: s.fixture.productFixture.soldCount,
        shippedFrom: s.fixture.productFixture.shippedFrom,
        imageUrl: s.fixture.productFixture.imageUrl,
        brand: s.fixture.productFixture.brand,
        category: s.fixture.productFixture.category,
        galleryJson: s.fixture.productFixture.galleryJson,
        videoUrl: null,
        priceBeforeDiscount: s.fixture.productFixture.priceBeforeDiscount,
        discountText: s.fixture.productFixture.discountText,
        favoriteCount: s.fixture.productFixture.favoriteCount,
        stock: s.fixture.productFixture.stock,
        description: s.fixture.productFixture.description,
        specificationJson: s.fixture.productFixture.specificationJson,
        variationJson: null,
        weight: {
          value: s.fixture.productFixture.weight.value,
          unit: s.fixture.productFixture.weight.unit,
          rawText: s.fixture.productFixture.weight.rawText,
          source: s.fixture.productFixture.weight.source,
          confidence: s.fixture.productFixture.weight.confidence,
        },
        features: s.fixture.productFixture.features,
        confidenceScore: 1.0,
      })),
      shops: new Map(),
      scoredProducts: scored.map((s) => ({
        product: {
          shopeeItemId: s.fixture.productFixture.itemId,
          shopeeShopId: s.fixture.productFixture.shopId,
          title: s.fixture.productFixture.title,
          originalUrl: s.fixture.productFixture.originalUrl,
          canonicalUrl: s.fixture.productFixture.originalUrl,
          priceMin: s.fixture.productFixture.priceMin,
          priceMax: s.fixture.productFixture.priceMax,
          rating: s.fixture.productFixture.rating,
          reviewCount: s.fixture.productFixture.reviewCount,
          soldCount: s.fixture.productFixture.soldCount,
          shippedFrom: s.fixture.productFixture.shippedFrom,
          imageUrl: s.fixture.productFixture.imageUrl,
          brand: s.fixture.productFixture.brand,
          category: s.fixture.productFixture.category,
          galleryJson: s.fixture.productFixture.galleryJson,
          videoUrl: null,
          priceBeforeDiscount: s.fixture.productFixture.priceBeforeDiscount,
          discountText: s.fixture.productFixture.discountText,
          favoriteCount: s.fixture.productFixture.favoriteCount,
          stock: s.fixture.productFixture.stock,
          description: s.fixture.productFixture.description,
          specificationJson: s.fixture.productFixture.specificationJson,
          variationJson: null,
          weight: {
            value: s.fixture.productFixture.weight.value,
            unit: s.fixture.productFixture.weight.unit,
            rawText: s.fixture.productFixture.weight.rawText,
            source: s.fixture.productFixture.weight.source,
            confidence: s.fixture.productFixture.weight.confidence,
          },
          features: s.fixture.productFixture.features,
          confidenceScore: 1.0,
        },
        scoring: s.scoring,
      })),
    });

    await upsertAiReport(env.DB, {
      id: generateId("air"),
      comparisonId,
      userId: message.userId,
      model: message.mode,
      provider: "9router",
      promptVersion: "v1",
      report: aiReport.report,
      confidence: aiReport.report.confidence ?? 0,
      rawResponseR2Key: null,
    });
  } catch (err) {
    console.warn("AI report generation failed:", err);
  }
}

export async function processJobSync(
  env: JobProcessorEnv,
  message: QueueMessage,
  jobId: string
): Promise<ProcessJobResult> {
  const fixtures: SelectedFixture[] = [];

  await createJobLog(env.DB, {
    id: generateId("log"),
    jobId,
    level: "info",
    message: `Job ${jobId} started for session ${message.researchSessionId} (${message.mode})`,
    metadataJson: JSON.stringify({ mode: message.mode, keyword: message.keyword ?? null, linkCount: message.links?.length ?? 0 }),
  });

  if (message.mode === researchMode.compareLinks) {
    const links = message.links ?? [];
    console.log(`[compare-links] Processing ${links.length} links`);
    await createJobLog(env.DB, {
      id: generateId("log"),
      jobId,
      level: "info",
      message: `Memproses ${links.length} link Shopee`,
    });
    const shopIdMap = new Map<string, string>();
    for (const url of links) {
      const f = selectFixtureByUrl(url, shopIdMap);
      if (f) fixtures.push(f);
    }
  } else if (message.mode === researchMode.keywordSearch) {
    const keyword = message.keyword ?? "";
    const limit = message.limit ?? 10;
    console.log(`[keyword-search] Processing keyword: "${keyword}", limit: ${limit}`);
    await createJobLog(env.DB, {
      id: generateId("log"),
      jobId,
      level: "info",
      message: `Mencari produk untuk keyword "${keyword}" (limit ${limit})`,
    });
    fixtures.push(...selectFixturesByKeyword(keyword, limit));
  }

  console.log(`[jobProcessor] Persisting ${fixtures.length} fixtures`);
  await createJobLog(env.DB, {
    id: generateId("log"),
    jobId,
    level: "info",
    message: `Menyimpan ${fixtures.length} produk ke D1`,
  });
  try {
    await persistFixtures(env, fixtures);
    console.log(`[jobProcessor] Persist done`);
    await createJobLog(env.DB, {
      id: generateId("log"),
      jobId,
      level: "info",
      message: `${fixtures.length} produk berhasil disimpan`,
    });
  } catch (err) {
    console.error(`[jobProcessor] Persist failed:`, err);
    await createJobLog(env.DB, {
      id: generateId("log"),
      jobId,
      level: "error",
      message: `Gagal menyimpan produk: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    throw err;
  }

  const scored = scoreFixtures(fixtures);
  const ranked = rankProducts(scored.map((s) => ({ product: s.fixture.productFixture as never, scoring: s.scoring })));

  const keyword = message.keyword ?? null;
  const shippedFrom = message.shippedFrom ?? null;
  const title = message.mode === researchMode.keywordSearch
    ? `Top ${fixtures.length} for "${keyword}"`
    : `Compare ${fixtures.length} products`;

  console.log(`[jobProcessor] Saving comparison`);
  await createJobLog(env.DB, {
    id: generateId("log"),
    jobId,
    level: "info",
    message: "Membuat perbandingan dan menyimpan ranking",
  });
  let comparisonId = "";
  try {
    comparisonId = await saveComparison(env, message, title, scored, ranked, keyword, shippedFrom);
    console.log(`[jobProcessor] Comparison saved: ${comparisonId}`);
    await createJobLog(env.DB, {
      id: generateId("log"),
      jobId,
      level: "info",
      message: `Perbandingan ${comparisonId} berhasil disimpan`,
    });
    await generateAiReport(env, message, comparisonId, scored);
    console.log(`[jobProcessor] AI report done`);
    await createJobLog(env.DB, {
      id: generateId("log"),
      jobId,
      level: "info",
      message: "AI report berhasil di-generate",
    });
  } catch (err) {
    console.error(`[jobProcessor] Save/AI failed:`, err);
    await createJobLog(env.DB, {
      id: generateId("log"),
      jobId,
      level: "error",
      message: `Gagal membuat perbandingan/AI: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    throw err;
  }

  const bestProductId = fixtures.length > 0 ? fixtures[0]!.productId : null;
  console.log(`[jobProcessor] Updating session status`);
  await createJobLog(env.DB, {
    id: generateId("log"),
    jobId,
    level: "info",
    message: `Job ${jobId} selesai. Produk terbaik: ${bestProductId ?? "N/A"}`,
  });
  await updateResearchSessionStatus(env.DB, message.researchSessionId, jobStatus.completed, {
    bestProductId: bestProductId ?? undefined,
    totalProducts: fixtures.length,
    completedProducts: fixtures.length,
  });
  await updateJobStatus(env.DB, jobId, jobStatus.completed, {
    progressCurrent: fixtures.length,
    progressTotal: fixtures.length,
    currentStep: "completed",
  });

  return {
    comparisonId,
    bestProductId,
    totalProducts: fixtures.length,
  };
}
import { type QueueMessage, queueMessageSchema, researchMode, jobStatus } from "@shopee-research/shared";
import { Hono } from "hono";
import {
  findJobById,
  updateJobStatus,
  updateResearchSessionStatus,
  createComparison,
  createComparisonItem,
  upsertProduct,
  upsertShop,
  upsertAiReport,
} from "@shopee-research/db";
import {
  productFixtures,
  findShopFixtureById,
  type ProductFixture,
  type ShopFixture,
} from "@shopee-research/shopee";
import {
  calculateProductScore,
  rankProducts,
  detectRisks,
} from "@shopee-research/core";
import { generateRecommendation } from "@shopee-research/ai";

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
  APP_ENV?: string;
  NINEROUTER_BASE_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/health", (c) => {
  return c.json({ status: "ok", worker: "queue-consumer" });
});

export interface QueueMessageBatch {
  messages: Array<{
    body: string;
    ack: () => void;
    retry: () => void;
  }>;
  queue: string;
}

function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `${prefix}_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

interface SelectedFixture {
  productFixture: ProductFixture;
  shopFixture: ShopFixture;
  productId: string;
  shopId: string;
}

function selectFixtureByIndex(): SelectedFixture | null {
  const productFixture = productFixtures[0];
  const shopFixture = findShopFixtureById(productFixture.shopId);
  if (!shopFixture) return null;
  return {
    productFixture,
    shopFixture,
    productId: generateId("prd"),
    shopId: generateId("shp"),
  };
}

function selectFixtureByUrl(url: string): SelectedFixture | null {
  const productFixture = productFixtures.find((p) => p.originalUrl === url) ?? productFixtures[0];
  if (!productFixture) return null;
  const shopFixture = findShopFixtureById(productFixture.shopId);
  if (!shopFixture) return null;
  return {
    productFixture,
    shopFixture,
    productId: generateId("prd"),
    shopId: generateId("shp"),
  };
}

function selectFixturesByKeyword(keyword: string, limit: number): SelectedFixture[] {
  const normalized = keyword.toLowerCase().trim();
  const filtered = productFixtures.filter((p) => {
    const text = `${p.title} ${p.brand} ${p.category}`.toLowerCase();
    return text.includes(normalized) || normalized.length === 0;
  });
  const source = filtered.length > 0 ? filtered : productFixtures;
  return source.slice(0, limit).map((productFixture) => {
    const shopFixture = findShopFixtureById(productFixture.shopId);
    if (!shopFixture) {
      throw new Error(`Shop ${productFixture.shopId} not found`);
    }
    return {
      productFixture,
      shopFixture,
      productId: generateId("prd"),
      shopId: generateId("shp"),
    };
  });
}

async function persistFixtures(db: D1Database, fixtures: SelectedFixture[]): Promise<SelectedFixture[]> {
  for (const f of fixtures) {
    const pf = f.productFixture;
    await upsertProduct(db, {
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

    const sf = f.shopFixture;
    await upsertShop(db, {
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
  return fixtures;
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
        weight: { value: pf.weight.value, unit: pf.weight.unit, rawText: pf.weight.rawText, source: pf.weight.source, confidence: pf.weight.confidence },
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

async function saveComparisonAndItems(
  db: D1Database,
  message: QueueMessage,
  title: string,
  scored: ScoredItem[],
  ranked: ReturnType<typeof rankProducts>,
  keyword: string | null,
  shippedFrom: string | null
): Promise<string> {
  const comparisonId = generateId("cmp");
  const bestProductId = ranked.length > 0 ? scored[0]!.fixture.productId : null;
  await createComparison(db, {
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
    const item = ranked[i]!;
    const scoredItem = scored.find((s) => s.fixture.productId === item.product.shopeeItemId)! || scored[i]!;
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
    await createComparisonItem(db, {
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
  db: D1Database,
  env: Bindings,
  message: QueueMessage,
  comparisonId: string,
  scored: ScoredItem[]
): Promise<void> {
  try {
    const aiReport = await generateRecommendation(db, env as unknown as Record<string, string | undefined>, {
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
    });

    await upsertAiReport(db, {
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

async function completeSession(
  db: D1Database,
  message: QueueMessage,
  jobId: string,
  fixtures: SelectedFixture[]
): Promise<void> {
  const bestProductId = fixtures.length > 0 ? fixtures[0]!.productId : null;
  await updateResearchSessionStatus(db, message.researchSessionId, jobStatus.completed, {
    bestProductId: bestProductId ?? undefined,
    totalProducts: fixtures.length,
    completedProducts: fixtures.length,
  });
  await updateJobStatus(db, jobId, jobStatus.completed, {
    progressCurrent: fixtures.length,
    progressTotal: fixtures.length,
    currentStep: "completed",
  });
}

export async function processQueueBatch(batch: QueueMessageBatch, env: Bindings): Promise<void> {
  for (const message of batch.messages) {
    try {
      const parsed = JSON.parse(message.body);
      const result = queueMessageSchema.safeParse(parsed);
      if (!result.success) {
        console.error("Invalid queue message:", result.error.issues);
        message.retry();
        continue;
      }
      const queueMessage: QueueMessage = result.data;

      const job = await findJobById(env.DB, queueMessage.researchSessionId);
      const jobId = job?.id ?? "";

      await updateJobStatus(env.DB, jobId, jobStatus.processing, {
        currentStep: "started",
        progressCurrent: 0,
      });

      console.log("Processing research job:", {
        userId: queueMessage.userId,
        researchSessionId: queueMessage.researchSessionId,
        mode: queueMessage.mode,
      });

      if (queueMessage.mode === researchMode.compareLinks) {
        const links = queueMessage.links ?? [];
        console.log(`[compare-links] Processing ${links.length} links`);
        const fixtures: SelectedFixture[] = [];
        for (let i = 0; i < links.length; i++) {
          const f = selectFixtureByIndex() ?? selectFixtureByUrl(links[i]!);
          if (f) fixtures.push(f);
        }
        await persistFixtures(env.DB, fixtures);
        const scored = scoreFixtures(fixtures);
        const ranked = rankProducts(scored.map((s) => ({ product: s.fixture.productFixture as never, scoring: s.scoring })));
        const comparisonId = await saveComparisonAndItems(env.DB, queueMessage, `Compare ${fixtures.length} products`, scored, ranked, null, null);
        await generateAiReport(env.DB, env, queueMessage, comparisonId, scored);
        await completeSession(env.DB, queueMessage, jobId, fixtures);
      } else if (queueMessage.mode === researchMode.keywordSearch) {
        const keyword = queueMessage.keyword ?? "";
        const limit = queueMessage.limit ?? 10;
        const shippedFrom = queueMessage.shippedFrom ?? "DKI Jakarta";
        console.log(`[keyword-search] Processing keyword: "${keyword}", limit: ${limit}`);
        const fixtures = selectFixturesByKeyword(keyword, limit);
        await persistFixtures(env.DB, fixtures);
        const scored = scoreFixtures(fixtures);
        const ranked = rankProducts(scored.map((s) => ({ product: s.fixture.productFixture as never, scoring: s.scoring })));
        const comparisonId = await saveComparisonAndItems(env.DB, queueMessage, `Top ${fixtures.length} for "${keyword}"`, scored, ranked, keyword, shippedFrom);
        await generateAiReport(env.DB, env, queueMessage, comparisonId, scored);
        await completeSession(env.DB, queueMessage, jobId, fixtures);
      }

      message.ack();
    } catch (error) {
      console.error("Error processing queue message:", error);
      try {
        const parsed = JSON.parse(message.body);
        const result = queueMessageSchema.safeParse(parsed);
        if (result.success) {
          const job = await findJobById(env.DB, result.data.researchSessionId);
          if (job) {
            await updateJobStatus(env.DB, job.id, jobStatus.failed, {
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
            await updateResearchSessionStatus(env.DB, result.data.researchSessionId, jobStatus.failed, {
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
} catch (parseErr) {
          void parseErr;
        }
        message.retry();
    }
  }
}

export default {
  async queue(batch: MessageBatch, env: Bindings, ctx: ExecutionContext): Promise<void> {
    void ctx;
    await processQueueBatch(batch as unknown as QueueMessageBatch, env);
  },
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};

// Re-export for tests
export { selectFixtureByIndex, selectFixtureByUrl, selectFixturesByKeyword };
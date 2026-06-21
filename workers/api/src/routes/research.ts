import { Hono } from "hono";
import {
  compareLinksRequestSchema,
  compareLinksResponseSchema,
  jobStatus,
  keywordSearchRequestSchema,
  keywordSearchResponseSchema,
  researchListResponseSchema,
  researchMode,
} from "@shopee-research/shared";
import {
  createResearchSession,
  createJob,
  listResearchSessionsByUser,
  sendResearchJobMessage,
  findJobById,
  findLatestJobByResearchSession,
  updateJobStatus,
  updateResearchSessionStatus,
  listJobLogsByJob,
  findResearchSessionById,
  findComparisonBySession,
  findComparisonById,
  findAiReportByComparison,
  listComparisonItemsByComparisonDb,
  findProductById,
  findShopById,
  listJobsByStatus,
  listJobLogs,
} from "@shopee-research/db";
import { parseShopeeUrl } from "@shopee-research/shopee";
import { authenticate, authErrorResponse, requireAdmin } from "../lib/auth.js";
import { errorResponse, forbiddenResponse, invalidJsonResponse, notFoundResponse, validationErrorResponse } from "../lib/errors.js";

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
  RESEARCH_QUEUE: Queue;
  APP_ENV: string;
  APP_NAME: string;
  PASSWORD_PEPPER?: string;
};

function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `${prefix}_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

export const researchRouter = new Hono<{ Bindings: Bindings }>();

function sanitizeQueueError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/api[_-]?key\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/token\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/secret\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/bearer\s+\S+/gi, "[REDACTED]")
    .slice(0, 200);
}

async function enqueueOrFail(
  c: { env: Bindings },
  payload: Parameters<typeof sendResearchJobMessage>[0]["message"],
  jobId: string,
  researchSessionId: string
): Promise<Response | null> {
  try {
    await sendResearchJobMessage({
      queue: c.env.RESEARCH_QUEUE,
      message: { ...payload, jobId, researchSessionId },
    });
    return null;
  } catch (err) {
    const message = sanitizeQueueError(err) || "QUEUE_FAILED";
    await updateJobStatus(c.env.DB, jobId, jobStatus.failed, {
      errorMessage: message,
      currentStep: "queueFailed",
    });
    await updateResearchSessionStatus(c.env.DB, researchSessionId, jobStatus.failed, {
      errorMessage: message,
    });
    return errorResponse(
      { json: (b: unknown, s: number) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } }) } as never,
      500,
      "QUEUE_FAILED",
      "Gagal mengirim job ke queue. Coba lagi nanti."
    );
  }
}

researchRouter.post("/compare-links", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = compareLinksRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid compare links input", parsed.error.issues);
  }

  const normalizedLinks: string[] = [];
  const seenNormalized = new Set<string>();
  for (const link of parsed.data.links) {
    const parseResult = parseShopeeUrl({ url: link });
    if (!parseResult.isValid || (!parseResult.isShopeeHost && !parseResult.isShortUrl)) {
      return errorResponse(c, 400, "INVALID_INPUT", `URL bukan Shopee yang valid: ${link}`);
    }
    const canonical = parseResult.normalizedUrl ?? link;
    if (seenNormalized.has(canonical)) continue;
    seenNormalized.add(canonical);
    normalizedLinks.push(canonical);
  }

  if (normalizedLinks.length === 0) {
    return errorResponse(c, 400, "INVALID_INPUT", "Tidak ada link valid setelah deduplication");
  }

  const sessionId = generateId("rsr");
  const jobId = generateId("job");

  await createResearchSession(c.env.DB, {
    id: sessionId,
    userId: auth.user.userId,
    mode: researchMode.compareLinks,
    keyword: null,
    shippedFrom: "DKI Jakarta",
    status: jobStatus.pending,
  });

  await createJob(c.env.DB, {
    id: jobId,
    userId: auth.user.userId,
    researchSessionId: sessionId,
    type: researchMode.compareLinks,
    status: jobStatus.pending,
    payloadJson: JSON.stringify({ links: parsed.data.links }),
  });

  const failed = await enqueueOrFail(
    c,
    {
      userId: auth.user.userId,
      researchSessionId: sessionId,
      mode: researchMode.compareLinks,
      links: normalizedLinks,
    },
    jobId,
    sessionId
  );
  if (failed) return failed;

  return c.json(
    compareLinksResponseSchema.parse({
      researchSessionId: sessionId,
      jobId,
      status: jobStatus.pending,
    }),
    202
  );
});

researchRouter.post("/keyword-search", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = keywordSearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid keyword search input", parsed.error.issues);
  }

  const sessionId = generateId("rsr");
  const jobId = generateId("job");

  const shippedFrom = parsed.data.shippedFrom ?? "DKI Jakarta";
  const limit = parsed.data.limit ?? 10;

  await createResearchSession(c.env.DB, {
    id: sessionId,
    userId: auth.user.userId,
    mode: researchMode.keywordSearch,
    keyword: parsed.data.keyword,
    shippedFrom,
    status: jobStatus.pending,
  });

  const payload = {
    keyword: parsed.data.keyword,
    shippedFrom,
    limit,
    ...(parsed.data.priceMin !== undefined && parsed.data.priceMin !== null ? { priceMin: parsed.data.priceMin } : {}),
    ...(parsed.data.priceMax !== undefined && parsed.data.priceMax !== null ? { priceMax: parsed.data.priceMax } : {}),
    ...(parsed.data.minimumRating !== undefined && parsed.data.minimumRating !== null ? { minimumRating: parsed.data.minimumRating } : {}),
    ...(parsed.data.storeStatus && parsed.data.storeStatus.length > 0 ? { storeStatus: parsed.data.storeStatus } : {}),
  };

  await createJob(c.env.DB, {
    id: jobId,
    userId: auth.user.userId,
    researchSessionId: sessionId,
    type: researchMode.keywordSearch,
    status: jobStatus.pending,
    payloadJson: JSON.stringify(payload),
  });

  const failed = await enqueueOrFail(
    c,
    {
      userId: auth.user.userId,
      researchSessionId: sessionId,
      mode: researchMode.keywordSearch,
      keyword: parsed.data.keyword,
      shippedFrom,
      limit,
      ...(parsed.data.priceMin !== undefined && parsed.data.priceMin !== null ? { priceMin: parsed.data.priceMin } : {}),
      ...(parsed.data.priceMax !== undefined && parsed.data.priceMax !== null ? { priceMax: parsed.data.priceMax } : {}),
      ...(parsed.data.minimumRating !== undefined && parsed.data.minimumRating !== null ? { minimumRating: parsed.data.minimumRating } : {}),
      ...(parsed.data.storeStatus && parsed.data.storeStatus.length > 0 ? { storeStatus: parsed.data.storeStatus } : {}),
    },
    jobId,
    sessionId
  );
  if (failed) return failed;

  return c.json(
    keywordSearchResponseSchema.parse({
      researchSessionId: sessionId,
      jobId,
      status: jobStatus.pending,
    }),
    202
  );
});

researchRouter.get("/", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const sessions = await listResearchSessionsByUser(c.env.DB, auth.user.userId, 50);
  return c.json(
    researchListResponseSchema.parse({
      items: sessions.map((s) => ({
        id: s.id,
        mode: s.mode,
        keyword: s.keyword,
        status: s.status,
        bestProductId: s.bestProductId,
        createdAt: s.createdAt,
      })),
    }),
    200
  );
});

researchRouter.get("/jobs/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const job = await findJobById(c.env.DB, id);
  if (!job) {
    return notFoundResponse(c, "JOB_NOT_FOUND", "Job not found");
  }

  if (job.userId !== auth.user.userId) {
    return forbiddenResponse(c, "Cannot access this job");
  }

  return c.json(
    {
      jobId: job.id,
      researchSessionId: job.researchSessionId,
      type: job.type,
      status: job.status,
      progressCurrent: job.progressCurrent,
      progressTotal: job.progressTotal,
      currentStep: job.currentStep,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
    200
  );
});

researchRouter.get("/jobs/:id/logs", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const job = await findJobById(c.env.DB, id);
  if (!job) {
    return notFoundResponse(c, "JOB_NOT_FOUND", "Job not found");
  }

  if (job.userId !== auth.user.userId) {
    return forbiddenResponse(c, "Cannot access this job");
  }

  const logs = await listJobLogsByJob(c.env.DB, id, 200);
  return c.json(
    {
      items: logs.map((l) => ({
        id: l.id,
        jobId: l.jobId,
        level: l.level,
        message: l.message,
        metadataJson: l.metadataJson,
        createdAt: l.createdAt,
      })),
    },
    200
  );
});

researchRouter.get("/sessions/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const session = await findResearchSessionById(c.env.DB, id);
  if (!session) {
    return notFoundResponse(c, "SESSION_NOT_FOUND", "Session not found");
  }

  if (session.userId !== auth.user.userId) {
    return forbiddenResponse(c, "Cannot access this session");
  }

  return c.json(
    {
      researchSessionId: session.id,
      mode: session.mode,
      keyword: session.keyword,
      shippedFrom: session.shippedFrom,
      status: session.status,
      bestProductId: session.bestProductId,
      totalProducts: session.totalProducts,
      completedProducts: session.completedProducts,
      errorMessage: session.errorMessage,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    200
  );
});

researchRouter.get("/sessions/:id/status", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const session = await findResearchSessionById(c.env.DB, id);
  if (!session) {
    return notFoundResponse(c, "SESSION_NOT_FOUND", "Session not found");
  }

  if (session.userId !== auth.user.userId) {
    return forbiddenResponse(c, "Cannot access this session");
  }

  const job = await findLatestJobByResearchSession(c.env.DB, id);
  let currentStep: string = "queued";
  let progressCurrent = 0;
  let progressTotal = 0;
  if (job) {
    currentStep = job.currentStep ?? (job.status === "completed" ? "completed" : job.status === "failed" ? "failed" : "queued");
    progressCurrent = job.progressCurrent ?? 0;
    progressTotal = job.progressTotal ?? 0;
  }

  return c.json({
    id: session.id,
    status: session.status,
    completedProducts: session.completedProducts ?? progressCurrent,
    totalProducts: session.totalProducts ?? progressTotal,
    currentStep,
    errorMessage: session.errorMessage ?? null,
    updatedAt: session.updatedAt,
  });
});

researchRouter.get("/comparisons/by-session/:sessionId", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const sessionId = c.req.param("sessionId");

  const session = await findResearchSessionById(c.env.DB, sessionId);
  if (!session) {
    return notFoundResponse(c, "SESSION_NOT_FOUND", "Session not found");
  }

  if (session.userId !== auth.user.userId) {
    return forbiddenResponse(c, "Cannot access this session");
  }

  const comparison = await findComparisonBySession(c.env.DB, sessionId);
  if (!comparison) {
    return c.json({ comparison: null, items: [], shops: {}, products: {} }, 200);
  }

  const items = await listComparisonItemsByComparisonDb(c.env.DB, comparison.id);
  const productMap: Record<string, unknown> = {};
  const shopMap: Record<string, unknown> = {};
  for (const item of items) {
    if (!productMap[item.productId]) {
      const product = await findProductById(c.env.DB, item.productId);
      if (product) productMap[item.productId] = product;
    }
    if (item.shopId && !shopMap[item.shopId]) {
      const shop = await findShopById(c.env.DB, item.shopId);
      if (shop) shopMap[item.shopId] = shop;
    }
  }

  return c.json(
    {
      comparison: {
        id: comparison.id,
        researchSessionId: comparison.researchSessionId,
        title: comparison.title,
        mode: comparison.mode,
        bestProductId: comparison.bestProductId,
      },
      items: items.map((i) => ({
        id: i.id,
        rank: i.rank,
        productId: i.productId,
        shopId: i.shopId,
        finalScore: i.finalScore,
        ratingScore: i.ratingScore,
        reviewCountScore: i.reviewCountScore,
        soldCountScore: i.soldCountScore,
        priceScore: i.priceScore,
        shopTrustScore: i.shopTrustScore,
        responseRateScore: i.responseRateScore,
        featureMatchScore: i.featureMatchScore,
        riskPenalty: i.riskPenalty,
        prosJson: i.prosJson ? JSON.parse(i.prosJson) : null,
        consJson: i.consJson ? JSON.parse(i.consJson) : null,
        riskJson: i.riskJson ? JSON.parse(i.riskJson) : null,
      })),
      products: productMap,
      shops: shopMap,
    },
    200
  );
});

researchRouter.get("/comparisons/:comparisonId/ai-report", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const comparisonId = c.req.param("comparisonId");

  const comparison = await findComparisonById(c.env.DB, comparisonId);
  if (!comparison) {
    return notFoundResponse(c, "COMPARISON_NOT_FOUND", "Comparison not found");
  }

  if (comparison.userId !== auth.user.userId) {
    return forbiddenResponse(c, "Cannot access this comparison");
  }

  const report = await findAiReportByComparison(c.env.DB, comparisonId);
  if (!report) {
    return c.json({ report: null, rawText: null }, 200);
  }

  let parsedReport = null;
  try {
    parsedReport = report.reportJson ? JSON.parse(report.reportJson) : null;
  } catch {
    parsedReport = null;
  }

  return c.json(
    {
      report: parsedReport,
      rawText: report.reportText ?? null,
    },
    200
  );
});

researchRouter.get("/products/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const product = await findProductById(c.env.DB, id);
  if (!product) {
    return notFoundResponse(c, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return c.json(product, 200);
});

researchRouter.get("/shops/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const shop = await findShopById(c.env.DB, id);
  if (!shop) {
    return notFoundResponse(c, "SHOP_NOT_FOUND", "Shop not found");
  }

  return c.json(shop, 200);
});

researchRouter.get("/admin/jobs", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const status = c.req.query("status") ?? "failed";
  const limit = Number(c.req.query("limit") ?? "50");

  const jobs = await listJobsByStatus(c.env.DB, status, Math.min(limit, 200));
  return c.json(
    {
      items: jobs.map((j) => ({
        id: j.id,
        userId: j.userId,
        researchSessionId: j.researchSessionId,
        type: j.type,
        status: j.status,
        progressCurrent: j.progressCurrent,
        progressTotal: j.progressTotal,
        currentStep: j.currentStep,
        errorMessage: j.errorMessage,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      })),
    },
    200
  );
});

researchRouter.get("/admin/logs", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const level = c.req.query("level");
  const limit = Number(c.req.query("limit") ?? "100");

  const logs = await listJobLogs(c.env.DB, {
    level: (level as "info" | "warn" | "error" | "debug") || undefined,
    limit: Math.min(limit, 500),
  });
  return c.json(
    {
      items: logs.map((l) => ({
        id: l.id,
        jobId: l.jobId,
        level: l.level,
        message: l.message,
        metadataJson: l.metadataJson,
        createdAt: l.createdAt,
      })),
    },
    200
  );
});

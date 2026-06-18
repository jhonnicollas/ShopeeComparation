import { Hono } from "hono";
import {
  compareLinksRequestSchema,
  compareLinksResponseSchema,
  jobStatus,
  researchMode,
} from "@shopee-research/shared";
import {
  createResearchSession,
  createJob,
  sendResearchJobMessage,
} from "@shopee-research/db";
import { authenticate, authErrorResponse } from "../lib/auth.js";

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
    return c.json(
      { error: { code: "INVALID_INPUT", message: "Request body must be valid JSON", details: null } },
      400
    );
  }

  const parsed = compareLinksRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid compare links input",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      400
    );
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

  await sendResearchJobMessage({
    queue: c.env.RESEARCH_QUEUE,
    message: {
      userId: auth.user.userId,
      researchSessionId: sessionId,
      mode: researchMode.compareLinks,
      links: parsed.data.links,
    },
  });

  return c.json(
    compareLinksResponseSchema.parse({
      researchSessionId: sessionId,
      jobId,
      status: jobStatus.pending,
    }),
    202
  );
});

researchRouter.get("/jobs/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const { findJobById } = await import("@shopee-research/db");
  const job = await findJobById(c.env.DB, id);
  if (!job) {
    return c.json(
      { error: { code: "JOB_NOT_FOUND", message: "Job not found", details: null } },
      404
    );
  }

  if (job.userId !== auth.user.userId) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Cannot access this job", details: null } },
      403
    );
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

researchRouter.get("/sessions/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const { findResearchSessionById } = await import("@shopee-research/db");
  const session = await findResearchSessionById(c.env.DB, id);
  if (!session) {
    return c.json(
      { error: { code: "SESSION_NOT_FOUND", message: "Session not found", details: null } },
      404
    );
  }

  if (session.userId !== auth.user.userId) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Cannot access this session", details: null } },
      403
    );
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

researchRouter.get("/comparisons/by-session/:sessionId", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }

  const sessionId = c.req.param("sessionId");
  const { findComparisonBySession, listComparisonItemsByComparisonDb } = await import("@shopee-research/db");
  const { findResearchSessionById } = await import("@shopee-research/db");

  const session = await findResearchSessionById(c.env.DB, sessionId);
  if (!session) {
    return c.json(
      { error: { code: "SESSION_NOT_FOUND", message: "Session not found", details: null } },
      404
    );
  }

  if (session.userId !== auth.user.userId) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Cannot access this session", details: null } },
      403
    );
  }

  const comparison = await findComparisonBySession(c.env.DB, sessionId);
  if (!comparison) {
    return c.json({ comparison: null, items: [] }, 200);
  }

  const items = await listComparisonItemsByComparisonDb(c.env.DB, comparison.id);
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
    },
    200
  );
});

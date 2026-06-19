import { Hono } from "hono";
import type { D1Database, R2Bucket, Queue } from "@cloudflare/workers-types";
import { resolveUrlRequestSchema } from "@shopee-research/shared";
import { resolveUrlWithDiagnostics } from "@shopee-research/shopee";
import { authenticate, authErrorResponse } from "../lib/auth.js";
import { invalidJsonResponse, validationErrorResponse, sanitizeErrorMessage } from "../lib/errors.js";

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
  RESEARCH_QUEUE: Queue;
  APP_ENV: string;
  APP_NAME: string;
  PASSWORD_PEPPER?: string;
};

export const shopeeRouter = new Hono<{ Bindings: Bindings }>();

shopeeRouter.post("/resolve-url", async (c) => {
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

  const parsed = resolveUrlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid resolve URL input", parsed.error.issues);
  }

  const result = await resolveUrlWithDiagnostics({ url: parsed.data.url });

  return c.json(
    {
      originalUrl: result.originalUrl,
      finalUrl: result.finalUrl,
      canonicalUrl: result.canonicalUrl,
      shopId: result.shopId,
      itemId: result.itemId,
      resolveMethod: result.resolveMethod,
      status: result.status,
      errorMessage: sanitizeErrorMessage(result.errorMessage),
      diagnostics: {
        adapterUsed: result.diagnostics.adapterUsed,
        attempts: result.diagnostics.attempts.map((a) => ({
          adapter: a.adapter,
          resolveMethod: a.resolveMethod,
          status: a.status,
          ...(a.errorMessage ? { errorMessage: sanitizeErrorMessage(a.errorMessage) ?? undefined } : {}),
          ...(a.durationMs !== undefined ? { durationMs: a.durationMs } : {}),
        })),
      },
    },
    200
  );
});

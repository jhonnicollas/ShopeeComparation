import { Hono } from "hono";
import type { D1Database, R2Bucket, Queue } from "@cloudflare/workers-types";
import { resolveUrlRequestSchema } from "@shopee-research/shared";
import { resolveUrlWithDiagnostics } from "@shopee-research/shopee";
import { authenticate, authErrorResponse } from "../lib/auth.js";

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
  RESEARCH_QUEUE: Queue;
  APP_ENV: string;
  APP_NAME: string;
  PASSWORD_PEPPER?: string;
};

const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
  /bearer\s+\S+/gi,
  /authorization\s*[:=]\s*\S+/gi,
];

function sanitizeErrorMessage(msg: string | undefined): string | null {
  if (!msg) return null;
  let sanitized = msg;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  if (sanitized.length > 300) {
    sanitized = sanitized.slice(0, 300) + "...";
  }
  return sanitized;
}

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
    return c.json(
      { error: { code: "INVALID_INPUT", message: "Request body must be valid JSON", details: null } },
      400
    );
  }

  const parsed = resolveUrlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid resolve URL input",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      400
    );
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

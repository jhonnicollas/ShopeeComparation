import { Hono } from "hono";
import type { D1Database, Queue, R2Bucket } from "@cloudflare/workers-types";
import { authRouter } from "./routes/auth.js";
import { configRouter } from "./routes/config.js";
import { researchRouter } from "./routes/research.js";
import { shopeeRouter } from "./routes/shopee.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import { internalErrorResponse } from "./lib/errors.js";

export type ApiEnv = {
  Bindings: {
    DB: D1Database;
    LOGS: R2Bucket;
    RESEARCH_QUEUE: Queue;
    APP_ENV: string;
    APP_NAME: string;
    PASSWORD_PEPPER?: string;
  };
};

const ALLOWED_ORIGINS = [
  "https://shopee-product-research-web.pages.dev",
  "http://localhost:5173",
  "http://localhost:4173",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Cookie",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

const app = new Hono<ApiEnv>();

app.use("*", async (c, next) => {
  const origin = c.req.header("origin");
  Object.entries(corsHeaders(origin ?? null)).forEach(([k, v]) => c.header(k, v));
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin ?? null) });
  }
  const blocked = rateLimitMiddleware(c.req.raw);
  if (blocked) return blocked;
  await next();
});

app.onError((_error, c) => {
  return internalErrorResponse(c);
});

app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: "Route not found", details: null } }, 404);
});

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    appName: c.env.APP_NAME,
    environment: c.env.APP_ENV,
  });
});

app.route("/api/auth", authRouter);
app.route("/api/config", configRouter);
app.route("/api/research", researchRouter);
app.route("/api/shopee", shopeeRouter);

export default app;

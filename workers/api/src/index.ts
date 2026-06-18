import { Hono } from "hono";
import type { D1Database, Queue, R2Bucket } from "@cloudflare/workers-types";
import { authRouter } from "./routes/auth.js";
import { configRouter } from "./routes/config.js";
import { researchRouter } from "./routes/research.js";
import { shopeeRouter } from "./routes/shopee.js";

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

const app = new Hono<ApiEnv>();

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

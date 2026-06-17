import type { D1Database, Queue, R2Bucket } from "@cloudflare/workers-types";

export interface ApiEnv {
  DB: D1Database;
  LOGS: R2Bucket;
  RESEARCH_QUEUE: Queue;
  APP_ENV: string;
  APP_NAME: string;
  APP_BASE_URL: string;
  NINEROUTER_BASE_URL: string;
  NINEROUTER_API_KEY: string;
  NINEROUTER_MODEL_PRIMARY: string;
  NINEROUTER_MODEL_FAST: string;
  NINEROUTER_MODEL_FALLBACK: string;
  CLOUDFLARE_API_TOKEN: string;
  SESSION_SECRET: string;
  PASSWORD_PEPPER?: string;
}

export interface QueueConsumerEnv {
  DB: D1Database;
  LOGS: R2Bucket;
  APP_ENV: string;
  APP_NAME: string;
  NINEROUTER_BASE_URL: string;
  NINEROUTER_API_KEY: string;
  NINEROUTER_MODEL_PRIMARY: string;
  NINEROUTER_MODEL_FAST: string;
  NINEROUTER_MODEL_FALLBACK: string;
}

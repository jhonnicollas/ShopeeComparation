import { z } from "zod";

export const appEnvSchema = z.enum(["development", "staging", "production"]);

export const envSchema = z.object({
  APP_ENV: appEnvSchema.default("development"),
  APP_NAME: z.string().min(1).default("Shopee Product Research AI"),
  APP_BASE_URL: z.string().url().optional().or(z.literal("")),
  NINEROUTER_BASE_URL: z.string().url().optional().or(z.literal("")),
  NINEROUTER_MODEL_PRIMARY: z.string().optional().or(z.literal("")),
  NINEROUTER_MODEL_FAST: z.string().optional().or(z.literal("")),
  NINEROUTER_MODEL_FALLBACK: z.string().optional().or(z.literal("")),
  JOB_POLL_INTERVAL_MS: z
    .string()
    .regex(/^\d+$/)
    .default("3000")
    .transform((val) => Number.parseInt(val, 10)),
  MAX_COMPARE_LINKS: z
    .string()
    .regex(/^\d+$/)
    .default("5")
    .transform((val) => Number.parseInt(val, 10)),
  KEYWORD_SEARCH_LIMIT: z
    .string()
    .regex(/^\d+$/)
    .default("10")
    .transform((val) => Number.parseInt(val, 10)),
  DEFAULT_SHIPPED_FROM: z.string().min(1).default("DKI Jakarta"),
});

export type EnvVars = z.infer<typeof envSchema>;
export type AppEnv = z.infer<typeof appEnvSchema>;

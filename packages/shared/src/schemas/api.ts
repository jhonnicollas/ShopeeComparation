import { z } from "zod";
import { errorCodeSchema, jobStatusSchema, jobStepSchema, researchModeSchema, resolveMethodSchema, resolveStatusSchema } from "./enums.js";

export const apiErrorSchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  details: z.unknown().nullable(),
});

export const apiErrorResponseSchema = z.object({
  error: apiErrorSchema,
});

export const registerRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const registerResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    role: z.string(),
  }),
});

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    role: z.string(),
  }),
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
});

export const meResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    role: z.string(),
  }),
});

export const compareLinksRequestSchema = z.object({
  links: z.array(z.url()).min(1).max(5),
});

export const compareLinksResponseSchema = z.object({
  researchSessionId: z.string(),
  jobId: z.string(),
  status: jobStatusSchema,
});

export const keywordSearchRequestSchema = z.object({
  keyword: z.string().min(1),
  shippedFrom: z.string().optional().default("DKI Jakarta"),
  limit: z.number().int().min(1).max(50).optional().default(10),
  priceMin: z.number().nullable().optional(),
  priceMax: z.number().nullable().optional(),
  minimumRating: z.number().nullable().optional(),
  storeStatus: z.array(z.string()).nullable().optional(),
});

export const keywordSearchResponseSchema = z.object({
  researchSessionId: z.string(),
  jobId: z.string(),
  status: jobStatusSchema,
});

export const researchListItemSchema = z.object({
  id: z.string(),
  mode: researchModeSchema,
  keyword: z.string().nullable(),
  status: z.string(),
  bestProductId: z.string().nullable(),
  createdAt: z.string(),
});

export const researchListResponseSchema = z.object({
  items: z.array(researchListItemSchema),
});

export const researchDetailResponseSchema = z.object({
  researchSession: z.record(z.string(), z.unknown()),
  comparison: z.record(z.string(), z.unknown()),
  items: z.array(z.unknown()),
  report: z.record(z.string(), z.unknown()),
});

export const researchStatusResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  completedProducts: z.number(),
  totalProducts: z.number(),
  currentStep: jobStepSchema.nullable(),
});

export const resolveUrlRequestSchema = z.object({
  url: z.string().min(1),
});

export const resolveUrlResponseSchema = z.object({
  originalUrl: z.string(),
  finalUrl: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  shopId: z.string().nullable(),
  itemId: z.string().nullable(),
  resolveMethod: resolveMethodSchema.nullable(),
  status: resolveStatusSchema,
});

export const jobStatusResponseSchema = z.object({
  id: z.string(),
  status: jobStatusSchema,
  progressCurrent: z.number(),
  progressTotal: z.number(),
  currentStep: jobStepSchema.nullable(),
  errorMessage: z.string().nullable(),
});

export const jobLogItemSchema = z.object({
  level: z.string(),
  message: z.string(),
  createdAt: z.string(),
});

export const jobLogsResponseSchema = z.object({
  items: z.array(jobLogItemSchema),
});

export const aiModelTestRequestSchema = z.object({
  testPrompt: z.string().min(1),
  expectJson: z.boolean(),
});

export const aiModelTestResponseSchema = z.object({
  status: z.string(),
  latencyMs: z.number(),
  outputValidJson: z.boolean(),
  message: z.string(),
});

export const healthResponseSchema = z.object({
  status: z.string(),
  appName: z.string(),
  environment: z.string(),
});

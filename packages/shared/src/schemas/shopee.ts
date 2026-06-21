import { z } from "zod";
import {
  resolveMethodSchema,
  resolveStatusSchema,
  riskSeveritySchema,
  shopStatusSchema,
  fieldAvailabilityStatusSchema,
} from "./enums.js";

export const weightExtractionSchema = z.object({
  value: z.number().nullable(),
  unit: z.string().nullable(),
  rawText: z.string().nullable(),
  source: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export const riskItemSchema = z.object({
  type: z.string(),
  severity: riskSeveritySchema,
  message: z.string(),
  impact: z.number(),
});

export const productFeatureItemSchema = z.object({
  name: z.string(),
  value: z.string().nullable(),
  source: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export const productSnapshotSchema = z.object({
  shopeeItemId: z.string().nullable(),
  shopeeShopId: z.string().nullable(),
  title: z.string().nullable(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  originalUrl: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
  galleryJson: z.array(z.string()).nullable(),
  videoUrl: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  priceBeforeDiscount: z.number().nullable(),
  discountText: z.string().nullable(),
  rating: z.number().nullable(),
  reviewCount: z.number().nullable(),
  soldCount: z.number().nullable(),
  favoriteCount: z.number().nullable(),
  stock: z.number().nullable(),
  shippedFrom: z.string().nullable(),
  description: z.string().nullable(),
  specificationJson: z.record(z.string(), z.unknown()).nullable(),
  variationJson: z.record(z.string(), z.unknown()).nullable(),
  weight: weightExtractionSchema,
  features: z.array(productFeatureItemSchema),
  confidenceScore: z.number().min(0).max(1),
});

export const shopSnapshotSchema = z.object({
  shopeeShopId: z.string().nullable(),
  name: z.string().nullable(),
  shopUrl: z.string().nullable(),
  statusLabels: z.array(z.string()),
  primaryStatus: shopStatusSchema.nullable(),
  rating: z.number().nullable(),
  ratingCount: z.number().nullable(),
  responseRate: z.number().nullable(),
  responseTime: z.string().nullable(),
  followerCount: z.number().nullable(),
  productCount: z.number().nullable(),
  joinedAgeText: z.string().nullable(),
  location: z.string().nullable(),
  confidenceScore: z.number().min(0).max(1),
});

export const resolveUrlResultSchema = z.object({
  originalUrl: z.string(),
  finalUrl: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  shopId: z.string().nullable(),
  itemId: z.string().nullable(),
  resolveMethod: resolveMethodSchema,
  status: resolveStatusSchema,
  errorMessage: z.string().optional(),
});

export const searchInputSchema = z.object({
  keyword: z.string().min(1),
  shippedFrom: z.string(),
  limit: z.number().int().min(1),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  minimumRating: z.number().optional(),
  minimumReviewCount: z.number().optional(),
  storeStatus: z.array(z.string()).optional(),
});

export const searchResultCandidateSchema = z.object({
  title: z.string().nullable(),
  originalUrl: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  itemId: z.string().nullable(),
  shopId: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  rating: z.number().nullable(),
  reviewCount: z.number().nullable(),
  soldCount: z.number().nullable(),
  shippedFrom: z.string().nullable(),
  shopName: z.string().nullable(),
  source: z.string(),
  confidence: z.number().min(0).max(1),
});

export const scoringWeightsSchema = z.object({
  ratingScore: z.number(),
  reviewCountScore: z.number(),
  soldCountScore: z.number(),
  priceScore: z.number(),
  shopTrustScore: z.number(),
  responseRateScore: z.number(),
  featureMatchScore: z.number(),
  riskPenaltyMax: z.number(),
});

export const aiReportStructuredSchema = z.object({
  bestProductId: z.string().nullable(),
  bestProductName: z.string().nullable(),
  ranking: z.array(
    z.object({
      productId: z.string(),
      rank: z.number(),
      reason: z.string(),
    }),
  ),
  valueForMoneyProductId: z.string().nullable(),
  safestProductId: z.string().nullable(),
  riskiestProductId: z.string().nullable(),
  prosCons: z.array(
    z.object({
      productId: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    }),
  ),
  redFlags: z.array(
    z.object({
      productId: z.string(),
      type: z.string(),
      message: z.string(),
    }),
  ),
  confidence: z.number().min(0).max(1),
  missingDataNotes: z.array(z.string()),
});

export const queueMessageSchema = z.object({
  userId: z.string(),
  researchSessionId: z.string(),
  jobId: z.string().optional(),
  mode: z.enum(["compareLinks", "keywordSearch"]),
  links: z.array(z.string()).optional(),
  keyword: z.string().optional(),
  shippedFrom: z.string().optional(),
  limit: z.number().int().optional(),
  priceMin: z.number().nullable().optional(),
  priceMax: z.number().nullable().optional(),
  minimumRating: z.number().nullable().optional(),
  storeStatus: z.array(z.string()).nullable().optional(),
  sentAt: z.string().optional(),
});

export const fieldEvidenceSchema = z.object({
  ownerType: z.string(),
  ownerId: z.string(),
  fieldName: z.string(),
  valueText: z.string().nullable(),
  source: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  status: fieldAvailabilityStatusSchema,
  rawSnapshotR2Key: z.string().nullable(),
});

export const resolveFallbackConfigSchema = z.object({
  adapters: z.array(z.string()).min(1),
  timeoutMs: z.number().int().positive(),
  retryCount: z.number().int().min(0),
  retryDelayMs: z.number().int().min(0),
});

export const resolveUrlAttemptSchema = z.object({
  adapter: z.string(),
  resolveMethod: resolveMethodSchema,
  status: resolveStatusSchema,
  errorMessage: z.string().optional(),
  durationMs: z.number().optional(),
});

export const resolveUrlDiagnosticsSchema = z.object({
  adapterUsed: z.string(),
  attempts: z.array(resolveUrlAttemptSchema),
});

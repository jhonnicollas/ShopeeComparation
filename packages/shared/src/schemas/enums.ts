import { z } from "zod";

export const userRoleSchema = z.enum(["user", "admin"]);
export const userStatusSchema = z.enum(["active", "disabled"]);
export const researchModeSchema = z.enum(["compareLinks", "keywordSearch"]);
export const jobStatusSchema = z.enum(["pending", "processing", "completed", "failed", "partialSuccess"]);
export const jobTypeSchema = z.enum(["compareLinks", "keywordSearch"]);
export const jobStepSchema = z.enum([
  "queued",
  "resolvingUrl",
  "searchingCandidates",
  "fetchingProduct",
  "fetchingShop",
  "extractingWeight",
  "extractingFeatures",
  "scoring",
  "generatingReport",
  "savingResult",
  "completed",
  "failed",
]);
export const errorCodeSchema = z.enum([
  "INVALID_INPUT",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "SHORT_URL_RESOLVE_FAILED",
  "PRODUCT_NOT_FOUND",
  "SHOP_NOT_FOUND",
  "WEIGHT_NOT_FOUND",
  "SHOPEE_FETCH_FAILED",
  "BROWSER_RENDER_FAILED",
  "AI_REPORT_FAILED",
  "PARTIAL_DATA_ONLY",
  "RATE_LIMITED",
  "QUEUE_FAILED",
  "CONFIG_NOT_FOUND",
  "CONFIG_TEST_FAILED",
  "INTERNAL_ERROR",
]);
export const shopStatusSchema = z.enum(["MALL", "OFFICIAL", "STAR", "STARPLUS", "PREFERRED", "REGULAR", "UNKNOWN"]);
export const resolveMethodSchema = z.enum(["direct", "redirect", "webFetch", "browserRun", "manual"]);
export const resolveStatusSchema = z.enum(["resolved", "failed"]);
export const configValueTypeSchema = z.enum(["string", "number", "boolean", "json"]);
export const testStatusSchema = z.enum(["success", "failed", "untested"]);
export const searchProviderTypeSchema = z.enum(["officialApi", "webFetch", "browserRun", "vpsScraper", "manual"]);
export const authTypeSchema = z.enum(["bearer", "apiKey", "none"]);
export const riskSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const fieldAvailabilityStatusSchema = z.enum(["available", "unavailable", "partial"]);
export const logLevelSchema = z.enum(["info", "warn", "error"]);
export const ownerTypeSchema = z.enum(["product", "shop", "weight", "feature", "resolver", "ai", "report"]);

export const aiModelUsageTypeSchema = z.enum(["reasoning", "extraction", "fallback", "vision", "test"]);

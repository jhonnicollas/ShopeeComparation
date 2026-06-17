export const userRole = {
  user: "user",
  admin: "admin",
} as const;

export type UserRole = (typeof userRole)[keyof typeof userRole];

export const userStatus = {
  active: "active",
  disabled: "disabled",
} as const;

export type UserStatus = (typeof userStatus)[keyof typeof userStatus];

export const researchMode = {
  compareLinks: "compareLinks",
  keywordSearch: "keywordSearch",
} as const;

export type ResearchMode = (typeof researchMode)[keyof typeof researchMode];

export const jobStatus = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
  partialSuccess: "partialSuccess",
} as const;

export type JobStatus = (typeof jobStatus)[keyof typeof jobStatus];

export const jobType = {
  compareLinks: "compareLinks",
  keywordSearch: "keywordSearch",
} as const;

export type JobType = (typeof jobType)[keyof typeof jobType];

export const jobStep = {
  queued: "queued",
  resolvingUrl: "resolvingUrl",
  searchingCandidates: "searchingCandidates",
  fetchingProduct: "fetchingProduct",
  fetchingShop: "fetchingShop",
  extractingWeight: "extractingWeight",
  extractingFeatures: "extractingFeatures",
  scoring: "scoring",
  generatingReport: "generatingReport",
  savingResult: "savingResult",
  completed: "completed",
  failed: "failed",
} as const;

export type JobStep = (typeof jobStep)[keyof typeof jobStep];

export const errorCode = {
  invalidInput: "INVALID_INPUT",
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  shortUrlResolveFailed: "SHORT_URL_RESOLVE_FAILED",
  productNotFound: "PRODUCT_NOT_FOUND",
  shopNotFound: "SHOP_NOT_FOUND",
  weightNotFound: "WEIGHT_NOT_FOUND",
  shopeeFetchFailed: "SHOPEE_FETCH_FAILED",
  browserRenderFailed: "BROWSER_RENDER_FAILED",
  aiReportFailed: "AI_REPORT_FAILED",
  partialDataOnly: "PARTIAL_DATA_ONLY",
  rateLimited: "RATE_LIMITED",
  queueFailed: "QUEUE_FAILED",
  configNotFound: "CONFIG_NOT_FOUND",
  configTestFailed: "CONFIG_TEST_FAILED",
  internalError: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof errorCode)[keyof typeof errorCode];

export const shopStatus = {
  mall: "MALL",
  official: "OFFICIAL",
  star: "STAR",
  starplus: "STARPLUS",
  preferred: "PREFERRED",
  regular: "REGULAR",
  unknown: "UNKNOWN",
} as const;

export type ShopStatus = (typeof shopStatus)[keyof typeof shopStatus];

export const resolveMethod = {
  direct: "direct",
  redirect: "redirect",
  webFetch: "webFetch",
  browserRun: "browserRun",
  manual: "manual",
} as const;

export type ResolveMethod = (typeof resolveMethod)[keyof typeof resolveMethod];

export const resolveStatus = {
  resolved: "resolved",
  failed: "failed",
} as const;

export type ResolveStatus = (typeof resolveStatus)[keyof typeof resolveStatus];

export const configValueType = {
  string: "string",
  number: "number",
  boolean: "boolean",
  json: "json",
} as const;

export type ConfigValueType = (typeof configValueType)[keyof typeof configValueType];

export const testStatus = {
  success: "success",
  failed: "failed",
  untested: "untested",
} as const;

export type TestStatus = (typeof testStatus)[keyof typeof testStatus];

export const searchProviderType = {
  officialApi: "officialApi",
  webFetch: "webFetch",
  browserRun: "browserRun",
  vpsScraper: "vpsScraper",
  manual: "manual",
} as const;

export type SearchProviderType = (typeof searchProviderType)[keyof typeof searchProviderType];

export const authType = {
  bearer: "bearer",
  apiKey: "apiKey",
  none: "none",
} as const;

export type AuthType = (typeof authType)[keyof typeof authType];

export const riskSeverity = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
} as const;

export type RiskSeverity = (typeof riskSeverity)[keyof typeof riskSeverity];

export const fieldAvailabilityStatus = {
  available: "available",
  unavailable: "unavailable",
  partial: "partial",
} as const;

export type FieldAvailabilityStatus = (typeof fieldAvailabilityStatus)[keyof typeof fieldAvailabilityStatus];

export const logLevel = {
  info: "info",
  warn: "warn",
  error: "error",
} as const;

export type LogLevel = (typeof logLevel)[keyof typeof logLevel];

export const ownerType = {
  product: "product",
  shop: "shop",
  weight: "weight",
  feature: "feature",
  resolver: "resolver",
  ai: "ai",
  report: "report",
} as const;

export type OwnerType = (typeof ownerType)[keyof typeof ownerType];

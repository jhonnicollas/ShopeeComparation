export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRow {
  id: string;
  userId: string;
  tokenHash: string;
  userAgentHash: string | null;
  ipHash: string | null;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface ResearchSessionRow {
  id: string;
  userId: string;
  mode: string;
  keyword: string | null;
  shippedFrom: string | null;
  status: string;
  bestProductId: string | null;
  totalProducts: number;
  completedProducts: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedUrlRow {
  id: string;
  userId: string;
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  shopId: string | null;
  itemId: string | null;
  resolveMethod: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export interface ProductRow {
  id: string;
  shopeeItemId: string | null;
  shopeeShopId: string | null;
  title: string | null;
  brand: string | null;
  category: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  imageUrl: string | null;
  galleryJson: string | null;
  videoUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceBeforeDiscount: number | null;
  discountText: string | null;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  favoriteCount: number | null;
  stock: number | null;
  shippedFrom: string | null;
  description: string | null;
  specificationJson: string | null;
  variationJson: string | null;
  confidenceScore: number;
  rawSnapshotR2Key: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWeightRow {
  id: string;
  productId: string;
  value: number | null;
  unit: string | null;
  rawText: string | null;
  source: string | null;
  confidence: number;
  createdAt: string;
}

export interface ShopRow {
  id: string;
  shopeeShopId: string | null;
  name: string | null;
  shopUrl: string | null;
  statusJson: string | null;
  primaryStatus: string | null;
  rating: number | null;
  ratingCount: number | null;
  responseRate: number | null;
  responseTime: string | null;
  followerCount: number | null;
  productCount: number | null;
  joinedAgeText: string | null;
  location: string | null;
  confidenceScore: number;
  rawSnapshotR2Key: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFeatureRow {
  id: string;
  productId: string;
  name: string;
  value: string | null;
  source: string | null;
  confidence: number;
  createdAt: string;
}

export interface ComparisonRow {
  id: string;
  researchSessionId: string;
  userId: string;
  title: string | null;
  mode: string;
  keyword: string | null;
  shippedFrom: string | null;
  bestProductId: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonItemRow {
  id: string;
  comparisonId: string;
  productId: string;
  shopId: string | null;
  rank: number | null;
  finalScore: number;
  ratingScore: number;
  reviewCountScore: number;
  soldCountScore: number;
  priceScore: number;
  shopTrustScore: number;
  responseRateScore: number;
  featureMatchScore: number;
  riskPenalty: number;
  prosJson: string | null;
  consJson: string | null;
  riskJson: string | null;
  createdAt: string;
}

export interface AiReportRow {
  id: string;
  comparisonId: string;
  userId: string;
  model: string | null;
  provider: string | null;
  promptVersion: string | null;
  reportJson: string | null;
  reportText: string | null;
  confidence: number;
  rawResponseR2Key: string | null;
  createdAt: string;
}

export interface JobRow {
  id: string;
  userId: string;
  researchSessionId: string | null;
  type: string;
  status: string;
  progressCurrent: number;
  progressTotal: number;
  currentStep: string | null;
  payloadJson: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobLogRow {
  id: string;
  jobId: string;
  level: string;
  message: string;
  metadataJson: string | null;
  createdAt: string;
}

export interface RawSnapshotRow {
  id: string;
  ownerType: string;
  ownerId: string;
  r2Key: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface FieldEvidenceRow {
  id: string;
  ownerType: string;
  ownerId: string;
  fieldName: string;
  valueText: string | null;
  source: string | null;
  confidence: number;
  status: string;
  rawSnapshotR2Key: string | null;
  createdAt: string;
}

export interface AppConfigRow {
  id: string;
  key: string;
  value: string | null;
  valueType: string;
  category: string;
  description: string | null;
  isPublic: number;
  isEnabled: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiProviderConfigRow {
  id: string;
  providerKey: string;
  displayName: string;
  baseUrl: string;
  authType: string;
  secretRef: string | null;
  timeoutMs: number;
  retryCount: number;
  isEnabled: number;
  lastTestStatus: string | null;
  lastTestAt: string | null;
  lastTestMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiModelConfigRow {
  id: string;
  providerKey: string;
  modelKey: string;
  modelName: string;
  displayName: string | null;
  usageType: string;
  contextWindow: number | null;
  supportsJson: number;
  supportsTools: number;
  supportsVision: number;
  costInput: number | null;
  costOutput: number | null;
  isDefault: number;
  isEnabled: number;
  lastTestStatus: string | null;
  lastTestAt: string | null;
  lastTestMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchProviderConfigRow {
  id: string;
  providerKey: string;
  displayName: string;
  providerType: string;
  priority: number;
  baseUrl: string | null;
  authType: string;
  secretRef: string | null;
  timeoutMs: number;
  retryCount: number;
  isEnabled: number;
  lastTestStatus: string | null;
  lastTestAt: string | null;
  lastTestMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScoringConfigRow {
  id: string;
  configKey: string;
  displayName: string;
  category: string;
  weightsJson: string;
  isDefault: number;
  isEnabled: number;
  createdAt: string;
  updatedAt: string;
}

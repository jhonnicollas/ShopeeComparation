import type {
  AuthType,
  SearchProviderType,
  ShopStatus,
  ResolveMethod,
  ResolveStatus,
  RiskSeverity,
  FieldAvailabilityStatus,
} from "../constants/index.js";

export interface ResolveUrlInput {
  url: string;
}

export interface ResolveUrlResult {
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  shopId: string | null;
  itemId: string | null;
  resolveMethod: ResolveMethod;
  status: ResolveStatus;
  errorMessage?: string;
}

export interface WeightExtraction {
  value: number | null;
  unit: string | null;
  rawText: string | null;
  source: string | null;
  confidence: number;
}

export interface RiskItem {
  type: string;
  severity: RiskSeverity;
  message: string;
  impact: number;
}

export interface ProductSnapshot {
  shopeeItemId: string | null;
  shopeeShopId: string | null;
  title: string | null;
  brand: string | null;
  category: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  imageUrl: string | null;
  galleryJson: string[] | null;
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
  specificationJson: Record<string, unknown> | null;
  variationJson: Record<string, unknown> | null;
  weight: WeightExtraction;
  features: ProductFeatureItem[];
  confidenceScore: number;
}

export interface ProductFeatureItem {
  name: string;
  value: string | null;
  source: string | null;
  confidence: number;
}

export interface ShopSnapshot {
  shopeeShopId: string | null;
  name: string | null;
  shopUrl: string | null;
  statusLabels: string[];
  primaryStatus: ShopStatus | null;
  rating: number | null;
  ratingCount: number | null;
  responseRate: number | null;
  responseTime: string | null;
  followerCount: number | null;
  productCount: number | null;
  joinedAgeText: string | null;
  location: string | null;
  confidenceScore: number;
}

export interface SearchInput {
  keyword: string;
  shippedFrom: string;
  limit: number;
  priceMin?: number;
  priceMax?: number;
  minimumRating?: number;
  minimumReviewCount?: number;
  storeStatus?: string[];
}

export interface SearchResultCandidate {
  title: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  itemId: string | null;
  shopId: string | null;
  priceMin: number | null;
  priceMax: number | null;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  shippedFrom: string | null;
  shopName: string | null;
  source: string;
  confidence: number;
}

export interface SearchProvider {
  key: string;
  search(input: SearchInput): Promise<SearchResultCandidate[]>;
}

export interface ResolveUrlInput2 {
  url: string;
}

export interface ExtractProductInput {
  shopId: string;
  itemId: string;
  canonicalUrl?: string;
}

export interface ExtractShopInput {
  shopId: string;
}

export interface ShopeeExtractor {
  resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult>;
  searchProducts(input: SearchInput): Promise<SearchResultCandidate[]>;
  extractProduct(input: ExtractProductInput): Promise<ProductSnapshot>;
  extractShop(input: ExtractShopInput): Promise<ShopSnapshot>;
}

export interface DataQualityField {
  value: unknown;
  source: string | null;
  confidence: number;
  status: FieldAvailabilityStatus;
}

export interface ScoringWeights {
  ratingScore: number;
  reviewCountScore: number;
  soldCountScore: number;
  priceScore: number;
  shopTrustScore: number;
  responseRateScore: number;
  featureMatchScore: number;
  riskPenaltyMax: number;
}

export interface ScoringInput {
  productId: string;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  priceMin: number | null;
  priceMax: number | null;
  shopStatus: ShopStatus | null;
  shopRating: number | null;
  responseRate: number | null;
  featureCount: number;
  featureMatchCount: number;
  risks: RiskItem[];
}

export interface ScoringOutput {
  finalScore: number;
  ratingScore: number;
  reviewCountScore: number;
  soldCountScore: number;
  priceScore: number;
  shopTrustScore: number;
  responseRateScore: number;
  featureMatchScore: number;
  riskPenalty: number;
}

export interface AiReportStructured {
  bestProductId: string | null;
  bestProductName: string | null;
  ranking: Array<{
    productId: string;
    rank: number;
    reason: string;
  }>;
  valueForMoneyProductId: string | null;
  safestProductId: string | null;
  riskiestProductId: string | null;
  prosCons: Array<{
    productId: string;
    pros: string[];
    cons: string[];
  }>;
  redFlags: Array<{
    productId: string;
    type: string;
    message: string;
  }> | string[];
  confidence: number;
  missingDataNotes: string[];
}

export interface QueueMessage {
  userId: string;
  researchSessionId: string;
  jobId?: string;
  mode: string;
  links?: string[];
  keyword?: string;
  shippedFrom?: string;
  limit?: number;
  priceMin?: number | null;
  priceMax?: number | null;
  minimumRating?: number | null;
  storeStatus?: string[] | null;
  sentAt?: string;
}

export interface ResolveFallbackConfig {
  adapters: string[];
  timeoutMs: number;
  retryCount: number;
  retryDelayMs: number;
}

export interface ResolveUrlAttempt {
  adapter: string;
  resolveMethod: ResolveMethod;
  status: ResolveStatus;
  errorMessage?: string;
  durationMs?: number;
}

export interface ResolveUrlDiagnostics {
  adapterUsed: string;
  attempts: ResolveUrlAttempt[];
}

export interface RuntimeConfigSnapshot {
  appConfig: Record<string, unknown>;
  aiProvider: {
    providerKey: string;
    baseUrl: string;
    authType: AuthType;
    secretRef: string | null;
    timeoutMs: number;
    retryCount: number;
  } | null;
  aiModels: Array<{
    modelKey: string;
    modelName: string;
    usageType: string;
    isDefault: boolean;
  }>;
  searchProviders: Array<{
    providerKey: string;
    providerType: SearchProviderType;
    priority: number;
    baseUrl: string | null;
    authType: AuthType;
    secretRef: string | null;
    timeoutMs: number;
    retryCount: number;
  }>;
  scoringWeights: ScoringWeights | null;
}

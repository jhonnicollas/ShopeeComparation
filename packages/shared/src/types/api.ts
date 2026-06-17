import type {
  ErrorCode,
  JobStatus,
  JobStep,
  ResearchMode,
  ResolveMethod,
  ResolveStatus,
} from "../constants/index.js";

export interface ApiError {
  code: ErrorCode;
  message: string;
  details: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface LogoutResponse {
  success: boolean;
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export interface CompareLinksRequest {
  links: string[];
}

export interface CompareLinksResponse {
  researchSessionId: string;
  jobId: string;
  status: JobStatus;
}

export interface KeywordSearchRequest {
  keyword: string;
  shippedFrom?: string;
  limit?: number;
  priceMin?: number | null;
  priceMax?: number | null;
  minimumRating?: number | null;
  storeStatus?: string[] | null;
}

export interface KeywordSearchResponse {
  researchSessionId: string;
  jobId: string;
  status: JobStatus;
}

export interface ResearchListItem {
  id: string;
  mode: ResearchMode;
  keyword: string | null;
  status: string;
  bestProductId: string | null;
  createdAt: string;
}

export interface ResearchListResponse {
  items: ResearchListItem[];
}

export interface ResearchDetailResponse {
  researchSession: Record<string, unknown>;
  comparison: Record<string, unknown>;
  items: unknown[];
  report: Record<string, unknown>;
}

export interface ResearchStatusResponse {
  id: string;
  status: string;
  completedProducts: number;
  totalProducts: number;
  currentStep: JobStep | null;
}

export interface ResolveUrlRequest {
  url: string;
}

export interface ResolveUrlResponse {
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  shopId: string | null;
  itemId: string | null;
  resolveMethod: ResolveMethod | null;
  status: ResolveStatus;
}

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progressCurrent: number;
  progressTotal: number;
  currentStep: JobStep | null;
  errorMessage: string | null;
}

export interface JobLogItem {
  level: string;
  message: string;
  createdAt: string;
}

export interface JobLogsResponse {
  items: JobLogItem[];
}

export interface FieldEvidenceApiShape {
  ownerType: string;
  ownerId: string;
  fieldName: string;
  valueText: string | null;
  source: string | null;
  confidence: number;
  status: string;
  rawSnapshotR2Key: string | null;
}

export interface AiModelTestRequest {
  testPrompt: string;
  expectJson: boolean;
}

export interface AiModelTestResponse {
  status: string;
  latencyMs: number;
  outputValidJson: boolean;
  message: string;
}

export interface HealthResponse {
  status: string;
  appName: string;
  environment: string;
}

export interface PublicConfigResponse {
  configs: Record<string, unknown>;
}

import { apiRequest } from "./api.js";

export interface ResolveUrlAttempt {
  adapter: string;
  resolveMethod: string;
  status: string;
  errorMessage?: string;
  durationMs?: number;
}

export interface ResolveUrlDiagnostics {
  adapterUsed: string;
  attempts: ResolveUrlAttempt[];
}

export interface ResolveUrlApiResult {
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  shopId: string | null;
  itemId: string | null;
  resolveMethod: string | null;
  status: "resolved" | "failed";
  errorMessage: string | null;
  diagnostics: ResolveUrlDiagnostics;
}

export async function resolveShopeeUrl(url: string): Promise<ResolveUrlApiResult> {
  return apiRequest<ResolveUrlApiResult>("/shopee/resolve-url", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

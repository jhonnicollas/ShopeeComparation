import { apiRequest } from "./api.js";

export interface AppConfig {
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

export interface AiProvider {
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

export interface AiModel {
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

export interface SearchProvider {
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

export interface ScoringConfig {
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

export const listAppConfigs = () =>
  apiRequest<{ configs: AppConfig[] }>("/config/apps");

export const deleteAppConfig = (id: string) =>
  apiRequest<{ success: boolean }>(`/config/apps/${id}`, { method: "DELETE" });

export const listAiProviders = () =>
  apiRequest<{ providers: AiProvider[] }>("/config/ai-providers");

export const deleteAiProvider = (id: string) =>
  apiRequest<{ success: boolean }>(`/config/ai-providers/${id}`, { method: "DELETE" });

export const listAiModels = (providerKey?: string) =>
  apiRequest<{ models: AiModel[] }>(
    `/config/ai-models${providerKey ? `?providerKey=${encodeURIComponent(providerKey)}` : ""}`
  );

export const deleteAiModel = (id: string) =>
  apiRequest<{ success: boolean }>(`/config/ai-models/${id}`, { method: "DELETE" });

export const listSearchProviders = () =>
  apiRequest<{ providers: SearchProvider[] }>("/config/search-providers");

export const deleteSearchProvider = (id: string) =>
  apiRequest<{ success: boolean }>(`/config/search-providers/${id}`, { method: "DELETE" });

export const listScoringConfigs = () =>
  apiRequest<{ configs: ScoringConfig[] }>("/config/scoring-configs");

export const deleteScoringConfig = (id: string) =>
  apiRequest<{ success: boolean }>(`/config/scoring-configs/${id}`, { method: "DELETE" });

import { z } from "zod";
import { aiModelUsageTypeSchema, authTypeSchema, configValueTypeSchema, searchProviderTypeSchema } from "./enums.js";

export const createAppConfigRequestSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().nullable().optional(),
  valueType: configValueTypeSchema,
  category: z.string().min(1).max(50),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.number().int().min(0).max(1).optional().default(0),
  isEnabled: z.number().int().min(0).max(1).optional().default(1),
});

export const updateAppConfigRequestSchema = z.object({
  value: z.string().nullable().optional(),
  valueType: configValueTypeSchema.optional(),
  category: z.string().min(1).max(50).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.number().int().min(0).max(1).optional(),
  isEnabled: z.number().int().min(0).max(1).optional(),
});

export const appConfigSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string().nullable(),
  valueType: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  isPublic: z.number(),
  isEnabled: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listAppConfigsResponseSchema = z.object({
  configs: z.array(appConfigSchema),
});

export const createAppConfigResponseSchema = z.object({
  config: appConfigSchema,
});

export const updateAppConfigResponseSchema = z.object({
  config: appConfigSchema,
});

export const deleteAppConfigResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateAppConfigRequest = z.infer<typeof createAppConfigRequestSchema>;
export type UpdateAppConfigRequest = z.infer<typeof updateAppConfigRequestSchema>;
export type AppConfigResponse = z.infer<typeof appConfigSchema>;

export const createAiProviderRequestSchema = z.object({
  providerKey: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  baseUrl: z.string().url(),
  authType: authTypeSchema,
  secretRef: z.string().max(100).nullable().optional(),
  timeoutMs: z.number().int().min(1000).max(600000).optional().default(60000),
  retryCount: z.number().int().min(0).max(10).optional().default(1),
  isEnabled: z.number().int().min(0).max(1).optional().default(1),
});

export const updateAiProviderRequestSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  baseUrl: z.string().url().optional(),
  authType: authTypeSchema.optional(),
  secretRef: z.string().max(100).nullable().optional(),
  timeoutMs: z.number().int().min(1000).max(600000).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
  isEnabled: z.number().int().min(0).max(1).optional(),
});

export const aiProviderSchema = z.object({
  id: z.string(),
  providerKey: z.string(),
  displayName: z.string(),
  baseUrl: z.string(),
  authType: z.string(),
  secretRef: z.string().nullable(),
  timeoutMs: z.number(),
  retryCount: z.number(),
  isEnabled: z.number(),
  lastTestStatus: z.string().nullable(),
  lastTestAt: z.string().nullable(),
  lastTestMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listAiProvidersResponseSchema = z.object({
  providers: z.array(aiProviderSchema),
});

export const createAiProviderResponseSchema = z.object({
  provider: aiProviderSchema,
});

export const updateAiProviderResponseSchema = z.object({
  provider: aiProviderSchema,
});

export const deleteAiProviderResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateAiProviderRequest = z.infer<typeof createAiProviderRequestSchema>;
export type UpdateAiProviderRequest = z.infer<typeof updateAiProviderRequestSchema>;
export type AiProviderResponse = z.infer<typeof aiProviderSchema>;

export const createAiModelRequestSchema = z.object({
  providerKey: z.string().min(1).max(100),
  modelKey: z.string().min(1).max(100),
  modelName: z.string().min(1).max(200),
  displayName: z.string().max(200).nullable().optional(),
  usageType: aiModelUsageTypeSchema,
  contextWindow: z.number().int().min(1).nullable().optional(),
  supportsJson: z.number().int().min(0).max(1).optional().default(0),
  supportsTools: z.number().int().min(0).max(1).optional().default(0),
  supportsVision: z.number().int().min(0).max(1).optional().default(0),
  costInput: z.number().nullable().optional(),
  costOutput: z.number().nullable().optional(),
  isDefault: z.number().int().min(0).max(1).optional().default(0),
  isEnabled: z.number().int().min(0).max(1).optional().default(1),
});

export const updateAiModelRequestSchema = z.object({
  modelName: z.string().min(1).max(200).optional(),
  displayName: z.string().max(200).nullable().optional(),
  usageType: aiModelUsageTypeSchema.optional(),
  contextWindow: z.number().int().min(1).nullable().optional(),
  supportsJson: z.number().int().min(0).max(1).optional(),
  supportsTools: z.number().int().min(0).max(1).optional(),
  supportsVision: z.number().int().min(0).max(1).optional(),
  costInput: z.number().nullable().optional(),
  costOutput: z.number().nullable().optional(),
  isDefault: z.number().int().min(0).max(1).optional(),
  isEnabled: z.number().int().min(0).max(1).optional(),
});

export const aiModelSchema = z.object({
  id: z.string(),
  providerKey: z.string(),
  modelKey: z.string(),
  modelName: z.string(),
  displayName: z.string().nullable(),
  usageType: z.string(),
  contextWindow: z.number().nullable(),
  supportsJson: z.number(),
  supportsTools: z.number(),
  supportsVision: z.number(),
  costInput: z.number().nullable(),
  costOutput: z.number().nullable(),
  isDefault: z.number(),
  isEnabled: z.number(),
  lastTestStatus: z.string().nullable(),
  lastTestAt: z.string().nullable(),
  lastTestMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listAiModelsResponseSchema = z.object({
  models: z.array(aiModelSchema),
});

export const createAiModelResponseSchema = z.object({
  model: aiModelSchema,
});

export const updateAiModelResponseSchema = z.object({
  model: aiModelSchema,
});

export const deleteAiModelResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateAiModelRequest = z.infer<typeof createAiModelRequestSchema>;
export type UpdateAiModelRequest = z.infer<typeof updateAiModelRequestSchema>;
export type AiModelResponse = z.infer<typeof aiModelSchema>;

export const createSearchProviderRequestSchema = z.object({
  providerKey: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  providerType: searchProviderTypeSchema,
  priority: z.number().int().min(0).max(10000).optional().default(100),
  baseUrl: z.string().url().nullable().optional(),
  authType: authTypeSchema,
  secretRef: z.string().max(100).nullable().optional(),
  timeoutMs: z.number().int().min(1000).max(600000).optional().default(60000),
  retryCount: z.number().int().min(0).max(10).optional().default(1),
  isEnabled: z.number().int().min(0).max(1).optional().default(1),
});

export const updateSearchProviderRequestSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  providerType: searchProviderTypeSchema.optional(),
  priority: z.number().int().min(0).max(10000).optional(),
  baseUrl: z.string().url().nullable().optional(),
  authType: authTypeSchema.optional(),
  secretRef: z.string().max(100).nullable().optional(),
  timeoutMs: z.number().int().min(1000).max(600000).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
  isEnabled: z.number().int().min(0).max(1).optional(),
});

export const searchProviderSchema = z.object({
  id: z.string(),
  providerKey: z.string(),
  displayName: z.string(),
  providerType: z.string(),
  priority: z.number(),
  baseUrl: z.string().nullable(),
  authType: z.string(),
  secretRef: z.string().nullable(),
  timeoutMs: z.number(),
  retryCount: z.number(),
  isEnabled: z.number(),
  lastTestStatus: z.string().nullable(),
  lastTestAt: z.string().nullable(),
  lastTestMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listSearchProvidersResponseSchema = z.object({
  providers: z.array(searchProviderSchema),
});

export const createSearchProviderResponseSchema = z.object({
  provider: searchProviderSchema,
});

export const updateSearchProviderResponseSchema = z.object({
  provider: searchProviderSchema,
});

export const deleteSearchProviderResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateSearchProviderRequest = z.infer<typeof createSearchProviderRequestSchema>;
export type UpdateSearchProviderRequest = z.infer<typeof updateSearchProviderRequestSchema>;
export type SearchProviderResponse = z.infer<typeof searchProviderSchema>;

export const createScoringConfigRequestSchema = z.object({
  configKey: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  category: z.string().min(1).max(50).optional().default("default"),
  weightsJson: z.string().min(2),
  isDefault: z.number().int().min(0).max(1).optional().default(0),
  isEnabled: z.number().int().min(0).max(1).optional().default(1),
});

export const updateScoringConfigRequestSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(50).optional(),
  weightsJson: z.string().min(2).optional(),
  isDefault: z.number().int().min(0).max(1).optional(),
  isEnabled: z.number().int().min(0).max(1).optional(),
});

export const scoringConfigSchema = z.object({
  id: z.string(),
  configKey: z.string(),
  displayName: z.string(),
  category: z.string(),
  weightsJson: z.string(),
  isDefault: z.number(),
  isEnabled: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listScoringConfigsResponseSchema = z.object({
  configs: z.array(scoringConfigSchema),
});

export const createScoringConfigResponseSchema = z.object({
  config: scoringConfigSchema,
});

export const updateScoringConfigResponseSchema = z.object({
  config: scoringConfigSchema,
});

export const deleteScoringConfigResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateScoringConfigRequest = z.infer<typeof createScoringConfigRequestSchema>;
export type UpdateScoringConfigRequest = z.infer<typeof updateScoringConfigRequestSchema>;
export type ScoringConfigResponse = z.infer<typeof scoringConfigSchema>;

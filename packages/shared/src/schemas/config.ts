import { z } from "zod";
import { authTypeSchema, configValueTypeSchema } from "./enums.js";

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

import { z } from "zod";
import { configValueTypeSchema } from "./enums.js";

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

import { Hono } from "hono";
import {
  createAppConfigRequestSchema,
  updateAppConfigRequestSchema,
  listAppConfigsResponseSchema,
  createAppConfigResponseSchema,
  updateAppConfigResponseSchema,
  deleteAppConfigResponseSchema,
  createAiProviderRequestSchema,
  updateAiProviderRequestSchema,
  listAiProvidersResponseSchema,
  createAiProviderResponseSchema,
  updateAiProviderResponseSchema,
  deleteAiProviderResponseSchema,
  createAiModelRequestSchema,
  updateAiModelRequestSchema,
  listAiModelsResponseSchema,
  createAiModelResponseSchema,
  updateAiModelResponseSchema,
  deleteAiModelResponseSchema,
  createSearchProviderRequestSchema,
  updateSearchProviderRequestSchema,
  listSearchProvidersResponseSchema,
  createSearchProviderResponseSchema,
  updateSearchProviderResponseSchema,
  deleteSearchProviderResponseSchema,
  createScoringConfigRequestSchema,
  updateScoringConfigRequestSchema,
  listScoringConfigsResponseSchema,
  createScoringConfigResponseSchema,
  updateScoringConfigResponseSchema,
  deleteScoringConfigResponseSchema,
  type AppConfigResponse,
  type AiProviderResponse,
  type AiModelResponse,
  type SearchProviderResponse,
  type ScoringConfigResponse,
} from "@shopee-research/shared";
import {
  createAppConfig,
  deleteAppConfig,
  findAppConfigById,
  findAppConfigByKey,
  listAppConfigs,
  listAppConfigsByCategory,
  listPublicAppConfigs,
  updateAppConfig,
  createAiProvider,
  deleteAiProvider,
  findAiProviderById,
  findAiProviderByKey,
  listAiProviders,
  updateAiProvider,
  createAiModel,
  deleteAiModel,
  findAiModelById,
  listAiModels,
  listAiModelsByProvider,
  updateAiModel,
  createSearchProvider,
  deleteSearchProvider,
  findSearchProviderById,
  findSearchProviderByKey,
  listSearchProviders,
  updateSearchProvider,
  createScoringConfig,
  deleteScoringConfig,
  findScoringConfigById,
  findScoringConfigByKey,
  listScoringConfigs,
  updateScoringConfig,
} from "@shopee-research/db";
import { authenticate, authErrorResponse, requireAdmin } from "../lib/auth.js";
import {
  invalidJsonResponse,
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse,
  conflictResponse,
} from "../lib/errors.js";
import { testNineRouterModel } from "../lib/nineRouter.js";

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
  RESEARCH_QUEUE: Queue;
  APP_ENV: string;
  APP_NAME: string;
  PASSWORD_PEPPER?: string;
};

function toResponse(row: {
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
}): AppConfigResponse {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    valueType: row.valueType,
    category: row.category,
    description: row.description,
    isPublic: row.isPublic,
    isEnabled: row.isEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAiProviderResponse(row: {
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
}): AiProviderResponse {
  return {
    id: row.id,
    providerKey: row.providerKey,
    displayName: row.displayName,
    baseUrl: row.baseUrl,
    authType: row.authType,
    secretRef: row.secretRef,
    timeoutMs: row.timeoutMs,
    retryCount: row.retryCount,
    isEnabled: row.isEnabled,
    lastTestStatus: row.lastTestStatus,
    lastTestAt: row.lastTestAt,
    lastTestMessage: row.lastTestMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAiModelResponse(row: {
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
}): AiModelResponse {
  return {
    id: row.id,
    providerKey: row.providerKey,
    modelKey: row.modelKey,
    modelName: row.modelName,
    displayName: row.displayName,
    usageType: row.usageType,
    contextWindow: row.contextWindow,
    supportsJson: row.supportsJson,
    supportsTools: row.supportsTools,
    supportsVision: row.supportsVision,
    costInput: row.costInput,
    costOutput: row.costOutput,
    isDefault: row.isDefault,
    isEnabled: row.isEnabled,
    lastTestStatus: row.lastTestStatus,
    lastTestAt: row.lastTestAt,
    lastTestMessage: row.lastTestMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toSearchProviderResponse(row: {
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
}): SearchProviderResponse {
  return {
    id: row.id,
    providerKey: row.providerKey,
    displayName: row.displayName,
    providerType: row.providerType,
    priority: row.priority,
    baseUrl: row.baseUrl,
    authType: row.authType,
    secretRef: row.secretRef,
    timeoutMs: row.timeoutMs,
    retryCount: row.retryCount,
    isEnabled: row.isEnabled,
    lastTestStatus: row.lastTestStatus,
    lastTestAt: row.lastTestAt,
    lastTestMessage: row.lastTestMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toScoringConfigResponse(row: {
  id: string;
  configKey: string;
  displayName: string;
  category: string;
  weightsJson: string;
  isDefault: number;
  isEnabled: number;
  createdAt: string;
  updatedAt: string;
}): ScoringConfigResponse {
  return {
    id: row.id,
    configKey: row.configKey,
    displayName: row.displayName,
    category: row.category,
    weightsJson: row.weightsJson,
    isDefault: row.isDefault,
    isEnabled: row.isEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `${prefix}_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

export const configRouter = new Hono<{ Bindings: Bindings }>();

configRouter.get("/apps/public", async (c) => {
  const rows = await listPublicAppConfigs(c.env.DB);
  const configs = rows.map(toResponse);
  return c.json({ configs }, 200);
});

configRouter.get("/apps", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  if (auth.user.role !== "admin") {
    return forbiddenResponse(c, "Admin role required");
  }

  const category = c.req.query("category");
  const rows = category
    ? await listAppConfigsByCategory(c.env.DB, category)
    : await listAppConfigs(c.env.DB);
  const configs = rows.map(toResponse);
  return c.json(listAppConfigsResponseSchema.parse({ configs }), 200);
});

configRouter.post("/apps", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        error: { code: "INVALID_INPUT", message: "Request body must be valid JSON", details: null },
      },
      400
    );
  }

  const parsed = createAppConfigRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid app config input", parsed.error.issues);
  }

  const existing = await findAppConfigByKey(c.env.DB, parsed.data.key);
  if (existing) {
    return conflictResponse(c, "CONFIG_KEY_EXISTS", "A config with this key already exists");
  }

  const created = await createAppConfig(c.env.DB, {
    id: generateId("cfg"),
    key: parsed.data.key,
    value: parsed.data.value ?? null,
    valueType: parsed.data.valueType,
    category: parsed.data.category,
    description: parsed.data.description ?? null,
    isPublic: parsed.data.isPublic ?? 0,
    isEnabled: parsed.data.isEnabled ?? 1,
  });

  return c.json(createAppConfigResponseSchema.parse({ config: toResponse(created) }), 201);
});

configRouter.put("/apps/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findAppConfigById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "CONFIG_NOT_FOUND", "App config not found");
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        error: { code: "INVALID_INPUT", message: "Request body must be valid JSON", details: null },
      },
      400
    );
  }

  const parsed = updateAppConfigRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid app config input", parsed.error.issues);
  }

  const updated = await updateAppConfig(c.env.DB, id, {
    value: parsed.data.value,
    valueType: parsed.data.valueType,
    category: parsed.data.category,
    description: parsed.data.description,
    isPublic: parsed.data.isPublic,
    isEnabled: parsed.data.isEnabled,
  });

  if (!updated) {
    return notFoundResponse(c, "CONFIG_NOT_FOUND", "App config not found");
  }

  return c.json(updateAppConfigResponseSchema.parse({ config: toResponse(updated) }), 200);
});

configRouter.delete("/apps/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findAppConfigById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "CONFIG_NOT_FOUND", "App config not found");
  }

  await deleteAppConfig(c.env.DB, id);
  return c.json(deleteAppConfigResponseSchema.parse({ success: true }), 200);
});

configRouter.get("/ai-providers", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  if (auth.user.role !== "admin") {
    return forbiddenResponse(c, "Admin role required");
  }
  const rows = await listAiProviders(c.env.DB);
  return c.json(listAiProvidersResponseSchema.parse({ providers: rows.map(toAiProviderResponse) }), 200);
});

configRouter.post("/ai-providers", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = createAiProviderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid AI provider input", parsed.error.issues);
  }

  const existing = await findAiProviderByKey(c.env.DB, parsed.data.providerKey);
  if (existing) {
    return conflictResponse(c, "PROVIDER_KEY_EXISTS", "A provider with this key already exists");
  }

  const created = await createAiProvider(c.env.DB, {
    id: generateId("aip"),
    providerKey: parsed.data.providerKey,
    displayName: parsed.data.displayName,
    baseUrl: parsed.data.baseUrl,
    authType: parsed.data.authType,
    secretRef: parsed.data.secretRef ?? null,
    timeoutMs: parsed.data.timeoutMs ?? 60000,
    retryCount: parsed.data.retryCount ?? 1,
    isEnabled: parsed.data.isEnabled ?? 1,
  });

  return c.json(createAiProviderResponseSchema.parse({ provider: toAiProviderResponse(created) }), 201);
});

configRouter.put("/ai-providers/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findAiProviderById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "PROVIDER_NOT_FOUND", "AI provider not found");
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = updateAiProviderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid AI provider input", parsed.error.issues);
  }

  const updated = await updateAiProvider(c.env.DB, id, {
    displayName: parsed.data.displayName,
    baseUrl: parsed.data.baseUrl,
    authType: parsed.data.authType,
    secretRef: parsed.data.secretRef,
    timeoutMs: parsed.data.timeoutMs,
    retryCount: parsed.data.retryCount,
    isEnabled: parsed.data.isEnabled,
  });

  if (!updated) {
    return notFoundResponse(c, "PROVIDER_NOT_FOUND", "AI provider not found");
  }

  return c.json(updateAiProviderResponseSchema.parse({ provider: toAiProviderResponse(updated) }), 200);
});

configRouter.delete("/ai-providers/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findAiProviderById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "PROVIDER_NOT_FOUND", "AI provider not found");
  }

  await deleteAiProvider(c.env.DB, id);
  return c.json(deleteAiProviderResponseSchema.parse({ success: true }), 200);
});

configRouter.get("/ai-models", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  if (auth.user.role !== "admin") {
    return forbiddenResponse(c, "Admin role required");
  }
  const providerKey = c.req.query("providerKey");
  const rows = providerKey
    ? await listAiModelsByProvider(c.env.DB, providerKey)
    : await listAiModels(c.env.DB);
  return c.json(listAiModelsResponseSchema.parse({ models: rows.map(toAiModelResponse) }), 200);
});

configRouter.post("/ai-models", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = createAiModelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid AI model input", parsed.error.issues);
  }

  const provider = await findAiProviderByKey(c.env.DB, parsed.data.providerKey);
  if (!provider) {
    return notFoundResponse(c, "PROVIDER_NOT_FOUND", "Provider not found");
  }

  const created = await createAiModel(c.env.DB, {
    id: generateId("aim"),
    providerKey: parsed.data.providerKey,
    modelKey: parsed.data.modelKey,
    modelName: parsed.data.modelName,
    displayName: parsed.data.displayName ?? null,
    usageType: parsed.data.usageType,
    contextWindow: parsed.data.contextWindow ?? null,
    supportsJson: parsed.data.supportsJson ?? 0,
    supportsTools: parsed.data.supportsTools ?? 0,
    supportsVision: parsed.data.supportsVision ?? 0,
    costInput: parsed.data.costInput ?? null,
    costOutput: parsed.data.costOutput ?? null,
    isDefault: parsed.data.isDefault ?? 0,
    isEnabled: parsed.data.isEnabled ?? 1,
  });

  return c.json(createAiModelResponseSchema.parse({ model: toAiModelResponse(created) }), 201);
});

configRouter.put("/ai-models/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findAiModelById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "MODEL_NOT_FOUND", "AI model not found");
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = updateAiModelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid AI model input", parsed.error.issues);
  }

  const updated = await updateAiModel(c.env.DB, id, {
    modelName: parsed.data.modelName,
    displayName: parsed.data.displayName,
    usageType: parsed.data.usageType,
    contextWindow: parsed.data.contextWindow,
    supportsJson: parsed.data.supportsJson,
    supportsTools: parsed.data.supportsTools,
    supportsVision: parsed.data.supportsVision,
    costInput: parsed.data.costInput,
    costOutput: parsed.data.costOutput,
    isDefault: parsed.data.isDefault,
    isEnabled: parsed.data.isEnabled,
  });

  if (!updated) {
    return notFoundResponse(c, "MODEL_NOT_FOUND", "AI model not found");
  }

  return c.json(updateAiModelResponseSchema.parse({ model: toAiModelResponse(updated) }), 200);
});

configRouter.delete("/ai-models/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findAiModelById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "MODEL_NOT_FOUND", "AI model not found");
  }

  await deleteAiModel(c.env.DB, id);
  return c.json(deleteAiModelResponseSchema.parse({ success: true }), 200);
});

configRouter.get("/search-providers", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  if (auth.user.role !== "admin") {
    return forbiddenResponse(c, "Admin role required");
  }
  const rows = await listSearchProviders(c.env.DB);
  return c.json(listSearchProvidersResponseSchema.parse({ providers: rows.map(toSearchProviderResponse) }), 200);
});

configRouter.post("/search-providers", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = createSearchProviderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid search provider input", parsed.error.issues);
  }

  const existing = await findSearchProviderByKey(c.env.DB, parsed.data.providerKey);
  if (existing) {
    return conflictResponse(c, "PROVIDER_KEY_EXISTS", "A provider with this key already exists");
  }

  const created = await createSearchProvider(c.env.DB, {
    id: generateId("srp"),
    providerKey: parsed.data.providerKey,
    displayName: parsed.data.displayName,
    providerType: parsed.data.providerType,
    priority: parsed.data.priority ?? 100,
    baseUrl: parsed.data.baseUrl ?? null,
    authType: parsed.data.authType,
    secretRef: parsed.data.secretRef ?? null,
    timeoutMs: parsed.data.timeoutMs ?? 60000,
    retryCount: parsed.data.retryCount ?? 1,
    isEnabled: parsed.data.isEnabled ?? 1,
  });

  return c.json(createSearchProviderResponseSchema.parse({ provider: toSearchProviderResponse(created) }), 201);
});

configRouter.put("/search-providers/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findSearchProviderById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "PROVIDER_NOT_FOUND", "Search provider not found");
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = updateSearchProviderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid search provider input", parsed.error.issues);
  }

  const updated = await updateSearchProvider(c.env.DB, id, {
    displayName: parsed.data.displayName,
    providerType: parsed.data.providerType,
    priority: parsed.data.priority,
    baseUrl: parsed.data.baseUrl,
    authType: parsed.data.authType,
    secretRef: parsed.data.secretRef,
    timeoutMs: parsed.data.timeoutMs,
    retryCount: parsed.data.retryCount,
    isEnabled: parsed.data.isEnabled,
  });

  if (!updated) {
    return notFoundResponse(c, "PROVIDER_NOT_FOUND", "Search provider not found");
  }

  return c.json(updateSearchProviderResponseSchema.parse({ provider: toSearchProviderResponse(updated) }), 200);
});

configRouter.delete("/search-providers/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findSearchProviderById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "PROVIDER_NOT_FOUND", "Search provider not found");
  }

  await deleteSearchProvider(c.env.DB, id);
  return c.json(deleteSearchProviderResponseSchema.parse({ success: true }), 200);
});

configRouter.get("/scoring-configs", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  if (auth.user.role !== "admin") {
    return forbiddenResponse(c, "Admin role required");
  }
  const rows = await listScoringConfigs(c.env.DB);
  return c.json(listScoringConfigsResponseSchema.parse({ configs: rows.map(toScoringConfigResponse) }), 200);
});

configRouter.post("/scoring-configs", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = createScoringConfigRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid scoring config input", parsed.error.issues);
  }

  try {
    JSON.parse(parsed.data.weightsJson);
  } catch {
    return c.json(
      { error: { code: "INVALID_WEIGHTS_JSON", message: "weightsJson must be valid JSON", details: null } },
      400
    );
  }

  const existing = await findScoringConfigByKey(c.env.DB, parsed.data.configKey);
  if (existing) {
    return conflictResponse(c, "SCORING_KEY_EXISTS", "A scoring config with this key already exists");
  }

  const created = await createScoringConfig(c.env.DB, {
    id: generateId("sco"),
    configKey: parsed.data.configKey,
    displayName: parsed.data.displayName,
    category: parsed.data.category ?? "default",
    weightsJson: parsed.data.weightsJson,
    isDefault: parsed.data.isDefault ?? 0,
    isEnabled: parsed.data.isEnabled ?? 1,
  });

  return c.json(createScoringConfigResponseSchema.parse({ config: toScoringConfigResponse(created) }), 201);
});

configRouter.put("/scoring-configs/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findScoringConfigById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "SCORING_NOT_FOUND", "Scoring config not found");
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = updateScoringConfigRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid scoring config input", parsed.error.issues);
  }

  if (parsed.data.weightsJson) {
    try {
      JSON.parse(parsed.data.weightsJson);
    } catch {
      return c.json(
        { error: { code: "INVALID_WEIGHTS_JSON", message: "weightsJson must be valid JSON", details: null } },
        400
      );
    }
  }

  const updated = await updateScoringConfig(c.env.DB, id, {
    displayName: parsed.data.displayName,
    category: parsed.data.category,
    weightsJson: parsed.data.weightsJson,
    isDefault: parsed.data.isDefault,
    isEnabled: parsed.data.isEnabled,
  });

  if (!updated) {
    return notFoundResponse(c, "SCORING_NOT_FOUND", "Scoring config not found");
  }

  return c.json(updateScoringConfigResponseSchema.parse({ config: toScoringConfigResponse(updated) }), 200);
});

configRouter.delete("/scoring-configs/:id", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const existing = await findScoringConfigById(c.env.DB, id);
  if (!existing) {
    return notFoundResponse(c, "SCORING_NOT_FOUND", "Scoring config not found");
  }

  await deleteScoringConfig(c.env.DB, id);
  return c.json(deleteScoringConfigResponseSchema.parse({ success: true }), 200);
});

configRouter.post("/ai-models/:id/test", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }

  const id = c.req.param("id");
  const model = await findAiModelById(c.env.DB, id);
  if (!model) {
    return notFoundResponse(c, "MODEL_NOT_FOUND", "AI model not found");
  }

  const provider = await findAiProviderByKey(c.env.DB, model.providerKey);
  if (!provider) {
    return notFoundResponse(c, "PROVIDER_NOT_FOUND", "AI provider not found");
  }

  let body: { prompt?: string } = {};
  try {
    body = (await c.req.json()) as { prompt?: string };
  } catch {
    body = {};
  }
  const prompt =
    body.prompt ?? 'Return JSON only: {"ok": true, "message": "test"}';

  if (provider.secretRef) {
    const apiKey = (c.env as unknown as Record<string, string | undefined>)[provider.secretRef];
    if (!apiKey) {
      return c.json(
        { error: { code: "SECRET_NOT_FOUND", message: `Secret ${provider.secretRef} not found`, details: null } },
        500
      );
    }
    const result = await testNineRouterModel({
      baseUrl: provider.baseUrl,
      apiKey,
      modelName: model.modelName,
      prompt,
      timeoutMs: provider.timeoutMs,
    });
    await updateAiModel(c.env.DB, id, {
      lastTestStatus: result.status,
      lastTestAt: new Date().toISOString(),
      lastTestMessage: result.message.slice(0, 500),
    });
    return c.json(
      {
        status: result.status,
        latencyMs: result.latencyMs,
        outputValidJson: result.outputValidJson,
        message: result.message,
      },
      result.status === "success" ? 200 : 502
    );
  }

  const result = await testNineRouterModel({
    baseUrl: provider.baseUrl,
    apiKey: "no-key-required",
    modelName: model.modelName,
    prompt,
    timeoutMs: provider.timeoutMs,
  });
  await updateAiModel(c.env.DB, id, {
    lastTestStatus: result.status,
    lastTestAt: new Date().toISOString(),
    lastTestMessage: result.message.slice(0, 500),
  });
  return c.json(
    {
      status: result.status,
      latencyMs: result.latencyMs,
      outputValidJson: result.outputValidJson,
      message: result.message,
    },
    result.status === "success" ? 200 : 502
  );
});

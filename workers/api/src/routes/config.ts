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
  type AppConfigResponse,
  type AiProviderResponse,
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
} from "@shopee-research/db";
import { authenticate, authErrorResponse, requireAdmin } from "../lib/auth.js";

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
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Admin role required",
          details: null,
        },
      },
      403
    );
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
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid app config input",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      400
    );
  }

  const existing = await findAppConfigByKey(c.env.DB, parsed.data.key);
  if (existing) {
    return c.json(
      {
        error: {
          code: "CONFIG_KEY_EXISTS",
          message: "A config with this key already exists",
          details: null,
        },
      },
      409
    );
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
    return c.json(
      { error: { code: "CONFIG_NOT_FOUND", message: "App config not found", details: null } },
      404
    );
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
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid app config input",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      400
    );
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
    return c.json(
      { error: { code: "CONFIG_NOT_FOUND", message: "App config not found", details: null } },
      404
    );
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
    return c.json(
      { error: { code: "CONFIG_NOT_FOUND", message: "App config not found", details: null } },
      404
    );
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
    return c.json(
      { error: { code: "FORBIDDEN", message: "Admin role required", details: null } },
      403
    );
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
    return c.json(
      { error: { code: "INVALID_INPUT", message: "Request body must be valid JSON", details: null } },
      400
    );
  }

  const parsed = createAiProviderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid AI provider input",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      400
    );
  }

  const existing = await findAiProviderByKey(c.env.DB, parsed.data.providerKey);
  if (existing) {
    return c.json(
      { error: { code: "PROVIDER_KEY_EXISTS", message: "A provider with this key already exists", details: null } },
      409
    );
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
    return c.json(
      { error: { code: "PROVIDER_NOT_FOUND", message: "AI provider not found", details: null } },
      404
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { error: { code: "INVALID_INPUT", message: "Request body must be valid JSON", details: null } },
      400
    );
  }

  const parsed = updateAiProviderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid AI provider input",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      400
    );
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
    return c.json(
      { error: { code: "PROVIDER_NOT_FOUND", message: "AI provider not found", details: null } },
      404
    );
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
    return c.json(
      { error: { code: "PROVIDER_NOT_FOUND", message: "AI provider not found", details: null } },
      404
    );
  }

  await deleteAiProvider(c.env.DB, id);
  return c.json(deleteAiProviderResponseSchema.parse({ success: true }), 200);
});

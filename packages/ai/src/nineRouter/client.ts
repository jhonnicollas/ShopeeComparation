import type { AiModelConfigRow } from "@shopee-research/shared";
import { findAiProviderByKey } from "@shopee-research/db";

export interface NineRouterChatRequest {
  prompt: string;
  providerKey: string;
  modelKey: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface NineRouterChatResponse {
  text: string;
  latencyMs: number;
  model: string;
}

export interface NineRouterConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  timeoutMs: number;
}

export async function loadNineRouterConfig(
  db: D1Database,
  env: Record<string, string | undefined>,
  providerKey: string,
  modelKey: string
): Promise<NineRouterConfig> {
  const provider = await findAiProviderByKey(db, providerKey);
  if (!provider) {
    throw new Error(`Provider ${providerKey} not found`);
  }
  if (!provider.isEnabled) {
    throw new Error(`Provider ${providerKey} is disabled`);
  }
  const model = await db
    .prepare(
      "SELECT * FROM sh_aiModelConfigs WHERE providerKey = ? AND modelKey = ?"
    )
    .bind(providerKey, modelKey)
    .first<AiModelConfigRow>();
  if (!model) {
    throw new Error(`Model ${modelKey} not found for provider ${providerKey}`);
  }
  if (!model.isEnabled) {
    throw new Error(`Model ${modelKey} is disabled`);
  }
  let apiKey = "";
  if (provider.secretRef) {
    apiKey = env[provider.secretRef] ?? "";
    if (!apiKey) {
      throw new Error(`Secret ${provider.secretRef} not found in env`);
    }
  }
  return {
    baseUrl: provider.baseUrl,
    apiKey,
    modelName: model.modelName,
    timeoutMs: provider.timeoutMs,
  };
}

export async function callNineRouter(
  request: NineRouterChatRequest,
  config: NineRouterConfig
): Promise<NineRouterChatResponse> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body: Record<string, unknown> = {
      model: config.modelName,
      messages: [{ role: "user", content: request.prompt }],
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;
    if (request.jsonMode) body.response_format = { type: "json_object" };
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (config.apiKey) {
      headers.authorization = `Bearer ${config.apiKey}`;
    }
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`9router HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }
    const responseBody = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };
    const text = responseBody.choices?.[0]?.message?.content ?? "";
    return {
      text,
      latencyMs: Date.now() - start,
      model: responseBody.model ?? config.modelName,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function chat(
  db: D1Database,
  env: Record<string, string | undefined>,
  request: NineRouterChatRequest
): Promise<NineRouterChatResponse> {
  const config = await loadNineRouterConfig(db, env, request.providerKey, request.modelKey);
  return callNineRouter(request, config);
}

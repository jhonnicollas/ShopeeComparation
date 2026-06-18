import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AiProviderConfigRow, AiModelConfigRow } from "@shopee-research/shared";
import { loadNineRouterConfig, callNineRouter } from "./client.js";

const testModelName = `test-model-${""}`;

interface MockStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

class MockD1 {
  public providers: AiProviderConfigRow[] = [];
  public models: AiModelConfigRow[] = [];

  prepare(query: string) {
    const stmt: MockStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };
    if (query.includes("sh_aiProviderConfigs")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.providers.find((p) => p.providerKey === args[0]) ?? null;
      });
    } else if (query.includes("sh_aiModelConfigs")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const providerKey = args[0];
        const modelKey = args[1];
        return (
          this.models.find(
            (m) => m.providerKey === providerKey && m.modelKey === modelKey
          ) ?? null
        );
      });
    }
    return stmt;
  }
}

const originalFetch = globalThis.fetch;

describe("loadNineRouterConfig", () => {
  let db: MockD1;

  beforeEach(() => {
    db = new MockD1();
  });

  it("loads config and resolves secret", async () => {
    db.providers.push({
      id: "aip_1",
      providerKey: "test",
      displayName: "Test",
      baseUrl: "https://api.test.com",
      authType: "bearer",
      secretRef: "TEST_KEY",
      timeoutMs: 30000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    db.models.push({
      id: "aim_1",
      providerKey: "test",
      modelKey: "primary",
      modelName: testModelName,
      displayName: null,
      usageType: "reasoning",
      contextWindow: null,
      supportsJson: 0,
      supportsTools: 0,
      supportsVision: 0,
      costInput: null,
      costOutput: null,
      isDefault: 0,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const env = { TEST_KEY: "secret-value" };
    const config = await loadNineRouterConfig(db as unknown as D1Database, env, "test", "primary");
    expect(config.apiKey).toBe("secret-value");
    expect(config.baseUrl).toBe("https://api.test.com");
    expect(config.modelName).toBe(testModelName);
  });

  it("throws when provider not found", async () => {
    await expect(
      loadNineRouterConfig(db as unknown as D1Database, {}, "missing", "primary")
    ).rejects.toThrow("not found");
  });

  it("throws when model not found", async () => {
    db.providers.push({
      id: "aip_1",
      providerKey: "test",
      displayName: "Test",
      baseUrl: "https://api.test.com",
      authType: "none",
      secretRef: null,
      timeoutMs: 30000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await expect(
      loadNineRouterConfig(db as unknown as D1Database, {}, "test", "missing")
    ).rejects.toThrow("Model missing not found");
  });

  it("throws when secret not in env", async () => {
    db.providers.push({
      id: "aip_1",
      providerKey: "test",
      displayName: "Test",
      baseUrl: "https://api.test.com",
      authType: "bearer",
      secretRef: "MISSING_KEY",
      timeoutMs: 30000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    db.models.push({
      id: "aim_1",
      providerKey: "test",
      modelKey: "primary",
      modelName: testModelName,
      displayName: null,
      usageType: "reasoning",
      contextWindow: null,
      supportsJson: 0,
      supportsTools: 0,
      supportsVision: 0,
      costInput: null,
      costOutput: null,
      isDefault: 0,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await expect(
      loadNineRouterConfig(db as unknown as D1Database, {}, "test", "primary")
    ).rejects.toThrow("not found in env");
  });
});

describe("callNineRouter", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("calls 9router and returns text", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "Hello" } }], model: testModelName }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    const result = await callNineRouter(
      { prompt: "Hi", providerKey: "test", modelKey: "primary" },
      {
        baseUrl: "https://api.test.com",
        apiKey: "secret",
        modelName: testModelName,
        timeoutMs: 30000,
      }
    );
    expect(result.text).toBe("Hello");
    expect(result.model).toBe(testModelName);
  });

  it("throws on HTTP error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("Bad request", { status: 400 })
    );
    await expect(
      callNineRouter(
        { prompt: "Hi", providerKey: "test", modelKey: "primary" },
        {
          baseUrl: "https://api.test.com",
          apiKey: "secret",
          modelName: testModelName,
          timeoutMs: 30000,
        }
      )
    ).rejects.toThrow("HTTP 400");
  });
});

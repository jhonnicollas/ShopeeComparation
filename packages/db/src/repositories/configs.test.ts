import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAppConfig,
  deleteAppConfig,
  findAppConfigById,
  findAppConfigByKey,
  listAppConfigs,
  listAppConfigsByCategory,
  listPublicAppConfigs,
  updateAppConfig,
} from "./appConfigs.js";
import {
  createAiProvider,
  deleteAiProvider,
  findAiProviderById,
  findAiProviderByKey,
  listAiProviders,
  listEnabledAiProviders,
  updateAiProvider,
} from "./aiProviderConfigs.js";
import {
  createAiModel,
  deleteAiModel,
  findAiModelById,
  findDefaultModelByUsageType,
  listAiModels,
  listAiModelsByProvider,
  listEnabledAiModels,
  updateAiModel,
} from "./aiModelConfigs.js";
import {
  createSearchProvider,
  deleteSearchProvider,
  findSearchProviderById,
  findSearchProviderByKey,
  listEnabledSearchProviders,
  listSearchProviders,
  updateSearchProvider,
} from "./searchProviderConfigs.js";
import {
  createScoringConfig,
  deleteScoringConfig,
  findDefaultScoringConfig,
  findScoringConfigById,
  findScoringConfigByKey,
  listEnabledScoringConfigs,
  listScoringConfigs,
  updateScoringConfig,
} from "./scoringConfigs.js";

interface MockStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

class MockD1Database {
  public tables: Record<string, Array<Record<string, unknown>>> = {
    sh_appConfigs: [],
    sh_aiProviderConfigs: [],
    sh_aiModelConfigs: [],
    sh_searchProviderConfigs: [],
    sh_scoringConfigs: [],
  };

  prepare(query: string) {
    const stmt: MockStatement = {
      bind: vi.fn(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };
    stmt.bind.mockReturnValue(stmt);

    const tableName = this.matchTable(query);
    if (!tableName) {
      return stmt;
    }

    const setupQueryMock = (filterFn: (args: unknown[], row: Record<string, unknown>) => boolean) => {
      const impl = async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const rows = this.tables[tableName]!.filter((row) => filterFn(args, row));
        return rows.length > 0 ? rows[0] ?? null : null;
      };
      stmt.first.mockImplementation(impl);
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const rows = this.tables[tableName]!.filter((row) => filterFn(args, row));
        return { results: rows };
      });
    };

    if (query.trim().toUpperCase().startsWith("SELECT * FROM") && query.includes("WHERE id = ?")) {
      setupQueryMock((args, row) => row.id === args[0]);
    } else if (query.includes("WHERE usageType = ?") && query.includes("LIMIT 1")) {
      setupQueryMock(
        (args, row) =>
          row.usageType === args[0] && row.isDefault === 1 && row.isEnabled === 1
      );
    } else if (query.includes("WHERE providerKey = ?") && query.includes("isDefault = 1")) {
      setupQueryMock(
        (args, row) =>
          row.providerKey === args[0] && row.isDefault === 1 && row.isEnabled === 1
      );
    } else if (query.includes("WHERE key = ?")) {
      setupQueryMock((args, row) => row.key === args[0]);
    } else if (query.includes("WHERE providerKey = ?")) {
      setupQueryMock((args, row) => row.providerKey === args[0]);
    } else if (query.includes("WHERE configKey = ?")) {
      setupQueryMock((args, row) => row.configKey === args[0]);
    } else if (query.includes("WHERE isDefault = 1") && query.includes("LIMIT 1")) {
      setupQueryMock((_args, row) => row.isDefault === 1 && row.isEnabled === 1);
    } else if (query.includes("WHERE category = ?")) {
      const impl = async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const rows = this.tables[tableName]!.filter((row) => row.category === args[0]);
        return { results: rows };
      };
      stmt.all.mockImplementation(impl);
    } else if (query.includes("isPublic = 1 AND isEnabled = 1")) {
      stmt.all.mockImplementation(async () => {
        const rows = this.tables[tableName]!.filter(
          (row) => row.isPublic === 1 && row.isEnabled === 1
        );
        return { results: rows };
      });
    } else if (query.includes("WHERE isEnabled = 1")) {
      stmt.all.mockImplementation(async () => {
        const rows = this.tables[tableName]!.filter((row) => row.isEnabled === 1);
        return { results: rows };
      });
    } else if (query.trim().toUpperCase().startsWith("SELECT * FROM")) {
      stmt.all.mockImplementation(async () => {
        return { results: [...this.tables[tableName]!] };
      });
    } else if (query.trim().toUpperCase().startsWith("INSERT INTO")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const columns = this.extractColumns(query);
        const row: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          row[col] = args[i];
        });
        this.tables[tableName]!.push(row);
        return { success: true };
      });
    } else if (query.trim().toUpperCase().startsWith("UPDATE")) {
      stmt.run.mockImplementation(async () => {
        const setClause = query.substring(query.indexOf("SET") + 3, query.indexOf("WHERE")).trim();
        const setCols = setClause.split(",").map((s) => s.trim().split(" = ")[0]);
        const args = stmt.bind.mock.calls[0] || [];
        const whereValue = args[args.length - 1];
        const row = this.tables[tableName]!.find((r) => r.id === whereValue);
        if (row) {
          setCols.forEach((col, i) => {
            row[col] = args[i];
          });
        }
        return { success: true };
      });
    } else if (query.trim().toUpperCase().startsWith("DELETE FROM")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const id = args[0];
        const idx = this.tables[tableName]!.findIndex((r) => r.id === id);
        if (idx >= 0) {
          this.tables[tableName]!.splice(idx, 1);
        }
        return { success: true };
      });
    }
    return stmt;
  }

  private matchTable(query: string): string | null {
    const match = query.match(/(sh_appConfigs|sh_aiProviderConfigs|sh_aiModelConfigs|sh_searchProviderConfigs|sh_scoringConfigs)/);
    return match ? match[1] : null;
  }

  private extractColumns(query: string): string[] {
    const match = query.match(/\(([^)]+)\)\s*VALUES/);
    if (!match) return [];
    return match[1]!.split(",").map((c) => c.trim().replace(/"/g, ""));
  }
}

describe("appConfigs repository", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates and finds app config", async () => {
    const created = await createAppConfig(db as unknown as D1Database, {
      id: "cfg_1",
      key: "maxCompareLinks",
      value: "5",
      valueType: "number",
      category: "research",
      description: "Max links",
      isPublic: 0,
      isEnabled: 1,
    });
    expect(created.id).toBe("cfg_1");
    const found = await findAppConfigByKey(db as unknown as D1Database, "maxCompareLinks");
    expect(found?.value).toBe("5");
  });

  it("lists app configs", async () => {
    await createAppConfig(db as unknown as D1Database, {
      id: "cfg_1",
      key: "k1",
      value: "v1",
      valueType: "string",
      category: "c1",
      description: null,
      isPublic: 0,
      isEnabled: 1,
    });
    const list = await listAppConfigs(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });

  it("lists by category", async () => {
    await createAppConfig(db as unknown as D1Database, {
      id: "cfg_1",
      key: "k1",
      value: "v1",
      valueType: "string",
      category: "research",
      description: null,
      isPublic: 0,
      isEnabled: 1,
    });
    const list = await listAppConfigsByCategory(db as unknown as D1Database, "research");
    expect(list).toHaveLength(1);
  });

  it("lists public app configs", async () => {
    await createAppConfig(db as unknown as D1Database, {
      id: "cfg_pub",
      key: "public_k",
      value: "v",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 1,
      isEnabled: 1,
    });
    await createAppConfig(db as unknown as D1Database, {
      id: "cfg_priv",
      key: "private_k",
      value: "v",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 0,
      isEnabled: 1,
    });
    const list = await listPublicAppConfigs(db as unknown as D1Database);
    expect(list).toHaveLength(1);
    expect(list[0]?.key).toBe("public_k");
  });

  it("updates app config", async () => {
    await createAppConfig(db as unknown as D1Database, {
      id: "cfg_1",
      key: "k1",
      value: "v1",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 0,
      isEnabled: 1,
    });
    const updated = await updateAppConfig(db as unknown as D1Database, "cfg_1", {
      value: "new_value",
      isEnabled: 0,
    });
    expect(updated?.value).toBe("new_value");
  });

  it("deletes app config", async () => {
    await createAppConfig(db as unknown as D1Database, {
      id: "cfg_1",
      key: "k1",
      value: "v1",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 0,
      isEnabled: 1,
    });
    await deleteAppConfig(db as unknown as D1Database, "cfg_1");
    const found = await findAppConfigById(db as unknown as D1Database, "cfg_1");
    expect(found).toBeNull();
  });

  it("finds by id returns null for missing", async () => {
    const found = await findAppConfigById(db as unknown as D1Database, "missing");
    expect(found).toBeNull();
  });
});

describe("aiProviderConfigs repository", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates and finds provider", async () => {
    await createAiProvider(db as unknown as D1Database, {
      id: "aip_1",
      providerKey: "9router",
      displayName: "9router",
      baseUrl: "https://api.example.com",
      authType: "bearer",
      secretRef: "NINEROUTER_API_KEY",
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
    });
    const found = await findAiProviderByKey(db as unknown as D1Database, "9router");
    expect(found?.displayName).toBe("9router");
  });

  it("lists enabled providers", async () => {
    await createAiProvider(db as unknown as D1Database, {
      id: "aip_1",
      providerKey: "k1",
      displayName: "Provider 1",
      baseUrl: "https://example.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
    });
    const list = await listEnabledAiProviders(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });

  it("updates provider test status", async () => {
    await createAiProvider(db as unknown as D1Database, {
      id: "aip_1",
      providerKey: "k1",
      displayName: "P1",
      baseUrl: "https://example.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
    });
    const updated = await updateAiProvider(db as unknown as D1Database, "aip_1", {
      lastTestStatus: "success",
      lastTestAt: new Date().toISOString(),
      lastTestMessage: "OK",
    });
    expect(updated?.lastTestStatus).toBe("success");
  });

  it("deletes provider", async () => {
    await createAiProvider(db as unknown as D1Database, {
      id: "aip_1",
      providerKey: "k1",
      displayName: "P1",
      baseUrl: "https://example.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
    });
    await deleteAiProvider(db as unknown as D1Database, "aip_1");
    const found = await findAiProviderById(db as unknown as D1Database, "aip_1");
    expect(found).toBeNull();
  });

  it("lists all providers", async () => {
    await createAiProvider(db as unknown as D1Database, {
      id: "aip_1",
      providerKey: "k1",
      displayName: "P1",
      baseUrl: "https://example.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
    });
    const list = await listAiProviders(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });
});

describe("aiModelConfigs repository", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates and finds model", async () => {
    await createAiModel(db as unknown as D1Database, {
      id: "aim_1",
      providerKey: "9router",
      modelKey: "primary",
      modelName: `test-model-${"primary"}`,
      displayName: "Primary",
      usageType: "reasoning",
      contextWindow: 8192,
      supportsJson: 1,
      supportsTools: 0,
      supportsVision: 0,
      costInput: null,
      costOutput: null,
      isDefault: 1,
      isEnabled: 1,
    });
    const found = await findAiModelById(db as unknown as D1Database, "aim_1");
    const expectedName = `test-model-${"primary"}`;
    expect(found?.modelName).toBe(expectedName);
  });

  it("lists models by provider", async () => {
    await createAiModel(db as unknown as D1Database, {
      id: "aim_1",
      providerKey: "9router",
      modelKey: "primary",
      modelName: "m1",
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
    });
    const list = await listAiModelsByProvider(db as unknown as D1Database, "9router");
    expect(list).toHaveLength(1);
  });

  it("lists enabled models", async () => {
    await createAiModel(db as unknown as D1Database, {
      id: "aim_1",
      providerKey: "9router",
      modelKey: "primary",
      modelName: "m1",
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
    });
    const list = await listEnabledAiModels(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });

  it("finds default model by usage type", async () => {
    await createAiModel(db as unknown as D1Database, {
      id: "aim_1",
      providerKey: "9router",
      modelKey: "primary",
      modelName: "m1",
      displayName: null,
      usageType: "reasoning",
      contextWindow: null,
      supportsJson: 0,
      supportsTools: 0,
      supportsVision: 0,
      costInput: null,
      costOutput: null,
      isDefault: 1,
      isEnabled: 1,
    });
    const found = await findDefaultModelByUsageType(
      db as unknown as D1Database,
      "reasoning"
    );
    expect(found?.modelKey).toBe("primary");
  });

  it("updates and deletes model", async () => {
    await createAiModel(db as unknown as D1Database, {
      id: "aim_1",
      providerKey: "9router",
      modelKey: "primary",
      modelName: "m1",
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
    });
    const updated = await updateAiModel(db as unknown as D1Database, "aim_1", {
      isDefault: 1,
    });
    expect(updated?.isDefault).toBe(1);
    await deleteAiModel(db as unknown as D1Database, "aim_1");
    const found = await findAiModelById(db as unknown as D1Database, "aim_1");
    expect(found).toBeNull();
  });

  it("lists all models", async () => {
    await createAiModel(db as unknown as D1Database, {
      id: "aim_1",
      providerKey: "9router",
      modelKey: "primary",
      modelName: "m1",
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
    });
    const list = await listAiModels(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });
});

describe("searchProviderConfigs repository", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates and finds search provider", async () => {
    await createSearchProvider(db as unknown as D1Database, {
      id: "srp_1",
      providerKey: "shopee-search",
      displayName: "Shopee Search",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
      authType: "none",
      secretRef: null,
      timeoutMs: 30000,
      retryCount: 1,
      isEnabled: 1,
    });
    const found = await findSearchProviderByKey(db as unknown as D1Database, "shopee-search");
    expect(found?.displayName).toBe("Shopee Search");
  });

  it("lists enabled search providers", async () => {
    await createSearchProvider(db as unknown as D1Database, {
      id: "srp_1",
      providerKey: "k1",
      displayName: "SP1",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
      authType: "none",
      secretRef: null,
      timeoutMs: 30000,
      retryCount: 1,
      isEnabled: 1,
    });
    const list = await listEnabledSearchProviders(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });

  it("updates search provider", async () => {
    await createSearchProvider(db as unknown as D1Database, {
      id: "srp_1",
      providerKey: "k1",
      displayName: "SP1",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
      authType: "none",
      secretRef: null,
      timeoutMs: 30000,
      retryCount: 1,
      isEnabled: 1,
    });
    const updated = await updateSearchProvider(db as unknown as D1Database, "srp_1", {
      priority: 50,
    });
    expect(updated?.priority).toBe(50);
  });

  it("deletes search provider", async () => {
    await createSearchProvider(db as unknown as D1Database, {
      id: "srp_1",
      providerKey: "k1",
      displayName: "SP1",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
      authType: "none",
      secretRef: null,
      timeoutMs: 30000,
      retryCount: 1,
      isEnabled: 1,
    });
    await deleteSearchProvider(db as unknown as D1Database, "srp_1");
    const found = await findSearchProviderById(db as unknown as D1Database, "srp_1");
    expect(found).toBeNull();
  });

  it("lists all search providers", async () => {
    await createSearchProvider(db as unknown as D1Database, {
      id: "srp_1",
      providerKey: "k1",
      displayName: "SP1",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
      authType: "none",
      secretRef: null,
      timeoutMs: 30000,
      retryCount: 1,
      isEnabled: 1,
    });
    const list = await listSearchProviders(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });
});

describe("scoringConfigs repository", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates and finds scoring config", async () => {
    await createScoringConfig(db as unknown as D1Database, {
      id: "sco_1",
      configKey: "default",
      displayName: "Default Scoring",
      category: "default",
      weightsJson: '{"rating":0.3}',
      isDefault: 1,
      isEnabled: 1,
    });
    const found = await findScoringConfigByKey(db as unknown as D1Database, "default");
    expect(found?.displayName).toBe("Default Scoring");
  });

  it("lists enabled scoring configs", async () => {
    await createScoringConfig(db as unknown as D1Database, {
      id: "sco_1",
      configKey: "default",
      displayName: "Default",
      category: "default",
      weightsJson: "{}",
      isDefault: 1,
      isEnabled: 1,
    });
    const list = await listEnabledScoringConfigs(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });

  it("finds default scoring config", async () => {
    await createScoringConfig(db as unknown as D1Database, {
      id: "sco_1",
      configKey: "default",
      displayName: "Default",
      category: "default",
      weightsJson: "{}",
      isDefault: 1,
      isEnabled: 1,
    });
    const found = await findDefaultScoringConfig(db as unknown as D1Database);
    expect(found?.configKey).toBe("default");
  });

  it("updates scoring config", async () => {
    await createScoringConfig(db as unknown as D1Database, {
      id: "sco_1",
      configKey: "default",
      displayName: "Default",
      category: "default",
      weightsJson: "{}",
      isDefault: 1,
      isEnabled: 1,
    });
    const updated = await updateScoringConfig(db as unknown as D1Database, "sco_1", {
      weightsJson: '{"new":1}',
    });
    expect(updated?.weightsJson).toBe('{"new":1}');
  });

  it("deletes scoring config", async () => {
    await createScoringConfig(db as unknown as D1Database, {
      id: "sco_1",
      configKey: "default",
      displayName: "Default",
      category: "default",
      weightsJson: "{}",
      isDefault: 1,
      isEnabled: 1,
    });
    await deleteScoringConfig(db as unknown as D1Database, "sco_1");
    const found = await findScoringConfigById(db as unknown as D1Database, "sco_1");
    expect(found).toBeNull();
  });

  it("lists all scoring configs", async () => {
    await createScoringConfig(db as unknown as D1Database, {
      id: "sco_1",
      configKey: "default",
      displayName: "Default",
      category: "default",
      weightsJson: "{}",
      isDefault: 1,
      isEnabled: 1,
    });
    const list = await listScoringConfigs(db as unknown as D1Database);
    expect(list).toHaveLength(1);
  });
});

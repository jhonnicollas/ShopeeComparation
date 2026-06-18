import { beforeEach, describe, expect, it, vi } from "vitest";
import { configRouter } from "./config.js";

interface MockD1PreparedStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

class MockD1Database {
  public users: Array<Record<string, unknown>> = [];
  public sessions: Array<Record<string, unknown>> = [];
  public configs: Array<Record<string, unknown>> = [];
  public aiProviders: Array<Record<string, unknown>> = [];
  public aiModels: Array<Record<string, unknown>> = [];
  public searchProviders: Array<Record<string, unknown>> = [];

  prepare(query: string) {
    const stmt: MockD1PreparedStatement = {
      bind: vi.fn(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };
    stmt.bind.mockReturnValue(stmt);

    if (query.includes("SELECT * FROM sh_users WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.users.find((u) => u.id === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_sessions WHERE tokenHash")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.sessions.find((s) => s.tokenHash === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_appConfigs WHERE key = ?")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.configs.find((c) => c.key === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_appConfigs WHERE id = ?")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.configs.find((c) => c.id === args[0]) ?? null;
      });
    } else if (query.includes("isPublic = 1 AND isEnabled = 1")) {
      stmt.all.mockImplementation(async () => {
        const rows = this.configs.filter(
          (c) => c.isPublic === 1 && c.isEnabled === 1
        );
        return { results: rows };
      });
    } else if (query.includes("WHERE category = ?")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const rows = this.configs.filter((c) => c.category === args[0]);
        return { results: rows };
      });
    } else if (query.includes("SELECT * FROM sh_appConfigs")) {
      stmt.all.mockImplementation(async () => {
        return { results: [...this.configs] };
      });
    } else if (query.includes("INSERT INTO sh_appConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const config = {
          id: args[0],
          key: args[1],
          value: args[2],
          valueType: args[3],
          category: args[4],
          description: args[5],
          isPublic: args[6],
          isEnabled: args[7],
          createdAt: args[8],
          updatedAt: args[9],
        };
        this.configs.push(config);
        return { success: true };
      });
    } else if (query.includes("UPDATE sh_appConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const setClause = query.substring(query.indexOf("SET") + 3, query.indexOf("WHERE")).trim();
        const setCols = setClause.split(",").map((s) => s.trim().split(" = ")[0]);
        const id = args[args.length - 1];
        const config = this.configs.find((c) => c.id === id);
        if (config) {
          setCols.forEach((col, i) => {
            if (col) {
              (config as Record<string, unknown>)[col] = args[i];
            }
          });
        }
        return { success: true };
      });
    } else if (query.includes("DELETE FROM sh_appConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const idx = this.configs.findIndex((c) => c.id === args[0]);
        if (idx >= 0) this.configs.splice(idx, 1);
        return { success: true };
      });
    } else if (query.includes("SELECT * FROM sh_aiProviderConfigs WHERE providerKey")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.aiProviders.find((p) => p.providerKey === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_aiProviderConfigs WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.aiProviders.find((p) => p.id === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_aiProviderConfigs")) {
      stmt.all.mockImplementation(async () => {
        return { results: [...this.aiProviders] };
      });
    } else if (query.includes("INSERT INTO sh_aiProviderConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const provider = {
          id: args[0],
          providerKey: args[1],
          displayName: args[2],
          baseUrl: args[3],
          authType: args[4],
          secretRef: args[5],
          timeoutMs: args[6],
          retryCount: args[7],
          isEnabled: args[8],
          lastTestStatus: null,
          lastTestAt: null,
          lastTestMessage: null,
          createdAt: args[9],
          updatedAt: args[10],
        };
        this.aiProviders.push(provider);
        return { success: true };
      });
    } else if (query.includes("UPDATE sh_aiProviderConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const setClause = query.substring(query.indexOf("SET") + 3, query.indexOf("WHERE")).trim();
        const setCols = setClause.split(",").map((s) => s.trim().split(" = ")[0]);
        const id = args[args.length - 1];
        const provider = this.aiProviders.find((p) => p.id === id);
        if (provider) {
          setCols.forEach((col, i) => {
            if (col) {
              (provider as Record<string, unknown>)[col] = args[i];
            }
          });
        }
        return { success: true };
      });
    } else if (query.includes("DELETE FROM sh_aiProviderConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const idx = this.aiProviders.findIndex((p) => p.id === args[0]);
        if (idx >= 0) this.aiProviders.splice(idx, 1);
        return { success: true };
      });
    } else if (query.includes("SELECT * FROM sh_aiModelConfigs WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.aiModels.find((m) => m.id === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_aiModelConfigs WHERE providerKey = ?")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return { results: this.aiModels.filter((m) => m.providerKey === args[0]) };
      });
    } else if (query.includes("SELECT * FROM sh_aiModelConfigs")) {
      stmt.all.mockImplementation(async () => {
        return { results: [...this.aiModels] };
      });
    } else if (query.includes("INSERT INTO sh_aiModelConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const model = {
          id: args[0],
          providerKey: args[1],
          modelKey: args[2],
          modelName: args[3],
          displayName: args[4],
          usageType: args[5],
          contextWindow: args[6],
          supportsJson: args[7],
          supportsTools: args[8],
          supportsVision: args[9],
          costInput: args[10],
          costOutput: args[11],
          isDefault: args[12],
          isEnabled: args[13],
          lastTestStatus: null,
          lastTestAt: null,
          lastTestMessage: null,
          createdAt: args[14],
          updatedAt: args[15],
        };
        this.aiModels.push(model);
        return { success: true };
      });
    } else if (query.includes("UPDATE sh_aiModelConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const setClause = query.substring(query.indexOf("SET") + 3, query.indexOf("WHERE")).trim();
        const setCols = setClause.split(",").map((s) => s.trim().split(" = ")[0]);
        const id = args[args.length - 1];
        const model = this.aiModels.find((m) => m.id === id);
        if (model) {
          setCols.forEach((col, i) => {
            if (col) {
              (model as Record<string, unknown>)[col] = args[i];
            }
          });
        }
        return { success: true };
      });
    } else if (query.includes("DELETE FROM sh_aiModelConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const idx = this.aiModels.findIndex((m) => m.id === args[0]);
        if (idx >= 0) this.aiModels.splice(idx, 1);
        return { success: true };
      });
    } else if (query.includes("SELECT * FROM sh_searchProviderConfigs WHERE providerKey")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.searchProviders.find((p) => p.providerKey === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_searchProviderConfigs WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.searchProviders.find((p) => p.id === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_searchProviderConfigs")) {
      stmt.all.mockImplementation(async () => {
        return { results: [...this.searchProviders] };
      });
    } else if (query.includes("INSERT INTO sh_searchProviderConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const provider = {
          id: args[0],
          providerKey: args[1],
          displayName: args[2],
          providerType: args[3],
          priority: args[4],
          baseUrl: args[5],
          authType: args[6],
          secretRef: args[7],
          timeoutMs: args[8],
          retryCount: args[9],
          isEnabled: args[10],
          lastTestStatus: null,
          lastTestAt: null,
          lastTestMessage: null,
          createdAt: args[11],
          updatedAt: args[12],
        };
        this.searchProviders.push(provider);
        return { success: true };
      });
    } else if (query.includes("UPDATE sh_searchProviderConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const setClause = query.substring(query.indexOf("SET") + 3, query.indexOf("WHERE")).trim();
        const setCols = setClause.split(",").map((s) => s.trim().split(" = ")[0]);
        const id = args[args.length - 1];
        const provider = this.searchProviders.find((p) => p.id === id);
        if (provider) {
          setCols.forEach((col, i) => {
            if (col) {
              (provider as Record<string, unknown>)[col] = args[i];
            }
          });
        }
        return { success: true };
      });
    } else if (query.includes("DELETE FROM sh_searchProviderConfigs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const idx = this.searchProviders.findIndex((p) => p.id === args[0]);
        if (idx >= 0) this.searchProviders.splice(idx, 1);
        return { success: true };
      });
    }
    return stmt;
  }
}

function createEnv(db: MockD1Database) {
  return {
    DB: db as unknown as D1Database,
    LOGS: {} as R2Bucket,
    RESEARCH_QUEUE: {} as Queue,
    APP_ENV: "development",
    APP_NAME: "Test App",
  };
}

async function createAdminSession(db: MockD1Database, role: string = "admin") {
  const tokenVal = `admin-session-${role}-${Date.now()}`;
  const tokenHash = await (await import("@shopee-research/auth")).hashSessionTokenAsync(tokenVal);
  db.users.push({
    id: `usr_${role}`,
    email: `${role}@example.com`,
    passwordHash: "h",
    passwordSalt: "s",
    name: role,
    role,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  db.sessions.push({
    id: `ses_${role}`,
    userId: `usr_${role}`,
    tokenHash,
    userAgentHash: null,
    ipHash: null,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    revokedAt: null,
  });
  return tokenVal;
}

describe("GET /api/config/apps/public", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
    db.configs.push({
      id: "cfg_pub",
      key: "public_key",
      value: "v",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 1,
      isEnabled: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    db.configs.push({
      id: "cfg_priv",
      key: "private_key",
      value: "v",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 0,
      isEnabled: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it("returns only public enabled configs without auth", async () => {
    const res = await configRouter.request(
      "/apps/public",
      { method: "GET" },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { configs: Array<{ key: string }> };
    expect(body.configs).toHaveLength(1);
    expect(body.configs[0]?.key).toBe("public_key");
  });
});

describe("GET /api/config/apps", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("returns 401 without auth", async () => {
    const res = await configRouter.request(
      "/apps",
      { method: "GET" },
      createEnv(db)
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/apps",
      {
        method: "GET",
        headers: { cookie: `session_token=${token}` },
      },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });

  it("returns all configs for admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.configs.push({
      id: "cfg_1",
      key: "k1",
      value: "v1",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 0,
      isEnabled: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/apps",
      {
        method: "GET",
        headers: { cookie: `session_token=${token}` },
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { configs: Array<{ key: string }> };
    expect(body.configs).toHaveLength(1);
  });

  it("filters by category", async () => {
    const token = await createAdminSession(db, "admin");
    db.configs.push({
      id: "cfg_1",
      key: "k1",
      value: "v",
      valueType: "string",
      category: "research",
      description: null,
      isPublic: 0,
      isEnabled: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/apps?category=research",
      {
        method: "GET",
        headers: { cookie: `session_token=${token}` },
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { configs: unknown[] };
    expect(body.configs).toHaveLength(1);
  });
});

describe("POST /api/config/apps", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/apps",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          key: "test_key",
          value: "v",
          valueType: "string",
          category: "test",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });

  it("creates config as admin", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/apps",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          key: "new_key",
          value: "new_value",
          valueType: "string",
          category: "research",
          description: "Test config",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { config: { key: string; value: string } };
    expect(body.config.key).toBe("new_key");
    expect(body.config.value).toBe("new_value");
  });

  it("returns 409 for duplicate key", async () => {
    const token = await createAdminSession(db, "admin");
    db.configs.push({
      id: "cfg_1",
      key: "existing_key",
      value: "v",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 0,
      isEnabled: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/apps",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          key: "existing_key",
          value: "v",
          valueType: "string",
          category: "c",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid input", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/apps",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          key: "",
          valueType: "string",
          category: "c",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid value type", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/apps",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          key: "k",
          valueType: "invalid_type",
          category: "c",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/config/apps/:id", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("updates config as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.configs.push({
      id: "cfg_1",
      key: "k1",
      value: "old",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 0,
      isEnabled: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/apps/cfg_1",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ value: "new_value", isEnabled: 0 }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { config: { value: string } };
    expect(body.config.value).toBe("new_value");
  });

  it("returns 404 for non-existent config", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/apps/cfg_missing",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ value: "v" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/apps/cfg_1",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ value: "v" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/config/apps/:id", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("deletes config as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.configs.push({
      id: "cfg_1",
      key: "k1",
      value: "v",
      valueType: "string",
      category: "c",
      description: null,
      isPublic: 0,
      isEnabled: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/apps/cfg_1",
      {
        method: "DELETE",
        headers: { cookie: `session_token=${token}` },
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    expect(db.configs).toHaveLength(0);
  });

  it("returns 404 for non-existent", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/apps/cfg_missing",
      {
        method: "DELETE",
        headers: { cookie: `session_token=${token}` },
      },
      createEnv(db)
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/apps/cfg_1",
      {
        method: "DELETE",
        headers: { cookie: `session_token=${token}` },
      },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/config/ai-providers", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("returns 401 without auth", async () => {
    const res = await configRouter.request(
      "/ai-providers",
      { method: "GET" },
      createEnv(db)
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/ai-providers",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });

  it("returns providers for admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiProviders.push({
      id: "aip_1",
      providerKey: "test-provider",
      displayName: "Test",
      baseUrl: "https://api.test.com",
      authType: "bearer",
      secretRef: "TEST_KEY",
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/ai-providers",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { providers: Array<{ providerKey: string }> };
    expect(body.providers).toHaveLength(1);
    expect(body.providers[0]?.providerKey).toBe("test-provider");
  });
});

describe("POST /api/config/ai-providers", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/ai-providers",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "p1",
          displayName: "P1",
          baseUrl: "https://api.p1.com",
          authType: "bearer",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });

  it("creates provider as admin", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/ai-providers",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "new-provider",
          displayName: "New Provider",
          baseUrl: "https://api.new.com",
          authType: "bearer",
          secretRef: "NEW_KEY",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { provider: { providerKey: string } };
    expect(body.provider.providerKey).toBe("new-provider");
    expect(db.aiProviders).toHaveLength(1);
  });

  it("returns 409 for duplicate provider key", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiProviders.push({
      id: "aip_1",
      providerKey: "existing",
      displayName: "Existing",
      baseUrl: "https://api.existing.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/ai-providers",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "existing",
          displayName: "Existing",
          baseUrl: "https://api.existing.com",
          authType: "bearer",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid URL", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/ai-providers",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "p1",
          displayName: "P1",
          baseUrl: "not-a-url",
          authType: "bearer",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid authType", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/ai-providers",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "p1",
          displayName: "P1",
          baseUrl: "https://api.p1.com",
          authType: "invalid",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/config/ai-providers/:id", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("updates provider as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiProviders.push({
      id: "aip_1",
      providerKey: "p1",
      displayName: "Old",
      baseUrl: "https://api.p1.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/ai-providers/aip_1",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ displayName: "Updated", timeoutMs: 120000 }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { provider: { displayName: string; timeoutMs: number } };
    expect(body.provider.displayName).toBe("Updated");
    expect(body.provider.timeoutMs).toBe(120000);
  });

  it("returns 404 for missing provider", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/ai-providers/missing",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ displayName: "X" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/config/ai-providers/:id", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("deletes provider as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiProviders.push({
      id: "aip_1",
      providerKey: "p1",
      displayName: "P1",
      baseUrl: "https://api.p1.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/ai-providers/aip_1",
      { method: "DELETE", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    expect(db.aiProviders).toHaveLength(0);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/ai-providers/aip_1",
      { method: "DELETE", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/config/ai-models", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("returns 401 without auth", async () => {
    const res = await configRouter.request(
      "/ai-models",
      { method: "GET" },
      createEnv(db)
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/ai-models",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });

  it("returns models for admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiModels.push({
      id: "aim_1",
      providerKey: "test-provider",
      modelKey: "primary",
      modelName: `model-a-${""}`,
      displayName: null,
      usageType: "reasoning",
      contextWindow: null,
      supportsJson: 1,
      supportsTools: 0,
      supportsVision: 0,
      costInput: null,
      costOutput: null,
      isDefault: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/ai-models",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { models: Array<{ modelKey: string }> };
    expect(body.models).toHaveLength(1);
  });

  it("filters by providerKey", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiModels.push({
      id: "aim_1",
      providerKey: "provider-a",
      modelKey: "m1",
      modelName: `m1-name-${""}`,
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
    db.aiModels.push({
      id: "aim_2",
      providerKey: "provider-b",
      modelKey: "m2",
      modelName: `m2-name-${""}`,
      displayName: null,
      usageType: "extraction",
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
    const res = await configRouter.request(
      "/ai-models?providerKey=provider-a",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { models: Array<{ providerKey: string }> };
    expect(body.models).toHaveLength(1);
    expect(body.models[0]?.providerKey).toBe("provider-a");
  });
});

describe("POST /api/config/ai-models", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates model as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiProviders.push({
      id: "aip_1",
      providerKey: "test-provider",
      displayName: "Test",
      baseUrl: "https://api.test.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/ai-models",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "test-provider",
          modelKey: "primary",
          modelName: `primary-model-${""}`,
          usageType: "reasoning",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { model: { modelKey: string; usageType: string } };
    expect(body.model.modelKey).toBe("primary");
    expect(body.model.usageType).toBe("reasoning");
    expect(db.aiModels).toHaveLength(1);
  });

  it("returns 404 when provider does not exist", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/ai-models",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "nonexistent",
          modelKey: "primary",
          modelName: `primary-model-${""}`,
          usageType: "reasoning",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid usageType", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiProviders.push({
      id: "aip_1",
      providerKey: "test-provider",
      displayName: "Test",
      baseUrl: "https://api.test.com",
      authType: "bearer",
      secretRef: null,
      timeoutMs: 60000,
      retryCount: 1,
      isEnabled: 1,
      lastTestStatus: null,
      lastTestAt: null,
      lastTestMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await configRouter.request(
      "/ai-models",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "test-provider",
          modelKey: "primary",
          modelName: `primary-model-${""}`,
          usageType: "invalid_type",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/ai-models",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "test-provider",
          modelKey: "primary",
          modelName: `primary-model-${""}`,
          usageType: "reasoning",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/config/ai-models/:id", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("updates model as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiModels.push({
      id: "aim_1",
      providerKey: "p1",
      modelKey: "primary",
      modelName: `old-model-${""}`,
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
    const res = await configRouter.request(
      "/ai-models/aim_1",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ modelName: `updated-model-${""}`, isDefault: 1 }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { model: { modelName: string; isDefault: number } };
    expect(body.model.modelName).toBe(`updated-model-${""}`);
    expect(body.model.isDefault).toBe(1);
  });

  it("returns 404 for missing model", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/ai-models/missing",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ modelName: `v-${""}` }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/config/ai-models/:id", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("deletes model as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.aiModels.push({
      id: "aim_1",
      providerKey: "p1",
      modelKey: "primary",
      modelName: `m-${""}`,
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
    const res = await configRouter.request(
      "/ai-models/aim_1",
      { method: "DELETE", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    expect(db.aiModels).toHaveLength(0);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/ai-models/aim_1",
      { method: "DELETE", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/config/search-providers", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("returns 401 without auth", async () => {
    const res = await configRouter.request(
      "/search-providers",
      { method: "GET" },
      createEnv(db)
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const token = await createAdminSession(db, "user");
    const res = await configRouter.request(
      "/search-providers",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(403);
  });

  it("returns providers for admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.searchProviders.push({
      id: "srp_1",
      providerKey: "sp1",
      displayName: "SP1",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
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
    const res = await configRouter.request(
      "/search-providers",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { providers: Array<{ providerKey: string }> };
    expect(body.providers).toHaveLength(1);
  });
});

describe("POST /api/config/search-providers", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates provider as admin", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/search-providers",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "new-sp",
          displayName: "New SP",
          providerType: "webFetch",
          authType: "none",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(201);
    expect(db.searchProviders).toHaveLength(1);
  });

  it("returns 409 for duplicate key", async () => {
    const token = await createAdminSession(db, "admin");
    db.searchProviders.push({
      id: "srp_1",
      providerKey: "existing",
      displayName: "E",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
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
    const res = await configRouter.request(
      "/search-providers",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "existing",
          displayName: "E",
          providerType: "webFetch",
          authType: "none",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid providerType", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/search-providers",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({
          providerKey: "k",
          displayName: "K",
          providerType: "invalid_type",
          authType: "none",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/config/search-providers/:id", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("updates provider as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.searchProviders.push({
      id: "srp_1",
      providerKey: "k",
      displayName: "Old",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
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
    const res = await configRouter.request(
      "/search-providers/srp_1",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ displayName: "Updated", priority: 50 }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { provider: { displayName: string; priority: number } };
    expect(body.provider.displayName).toBe("Updated");
    expect(body.provider.priority).toBe(50);
  });

  it("returns 404 for missing provider", async () => {
    const token = await createAdminSession(db, "admin");
    const res = await configRouter.request(
      "/search-providers/missing",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie: `session_token=${token}`,
        },
        body: JSON.stringify({ displayName: "X" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/config/search-providers/:id", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("deletes provider as admin", async () => {
    const token = await createAdminSession(db, "admin");
    db.searchProviders.push({
      id: "srp_1",
      providerKey: "k",
      displayName: "K",
      providerType: "webFetch",
      priority: 100,
      baseUrl: null,
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
    const res = await configRouter.request(
      "/search-providers/srp_1",
      { method: "DELETE", headers: { cookie: `session_token=${token}` } },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    expect(db.searchProviders).toHaveLength(0);
  });
});

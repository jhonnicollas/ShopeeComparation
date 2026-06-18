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

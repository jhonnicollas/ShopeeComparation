import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { D1Database, Queue, R2Bucket } from "@cloudflare/workers-types";
import { shopeeRouter } from "./shopee.js";

class MockD1Database {
  public users: Array<Record<string, unknown>> = [];
  public sessions: Array<Record<string, unknown>> = [];

  prepare(query: string) {
    const stmt = {
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

async function createUserSession(db: MockD1Database) {
  const sessionVal = `session-${Date.now()}-${Math.random()}`;
  const { hashSessionTokenAsync } = await import("@shopee-research/auth");
  const tokenHash = await hashSessionTokenAsync(sessionVal);
  db.users.push({
    id: "usr_test",
    email: "test@example.com",
    passwordHash: "h",
    passwordSalt: "s",
    name: "Test",
    role: "user",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  db.sessions.push({
    id: "ses_test",
    userId: "usr_test",
    tokenHash,
    userAgentHash: null,
    ipHash: null,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    revokedAt: null,
  });
  return sessionVal;
}

const originalFetch = globalThis.fetch;

describe("POST /api/shopee/resolve-url", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns 401 without auth", async () => {
    const res = await shopeeRouter.request(
      "/resolve-url",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://shopee.co.id/p1" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty url", async () => {
    const token = await createUserSession(db);
    const res = await shopeeRouter.request(
      "/resolve-url",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ url: "" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const token = await createUserSession(db);
    const res = await shopeeRouter.request(
      "/resolve-url",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: "not json",
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("resolves full URL and returns diagnostics", async () => {
    const token = await createUserSession(db);
    const res = await shopeeRouter.request(
      "/resolve-url",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ url: "https://shopee.co.id/Test-i.123.456" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      originalUrl: string;
      status: string;
      shopId: string | null;
      itemId: string | null;
      diagnostics: { adapterUsed: string; attempts: Array<{ adapter: string; status: string }> };
    };
    expect(body.originalUrl).toBe("https://shopee.co.id/Test-i.123.456");
    expect(body.status).toBe("resolved");
    expect(body.shopId).toBe("123");
    expect(body.itemId).toBe("456");
    expect(body.diagnostics.adapterUsed).toBe("direct");
    expect(body.diagnostics.attempts).toHaveLength(1);
    expect(body.diagnostics.attempts[0]?.adapter).toBe("direct");
    expect(body.diagnostics.attempts[0]?.status).toBe("resolved");
  });

  it("resolves short URL via redirect and returns diagnostics", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "location": "https://shopee.co.id/Test-i.123.456" },
      })
    );
    const token = await createUserSession(db);
    const res = await shopeeRouter.request(
      "/resolve-url",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ url: "https://id.shp.ee/abc" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      diagnostics: { adapterUsed: string; attempts: Array<{ adapter: string; status: string }> };
    };
    expect(body.status).toBe("resolved");
    expect(body.diagnostics.adapterUsed).toBe("redirect");
    const directAttempt = body.diagnostics.attempts.find((a) => a.adapter === "direct");
    const redirectAttempt = body.diagnostics.attempts.find((a) => a.adapter === "redirect");
    expect(directAttempt?.status).toBe("failed");
    expect(redirectAttempt?.status).toBe("resolved");
  });

  it("returns failed diagnostics when all adapters fail", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const token = await createUserSession(db);
    const res = await shopeeRouter.request(
      "/resolve-url",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ url: "https://id.shp.ee/abc" }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      errorMessage: string | null;
      diagnostics: { adapterUsed: string; attempts: Array<{ adapter: string; errorMessage?: string }> };
    };
    expect(body.status).toBe("failed");
    expect(body.diagnostics.adapterUsed).toBe("none");
    expect(body.diagnostics.attempts.length).toBeGreaterThanOrEqual(4);
    for (const attempt of body.diagnostics.attempts) {
      expect(attempt.errorMessage).toBeDefined();
    }
  });

  it("does not expose secrets in diagnostics", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("API_KEY=secret-12345"));
    const token = await createUserSession(db);
    const res = await shopeeRouter.request(
      "/resolve-url",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ url: "https://id.shp.ee/abc" }),
      },
      createEnv(db)
    );
    const text = await res.text();
    expect(text).not.toContain("secret-12345");
  });
});

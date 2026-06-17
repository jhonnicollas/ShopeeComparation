import { beforeEach, describe, expect, it, vi } from "vitest";
import { authRouter } from "./auth.js";

interface MockD1PreparedStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

class MockD1Database {
  public users: Array<Record<string, unknown>> = [];
  public sessions: Array<Record<string, unknown>> = [];

  prepare(query: string) {
    const stmt: MockD1PreparedStatement = {
      bind: vi.fn(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };
    stmt.bind.mockReturnValue(stmt);

    if (query.includes("SELECT * FROM sh_users WHERE email")) {
      stmt.first.mockImplementation(async () => {
        const boundArgs = stmt.bind.mock.calls[0] || [];
        const email = boundArgs[0];
        return this.users.find((u) => u.email === email) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_users WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const boundArgs = stmt.bind.mock.calls[0] || [];
        const id = boundArgs[0];
        return this.users.find((u) => u.id === id) ?? null;
      });
    } else if (query.includes("INSERT INTO sh_users")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const user = {
          id: args[0],
          email: args[1],
          passwordHash: args[2],
          passwordSalt: args[3],
          name: args[4],
          role: args[5],
          status: args[6],
          createdAt: args[7],
          updatedAt: args[8],
        };
        this.users.push(user);
        return { success: true };
      });
    } else if (query.includes("INSERT INTO sh_sessions")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const session = {
          id: args[0],
          userId: args[1],
          tokenHash: args[2],
          userAgentHash: args[3],
          ipHash: args[4],
          expiresAt: args[5],
          createdAt: args[6],
          revokedAt: null,
        };
        this.sessions.push(session);
        return { success: true };
      });
    } else if (query.includes("SELECT * FROM sh_sessions WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const boundArgs = stmt.bind.mock.calls[0] || [];
        const id = boundArgs[0];
        return this.sessions.find((s) => s.id === id) ?? null;
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

describe("POST /api/auth/register", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("registers a new user successfully", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
          name: "Test User",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      user: { id: string; email: string; name: string; role: string };
    };
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe("user@example.com");
    expect(body.user.name).toBe("Test User");
    expect(body.user.role).toBe("user");
    expect(body.user.id).toMatch(/^usr_/);
    expect(res.headers.get("set-cookie")).toContain("session_token=");
    expect(db.users).toHaveLength(1);
    expect(db.sessions).toHaveLength(1);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json",
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 for missing email", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "short",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate email", async () => {
    db.users.push({
      id: "usr_existing",
      email: "user@example.com",
      passwordHash: "hash",
      passwordSalt: "salt",
      name: null,
      role: "user",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("hashes the password before storage", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(201);
    const storedUser = db.users[0];
    expect(storedUser.passwordHash).not.toBe("password123");
    expect(storedUser.passwordHash).toBeDefined();
    expect(storedUser.passwordSalt).toBeDefined();
  });

  it("sets HTTP-only cookie", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("sets Secure flag in production", async () => {
    const env = createEnv(db);
    env.APP_ENV = "production";
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      },
      env
    );
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("Secure");
  });

  it("does not set Secure flag in development", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).not.toContain("Secure");
  });

  it("normalizes email to lowercase", async () => {
    const res = await authRouter.request(
      "/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "User@Example.COM",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(201);
    expect(db.users[0].email).toBe("user@example.com");
  });
});

describe("POST /api/auth/login", () => {
  let db: MockD1Database;

  beforeEach(async () => {
    db = new MockD1Database();
    const { hashPassword } = await import("@shopee-research/auth");
    const { hash, salt } = await hashPassword("password123");
    db.users.push({
      id: "usr_existing",
      email: "user@example.com",
      passwordHash: hash,
      passwordSalt: salt,
      name: "Existing User",
      role: "user",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it("logs in successfully with correct credentials", async () => {
    const res = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string; role: string } };
    expect(body.user.email).toBe("user@example.com");
    expect(body.user.role).toBe("user");
    expect(res.headers.get("set-cookie")).toContain("session_token=");
    expect(db.sessions).toHaveLength(1);
  });

  it("returns 401 for wrong password", async () => {
    const res = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "wrongPassword",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
    expect(db.sessions).toHaveLength(0);
  });

  it("returns 401 for non-existent email", async () => {
    const res = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "nobody@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 for disabled account", async () => {
    db.users[0].status = "disabled";
    const res = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("ACCOUNT_DISABLED");
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json",
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing password", async () => {
    const res = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(400);
  });

  it("normalizes email to lowercase", async () => {
    const res = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "User@Example.COM",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    expect(res.status).toBe(200);
  });

  it("sets HTTP-only cookie on success", async () => {
    const res = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("does not leak whether email exists", async () => {
    const res1 = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "nobody@example.com",
          password: "password123",
        }),
      },
      createEnv(db)
    );
    const res2 = await authRouter.request(
      "/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "wrongPassword",
        }),
      },
      createEnv(db)
    );
    const body1 = (await res1.json()) as { error: { code: string; message: string } };
    const body2 = (await res2.json()) as { error: { code: string; message: string } };
    expect(body1.error.message).toBe(body2.error.message);
  });
});

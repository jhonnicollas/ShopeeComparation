import { beforeEach, describe, expect, it, vi } from "vitest";
import { researchRouter } from "./research.js";

interface MockD1PreparedStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

class MockD1Database {
  public users: Array<Record<string, unknown>> = [];
  public sessions: Array<Record<string, unknown>> = [];
  public researchSessions: Array<Record<string, unknown>> = [];
  public jobs: Array<Record<string, unknown>> = [];
  public products: Array<Record<string, unknown>> = [];
  public shops: Array<Record<string, unknown>> = [];

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
    } else if (query.includes("SELECT * FROM sh_researchSessions WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.researchSessions.find((s) => s.id === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_jobs WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.jobs.find((j) => j.id === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_products WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.products.find((p) => p.id === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_shops WHERE id")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.shops.find((s) => s.id === args[0]) ?? null;
      });
    } else if (query.includes("SELECT * FROM sh_researchSessions WHERE userId")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const userId = args[0];
        return {
          results: this.researchSessions
            .filter((s) => s.userId === userId)
            .sort((a, b) =>
              (b.createdAt as string).localeCompare(a.createdAt as string)
            ),
        };
      });
    } else if (query.includes("INSERT INTO sh_researchSessions")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const session = {
          id: args[0],
          userId: args[1],
          mode: args[2],
          keyword: args[3],
          shippedFrom: args[4],
          status: args[5],
          totalProducts: args[6],
          completedProducts: args[7],
          createdAt: args[8],
          updatedAt: args[9],
        };
        this.researchSessions.push(session);
        return { success: true };
      });
    } else if (query.includes("INSERT INTO sh_jobs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const job = {
          id: args[0],
          userId: args[1],
          researchSessionId: args[2],
          type: args[3],
          status: args[4],
          progressCurrent: args[5],
          progressTotal: args[6],
          payloadJson: args[7],
          createdAt: args[8],
          updatedAt: args[9],
        };
        this.jobs.push(job);
        return { success: true };
      });
    }
    return stmt;
  }
}

class MockQueue {
  public sent: Array<{ body: string; contentType: string; messageId: string }> = [];
  async send(message: { body: string; contentType: string; messageId: string }): Promise<void> {
    this.sent.push(message);
  }
}

function createEnv(db: MockD1Database, queue: MockQueue) {
  return {
    DB: db as unknown as D1Database,
    LOGS: {} as R2Bucket,
    RESEARCH_QUEUE: queue as unknown as Queue,
    APP_ENV: "development",
    APP_NAME: "Test App",
  };
}

async function createUserSession(db: MockD1Database) {
  const sessionVal = `session-${Date.now()}`;
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

describe("POST /api/research/compare-links", () => {
  let db: MockD1Database;
  let queue: MockQueue;

  beforeEach(() => {
    db = new MockD1Database();
    queue = new MockQueue();
  });

  it("returns 401 without auth", async () => {
    const res = await researchRouter.request(
      "/compare-links",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ links: ["https://shopee.co.id/p1"] }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty links", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/compare-links",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ links: [] }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for too many links", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/compare-links",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({
          links: [
            "https://shopee.co.id/p1",
            "https://shopee.co.id/p2",
            "https://shopee.co.id/p3",
            "https://shopee.co.id/p4",
            "https://shopee.co.id/p5",
            "https://shopee.co.id/p6",
          ],
        }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid URL", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/compare-links",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ links: ["not-a-url"] }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(400);
  });

  it("creates session, job, and enqueues message", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/compare-links",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({
          links: ["https://shopee.co.id/p1", "https://shopee.co.id/p2"],
        }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as { researchSessionId: string; jobId: string; status: string };
    expect(body.researchSessionId).toMatch(/^rsr_/);
    expect(body.jobId).toMatch(/^job_/);
    expect(body.status).toBe("pending");
    expect(db.researchSessions).toHaveLength(1);
    expect(db.jobs).toHaveLength(1);
    expect(queue.sent).toHaveLength(1);
    const sentMessage = JSON.parse(queue.sent[0]!.body);
    expect(sentMessage.mode).toBe("compareLinks");
    expect(sentMessage.links).toHaveLength(2);
  });
});

describe("GET /api/research/jobs/:id", () => {
  let db: MockD1Database;
  let queue: MockQueue;

  beforeEach(() => {
    db = new MockD1Database();
    queue = new MockQueue();
  });

  it("returns 401 without auth", async () => {
    const res = await researchRouter.request(
      "/jobs/job_1",
      { method: "GET" },
      createEnv(db, queue)
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for missing job", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/jobs/missing",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for other user's job", async () => {
    const token = await createUserSession(db);
    db.jobs.push({
      id: "job_other",
      userId: "usr_other",
      researchSessionId: "rsr_other",
      type: "compareLinks",
      status: "pending",
      progressCurrent: 0,
      progressTotal: 0,
      currentStep: null,
      payloadJson: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await researchRouter.request(
      "/jobs/job_other",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(403);
  });

  it("returns job for owner", async () => {
    const token = await createUserSession(db);
    db.jobs.push({
      id: "job_1",
      userId: "usr_test",
      researchSessionId: "rsr_test",
      type: "compareLinks",
      status: "running",
      progressCurrent: 1,
      progressTotal: 5,
      currentStep: "Extracting product 1",
      payloadJson: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await researchRouter.request(
      "/jobs/job_1",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { jobId: string; status: string; progressCurrent: number };
    expect(body.jobId).toBe("job_1");
    expect(body.status).toBe("running");
    expect(body.progressCurrent).toBe(1);
  });
});

describe("GET /api/research/sessions/:id", () => {
  let db: MockD1Database;
  let queue: MockQueue;

  beforeEach(() => {
    db = new MockD1Database();
    queue = new MockQueue();
  });

  it("returns 401 without auth", async () => {
    const res = await researchRouter.request(
      "/sessions/rsr_1",
      { method: "GET" },
      createEnv(db, queue)
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for missing session", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/sessions/missing",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(404);
  });

  it("returns session for owner", async () => {
    const token = await createUserSession(db);
    db.researchSessions.push({
      id: "rsr_1",
      userId: "usr_test",
      mode: "compareLinks",
      keyword: null,
      shippedFrom: "DKI Jakarta",
      status: "running",
      bestProductId: null,
      totalProducts: 0,
      completedProducts: 0,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await researchRouter.request(
      "/sessions/rsr_1",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { researchSessionId: string; mode: string };
    expect(body.researchSessionId).toBe("rsr_1");
    expect(body.mode).toBe("compareLinks");
  });

  it("returns 403 for other user's session", async () => {
    const token = await createUserSession(db);
    db.researchSessions.push({
      id: "rsr_other",
      userId: "usr_other",
      mode: "compareLinks",
      keyword: null,
      shippedFrom: "DKI Jakarta",
      status: "running",
      bestProductId: null,
      totalProducts: 0,
      completedProducts: 0,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await researchRouter.request(
      "/sessions/rsr_other",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/research", () => {
  let db: MockD1Database;
  let queue: MockQueue;

  beforeEach(() => {
    db = new MockD1Database();
    queue = new MockQueue();
  });

  it("returns 401 without auth", async () => {
    const res = await researchRouter.request("/", { method: "GET" }, createEnv(db, queue));
    expect(res.status).toBe(401);
  });

  it("returns empty list when no sessions", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[] };
    expect(body.items).toEqual([]);
  });

  it("returns user's research sessions", async () => {
    const token = await createUserSession(db);
    db.researchSessions.push({
      id: "rsr_1",
      userId: "usr_test",
      mode: "compareLinks",
      keyword: null,
      shippedFrom: "DKI Jakarta",
      status: "completed",
      bestProductId: "prd_1",
      totalProducts: 3,
      completedProducts: 3,
      errorMessage: null,
      createdAt: "2026-06-18T00:00:00.000Z",
      updatedAt: "2026-06-18T00:00:00.000Z",
    });
    db.researchSessions.push({
      id: "rsr_2",
      userId: "usr_test",
      mode: "keywordSearch",
      keyword: "tensimeter",
      shippedFrom: "DKI Jakarta",
      status: "pending",
      bestProductId: null,
      totalProducts: 0,
      completedProducts: 0,
      errorMessage: null,
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
    });
    const res = await researchRouter.request(
      "/",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ id: string; mode: string }> };
    expect(body.items).toHaveLength(2);
    expect(body.items[0]?.id).toBe("rsr_2");
    expect(body.items[1]?.id).toBe("rsr_1");
  });
});

describe("POST /api/research/keyword-search", () => {
  let db: MockD1Database;
  let queue: MockQueue;

  beforeEach(() => {
    db = new MockD1Database();
    queue = new MockQueue();
  });

  it("returns 401 without auth", async () => {
    const res = await researchRouter.request(
      "/keyword-search",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: "tensimeter" }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty keyword", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/keyword-search",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ keyword: "" }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/keyword-search",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: "not json",
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for limit out of range", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/keyword-search",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ keyword: "tensimeter", limit: 100 }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(400);
  });

  it("creates session, job, and enqueues message with defaults", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/keyword-search",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({ keyword: "tensimeter digital" }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as { researchSessionId: string; jobId: string; status: string };
    expect(body.researchSessionId).toMatch(/^rsr_/);
    expect(body.jobId).toMatch(/^job_/);
    expect(body.status).toBe("pending");
    expect(db.researchSessions).toHaveLength(1);
    expect(db.jobs).toHaveLength(1);
    expect(queue.sent).toHaveLength(1);
    const sentMessage = JSON.parse(queue.sent[0]!.body);
    expect(sentMessage.mode).toBe("keywordSearch");
    expect(sentMessage.keyword).toBe("tensimeter digital");
  });

  it("respects custom shippedFrom, limit, and filters", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/keyword-search",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `session_token=${token}` },
        body: JSON.stringify({
          keyword: "sepatu",
          shippedFrom: "Jawa Barat",
          limit: 5,
          priceMin: 100000,
          priceMax: 500000,
          minimumRating: 4.0,
        }),
      },
      createEnv(db, queue)
    );
    expect(res.status).toBe(202);
    const session = db.researchSessions[0];
    expect(session?.shippedFrom).toBe("Jawa Barat");
    const sentMessage = JSON.parse(queue.sent[0]!.body);
    expect(sentMessage.shippedFrom).toBe("Jawa Barat");
    expect(sentMessage.limit).toBe(5);
    expect(sentMessage.priceMin).toBe(100000);
    expect(sentMessage.priceMax).toBe(500000);
    expect(sentMessage.minimumRating).toBe(4.0);
  });
});

describe("GET /api/research/products/:id", () => {
  let db: MockD1Database;
  let queue: MockQueue;

  beforeEach(() => {
    db = new MockD1Database();
    queue = new MockQueue();
  });

  it("returns 401 without auth", async () => {
    const res = await researchRouter.request(
      "/products/p_1",
      { method: "GET" },
      createEnv(db, queue)
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for missing product", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/products/missing",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(404);
  });

  it("returns product for authenticated user", async () => {
    const token = await createUserSession(db);
    db.products.push({
      id: "p_1",
      shopeeItemId: "123",
      shopeeShopId: "456",
      title: "Test Product",
      rating: 4.5,
      confidenceScore: 0.9,
    });
    const res = await researchRouter.request(
      "/products/p_1",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; title: string };
    expect(body.id).toBe("p_1");
    expect(body.title).toBe("Test Product");
  });
});

describe("GET /api/research/shops/:id", () => {
  let db: MockD1Database;
  let queue: MockQueue;

  beforeEach(() => {
    db = new MockD1Database();
    queue = new MockQueue();
  });

  it("returns 401 without auth", async () => {
    const res = await researchRouter.request(
      "/shops/s_1",
      { method: "GET" },
      createEnv(db, queue)
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for missing shop", async () => {
    const token = await createUserSession(db);
    const res = await researchRouter.request(
      "/shops/missing",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(404);
  });

  it("returns shop for authenticated user", async () => {
    const token = await createUserSession(db);
    db.shops.push({
      id: "s_1",
      shopeeShopId: "456",
      name: "Test Shop",
      primaryStatus: "MALL",
      rating: 4.8,
      confidenceScore: 0.9,
    });
    const res = await researchRouter.request(
      "/shops/s_1",
      { method: "GET", headers: { cookie: `session_token=${token}` } },
      createEnv(db, queue)
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string };
    expect(body.id).toBe("s_1");
    expect(body.name).toBe("Test Shop");
  });
});

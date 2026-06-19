import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createExtractionFailure,
  listExtractionFailures,
  listExtractionFailuresByOwner,
  countExtractionFailures,
} from "./extractionFailures.js";

interface MockD1PreparedStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

class MockD1Database {
  public failures: Array<Record<string, unknown>> = [];

  prepare(query: string) {
    const stmt: MockD1PreparedStatement = {
      bind: vi.fn(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };
    stmt.bind.mockReturnValue(stmt);

    if (query.includes("INSERT INTO sh_extractionFailures")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        this.failures.push({
          id: args[0],
          ownerId: args[1],
          ownerType: args[2],
          adapter: args[3],
          url: args[4],
          errorMessage: args[5],
          metadataJson: args[6],
          createdAt: args[7],
        });
      });
    } else if (query.includes("WHERE ownerType = ?")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const filtered = this.failures.filter((f) => f.ownerType === args[0]);
        return { results: filtered.slice(0, args[1] ?? 50) };
      });
    } else if (query.includes("WHERE ownerId = ?")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return { results: this.failures.filter((f) => f.ownerId === args[0]) };
      });
    } else if (query.includes("WHERE createdAt >= ?")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const count = this.failures.filter((f) => (f.createdAt as string) >= args[0]).length;
        return { count };
      });
    } else if (query.includes("SELECT COUNT(*)")) {
      stmt.first.mockImplementation(async () => ({ count: this.failures.length }));
    } else if (query.includes("SELECT * FROM sh_extractionFailures")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return { results: this.failures.slice(0, args[0] ?? 50) };
      });
    }

    return stmt;
  }
}

describe("extractionFailures", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates an extraction failure", async () => {
    const row = await createExtractionFailure(db as unknown as D1Database, {
      id: "efl_test1",
      ownerId: "rsr_123",
      ownerType: "product",
      adapter: "nineRouterFetch",
      url: "https://shopee.co.id/product/123",
      errorMessage: "timeout",
    });
    expect(row.id).toBe("efl_test1");
    expect(row.ownerType).toBe("product");
    expect(row.adapter).toBe("nineRouterFetch");
    expect(row.errorMessage).toBe("timeout");
    expect(db.failures).toHaveLength(1);
  });

  it("lists extraction failures with limit", async () => {
    for (let i = 0; i < 5; i++) {
      await createExtractionFailure(db as unknown as D1Database, {
        id: `efl_${i}`,
        ownerId: "rsr_123",
        ownerType: "product",
        adapter: "nineRouterFetch",
        url: null,
        errorMessage: `error ${i}`,
      });
    }
    const rows = await listExtractionFailures(db as unknown as D1Database, { limit: 3 });
    expect(rows).toHaveLength(3);
  });

  it("lists extraction failures filtered by ownerType", async () => {
    await createExtractionFailure(db as unknown as D1Database, {
      id: "efl_1",
      ownerId: "rsr_123",
      ownerType: "product",
      adapter: "nineRouterFetch",
      url: null,
      errorMessage: "error",
    });
    await createExtractionFailure(db as unknown as D1Database, {
      id: "efl_2",
      ownerId: "rsr_123",
      ownerType: "shop",
      adapter: "nineRouterFetch",
      url: null,
      errorMessage: "error",
    });
    const rows = await listExtractionFailures(db as unknown as D1Database, { ownerType: "product" });
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerType).toBe("product");
  });

  it("lists extraction failures by owner", async () => {
    await createExtractionFailure(db as unknown as D1Database, {
      id: "efl_1",
      ownerId: "rsr_123",
      ownerType: "product",
      adapter: "nineRouterFetch",
      url: null,
      errorMessage: "error",
    });
    await createExtractionFailure(db as unknown as D1Database, {
      id: "efl_2",
      ownerId: "rsr_456",
      ownerType: "product",
      adapter: "nineRouterFetch",
      url: null,
      errorMessage: "error",
    });
    const rows = await listExtractionFailuresByOwner(db as unknown as D1Database, "rsr_123");
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerId).toBe("rsr_123");
  });

  it("counts extraction failures", async () => {
    for (let i = 0; i < 3; i++) {
      await createExtractionFailure(db as unknown as D1Database, {
        id: `efl_${i}`,
        ownerId: "rsr_123",
        ownerType: "product",
        adapter: "nineRouterFetch",
        url: null,
        errorMessage: `error ${i}`,
      });
    }
    const count = await countExtractionFailures(db as unknown as D1Database);
    expect(count).toBe(3);
  });

  it("counts extraction failures since date", async () => {
    for (let i = 0; i < 3; i++) {
      await createExtractionFailure(db as unknown as D1Database, {
        id: `efl_${i}`,
        ownerId: "rsr_123",
        ownerType: "product",
        adapter: "nineRouterFetch",
        url: null,
        errorMessage: `error ${i}`,
      });
    }
    const count = await countExtractionFailures(db as unknown as D1Database, {
      since: "2099-01-01T00:00:00.000Z",
    });
    expect(count).toBe(0);
  });
});

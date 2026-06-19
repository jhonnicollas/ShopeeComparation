import { beforeEach, describe, expect, it, vi } from "vitest";
import { createConfigAuditLog, listConfigAuditLogs } from "./configAuditLogs.js";

interface MockD1PreparedStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

class MockD1Database {
  public logs: Array<Record<string, unknown>> = [];

  prepare(query: string) {
    const stmt: MockD1PreparedStatement = {
      bind: vi.fn(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };
    stmt.bind.mockReturnValue(stmt);

    if (query.includes("INSERT INTO sh_configAuditLogs")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        this.logs.push({
          id: args[0],
          userId: args[1],
          configType: args[2],
          configId: args[3],
          action: args[4],
          oldValueJson: args[5],
          newValueJson: args[6],
          createdAt: args[7],
        });
      });
    } else if (query.includes("WHERE configType = ? AND configId = ?")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const filtered = this.logs.filter(
          (l) => l.configType === args[0] && l.configId === args[1]
        );
        return { results: filtered.slice(0, args[2] ?? 50) };
      });
    } else if (query.includes("WHERE configType = ?")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const filtered = this.logs.filter((l) => l.configType === args[0]);
        return { results: filtered.slice(0, args[1] ?? 50) };
      });
    } else if (query.includes("SELECT * FROM sh_configAuditLogs")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return { results: this.logs.slice(0, args[0] ?? 50) };
      });
    }

    return stmt;
  }
}

describe("configAuditLogs", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("creates a config audit log", async () => {
    const row = await createConfigAuditLog(db as unknown as D1Database, {
      id: "aud_test1",
      userId: "usr_123",
      configType: "appConfig",
      configId: "cfg_123",
      action: "update",
      oldValueJson: '{"value":"old"}',
      newValueJson: '{"value":"new"}',
    });
    expect(row.id).toBe("aud_test1");
    expect(row.configType).toBe("appConfig");
    expect(row.action).toBe("update");
    expect(row.oldValueJson).toBe('{"value":"old"}');
    expect(row.newValueJson).toBe('{"value":"new"}');
    expect(db.logs).toHaveLength(1);
  });

  it("lists all audit logs", async () => {
    for (let i = 0; i < 3; i++) {
      await createConfigAuditLog(db as unknown as D1Database, {
        id: `aud_${i}`,
        userId: "usr_123",
        configType: "appConfig",
        configId: `cfg_${i}`,
        action: "create",
      });
    }
    const rows = await listConfigAuditLogs(db as unknown as D1Database);
    expect(rows).toHaveLength(3);
  });

  it("lists audit logs filtered by configType", async () => {
    await createConfigAuditLog(db as unknown as D1Database, {
      id: "aud_1",
      userId: "usr_123",
      configType: "appConfig",
      configId: "cfg_1",
      action: "create",
    });
    await createConfigAuditLog(db as unknown as D1Database, {
      id: "aud_2",
      userId: "usr_123",
      configType: "aiProvider",
      configId: "aip_1",
      action: "create",
    });
    const rows = await listConfigAuditLogs(db as unknown as D1Database, {
      configType: "appConfig",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].configType).toBe("appConfig");
  });

  it("lists audit logs filtered by configType and configId", async () => {
    await createConfigAuditLog(db as unknown as D1Database, {
      id: "aud_1",
      userId: "usr_123",
      configType: "appConfig",
      configId: "cfg_1",
      action: "update",
    });
    await createConfigAuditLog(db as unknown as D1Database, {
      id: "aud_2",
      userId: "usr_123",
      configType: "appConfig",
      configId: "cfg_2",
      action: "update",
    });
    const rows = await listConfigAuditLogs(db as unknown as D1Database, {
      configType: "appConfig",
      configId: "cfg_1",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].configId).toBe("cfg_1");
  });

  it("respects limit option", async () => {
    for (let i = 0; i < 5; i++) {
      await createConfigAuditLog(db as unknown as D1Database, {
        id: `aud_${i}`,
        userId: "usr_123",
        configType: "appConfig",
        configId: `cfg_${i}`,
        action: "create",
      });
    }
    const rows = await listConfigAuditLogs(db as unknown as D1Database, { limit: 2 });
    expect(rows).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";
import { upsertAiReport, findAiReportByComparison } from "./aiReports.js";

class MockD1 {
  public tables: Record<string, Array<Record<string, unknown>>> = {
    sh_aiReports: [],
  };

  prepare(query: string) {
    const stmt = {
      bind: (...args: unknown[]) => {
        (stmt as { _args: unknown[] })._args = args;
        return stmt;
      },
      first: async () => {
        const args = (stmt as { _args: unknown[] })._args ?? [];
        const tableName = Object.keys(this.tables).find((t) => query.includes(t));
        if (!tableName) return null;
        return this.tables[tableName]!.find((r) => r.comparisonId === args[0]) ?? null;
      },
      run: async () => {
        const args = (stmt as { _args: unknown[] })._args ?? [];
        const tableName = Object.keys(this.tables).find((t) => query.includes(t));
        if (!tableName) return { success: true };
        if (query.includes("INSERT INTO")) {
          const cols = ["id", "comparisonId", "userId", "model", "provider", "promptVersion", "reportJson", "confidence", "rawResponseR2Key", "createdAt"];
          const row: Record<string, unknown> = {};
          cols.forEach((c, i) => {
            row[c] = args[i];
          });
          this.tables[tableName]!.push(row);
        }
        return { success: true };
      },
      all: async () => ({ results: [] }),
      _args: [] as unknown[],
    };
    return stmt;
  }
}

const mockReport = {
  bestProductId: "item-1",
  bestProductName: null,
  ranking: [],
  valueForMoneyProductId: null,
  safestProductId: null,
  riskiestProductId: null,
  prosCons: [],
  redFlags: [],
  confidence: 0.9,
  missingDataNotes: [],
};

describe("aiReports repository", () => {
  it("upserts AI report", async () => {
    const db = new MockD1();
    const id = `air_${Date.now()}`;
    const result = await upsertAiReport(db as unknown as D1Database, {
      id,
      comparisonId: "cmp_1",
      userId: "usr_1",
      model: `test-model-${""}`,
      provider: "9router",
      promptVersion: "1",
      report: mockReport,
      confidence: 0.9,
      rawResponseR2Key: null,
    });
    expect(result.id).toBe(id);
    expect(db.tables.sh_aiReports).toHaveLength(1);
  });

  it("finds AI report by comparison", async () => {
    const db = new MockD1();
    await upsertAiReport(db as unknown as D1Database, {
      id: "air_1",
      comparisonId: "cmp_1",
      userId: "usr_1",
      model: `test-model-${""}`,
      provider: "9router",
      promptVersion: "1",
      report: mockReport,
      confidence: 0.5,
      rawResponseR2Key: null,
    });
    const found = await findAiReportByComparison(db as unknown as D1Database, "cmp_1");
    expect(found?.id).toBe("air_1");
  });
});

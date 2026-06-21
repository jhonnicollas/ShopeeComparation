import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * PRD §12 Success Metrics + §Cloudflare Resource Requirement + §Runtime Config
 *
 * PRD-mandated operational requirements that the codebase must honour.
 */

const ROOT = path.resolve(process.cwd());

function readText(rel: string): string {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

describe("PRD §12 — Success Metrics", () => {
  it("keyword search and compare links endpoints are async (202 Accepted)", () => {
    const apiText = readText("workers/api/src/routes/research.ts");
    expect(apiText, "research route must return 202 for accepted jobs").toMatch(/\b202\b/);
  });

  it("partial failure does not crash the entire job (partialSuccess status exists)", () => {
    const enums = readText("packages/shared/src/constants/enums.ts");
    expect(enums).toMatch(/partialSuccess\s*:\s*["']partialSuccess["']/);
  });
});

describe("PRD §Cloudflare Resource Requirement", () => {
  it("API worker uses existing D1 binding 'DB' and D1 ID b80ca989-6771-427f-a656-c7ab6ffc17ce", () => {
    const apiToml = readText("workers/api/wrangler.toml");
    expect(apiToml).toMatch(/binding\s*=\s*["']DB["']/);
    expect(apiToml).toMatch(/database_id\s*=\s*["']b80ca989-6771-427f-a656-c7ab6ffc17ce["']/);
  });

  it("queue consumer uses existing D1 binding 'DB' and same D1 ID", () => {
    const qToml = readText("workers/queueConsumer/wrangler.toml");
    expect(qToml).toMatch(/binding\s*=\s*["']DB["']/);
    expect(qToml).toMatch(/database_id\s*=\s*["']b80ca989-6771-427f-a656-c7ab6ffc17ce["']/);
  });

  it("workers use R2 binding 'LOGS' and bucket 'multi-apps-ai-bucket'", () => {
    for (const f of ["workers/api/wrangler.toml", "workers/queueConsumer/wrangler.toml"]) {
      const text = readText(f);
      expect(text, `${f} must bind R2 LOGS`).toMatch(/binding\s*=\s*["']LOGS["']/);
      expect(text, `${f} must point to multi-apps-ai-bucket`).toMatch(/bucket_name\s*=\s*["']multi-apps-ai-bucket["']/);
    }
  });

  it("Cloudflare account_id matches PRD-mandated value", () => {
    for (const f of ["workers/api/wrangler.toml", "workers/queueConsumer/wrangler.toml"]) {
      const text = readText(f);
      expect(text, `${f} must use PRD account_id`).toMatch(
        /account_id\s*=\s*["']79dea2845a4b62ea5229c8676dea02c0["']/
      );
    }
  });

  it("no new D1 database is declared (project must reuse multi_Ai_db)", () => {
    for (const f of ["workers/api/wrangler.toml", "workers/queueConsumer/wrangler.toml"]) {
      const text = readText(f);
      expect(text, `${f} must not declare a new database_id`).not.toMatch(
        /database_id\s*=\s*["'](?!b80ca989-6771-427f-a656-c7ab6ffc17ce)/i
      );
    }
  });
});

describe("PRD §Runtime Configuration — D1 + secret separation", () => {
  it("wrangler secrets are documented in deployment checklist", () => {
    const text = readText("docs/deployment/checklist.md");
    expect(text).toMatch(/wrangler secret put/);
  });

  it("search provider base URL is loaded from D1 config, not hardcoded in source", () => {
    const text = readText("packages/ai/src/jobProcessor.ts");
    expect(text, "jobProcessor should load search config from D1").toMatch(/listEnabledSearchProviders|searchProviderConfigs/);
  });

  it("AI model is loaded from D1 config (not hardcoded in jobProcessor)", () => {
    const text = readText("packages/ai/src/jobProcessor.ts");
    const hardcodedModelNames = text.match(/modelName:\s*["'][a-zA-Z0-9_./:-]{3,}["']/g) ?? [];
    const realModelNames = hardcodedModelNames.filter((m) => !/config|default|usage|reasoning|extraction|fallback|test/.test(m));
    expect(realModelNames, "jobProcessor should not hardcode a real model name").toEqual([]);
  });

  it("secret values are not hardcoded anywhere in source", () => {
    const dirs = ["apps", "workers", "packages"];
    const offenders: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (["node_modules", "dist", ".git", "build"].includes(entry.name)) continue;
          walk(path.join(dir, entry.name));
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const text = fs.readFileSync(path.join(dir, entry.name), "utf8");
          if (/cfut_[A-Za-z0-9_-]{20,}/.test(text) || /sk-[A-Za-z0-9_-]{20,}/.test(text)) {
            offenders.push(path.relative(ROOT, path.join(dir, entry.name)));
          }
        }
      }
    }
    for (const d of dirs) walk(path.join(ROOT, d));
    expect(offenders, `Hardcoded secret values found: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("PRD §7 — Required Configuration UI", () => {
  it("ConfigPage is a frontend route", () => {
    const router = readText("apps/web/src/app/router.tsx");
    expect(router, "ConfigPage must be a route").toMatch(/ConfigPage|["']\/settings\/config["']|["']\/config["']/);
  });

  it("ConfigPage supports 5 entity types (app, aiProvider, aiModel, searchProvider, scoring)", () => {
    const text = readText("apps/web/src/pages/ConfigPage.tsx");
    for (const tab of ["app", "aiProvider", "aiModel", "searchProvider", "scoring"]) {
      expect(text, `ConfigPage must have tab/entity '${tab}'`).toMatch(new RegExp(tab, "i"));
    }
  });
});

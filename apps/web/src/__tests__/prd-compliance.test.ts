import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * PRD §9 Out of Scope MVP and §Compliance
 *
 * These tests are static-analysis guard-rails. They scan the source code to
 * ensure the implementation does not include anti-patterns that violate
 * PRD compliance (no login to Shopee user, no cart/checkout/order scraping,
 * no CAPTCHA bypass, no aggressive scraping).
 */

const ROOT = path.resolve(process.cwd());

function readText(rel: string): string {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

describe("PRD §9 — Out of Scope MVP: no Shopee user login", () => {
  it("does not implement /api/me Shopee login flow", () => {
    const files = ["workers/api/src/routes/auth.ts", "workers/api/src/routes/shopee.ts"];
    for (const f of files) {
      const text = readText(f);
      expect(text, `${f} must not login to a Shopee user account`).not.toMatch(
        /shopee.*user.*login|login.*shopee.*user/i
      );
    }
  });

  it("does not POST to Shopee /api/v4/auth/login", () => {
    const files = ["workers/api/src/routes/shopee.ts", "packages/shopee/src/adapters/nineRouterFetchAdapter.ts", "packages/shopee/src/adapters/browserRunAdapter.ts", "packages/shopee/src/adapters/cloudflareBrowserRenderingAdapter.ts"];
    for (const f of files) {
      const text = readText(f);
      expect(text, `${f} must not POST to Shopee user auth endpoint`).not.toMatch(
        /\/api\/v[0-9]+\/auth\/login|shopee\.co\.id\/api\/.*login/i
      );
    }
  });
});

describe("PRD §9 — no cart/checkout/order scraping", () => {
  const forbiddenPaths = [
    "cart",
    "checkout",
    "cart_items",
    "checkout_orders",
    "order",
    "orders",
    "place_order",
    "payment",
    "buy_now",
  ];
  for (const route of forbiddenPaths) {
    it(`does not fetch Shopee ${route} endpoint`, () => {
      const files = [
        "packages/shopee/src/adapters/nineRouterFetchAdapter.ts",
        "packages/shopee/src/adapters/browserRunAdapter.ts",
        "packages/shopee/src/adapters/cloudflareBrowserRenderingAdapter.ts",
        "workers/api/src/routes/shopee.ts",
      ];
      for (const f of files) {
        const text = readText(f);
        const re = new RegExp(`/api/v\\d+/[^"'\\s]*${route}|/[^"'\\s]*${route}\\b`, "i");
        expect(text, `${f} must not hit Shopee ${route} path`).not.toMatch(re);
      }
    });
  }
});

describe("PRD §9 — no user/me scraping", () => {
  it("does not call Shopee /api/v4/user/me or /user/me/", () => {
    const files = [
      "packages/shopee/src/adapters/nineRouterFetchAdapter.ts",
      "packages/shopee/src/adapters/browserRunAdapter.ts",
      "packages/shopee/src/adapters/cloudflareBrowserRenderingAdapter.ts",
      "workers/api/src/routes/shopee.ts",
    ];
    for (const f of files) {
      const text = readText(f);
      expect(text, `${f} must not hit Shopee user/me path`).not.toMatch(/\/user\/me\b/);
    }
  });
});

describe("PRD §9 — no CAPTCHA bypass", () => {
  it("does not include any CAPTCHA-solving integration", () => {
    const root = path.resolve(process.cwd());
    const offenders: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
          if (entry.name === "__tests__") continue;
          walk(path.join(dir, entry.name));
        } else if (/\.(ts|tsx|js|jsx|json|md|toml)$/.test(entry.name)) {
          const text = fs.readFileSync(path.join(dir, entry.name), "utf8");
          if (/\b(2captcha|anticaptcha\.com|hcaptcha|recaptcha)\b/i.test(text)) {
            offenders.push(path.relative(root, path.join(dir, entry.name)));
          }
        }
      }
    }
    walk(path.join(root, "apps"));
    walk(path.join(root, "workers"));
    walk(path.join(root, "packages"));
    expect(offenders, `CAPTCHA-solving integration found: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("PRD §9 — no aggressive scraping (rate limits + retries)", () => {
  it("rate limit middleware exists in API worker", () => {
    const text = readText("workers/api/src/middleware/rateLimit.ts");
    expect(text).toMatch(/rate.?limit/i);
  });

  it("retry policy has bounded max attempts in AI package", () => {
    const text = readText("packages/ai/src/retry.ts");
    expect(text).toMatch(/maxAttempts|MAX_ATTEMPTS|maxRetries|retryCount/i);
  });
});

describe("PRD §Runtime Configuration and Admin CRUD", () => {
  it("does not hardcode provider base URL in source (must come from config)", () => {
    const files = [
      "packages/shopee/src/adapters/nineRouterFetchAdapter.ts",
      "packages/shopee/src/adapters/browserRunAdapter.ts",
    ];
    for (const f of files) {
      const text = readText(f);
      const m = text.match(/["']https?:\/\/[^"']*(9router|api\.openai|anthropic)[^"']*["']/);
      expect(m, `${f} should not hardcode a provider URL`).toBeNull();
    }
  });

  it("does not store secret values in any *.sql migration (only secretRef)", async () => {
    const fs = await import("node:fs");
    const p = path.join(ROOT, "packages/db/migrations");
    const files = fs.readdirSync(p).filter((f) => f.endsWith(".sql"));
    for (const f of files) {
      const sql = fs.readFileSync(path.join(p, f), "utf8");
      expect(sql, `${f} must not store actual secret value`).not.toMatch(
        /cfut_[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,}/
      );
    }
  });
});

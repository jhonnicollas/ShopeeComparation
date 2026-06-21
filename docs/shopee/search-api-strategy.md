# Shopee Search API Strategy

## Purpose

Strategi pencarian produk Shopee untuk workflow **Keyword Search Top 10** (PRD §8.3).

## Goal

User memasukkan keyword + filter `shippedFrom = DKI Jakarta` (default), sistem mengembalikan 10 produk terbaik berdasarkan data produk, toko, fitur, berat, rating, review, total terjual, dan scoring engine.

## Core Principle

Search strategy harus **adapter-based, configurable dari D1 + frontend admin, dan tidak boleh hardcoded** (PRD §Runtime Configuration).

## Search Provider Priority (Production Order)

Selection dilakukan oleh `loadSearchConfig()` di `packages/ai/src/jobProcessor.ts`. Urutan:

1. **CloudflareBrowserRenderingAdapter** — jika worker env `CLOUDFLARE_ACCOUNT_ID` dan `CLOUDFLARE_API_TOKEN` ada. Render Shopee via Cloudflare Browser Run REST API.
2. **NineRouterFetchAdapter** — jika D1 `sh_searchProviderConfigs` punya row enabled `providerType="webFetch"`. Pakai 9router AI gateway dengan agentic loop.
3. **BrowserRunAdapter** — jika D1 punya row enabled `providerType="browserRun"`. Direct call ke Browser Run service.
4. **No fallback** — jika tidak ada provider, job fail dengan `configMissing` (PRD-compliant honest failure).

**Optional VPS scraper** (PRD §7 #7 last item) tidak diimplementasikan di MVP. Bisa ditambah sebagai `providerType="vpsScraper"` di kemudian hari.

## D1 Configuration Table

`sh_searchProviderConfigs` schema:

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | `srp_xxx` |
| providerKey | TEXT NOT NULL | e.g. `9router`, `browserRun`, `cloudflareBrowserRendering` |
| displayName | TEXT NOT NULL | human-readable |
| providerType | TEXT NOT NULL | `officialApi | webFetch | browserRun | vpsScraper | manual` |
| priority | INTEGER NOT NULL | lower = higher priority |
| baseUrl | TEXT | nullable, from D1 not env |
| authType | TEXT NOT NULL | `bearer | apiKey | none` |
| secretRef | TEXT | nullable, env var name (D1 only stores ref, not value) |
| timeoutMs | INTEGER NOT NULL | |
| retryCount | INTEGER NOT NULL | |
| isEnabled | INTEGER NOT NULL | 0/1 |
| lastTestStatus | TEXT | `success | failed | untested` |
| lastTestAt | TEXT | ISO timestamp |
| lastTestMessage | TEXT | |

Per PRD §Runtime Configuration: secret values NEVER stored in D1. D1 only stores `secretRef` (e.g. `NINEROUTER_API_KEY`); the secret value is read from `env[secretRef]`.

## Default Behavior (PRD §8.3)

- Default `shippedFrom` = `"DKI Jakarta"`.
- Default `limit` = `10`.
- Optional: `priceMin`, `priceMax`, `minimumRating`, `storeStatus[]`.
- After fetching candidates, system dedupes by `shopId + itemId`, prioritizes DKI Jakarta, then enriches and ranks.

## Search Provider Interface

```ts
export type SearchInput = {
  keyword: string;
  shippedFrom: string;
  limit: number;
  priceMin?: number;
  priceMax?: number;
  minimumRating?: number;
  storeStatus?: string[];
};

export type SearchResultCandidate = {
  title: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  itemId: string | null;
  shopId: string | null;
  priceMin: number | null;
  priceMax: number | null;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  shippedFrom: string | null;
  shopName: string | null;
  source: string;
  confidence: number;
};
```

## Keyword Search Workflow (Actual Code)

1. Validate input via Zod (`packages/shared/src/schemas`).
2. Create `sh_researchSessions` + `sh_jobs` rows, return 202.
3. Queue consumer picks up message.
4. `loadSearchConfig()` selects adapter.
5. `extractor.searchProducts(keyword)` fetches candidates.
6. For each candidate (buffer `limit * 3`):
   - `extractProduct` → upsert `sh_products`
   - `extractShop` → upsert `sh_shops`
   - `saveProductWeight` → `sh_productWeights`
   - `saveProductFeatures` → `sh_productFeatures`
   - `saveRawProductSnapshot` → R2
7. `shippedFromFilter` prioritizes DKI Jakarta.
8. `calculateProductScore` + `detectRisks` (deterministic, `packages/core`).
9. `topTenRanking` selects top 10.
10. `runResearchWorkflow` (Mastra) → 3 agents → `sh_aiReports`.
11. `sh_comparisons` + `sh_comparisonItems` persist rank.
12. Update `sh_jobs.status` to `completed | partialSuccess | failed`.
13. Frontend polls `/api/research/jobs/:id` → `/result/:sessionId`.

## Compliance Rules (PRD §9)

System must not:
- Login to Shopee user account.
- Access cart, checkout, order, user, or me pages.
- Bypass CAPTCHA.
- Collect personal data.
- Scrape aggressively.

Enforced by `apps/web/src/__tests__/prd-compliance.test.ts` (17 tests).

## Retry Rules

- Retry only transient failures.
- Do not retry CAPTCHA or forbidden responses aggressively.
- Use exponential backoff (`packages/ai/src/retry.ts`, `maxAttempts: 3`).
- Mark `partialSuccess` if some candidates fail.

## Data Quality Rules

Every search result field must include:
- `value` (or `null`)
- `source` (adapter name, e.g. `"cloudflareBrowserRendering"`)
- `confidence` (0.0–1.0)

If `shippedFrom` cannot be verified, product must be marked as `unknown`, not as confirmed DKI Jakarta.

## Admin Configuration

Search provider settings manageable via frontend at `/settings/config`:
- providerKey
- displayName
- providerType
- priority
- baseUrl
- authType
- secretRef
- isEnabled
- timeoutMs
- retryCount
- Test provider button (`POST /api/admin/configs/search-providers/:id/test`)

Secret values are NEVER stored in D1. Worker reads them from `env[secretRef]` at request time.

# Shopee URL Resolver

## Goal

Convert user-provided Shopee URL into canonical product URL and identifiers (PRD §8.5).

## Supported Input (PRD §8.4)

- `https://id.shp.ee/...` (short URL — must follow redirect)
- `https://shopee.co.id/product/{shopId}/{itemId}` (full URL — parse directly)
- Shopee URLs with tracking parameters (`?utm_*`, `?d_id=*`, `?af_id=*`, etc.) — must be stripped from canonical
- Mobile Shopee URL (`m.shopee.co.id`) if product identifiers can be extracted

Non-Shopee URLs are rejected with `errorMessage` (PRD §8.4: "Sistem menolak URL non-Shopee").

## Output Schema

```ts
export type ResolveUrlResult = {
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  shopId: string | null;
  itemId: string | null;
  resolveMethod: "direct" | "redirect" | "webFetch" | "browserRun" | "manual";
  status: "resolved" | "failed";
  errorMessage?: string;
};
```

`status` is one of `ResolveStatus` enum (`packages/shared/src/constants/enums.ts`).

## Resolution Methods (Priority Order)

1. **Direct** — input is already `https://shopee.co.id/product/{shopId}/{itemId}`, parse directly.
2. **Redirect** — input is `id.shp.ee/...`, follow HTTP redirect, then parse.
3. **webFetch** — fallback when redirect fails, use 9router with `web_fetch` tool agentic loop.
4. **browserRun** — Cloudflare Browser Rendering snapshot of the short URL page.
5. **manual** — placeholder for future manual override.

## URL Parsing Implementation

`packages/shopee/src/resolver/urlParser.ts`:

```ts
parseShopeeUrl({ url: "https://shopee.co.id/product/123/456" })
// → { isValid: true, shopId: "123", itemId: "456", isShortUrl: false, normalizedUrl: "..." }

parseShopeeUrl({ url: "https://id.shp.ee/abc" })
// → { isValid: true, isShortUrl: true, normalizedUrl: "https://id.shp.ee/abc" }
```

## Resolution Implementation

`packages/shopee/src/resolver/resolveUrl.ts` chains:

1. `parseShopeeUrl(input)` — first.
2. If `shopId && itemId` → return with `resolveMethod="direct"`.
3. If `isShortUrl` → try `fetch(url, { redirect: "follow" })` for redirect, then parse again. On success, return `resolveMethod="redirect"`.
4. If redirect fails → try `webFetchAdapter.resolveUrl(input)` (9router).
5. If webFetch fails → try `browserRunAdapter.resolveUrl(input)` (Cloudflare Browser Rendering).
6. On all failures → return `{ status: "failed", errorMessage: "..." }`. Never throw.

## Canonical URL Normalization

The canonical URL strips:
- UTM parameters (`utm_source`, `utm_medium`, etc.)
- Shopee tracking parameters (`d_id`, `af_id`, `xcrid`, etc.)
- Hash fragments (`#...`)

Implemented in `urlParser.ts` `normalizeShopeeUrl()`.

## PRD §8.5 Compliance (7 Steps)

1. **Validate URL** — reject non-Shopee hostnames.
2. **Follow HTTP redirect** — for `id.shp.ee`.
3. **Normalize canonical URL** — strip tracking.
4. **Extract shopId and itemId** — regex on canonical path.
5. **Fallback to 9router web fetch** — if redirect fails.
6. **Fallback to Browser Run** — if web fetch fails.
7. **Return error jelas jika gagal** — `errorMessage` field set, `status="failed"`, all IDs null. Never crash (PRD §8.5 last rule).

## Failure Handling

A failed URL becomes a `partialSuccess` item in the comparison — the comparison continues with the remaining URLs. The job only fails entirely if ALL URLs fail.

## Persistence

`sh_resolvedUrls` table stores every attempted resolution:

| Column | Type |
|---|---|
| id | TEXT PK (`res_xxx`) |
| researchSessionId | TEXT |
| originalUrl | TEXT NOT NULL |
| finalUrl | TEXT NULL |
| canonicalUrl | TEXT NULL |
| shopId | TEXT NULL |
| itemId | TEXT NULL |
| resolveMethod | TEXT |
| status | TEXT (`resolved` / `failed`) |
| errorMessage | TEXT NULL |
| createdAt | TEXT NOT NULL |

Persisted in `packages/db/src/repositories/resolvedUrls.ts` from `extractOneUrl` in `packages/ai/src/jobProcessor.ts`.

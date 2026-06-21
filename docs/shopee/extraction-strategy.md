# Shopee Extraction Strategy

## Strategy Decision

Shopee extraction must be **adapter-based** (PRD §7 #7). The app must not depend on a single fragile scraping method.

### Actual Production Order

In production (`packages/ai/src/jobProcessor.ts`), the `loadSearchConfig()` selects an adapter based on environment + D1 config:

1. **CloudflareBrowserRenderingAdapter** — if `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are set in worker env. Renders Shopee via Cloudflare Browser Run REST API, parses rendered HTML with cheerio.
2. **NineRouterFetchAdapter** — if D1 `sh_searchProviderConfigs` has a `providerType="webFetch"` row enabled. Uses 9router AI gateway with agentic loop for `web_fetch` tool calls.
3. **BrowserRunAdapter** — if D1 has a `providerType="browserRun"` row enabled. Direct call to a Browser Run service.
4. **No fallback** — if no provider is configured, the job fails with `configMissing` error message.

### Adapter Files

| Adapter | File | Use case |
|---|---|---|
| `CloudflareBrowserRenderingAdapter` | `packages/shopee/src/adapters/cloudflareBrowserRenderingAdapter.ts` | Primary in production. Renders Shopee via Cloudflare Browser Run REST API. |
| `NineRouterFetchAdapter` | `packages/shopee/src/adapters/nineRouterFetchAdapter.ts` | Uses 9router AI gateway with `web_fetch` tool. Includes SSE parser, agentic loop, JSON-tool-call handling. |
| `BrowserRunAdapter` | `packages/shopee/src/adapters/browserRunAdapter.ts` | Direct Browser Run service integration. |
| `SearchProviderAdapter` | `packages/shopee/src/adapters/searchProviderAdapter.ts` | Loader that reads from D1 and delegates to the configured adapter. |
| `FallbackShopeeExtractor` | `packages/shopee/src/extractors/fallbackExtractor.ts` | Chain-based fallback across multiple extractors (used internally). |
| `MockShopeeExtractor` | `packages/shopee/src/extractors/mockExtractor.ts` | Test-only fixture data. Never used in production. |

## Compliance Rules (PRD §Compliance + §9)

- Do not login to Shopee user account.
- Do not access cart, checkout, order, or user/me pages.
- Do not bypass CAPTCHA.
- Do not scrape aggressively. Respect rate limits and retry policies.
- Cache results and store extraction timestamp (`lastCheckedAt`).
- Failed extraction fields must be `null` with `confidence = 0` (PRD §8.6).

Enforced by `apps/web/src/__tests__/prd-compliance.test.ts` (17 tests scan source for forbidden paths and patterns).

## Adapter Interface

```ts
export interface ShopeeExtractorLike {
  resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult>;
  searchProducts(input: SearchInput): Promise<SearchResultCandidate[]>;
  extractProduct(input: ExtractProductInput): Promise<ProductSnapshot>;
  extractShop(input: ExtractShopInput): Promise<ShopSnapshot>;
}
```

## No Mock Data Fallback in Production Adapters

`CloudflareBrowserRenderingAdapter` and `NineRouterFetchAdapter` do **not** return fabricated mock data when real extraction fails. On failure they return empty arrays / throw — the job then fails with `noData` and surfaces a clear error to the user. This is PRD §8.6 compliant: "Field gagal tidak boleh diisi data palsu."

Previous versions of these adapters had a fixture pool fallback (used in early development). That fallback was removed in `f301fc7` to prevent pollution of production D1 with synthetic data.

## Data Quality Invariant

Every extracted field is represented as:

```ts
{
  value: unknown | null,
  source: string | null,
  confidence: number
}
```

Missing data stays missing. Never inferred as fact. AI receives the structured data as-is and is forbidden from inventing values per PRD §8.10.

## Known Production Constraint

**Cloudflare Browser Rendering REST API identifies Cloudflare Workers as a bot** when fetching Shopee.co.id. Shopee serves an empty SPA shell (no product URLs in initial HTML, products loaded via XHR after JS execution that the headless browser does not trigger due to Shopee's anti-bot). Real Shopee search returns zero results; the app fails honestly with `noData`.

To get real Shopee data in production, integrate the **Shopee Open Platform** (`https://openplatform.shopee.com`) — requires partnership approval, but provides official data access that bypasses anti-bot.

## Development Rule

Build mock end-to-end flow first (`MockShopeeExtractor` in tests). Real extraction is added only after API, D1, UI, scoring, and AI report work with fixture data. The `MockShopeeExtractor` is for unit/integration tests only and is never wired into the production code path.

# TASK-101: Build search provider adapter

## Status

DONE

## Goal

Build a search provider adapter that implements the `SearchProvider` interface. The adapter loads its configuration from `sh_searchProviderConfigs` table (D1), respecting `isEnabled` and `priority` order. It must support pluggable providers (official API, webFetch, 9router, BrowserRun, manual) and use the existing `SearchInput`/`SearchResultCandidate` types.

## Required Reading

- `docs/prd/prd.md` (section 8.6, 8.3)
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/api/api-contract.md`
- `docs/configuration/runtime-configuration.md`
- `docs/shopee/search-api-strategy.md`
- `docs/shopee/extraction-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/shopee/src/adapters/searchProviderAdapter.ts` — SearchProviderAdapter
- Implement `SearchProvider` interface (single `search()` method)
- Load `SearchProviderConfigRow` from D1 by `providerKey`
- Pass `baseUrl`/`timeoutMs`/`retryCount`/`authType`/`secretRef` from row
- Use existing 9router adapter (`NineRouterFetchAdapter`) when `providerType` is `webFetch`/`9router`
- Use existing Browser Run adapter (`BrowserRunAdapter`) when `providerType` is `browserRun`
- For `manual`/`officialApi` types, return empty candidates (placeholder for future)
- Skip disabled providers (`isEnabled = 0`)
- Comprehensive unit tests with mocked D1 + mocked fetch

## Out of Scope

- Do not call Shopee from frontend (no frontend change here)
- Do not implement queue consumer (separate task)
- Do not implement candidate collection/enrichment (TASK-102..104)
- Do not change D1 schema
- Do not change wrangler.toml

## Allowed Files

- `packages/shopee/src/adapters/searchProviderAdapter.ts` (new)
- `packages/shopee/src/adapters/searchProviderAdapter.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**` (no DB schema changes; reuse existing repos)
- `packages/core/**`
- `packages/ai/**`
- `wrangler*.toml`

## Input Contract

`search(input: SearchInput): Promise<SearchResultCandidate[]>`

`SearchInput`:
```ts
{
  keyword: string;
  shippedFrom: string;
  limit: number;
  priceMin?: number;
  priceMax?: number;
  minimumRating?: number;
  minimumReviewCount?: number;
  storeStatus?: string[];
}
```

## Output Contract

`SearchResultCandidate[]` with each field nullable except `source` and `confidence`.

## Acceptance Criteria

- [ ] SearchProviderAdapter class implements `SearchProvider` interface
- [ ] `search()` method returns `SearchResultCandidate[]`
- [ ] Loads config from D1 by `providerKey`
- [ ] Returns empty array when provider is disabled
- [ ] Returns empty array when provider is not found
- [ ] Uses correct adapter based on `providerType`
- [ ] Does not call Shopee from frontend
- [ ] Secret values resolved from env, never hardcoded
- [ ] Unit tests pass
- [ ] All existing tests pass
- [ ] Quality gate passes (lint, typecheck, test, build, quality-gate.js)

## Test Requirements

- [ ] Unit test: returns empty when provider is disabled
- [ ] Unit test: returns empty when provider is not found
- [ ] Unit test: uses 9router adapter for webFetch type
- [ ] Unit test: uses Browser Run adapter for browserRun type
- [ ] Unit test: returns empty for manual/officialApi types
- [ ] Unit test: handles missing secret env gracefully

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new adapter

## Stop Conditions Check

- [ ] No hard stop condition is triggered

## Completion Rule

Task is complete only when:
- Lint passes
- Typecheck passes
- Tests pass
- Build passes
- Self-review passes
- Task is committed

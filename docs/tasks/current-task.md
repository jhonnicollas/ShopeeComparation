# TASK-090: Build 9router web fetch adapter

## Status

DONE

## Goal

Build a 9router web fetch adapter for Shopee URL resolution that implements the `ShopeeExtractor` interface. The adapter should use 9router's web fetch capability to resolve short Shopee URLs and extract basic product/shop data, falling back gracefully when the fetch fails.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/database/naming-rules.md`
- `docs/api/api-contract.md`
- `docs/configuration/runtime-configuration.md`
- `docs/ai/9router-configuration.md`
- `docs/shopee/search-api-strategy.md`
- `docs/shopee/extraction-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/shopee/src/adapters/nineRouterFetchAdapter.ts` — implements `ShopeeExtractor` interface
- The adapter uses 9router web fetch (via chat/completions with web fetch tools) to resolve short URLs and fetch product/shop data
- Configuration loaded from `sh_searchProviderConfigs` table via D1 (not hardcoded)
- Add `extractProduct()` and `extractShop()` methods that return ProductSnapshot/ShopSnapshot with confidence scores
- Add proper source attribution and confidence for each extracted field
- Add comprehensive error handling and timeout
- Add unit tests with mocked fetch
- Add integration with the existing `webFetchAdapter.ts` resolver adapter

## Out of Scope

- Do not implement actual HTML/JSON parsing logic (that's TASK-093/094)
- Do not create API endpoints (resolver is already done)
- Do not create frontend UI (already done in TASK-085)
- Do not create D1 schema changes

## Allowed Files

- `packages/shopee/src/adapters/**` (new directory)
- `packages/shopee/src/adapters/nineRouterFetchAdapter.ts` (new)
- `packages/shopee/src/adapters/nineRouterFetchAdapter.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**` (no DB changes)
- `packages/core/**`
- `packages/ai/**` (separate AI package)

## Input Contract

Implements ShopeeExtractor interface with:
- `resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult>`
- `searchProducts(input: SearchInput): Promise<SearchResultCandidate[]>`
- `extractProduct(input: ExtractProductInput): Promise<ProductSnapshot>`
- `extractShop(input: ExtractShopInput): Promise<ShopSnapshot>`

Configuration loaded from D1 search provider config.

## Output Contract

All methods return appropriate typed results. Missing data returns `null` with `confidence: 0` per source-of-truth rules.

## Acceptance Criteria

- [ ] NineRouterFetchAdapter class implements ShopeeExtractor interface
- [ ] resolveUrl() uses 9router to fetch and parse Shopee short URLs
- [ ] extractProduct() returns ProductSnapshot with all required fields
- [ ] extractShop() returns ShopSnapshot with all required fields
- [ ] searchProducts() returns SearchResultCandidate[] (basic stub OK)
- [ ] All extracted fields include source and confidence
- [ ] Missing data returns null with confidence 0 (no fabrication)
- [ ] Configuration loaded from D1 (not hardcoded)
- [ ] Timeout handling implemented
- [ ] Error handling safe (no secrets in errors)
- [ ] Unit tests pass with mocked fetch
- [ ] All existing tests still pass
- [ ] Quality gate passes (lint, typecheck, test, build, quality-gate.js)

## Test Requirements

- [ ] Unit test for resolveUrl() with mocked 9router response
- [ ] Unit test for extractProduct() with mocked response
- [ ] Unit test for extractShop() with mocked response
- [ ] Unit test for timeout handling
- [ ] Unit test for error handling (no secret leakage)

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

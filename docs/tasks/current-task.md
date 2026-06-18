# TASK-092: Build fallback extractor strategy

## Status

DONE

## Goal

Build a fallback extractor strategy that chains multiple ShopeeExtractor implementations in priority order, collecting results from each adapter and merging into a single ProductSnapshot/ShopSnapshot. Each adapter's result is recorded for diagnostics. Missing fields stay null with confidence 0. Partial success is allowed.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/api/api-contract.md`
- `docs/shopee/search-api-strategy.md`
- `docs/shopee/extraction-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/shopee/src/extractors/fallbackExtractor.ts` — FallbackShopeeExtractor class
- Implements ShopeeExtractor interface and orchestrates multiple adapters
- For each method, iterates adapters in priority order, calls each, and merges results
- Tracks per-adapter outcomes for diagnostics
- Returns partial success when some adapters succeed and others fail
- Logs to a diagnostics array (no secret leakage)
- Adapter priority loaded from D1 config (searchProviderConfigs)
- Add comprehensive unit tests

## Out of Scope

- Do not create API endpoints
- Do not create frontend UI
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/extractors/fallbackExtractor.ts` (new)
- `packages/shopee/src/extractors/fallbackExtractor.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**`
- `packages/core/**`
- `packages/ai/**`

## Input Contract

Implements ShopeeExtractor interface. Accepts array of adapters in priority order.

## Output Contract

Returns merged ProductSnapshot/ShopSnapshot with per-field source and confidence. Missing fields stay null.

## Acceptance Criteria

- [ ] FallbackShopeeExtractor implements ShopeeExtractor
- [ ] All 4 methods (resolveUrl, searchProducts, extractProduct, extractShop) supported
- [ ] Adapters called in priority order
- [ ] Per-adapter results merged into final result
- [ ] Missing fields stay null with confidence 0
- [ ] Diagnostics captured per attempt
- [ ] Errors do not crash the whole extraction
- [ ] Unit tests pass
- [ ] All existing tests still pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for resolveUrl with multiple adapters
- [ ] Unit test for extractProduct with primary adapter failing
- [ ] Unit test for extractShop with all adapters failing
- [ ] Unit test for searchProducts merging results
- [ ] Unit test for error handling

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new extractor

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

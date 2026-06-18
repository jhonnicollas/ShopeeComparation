# TASK-091: Build Browser Run adapter interface

## Status

DONE

## Goal

Build a Cloudflare Browser Run adapter interface for Shopee URL resolution. The adapter should implement the `ShopeeExtractor` interface and use Cloudflare Browser Run (via REST API) to render JavaScript-heavy pages and extract product/shop data.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/database/naming-rules.md`
- `docs/api/api-contract.md`
- `docs/configuration/runtime-configuration.md`
- `docs/shopee/search-api-strategy.md`
- `docs/shopee/extraction-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/shopee/src/adapters/browserRunAdapter.ts` — implements `ShopeeExtractor` interface
- The adapter uses Cloudflare Browser Run REST API to render pages and extract data
- Configuration loaded from `sh_searchProviderConfigs` (provider type: `browserRun`)
- Add `BrowserRunAdapter` class with proper Cloudflare Browser Run integration
- Add `BrowserRunConfig` interface for configuration
- Add error handling and timeout
- Add unit tests with mocked fetch

## Out of Scope

- Do not create the actual Cloudflare Browser Run binding/wrangler config (deferred to deployment)
- Do not create API endpoints
- Do not create frontend UI
- Do not create D1 schema changes

## Allowed Files

- `packages/shopee/src/adapters/browserRunAdapter.ts` (new)
- `packages/shopee/src/adapters/browserRunAdapter.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**` (no DB changes)
- `packages/core/**`
- `packages/ai/**`
- `wrangler*.toml` (no config changes)

## Input Contract

Implements ShopeeExtractor interface with all 4 methods.

## Output Contract

All methods return appropriate typed results. Missing data returns `null` with `confidence: 0`.

## Acceptance Criteria

- [ ] BrowserRunAdapter class implements ShopeeExtractor interface
- [ ] Uses Cloudflare Browser Run REST API for fetching
- [ ] Configuration loaded from D1 search provider configs
- [ ] All extracted fields include source and confidence
- [ ] Missing data returns null with confidence 0
- [ ] Timeout handling implemented
- [ ] Error handling safe (no secrets in errors)
- [ ] Unit tests pass with mocked fetch
- [ ] All existing tests still pass
- [ ] Quality gate passes (lint, typecheck, test, build, quality-gate.js)

## Test Requirements

- [ ] Unit test for resolveUrl() with mocked Browser Run response
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

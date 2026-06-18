# TASK-084: Add resolver fallback interface

## Status

TODO

## Goal

Extend the Shopee URL resolver with additional fallback adapters: WebFetch (via 9router web fetch) and BrowserRun (stub for Cloudflare Browser Run). The fallback chain should be configurable via D1 search provider config and gracefully handle partial failures.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/database/naming-rules.md`
- `docs/api/api-contract.md`
- `docs/configuration/runtime-configuration.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`
- `docs/shopee/search-api-strategy.md`
- `docs/shopee/extraction-strategy.md`

## Scope

- Create `packages/shopee/src/resolver/webFetchAdapter.ts` — implements `ResolveUrlAdapter` using 9router web fetch to resolve short URLs when HTTP redirect fails
- Create `packages/shopee/src/resolver/browserRunAdapter.ts` — implements `ResolveUrlAdapter` as a stub for Cloudflare Browser Run (returns failed status with message indicating Browser Run not available)
- Update `packages/shopee/src/resolver/resolveUrl.ts` to include these adapters in the default fallback chain: `[DirectResolveAdapter, HttpRedirectResolveAdapter, WebFetchResolveAdapter, BrowserRunResolveAdapter]`
- Add `ResolveFallbackConfig` type in `packages/shared/src/types/shopee.ts` with adapter ordering, timeout, retry options
- Add Zod schema for `ResolveFallbackConfig` in `packages/shared/src/schemas/shopee.ts`
- Add unit tests for each new adapter and the extended fallback chain
- Ensure all files follow naming conventions (no underscores in column names, sh_ prefix for tables)

## Out of Scope

- Do not implement actual 9router web fetch call (that's TASK-090)
- Do not implement actual Cloudflare Browser Run call (that's TASK-091)
- Do not create API endpoints (that's TASK-085)
- Do not create frontend UI (that's TASK-085)
- Do not modify D1 schema (existing sh_resolvedUrls table is sufficient)

## Allowed Files

- `packages/shopee/src/resolver/**`
- `packages/shared/src/types/shopee.ts`
- `packages/shared/src/schemas/shopee.ts`
- `packages/shared/src/index.ts` (re-export)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**` (no DB changes needed)
- `packages/core/**`
- `packages/ai/**`

## Input Contract

ResolveUrlInput from shared types:
```ts
{ url: string }
```

## Output Contract

ResolveUrlResult with adapterUsed field:
```ts
ResolveUrlResult & { adapterUsed: string }
```

## Acceptance Criteria

- [ ] webFetchAdapter.ts exists and implements ResolveUrlAdapter interface
- [ ] browserRunAdapter.ts exists and implements ResolveUrlAdapter interface
- [ ] resolveUrl.ts updated with new adapters in fallback chain
- [ ] ResolveFallbackConfig type added to shared types
- [ ] ResolveFallbackConfig Zod schema added to shared schemas
- [ ] Unit tests pass for new adapters
- [ ] All existing tests still pass
- [ ] Quality gate passes (lint, typecheck, test, build, quality-gate.js)

## Test Requirements

- [ ] Unit test for WebFetchResolveAdapter (mock 9router call)
- [ ] Unit test for BrowserRunResolveAdapter (returns failed with expected message)
- [ ] Unit test for resolveUrlWithFallback with all 4 adapters in chain
- [ ] Unit test that fallback works when earlier adapters fail

## Documentation Update

- [ ] Update `packages/shared/src/index.ts` to export new types/schemas
- [ ] Update `packages/shopee/src/index.ts` to export new adapters

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
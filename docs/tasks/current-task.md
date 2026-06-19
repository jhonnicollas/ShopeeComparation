# TASK-102: Build candidate collector

## Status

DONE

## Goal

Build a candidate collector that aggregates search results from multiple search providers, deduplicates by `shopId+itemId` or canonical URL, and returns a merged list of `SearchResultCandidate`. The collector should respect provider priority order from D1 config.

## Required Reading

- `docs/prd/prd.md` (section 8.3)
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

- Create `packages/shopee/src/collectors/candidateCollector.ts` — CandidateCollector
- Accepts list of search providers (each implements `SearchProvider`)
- Calls each provider in order
- Merges and deduplicates results by `shopId+itemId` then by `canonicalUrl`
- Returns top N candidates (default `limit` from `SearchInput`)
- Tracks per-provider result count for diagnostics
- Handles provider failures gracefully (partial success)
- Unit tests with mocked providers

## Out of Scope

- Do not implement actual Shopee API calls
- Do not implement score/rank
- Do not implement queue consumer
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/collectors/candidateCollector.ts` (new)
- `packages/shopee/src/collectors/candidateCollector.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**` (no schema changes)
- `packages/core/**`
- `packages/ai/**`
- `wrangler*.toml`

## Input Contract

`collect(input: { searchInput: SearchInput; providers: SearchProvider[] }): Promise<CollectionResult>`

## Output Contract

`CollectionResult`:
```ts
{
  candidates: SearchResultCandidate[];
  perProviderCount: Record<string, number>;
  failedProviders: string[];
}
```

## Acceptance Criteria

- [ ] CandidateCollector class implemented
- [ ] Calls each provider in priority order
- [ ] Deduplicates by `shopId+itemId` first, then by `canonicalUrl`
- [ ] Returns top N candidates (respects `searchInput.limit`)
- [ ] Tracks per-provider result count
- [ ] Tracks failed providers
- [ ] Handles provider errors without crashing
- [ ] Unit tests pass
- [ ] All existing tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test: collects from all providers
- [ ] Unit test: deduplicates by shopId+itemId
- [ ] Unit test: deduplicates by canonicalUrl
- [ ] Unit test: respects limit
- [ ] Unit test: handles provider failure
- [ ] Unit test: returns empty when no providers
- [ ] Unit test: tracks per-provider count

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new collector

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

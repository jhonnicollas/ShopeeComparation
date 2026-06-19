# TASK-103: Build DKI Jakarta shippedFrom filter

## Status

TODO

## Goal

Build a filter for `SearchResultCandidate[]` that:
- Includes candidates whose `shippedFrom` matches the requested shippedFrom (default "DKI Jakarta")
- Excludes candidates where `shippedFrom` is null/empty (cannot be confirmed)
- Excludes candidates where `shippedFrom` is set but does not match
- Returns a `FilterResult` containing kept candidates, dropped candidates, and counts

## Required Reading

- `docs/prd/prd.md` (section 8.3)
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/shopee/search-api-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `packages/shopee/src/filters/shippedFromFilter.ts`
- Export `filterByShippedFrom(candidates, shippedFrom)` function
- Return `FilterResult` with `kept`, `dropped`, `keptCount`, `droppedCount`
- Case-insensitive comparison
- Trim whitespace
- Unit tests

## Out of Scope

- Do not call Shopee from frontend
- Do not implement enrichment
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/filters/shippedFromFilter.ts` (new)
- `packages/shopee/src/filters/shippedFromFilter.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**`
- `packages/core/**`
- `packages/ai/**`

## Input Contract

```ts
filterByShippedFrom(
  candidates: SearchResultCandidate[],
  shippedFrom: string
): FilterResult
```

## Output Contract

```ts
{
  kept: SearchResultCandidate[];
  dropped: SearchResultCandidate[];
  keptCount: number;
  droppedCount: number;
}
```

## Acceptance Criteria

- [ ] filterByShippedFrom function implemented
- [ ] Returns empty kept array when all candidates have null shippedFrom
- [ ] Case-insensitive matching
- [ ] Trims whitespace
- [ ] Tracks dropped candidates
- [ ] Unit tests pass
- [ ] All existing tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test: keeps candidates matching shippedFrom
- [ ] Unit test: drops candidates with null shippedFrom
- [ ] Unit test: drops candidates with non-matching shippedFrom
- [ ] Unit test: case-insensitive matching
- [ ] Unit test: handles empty input
- [ ] Unit test: tracks dropped count

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new filter

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

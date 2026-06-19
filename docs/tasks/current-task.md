# TASK-105: Build top 10 ranking

## Status

TODO

## Goal

Build a deterministic scoring and ranking function for enriched `ProductSnapshot` + `ShopSnapshot` products. Uses existing `packages/core` scoring engine to produce final scores, then sorts and returns top N (default 10). Each result includes rank, score, and a deterministic comparison key.

## Required Reading

- `docs/prd/prd.md` (section 8.3, 8.9)
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/shopee/search-api-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/done-definition.md`

## Scope

- Create `packages/shopee/src/jobs/topTenRanking.ts`
- Export `rankTopN(items: { product: ProductSnapshot; shop: ShopSnapshot | null }[], limit: number): RankedResult[]`
- Use existing `packages/core` scoring engine (calculateProductScore)
- Sort by score descending; tiebreak by `itemId` for determinism
- Return `RankedResult[]` with `rank`, `productId`, `score`, `product`, `shop`
- Unit tests with various score inputs

## Out of Scope

- Do not implement actual AI ranking
- Do not modify packages/core
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/jobs/topTenRanking.ts` (new)
- `packages/shopee/src/jobs/topTenRanking.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**`
- `packages/ai/**`

## Input Contract

```ts
rankTopN(items: RankInput[], limit: number): RankedResult[]
```

## Output Contract

```ts
interface RankedResult {
  rank: number;
  productId: string;
  score: number;
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
}
```

## Acceptance Criteria

- [ ] rankTopN function implemented
- [ ] Uses packages/core scoring engine
- [ ] Sorts by score descending with deterministic tiebreak
- [ ] Returns top N items
- [ ] Assigns rank 1..N
- [ ] Unit tests pass
- [ ] All existing tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test: ranks by score descending
- [ ] Unit test: tiebreak by itemId
- [ ] Unit test: respects limit
- [ ] Unit test: handles empty list
- [ ] Unit test: assigns ranks correctly

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new ranker

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

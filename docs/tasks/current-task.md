# TASK-104: Build candidate enrichment job

## Status

DONE

## Goal

Build a candidate enrichment pipeline that takes a list of `SearchResultCandidate`, enriches each with full `ProductSnapshot` and `ShopSnapshot` via the `FallbackShopeeExtractor`, and saves results to D1 (products, shops, weights) and R2 (raw snapshots). Pipeline processes candidates in parallel with bounded concurrency and reports partial success.

## Required Reading

- `docs/prd/prd.md` (section 8.3, 8.6, 8.7, 8.8)
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/shopee/search-api-strategy.md`
- `docs/shopee/extraction-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `packages/shopee/src/jobs/candidateEnrichmentJob.ts`
- Accept list of `SearchResultCandidate`, db, r2, fallback extractor
- For each candidate: extract product, extract shop, save to D1, save snapshot to R2
- Bounded concurrency (e.g. 5 parallel)
- Return `EnrichmentResult` with enriched products, shops, errors
- Mark research session progress as items complete
- Use existing packages/db repos
- Unit tests with mocked db/r2/extractor

## Out of Scope

- Do not implement queue consumer (separate task)
- Do not implement score/rank
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/jobs/candidateEnrichmentJob.ts` (new)
- `packages/shopee/src/jobs/candidateEnrichmentJob.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**` (no schema changes; reuse repos)
- `packages/core/**`
- `packages/ai/**`

## Input Contract

```ts
runEnrichment(input: {
  db: D1Database;
  r2: R2Bucket;
  extractor: FallbackShopeeExtractor;
  candidates: SearchResultCandidate[];
  researchSessionId: string;
  concurrency?: number;
}): Promise<EnrichmentResult>
```

## Output Contract

```ts
{
  products: ProductSnapshot[];
  shops: ShopSnapshot[];
  errors: Array<{ itemId: string; error: string }>;
  enrichedCount: number;
  failedCount: number;
}
```

## Acceptance Criteria

- [ ] runEnrichment function implemented
- [ ] Processes candidates with bounded concurrency
- [ ] Saves each product and shop to D1
- [ ] Saves raw snapshot to R2
- [ ] Handles per-candidate failures gracefully
- [ ] Returns enriched products, shops, errors
- [ ] Unit tests pass
- [ ] All existing tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test: enriches all candidates successfully
- [ ] Unit test: handles per-candidate failure
- [ ] Unit test: saves to D1
- [ ] Unit test: saves to R2
- [ ] Unit test: respects concurrency
- [ ] Unit test: returns empty result for empty candidates

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new job

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

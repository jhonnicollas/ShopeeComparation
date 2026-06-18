# TASK-097: Save raw product snapshot to R2

## Status

DONE

## Goal

Build a helper to save raw product snapshots to Cloudflare R2. The raw HTML/JSON from Shopee extraction is stored in R2 with a reference key in sh_rawSnapshots table. This keeps D1 lightweight while preserving full extraction context.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/database/schema.md`
- `docs/database/naming-rules.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `packages/shopee/src/extractors/snapshotStorage.ts` — saveRawProductSnapshot helper
- Uses existing R2 helper (putSnapshot from packages/db)
- Records in sh_rawSnapshots and sh_fieldEvidence tables
- Stores raw HTML, JSON, or text content
- Returns R2 key for reference
- Add unit tests with mock R2 bucket

## Out of Scope

- Do not create API endpoints
- Do not create frontend UI
- Do not change D1 schema (sh_rawSnapshots and sh_fieldEvidence already exist)
- Do not create new repositories (use existing from packages/db)

## Allowed Files

- `packages/shopee/src/extractors/snapshotStorage.ts` (new)
- `packages/shopee/src/extractors/snapshotStorage.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**` (no API changes)
- `packages/db/**` (no DB changes)
- `packages/core/**`
- `packages/ai/**`

## Input Contract

`saveRawProductSnapshot(input: { db, r2, ownerId, ownerType, content, contentType }): Promise<{ r2Key, snapshotId }>`

## Output Contract

Returns R2 key and snapshot record ID for reference.

## Acceptance Criteria

- [ ] saveRawProductSnapshot function implemented
- [ ] Uses existing R2 helper (putSnapshot)
- [ ] Records in sh_rawSnapshots table
- [ ] Returns R2 key
- [ ] Unit tests pass
- [ ] All existing tests still pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for saving raw product snapshot
- [ ] Unit test for saving raw shop snapshot
- [ ] Unit test for error handling

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new helper

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

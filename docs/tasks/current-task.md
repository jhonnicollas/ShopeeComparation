# TASK-121: Add retry policy

## Status

IN_PROGRESS

## Goal

Add a retry utility to the AI package for handling transient network/provider errors with exponential backoff. Used by 9router calls and extractor adapters.

## Required Reading

- `docs/architecture/technical-decisions.md`
- `docs/api/api-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `packages/ai/src/retry.ts` with `withRetry`, `isRetryableError`, `calculateDelay`, `DEFAULT_RETRY_CONFIG`
- Export from `packages/ai/src/index.ts`
- Add tests for retry behavior

## Out of Scope

- Do not change frontend
- Do not change worker code
- Do not integrate into 9router client yet (separate task)

## Allowed Files

- `packages/ai/src/retry.ts` (new)
- `packages/ai/src/retry.test.ts` (new)
- `packages/ai/src/index.ts`
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `workers/api/**`
- `packages/db/**`
- `packages/shopee/**`
- `packages/core/**`

## Acceptance Criteria

- [ ] Retry utility created with exponential backoff
- [ ] Only retries timeout/network/502/503/429 errors
- [ ] Tests pass
- [ ] Quality gate passes

## Completion Rule

Task is complete only when all quality gates pass and task is committed.

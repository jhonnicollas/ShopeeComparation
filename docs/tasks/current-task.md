# TASK-085: Add resolver diagnostics UI

## Status

DONE

## Goal

Build a resolver diagnostics UI that shows per-URL adapter attempt history from the resolveUrlWithFallback chain. The UI must not expose secrets, must show which adapter was used, and must be integrated into the compare links flow.

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

- Add `POST /api/shopee/resolve-url` endpoint in `workers/api/src/routes/shopee.ts` that calls `resolveUrlWithFallback` and returns the result with adapter attempts.
- Add `ResolveUrlDiagnostics` type in `packages/shared/src/types/shopee.ts` to capture adapter attempt history.
- Create `apps/web/src/components/ResolverDiagnostics.tsx` — React component that displays per-URL resolve status, adapter used, errors.
- Add `resolveUrlByApi()` function to `apps/web/src/lib/api.ts` (or a new shopee.ts lib) for calling the new endpoint.
- Wire ResolverDiagnostics into ComparePage or create a standalone panel accessible from compare flow.
- Add CSS for diagnostics display.
- Add unit tests for the new API endpoint and React component.

## Out of Scope

- Do not create new D1 tables (no DB changes needed; diagnostics are per-request)
- Do not implement actual 9router or Browser Run calls (TASK-090, TASK-091)
- Do not change auth flow (use existing `authenticate` helper)

## Allowed Files

- `workers/api/src/routes/shopee.ts` (new)
- `workers/api/src/routes/shopee.test.ts` (new)
- `workers/api/src/index.ts` (mount shopee router)
- `packages/shared/src/types/shopee.ts`
- `packages/shared/src/schemas/shopee.ts`
- `apps/web/src/components/ResolverDiagnostics.tsx` (new)
- `apps/web/src/components/ResolverDiagnostics.test.tsx` (new)
- `apps/web/src/lib/shopee.ts` (new) or `apps/web/src/lib/api.ts` (add)
- `apps/web/src/pages/ComparePage.tsx`
- `apps/web/src/styles/global.css`
- `docs/tasks/**`

## Forbidden Files

- `packages/db/**` (no DB changes needed)
- `packages/core/**`
- `packages/ai/**`
- `workers/queueConsumer/**` (no queue changes needed)

## Input Contract

ResolveUrlRequest from API contract:
```ts
{ url: string }
```

## Output Contract

ResolveUrlResponse with diagnostics:
```ts
{
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  shopId: string | null;
  itemId: string | null;
  resolveMethod: ResolveMethod | null;
  status: ResolveStatus;
  diagnostics: {
    adapterUsed: string;
    attempts: Array<{
      adapter: string;
      method: ResolveMethod;
      status: ResolveStatus;
      errorMessage?: string;
    }>;
  };
}
```

## Acceptance Criteria

- [ ] POST /api/shopee/resolve-url endpoint exists
- [ ] ResolverDiagnostics type added to shared
- [ ] ResolverDiagnostics component created
- [ ] Component shows adapter attempts, status, errors per URL
- [ ] Component does not expose secrets
- [ ] Wired into ComparePage or accessible from compare flow
- [ ] Unit tests pass for new endpoint
- [ ] Unit tests pass for new component
- [ ] All existing tests still pass
- [ ] Quality gate passes (lint, typecheck, test, build, quality-gate.js)

## Test Requirements

- [ ] Unit test for POST /api/shopee/resolve-url endpoint
- [ ] Unit test for ResolverDiagnostics component
- [ ] Unit test that diagnostics do not expose secrets

## Documentation Update

- [ ] Update `packages/shared/src/index.ts` to export new types
- [ ] No public docs changes needed (internal API)

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

# TASK-046: Build frontend configuration CRUD page

## Status

DONE

## Goal

Create a frontend configuration CRUD page that allows admin users to manage app configs, AI providers, AI models, search providers, and scoring configs.

## Required Reading

- `docs/ui/configuration-crud.md`
- `docs/api/api-contract.md`
- `docs/configuration/runtime-configuration.md`
- `docs/architecture/implementation-stack.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create apps/web/src/lib/config.ts with API client functions.
- Create ConfigPage with tabs for each config type.
- Use TanStack Query for data fetching and mutations.
- Show loading/error states.
- Add component tests.

## Out of Scope

- Do not implement actual edit dialogs (list/create/delete only).
- Do not implement test console (TASK-048).

## Allowed Files

- `apps/web/src/lib/config.ts`
- `apps/web/src/pages/ConfigPage.tsx`
- `apps/web/src/pages/ConfigPage.test.tsx`
- `apps/web/src/app/router.tsx`
- `apps/web/src/styles/global.css`
- `docs/tasks/**`

## Forbidden Files

- `workers/**`
- `packages/**`
- `.ai/**`

## Input Contract

Admin user navigates to /settings/config and sees tabs for each config type.

## Output Contract

Page shows list of configs with create/delete buttons. On submit, calls API and refreshes.

## Acceptance Criteria

- [ ] ConfigPage component exists
- [ ] /settings/config route exists
- [ ] Tabs for each config type
- [ ] List view with create/delete
- [ ] API client functions exist
- [ ] Loading/error states shown
- [ ] Component tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] ConfigPage renders
- [ ] Tabs render
- [ ] Existing tests still pass

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.

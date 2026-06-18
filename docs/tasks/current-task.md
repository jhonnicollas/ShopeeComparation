# TASK-059: Build compare links frontend page

## Status

DONE

## Goal

Build the frontend compare-links page that lets users submit Shopee links and poll job status.

## Required Reading

- `docs/api/api-contract.md`
- `docs/architecture/implementation-stack.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Update ComparePage with form for adding links.
- Add TanStack Query mutation for submission.
- Add TanStack Query polling for job status.
- Show progress and status.
- Add component tests.

## Out of Scope

- Do not implement keyword search page.
- Do not implement scoring display.

## Allowed Files

- `apps/web/src/pages/ComparePage.tsx`
- `apps/web/src/pages/ComparePage.test.tsx`
- `docs/tasks/**`

## Input Contract

User enters up to 5 links in form.

## Output Contract

Form submits, shows job status, polls until completion.

## Acceptance Criteria

- [ ] ComparePage form implemented
- [ ] Add/remove link buttons
- [ ] Submit calls POST /api/research/compare-links
- [ ] Polls GET /api/research/jobs/:id
- [ ] Shows progress and status
- [ ] Component tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.

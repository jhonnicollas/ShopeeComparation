# Review Checklist

## Scope

- [ ] Implementation matches task.
- [ ] No forbidden files edited.
- [ ] No unrelated refactor.

## Architecture

- [ ] Follows technical decisions.
- [ ] Frontend uses React + Vite.
- [ ] Package setup uses pnpm.
- [ ] Backend logic stays in Workers/services.
- [ ] Shopee logic stays in `packages/shopee`.
- [ ] AI logic stays in `packages/ai`.

## Database

- [ ] Tables use prefix `sh_`.
- [ ] Columns have no underscore.
- [ ] Columns use camelCase.
- [ ] Large raw data not stored in D1.

## Security

- [ ] No secret in frontend.
- [ ] Protected routes check auth.
- [ ] User data isolation enforced.
- [ ] No internal stacktrace exposed.

## Data Quality

- [ ] Missing Shopee data not invented.
- [ ] Fields have source and confidence.
- [ ] AI report mentions missing data.

## Tests

- [ ] Unit tests added or updated.
- [ ] Typecheck passes.
- [ ] Build passes.

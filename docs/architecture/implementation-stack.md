# Implementation Stack

This document locks the implementation choices that were still ambiguous in the source-of-truth docs. Autopilot agents must follow this stack unless an ADR is approved by a human.

## Monorepo

- Package manager: `pnpm`.
- Workspace file: `pnpm-workspace.yaml`.
- Language: TypeScript only.
- TypeScript mode: strict.
- Module format: ESM.
- Shared code must live in `packages/*`.

## Frontend

- App location: `apps/web`.
- Framework: React + Vite.
- Routing: TanStack Router.
- Server state: TanStack Query.
- Forms: React Hook Form with Zod resolver.
- Styling: CSS Modules or plain CSS in `apps/web/src/styles`; do not introduce a UI framework unless an ADR approves it.
- Frontend imports only from `packages/shared`.

## Workers

- API Worker location: `workers/api`.
- Queue consumer location: `workers/queueConsumer`.
- Worker router: Hono.
- Validation: Zod at route boundary.
- Route handlers must call services; business logic must stay out of route handlers.
- Worker tests use Vitest with Miniflare-compatible mocks where needed.

## Database

- Database: Cloudflare D1 binding `DB`.
- Query style: prepared D1 statements through repository helpers in `packages/db`.
- ORM: none for MVP unless an ADR approves it.
- Migrations location: `packages/db/migrations`.
- Table names must start with `sh_`.
- Column names must use camelCase and must not contain underscores.

## Queue

- Queue producer binding name: `RESEARCH_QUEUE`.
- Queue consumer binding name: `RESEARCH_QUEUE`.
- Queue message schema must be defined in `packages/shared`.
- Heavy workflows must be accepted synchronously by API and processed asynchronously by the queue consumer.
- Local development may use a mock queue adapter when Cloudflare Queues are unavailable.

## R2

- R2 binding name: `LOGS`.
- Bucket name: `multi-apps-ai-bucket`.
- R2 helpers must live in `packages/db` or Worker service code, not in frontend.
- D1 stores only R2 keys and safe metadata.

## Testing

- Test runner: Vitest.
- Frontend component tests: Vitest + Testing Library.
- API/service tests: Vitest.
- Required scripts at root:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

## Code Quality

- Linting: ESLint.
- Formatting: Prettier.
- Build output, coverage, `.wrangler`, and generated artifacts must not be committed unless explicitly required by a task.

## Bootstrap Rule

Before `package.json` exists, only source-of-truth validation scripts are required to pass. After `TASK-010` creates the monorepo root package, every subsequent task must maintain the root scripts listed above.

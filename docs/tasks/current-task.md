# TASK-023: Setup Cloudflare Queue producer

## Status

DONE

## Goal

Create a Cloudflare Queue producer helper that API worker uses to send research job messages to RESEARCH_QUEUE. The helper should validate message payload and integrate with the existing queue binding.

## Required Reading

- `docs/architecture/implementation-stack.md` (queue section)
- `docs/architecture/cloudflare-architecture.md` (request flow)
- `docs/api/api-contract.md` (research session/job creation)
- `docs/configuration/env-variables.md` (RESEARCH_QUEUE binding)
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/db/src/queue.ts` with queue producer helper functions.
- Implement `sendResearchJobMessage()` function to send job messages to RESEARCH_QUEUE.
- Use Queue message schema from packages/shared.
- Add TypeScript types for queue operations.
- Add unit tests for queue producer functions.
- Re-export queue message type from shared package.

## Out of Scope

- Do not create queue consumer worker (TASK-024).
- Do not create actual queue (already exists in Cloudflare).
- Do not create job execution logic (later task).
- Do not create queue retry/dead letter logic (later task).

## Allowed Files

- `packages/db/src/queue.ts`
- `packages/db/src/queue.test.ts`
- `packages/db/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `workers/queueConsumer/**` (not created yet)
- `apps/web/**`
- `.ai/**`

## Input Contract

Cloudflare Queue exists with binding `RESEARCH_QUEUE`. Worker environment has `env.RESEARCH_QUEUE` of type `Queue`.

## Output Contract

`packages/db/src/queue.ts` exports `sendResearchJobMessage()` function that workers can use to send job messages to the queue. Helper accepts Queue binding and message payload.

## Acceptance Criteria

- [x] `packages/db/src/queue.ts` exists
- [x] Exports `sendResearchJobMessage()` function
- [x] Uses queue message schema from shared package
- [x] Validates message payload before sending
- [x] All functions have TypeScript types
- [x] Unit tests pass for queue producer functions
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for sendResearchJobMessage() with mock queue
- [x] Unit test for payload validation
- [x] Existing tests still pass

## Documentation Update

- [x] Update task status files only

## Stop Conditions Check

- [x] No hard stop condition is triggered

## Completion Rule

Task is complete only when:

- Lint passes.
- Typecheck passes.
- Tests pass.
- Build passes.
- Self-review passes.
- Task is committed.

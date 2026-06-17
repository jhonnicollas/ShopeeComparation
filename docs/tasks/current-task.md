# TASK-024: Setup Cloudflare Queue consumer

## Status

DONE

## Goal

Create a Cloudflare Queue consumer worker at `workers/queueConsumer` that processes research job messages from RESEARCH_QUEUE. The consumer must validate messages, acknowledge successful processing, and reject invalid messages back to the queue.

## Required Reading

- `docs/architecture/implementation-stack.md` (queue section)
- `docs/architecture/cloudflare-architecture.md` (request flow)
- `docs/architecture/folder-structure.md` (workers/queueConsumer location)
- `docs/configuration/env-variables.md` (RESEARCH_QUEUE binding)
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `workers/queueConsumer` worker package.
- Create `workers/queueConsumer/src/index.ts` with Hono queue handler.
- Create `workers/queueConsumer/wrangler.toml` with queue consumer binding.
- Validate incoming queue messages using queueMessageSchema.
- Acknowledge successful messages and reject invalid ones.
- Add unit tests for message handler.
- Add package.json with lint, typecheck, test, build scripts.

## Out of Scope

- Do not create actual job execution logic (later task).
- Do not create Mastra workflow integration (later task).
- Do not create Shopee extraction logic (later task).
- Do not deploy worker (requires Cloudflare credentials).

## Allowed Files

- `workers/queueConsumer/**`
- `docs/tasks/**`

## Forbidden Files

- `workers/api/**` (existing API worker)
- `apps/web/**`
- `packages/**` (except if needed for imports)
- `.ai/**`

## Input Contract

Cloudflare Queue RESEARCH_QUEUE exists. Messages are JSON strings with research job payload matching queueMessageSchema.

## Output Contract

`workers/queueConsumer/src/index.ts` exports default Hono worker that handles queue messages. Worker validates messages and logs processing status.

## Acceptance Criteria

- [x] `workers/queueConsumer` directory exists
- [x] `workers/queueConsumer/package.json` exists
- [x] `workers/queueConsumer/wrangler.toml` exists with queue consumer binding
- [x] `workers/queueConsumer/src/index.ts` exists with Hono handler
- [x] Message validation uses queueMessageSchema
- [x] Unit tests pass for message handler
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for valid message processing
- [x] Unit test for invalid message rejection
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

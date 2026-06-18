# TASK-071: Build 9router client from config table

## Status

TODO

## Goal

Create 9router client that loads provider/model config from D1 at runtime.

## Required Reading

- `docs/ai/9router-configuration.md`
- `docs/configuration/runtime-configuration.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/ai/src/nineRouter/client.ts.
- Load provider config from D1 (sh_aiProviderConfigs).
- Resolve secret from env via secretRef.
- Call 9router /chat/completions endpoint.
- Add unit tests.

## Out of Scope

- Do not implement agent prompts (later).

## Allowed Files

- `packages/ai/src/nineRouter/client.ts`
- `packages/ai/src/nineRouter/client.test.ts`
- `packages/ai/src/index.ts` (re-export)
- `docs/tasks/**`

## Input Contract

DB context and chat request.

## Output Contract

Chat response with text.

## Acceptance Criteria

- [ ] client.ts exists
- [ ] Loads config from D1
- [ ] Resolves secret via env
- [ ] Calls 9router endpoint
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.

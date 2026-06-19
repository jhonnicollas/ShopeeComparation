# TASK-124: Add config audit logs

## Status

IN_PROGRESS

## Goal

Log configuration changes (create, update, delete) to D1 for auditing. Track who changed what, when, and the old/new values.

## Required Reading

- `docs/architecture/technical-decisions.md`
- `docs/api/api-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create config audit log table in D1 (sh_configAuditLogs)
- Create repository function to insert/query audit logs
- Hook into config routes to log create/update/delete operations
- Add tests

## Out of Scope

- Do not change frontend
- Do not block on audit logging (fire-and-forget)

## Allowed Files

- `packages/db/migrations/0003_config_audit_logs.sql` (new)
- `packages/db/src/repositories/configAuditLogs.ts` (new)
- `packages/db/src/repositories/configAuditLogs.test.ts` (new)
- `packages/db/src/index.ts`
- `workers/api/src/routes/config.ts`
- `docs/tasks/**`
- `docs/database/schema.md`

## Forbidden Files

- `apps/web/**`
- `packages/core/**`

## Acceptance Criteria

- [x] Config audit log table created
- [x] Repository functions to insert/query
- [x] Audit logs created on config changes
- [x] Tests pass
- [x] Quality gate passes

## Completion Rule

Task is complete only when all quality gates pass and task is committed.

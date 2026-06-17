# Autopilot Task Runner

## Task Selection

1. Open `docs/tasks/backlog.md`.
2. Find the first task with status `TODO`.
3. Copy the full task block into `docs/tasks/current-task.md`.
4. If task details are incomplete, expand it using `docs/tasks/task-template.md` and `docs/tasks/autopilot-task-contract.md`.
5. Create or checkout the task branch.

## Task Execution

For each task:

1. Read source of truth docs.
2. Read the current task.
3. Identify allowed and forbidden files.
4. Inspect existing code before creating new files.
5. Implement only the active task.
6. Add tests.
7. Update related docs.
8. Run quality gate.
9. Run self-review.
10. Fix issues if needed.
11. Commit.
12. Mark task done.

## Task Status Values

Use these statuses:

- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `FAILED`
- `DONE`

## Done Update

When a task is completed, append to `docs/tasks/done.md`:

```md
## TASK-XXX: Title

Status: DONE
CompletedAt: YYYY-MM-DD HH:mm
Branch: feature/TASK-XXX-title
Commit: <commit hash>

Summary:
- ...

Quality Gate:
- lint: pass
- typecheck: pass
- test: pass
- build: pass
```

## Failed Update

When a task fails, append to `docs/tasks/failed.md` using `.ai/failure-report-template.md`.

## Continue Rule

Continue automatically to the next task unless a hard stop condition is triggered.

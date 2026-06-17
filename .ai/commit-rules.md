# Commit Rules

## Branch Format

Use this branch format:

```txt
feature/TASK-XXX-short-title
```

Examples:

```txt
feature/TASK-020-wrangler-config
feature/TASK-040-config-tables
feature/TASK-070-mastra-workflow
```

## Commit Format

Use this commit format:

```txt
task(TASK-XXX): short task title
```

Commit body:

```txt
Summary:
- ...

Files changed:
- ...

Tests:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build

Notes:
- ...
```

## Commit Requirements

Commit only if:

- Current task acceptance criteria pass.
- Quality gate passes.
- Self-review passes.
- No stop condition is active.
- Documentation is updated if required.

## Forbidden Commits

Do not commit:

- Hardcoded secrets.
- Hardcoded runtime configuration.
- Destructive migrations.
- Table names without `sh_` prefix.
- Column names containing underscores.
- Broken build.
- Tests skipped without explanation.
- Generated files not required by the project.

## Merge Policy

For autopilot mode:

- Commit per task.
- Keep each task atomic.
- Do not squash unrelated tasks.
- Do not merge to production branch unless a deploy/release task explicitly requires it.

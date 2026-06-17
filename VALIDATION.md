# Validation Report — v4 Autopilot

## Generated Files

- Source directory: `/mnt/data/shopee_source_docs_v4_autopilot`
- ZIP: `/mnt/data/shopee_product_research_ai_source_of_truth_autopilot_v4.zip`

## Autopilot Files

Added:

- `.ai/autopilot-prompt.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`
- `.ai/commit-rules.md`
- `.ai/task-runner.md`
- `.ai/self-review.md`
- `.ai/failure-report-template.md`
- `docs/tasks/backlog.md`
- `docs/tasks/current-task.md`
- `docs/tasks/done.md`
- `docs/tasks/failed.md`
- `docs/tasks/task-template.md`
- `scripts/quality-gate.sh`
- `scripts/validate-db-naming.js`
- `scripts/validate-no-hardcode.js`
- `scripts/validate-source-of-truth.js`
- `scripts/autopilot.sh`

## Database Naming Rule

- Table prefix required: `sh_`
- Column names: camelCase only
- Column underscore allowed: No

## Security Rule

Cloudflare token is not written into Markdown or source files. Use `wrangler secret put CLOUDFLARE_API_TOKEN`.

## Notes

This package is designed for 100% autopilot coding execution with hard stop conditions.

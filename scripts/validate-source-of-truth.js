#!/usr/bin/env node
import fs from "node:fs";

const required = [
  "README.md",
  "docs/prd/prd.md",
  "docs/prd/user-stories.md",
  "docs/prd/acceptance-criteria.md",
  "docs/architecture/technical-decisions.md",
  "docs/architecture/implementation-stack.md",
  "docs/shared/enums.md",
  "docs/database/schema.md",
  "docs/database/naming-rules.md",
  "docs/api/api-contract.md",
  "docs/configuration/env-variables.md",
  "docs/configuration/runtime-configuration.md",
  "docs/shopee/search-api-strategy.md",
  "docs/ai/mastra-orchestrator.md",
  "docs/ai/9router-configuration.md",
  "docs/ui/configuration-crud.md",
  "docs/tasks/autopilot-task-contract.md",
  ".ai/agent-rules.md",
  ".ai/review-checklist.md",
  ".ai/autopilot-prompt.md",
  ".ai/autopilot-policy.md",
  ".ai/stop-conditions.md",
  "docs/tasks/backlog.md",
  "docs/tasks/current-task.md",
  "scripts/quality-gate.sh",
  "scripts/quality-gate.js",
  "scripts/validate-db-naming.js",
  "scripts/validate-no-hardcode.js",
];

let failed = false;
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`[SOURCE OF TRUTH] Missing required file: ${file}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("[SOURCE OF TRUTH] Passed");

#!/usr/bin/env node
import fs from "node:fs";

const required = [
  "README.md",
  "docs/prd.md",
  "docs/architecture.md",
  "docs/shared/enums.md",
  "docs/database/schema.md",
  "docs/database/naming-rules.md",
  "docs/api/api-contract.md",
  "docs/configuration/env-variables.md",
  "docs/configuration/runtime-configuration.md",
  "docs/shopee/search-api-strategy.md",
  "docs/ai-orchestration.md",
  "docs/ui/configuration-crud.md",
  "docs/tasks/autopilot-task-contract.md",
  ".ai/agent-instructions.md",
  ".ai/autopilot-system.md",
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

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ignoredDirs = new Set(["node_modules", ".git", ".wrangler", "dist", "build", ".output", "coverage"]);
const ignoredFiles = new Set([".env.example"]);
const allowedDocs = new Set([
  "docs/configuration/env-variables.md",
  "docs/configuration/runtime-configuration.md",
  "docs/ai/9router-configuration.md",
  "docs/architecture/technical-decisions.md",
  "docs/prd/prd.md",
  "docs/tasks/autopilot-task-contract.md",
  "docs/api/api-contract.md",
]);

const patterns = [
  { name: "Cloudflare token", regex: /cfut_[A-Za-z0-9_-]{20,}/g },
  {
    name: "Likely API key assignment",
    regex: /(apiKey|apikey|api_key|token|secret)\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/gi,
  },
  { name: "Hardcoded 9router base URL", regex: /https?:\/\/[^\s'"`]*9router[^\s'"`]*/gi },
  {
    name: "Hardcoded model string",
    regex: /(model|modelName)\s*[:=]\s*['"][A-Za-z0-9_.:/-]{3,}['"]/gi,
  },
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(full, files);
    } else {
      const rel = full.replace(/\\/g, "/");
      if (ignoredFiles.has(entry.name)) continue;
      if (/\.(ts|tsx|js|jsx|json|toml|md|sql|yml|yaml)$/.test(entry.name)) files.push(rel);
    }
  }
  return files;
}

const files = walk('.');
let failed = false;

for (const file of files) {
  const normalized = file.replace(/^\.\//, "");
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern.regex)];
    if (!matches.length) continue;

    // Allow docs to describe placeholders but not actual cfut tokens.
    if (allowedDocs.has(normalized) && pattern.name !== "Cloudflare token") continue;

    for (const match of matches) {
      const value = match[0];
      if (value.includes("<set-via-secret>") || value.includes("process.env") || value.includes("env.")) {
        continue;
      }
      console.error(`[NO HARDCODE] ${pattern.name} in ${normalized}: ${value.slice(0, 120)}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("[NO HARDCODE] Passed");

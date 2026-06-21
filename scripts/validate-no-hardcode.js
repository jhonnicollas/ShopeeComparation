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

function parseGitignore(rootDir) {
  const gitignorePath = path.join(rootDir, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return [];
  const lines = fs.readFileSync(gitignorePath, "utf8").split(/\r?\n/);
  const patterns = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    patterns.push(line);
  }
  return patterns;
}

function gitignoreToRegex(gitignoreLine) {
  let line = gitignoreLine;
  let negated = false;
  if (line.startsWith("!")) {
    negated = true;
    line = line.slice(1);
  }
  const absolute = line.startsWith("/");
  let body = line.replace(/^\/+/, "");
  if (absolute) body = "/" + body;
  body = body.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
  let regex;
  if (body.endsWith("/")) {
    const dir = body;
    regex = new RegExp(`(^${dir}.*|/${dir}.*)$`);
  } else if (body.includes("/") || absolute) {
    regex = new RegExp(`^${body}(/.*)?$`);
  } else {
    regex = new RegExp(`(/${body}|/${body}$|^${body}$)`);
  }
  return { regex, negated };
}

function isGitignored(relPath, isDir, compiledGitignore) {
  let ignored = false;
  for (const { regex, negated } of compiledGitignore) {
    if (regex.test(relPath)) {
      ignored = !negated;
    }
  }
  return ignored;
}

function walk(dir, rootDir, compiledGitignore, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(rootDir, full).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      if (isGitignored(rel + "/", true, compiledGitignore)) continue;
      walk(full, rootDir, compiledGitignore, files);
    } else {
      if (ignoredFiles.has(entry.name)) continue;
      if (isGitignored(rel, false, compiledGitignore)) continue;
      if (!/\.(ts|tsx|js|jsx|json|toml|md|sql|yml|yaml)$/.test(entry.name)) continue;
      files.push(rel);
    }
  }
  return files;
}

const rootDir = path.resolve(".");
const compiledGitignore = parseGitignore(rootDir).map((line) => gitignoreToRegex(line));
const files = walk(".", rootDir, compiledGitignore);
let failed = false;

for (const rel of files) {
  const normalized = rel.replace(/^\.\//, "");
  const fullPath = path.join(rootDir, rel);
  const text = fs.readFileSync(fullPath, "utf8");
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern.regex)];
    if (!matches.length) continue;

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

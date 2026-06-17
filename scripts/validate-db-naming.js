#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const roots = [
  "packages/db",
  "workers",
  "apps",
  "docs/database",
].filter((p) => fs.existsSync(p));

const sqlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".wrangler", ".git", "dist", "build"].includes(entry.name)) continue;
      walk(full);
    } else if (/\.(sql|ts|tsx|js|jsx|md)$/.test(entry.name)) {
      sqlFiles.push(full);
    }
  }
}
roots.forEach(walk);

let failed = false;
const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?([A-Za-z0-9_]+)[`"']?/gi;

for (const file of sqlFiles) {
  const text = fs.readFileSync(file, "utf8");
  let match;
  while ((match = tableRegex.exec(text))) {
    const tableName = match[1];
    if (!tableName.startsWith("sh_")) {
      console.error(`[DB NAMING] Table without sh_ prefix in ${file}: ${tableName}`);
      failed = true;
    }
  }

  const columnMatches = text.matchAll(/^\s*[`"']?([A-Za-z][A-Za-z0-9_]*)[`"']?\s+(TEXT|INTEGER|REAL|BLOB|BOOLEAN|NUMERIC|DATETIME|DATE|JSON)\b/gim);
  for (const col of columnMatches) {
    const colName = col[1];
    if (colName.includes("_")) {
      console.error(`[DB NAMING] Column contains underscore in ${file}: ${colName}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("[DB NAMING] Passed");

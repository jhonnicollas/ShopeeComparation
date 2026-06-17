#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";

function run(command, args) {
  console.log(`Running: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPnpm(args) {
  if (process.platform === "win32") {
    run("cmd.exe", ["/c", "pnpm", ...args]);
    return;
  }
  run("pnpm", args);
}

function runNodeScriptIfExists(file) {
  if (fs.existsSync(file)) {
    run(process.execPath, [file]);
  }
}

console.log("\n== Quality Gate ==\n");

if (!fs.existsSync("package.json")) {
  console.log(
    "package.json not found. Bootstrap phase is still in progress; running source-of-truth checks only.",
  );
  runNodeScriptIfExists("scripts/validate-db-naming.js");
  runNodeScriptIfExists("scripts/validate-no-hardcode.js");
  runNodeScriptIfExists("scripts/validate-source-of-truth.js");
  console.log("Quality gate completed in bootstrap mode.");
  process.exit(0);
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scripts = packageJson.scripts ?? {};

for (const scriptName of ["lint", "typecheck", "test", "build"]) {
  if (scripts[scriptName]) {
    runPnpm([scriptName]);
  } else {
    console.log(`Skipping missing script: ${scriptName}`);
  }
}

runNodeScriptIfExists("scripts/validate-db-naming.js");
runNodeScriptIfExists("scripts/validate-no-hardcode.js");
runNodeScriptIfExists("scripts/validate-source-of-truth.js");

console.log("Quality gate completed.");

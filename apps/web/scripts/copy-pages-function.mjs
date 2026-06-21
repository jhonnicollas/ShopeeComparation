#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve("functions/_worker.js");
const destDir = resolve("dist");
const dest = resolve("dist/_worker.js");

if (!existsSync(src)) {
  console.error(`[copy-pages-function] source not found: ${src}`);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-pages-function] copied ${src} -> ${dest}`);

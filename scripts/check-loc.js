// scripts/check-loc.js
// Usage: node scripts/check-loc.js [--max=700] [--fail-on-warning]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import minimist from "minimist";

const argv = minimist(process.argv.slice(2));
const MAX = parseInt(argv.max || process.env.CHECK_LOC_MAX || 700, 10);
const ROOT = process.cwd();
const IGNORED_DIRS = ["node_modules", ".git", "dist", "build", ".wrangler"];

function isIgnored(p) {
  return IGNORED_DIRS.some(
    (dir) => p.includes(path.sep + dir + path.sep) || p.endsWith(path.sep + dir)
  );
}

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!isIgnored(filePath)) results.push(...walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function countLines(file) {
  try {
    const content = fs.readFileSync(file, "utf8");
    // Count non-empty lines as a heuristic (treat CRLF and LF)
    return content.split(/\r?\n/).length;
  } catch (error) {
    console.error(`Error reading file ${file}:`, error);
    return 0;
  }
}

const files = walk(ROOT).filter((f) =>
  /\.(js|ts|tsx|jsx|go|py|rs|java|c|cpp|cs|swift|html|css)$/i.test(f)
);
const offenders = [];
for (const f of files) {
  if (isIgnored(f)) continue;
  const lines = countLines(f);
  if (lines > MAX) offenders.push({ file: path.relative(ROOT, f), lines });
}

if (offenders.length) {
  console.log(`Files exceeding ${MAX} LOC:`);
  offenders.forEach((o) => console.log(`  - ${o.file}: ${o.lines} lines`));
  if (argv["fail-on-warning"] || process.env.CHECK_LOC_FAIL === "1") {
    console.error(`
Failing because files exceed ${MAX} LOC.`);
    process.exit(2);
  } else {
    process.exit(1);
  }
} else {
  console.log(`All files are within ${MAX} LOC.`);
  process.exit(0);
}

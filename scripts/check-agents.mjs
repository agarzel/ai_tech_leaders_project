#!/usr/bin/env node
// Agent-instruction guard (task-router, lesson 10): fails when the root AGENTS.md is longer than 150 lines, a package
// AGENTS.md is longer than 120, a path named in the root "| Task | Read |" table does not exist, or a CLAUDE.md next to
// an AGENTS.md holds more than the `@AGENTS.md` import.
// Usage: node scripts/check-agents.mjs
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT_BUDGET = 150;
export const UNIT_BUDGET = 120;
const CLAUDE_IMPORT = "@AGENTS.md";

export function lineCount(text) {
  return text.trimEnd().split("\n").length;
}

/** Paths named in the Read column of the routing table, the one whose header is `| Task | Read |`. */
export function parseRoutes(markdown) {
  const routes = [];
  let inTable = false;
  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();
    if (/^\|\s*Task\s*\|\s*Read\s*\|$/.test(trimmed)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!trimmed.startsWith("|")) break;
    if (/^\|[-\s|]+\|$/.test(trimmed)) continue;
    const [, , readCell = ""] = trimmed.split("|");
    for (const [, target] of readCell.matchAll(/`([^`]+)`/g)) routes.push(target);
  }
  return routes;
}

/** Folders under packages/ that have their own AGENTS.md, relative to `root`. */
function unitDirs(root) {
  const packages = path.join(root, "packages");
  return readdirSync(packages)
    .filter((name) => existsSync(path.join(packages, name, "AGENTS.md")))
    .map((name) => path.join("packages", name));
}

function claudeProblems(root, dir) {
  const label = dir || "root";
  const file = path.join(root, dir, "CLAUDE.md");
  if (!existsSync(file)) return [`${label}: missing CLAUDE.md next to AGENTS.md`];
  if (readFileSync(file, "utf8").trim() !== CLAUDE_IMPORT) return [`${label}: CLAUDE.md must contain only ${CLAUDE_IMPORT}`];
  return [];
}

/** Every problem found under `root`, as readable messages. Empty when the instructions pass. */
export function findProblems(root = ROOT) {
  const rootText = readFileSync(path.join(root, "AGENTS.md"), "utf8");
  const problems = [];

  if (lineCount(rootText) > ROOT_BUDGET) problems.push(`AGENTS.md is ${lineCount(rootText)} lines, budget ${ROOT_BUDGET}`);

  const routes = parseRoutes(rootText);
  if (routes.length === 0) problems.push("AGENTS.md has no `| Task | Read |` routing table");
  for (const route of routes) {
    if (!existsSync(path.join(root, route))) problems.push(`AGENTS.md routes to a missing path: ${route}`);
  }

  problems.push(...claudeProblems(root, ""));

  for (const dir of unitDirs(root)) {
    const lines = lineCount(readFileSync(path.join(root, dir, "AGENTS.md"), "utf8"));
    if (lines > UNIT_BUDGET) problems.push(`${dir}/AGENTS.md is ${lines} lines, budget ${UNIT_BUDGET}`);
    problems.push(...claudeProblems(root, dir));
  }

  return problems;
}

export function run(root = ROOT, log = console.log) {
  const problems = findProblems(root);
  if (problems.length === 0) {
    log("Agent instructions: OK");
    return 0;
  }
  for (const problem of problems) log(`- ${problem}`);
  log("Move the rule to the package that owns it, or fix the path, then run the check again.");
  return 1;
}

export function isEntryPoint(argv1, moduleUrl = import.meta.url) {
  return argv1 !== undefined && pathToFileURL(argv1).href === moduleUrl;
}

if (isEntryPoint(process.argv[1])) {
  process.exitCode = run();
}

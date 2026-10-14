#!/usr/bin/env node
// One-command, idempotent local setup: `npm run setup` (issue #13).
// Node built-ins only – this runs before `npm install`, so no dependencies are available yet.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Vitest 5 (unit tests) needs Node 22.12+; older versions still run the app, so this only warns.
export const MIN_NODE_VERSION = [22, 12];
export const DB_HEALTH_TIMEOUT_MS = 60_000;
const DB_POLL_INTERVAL_MS = 1_000;

export class SetupError extends Error {}

/** Runs a command and returns its exit status and output (never throws on a non-zero exit). */
export function runCommand(command, args, { cwd, inherit = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    // npm is a .cmd shim on Windows, which spawnSync can only start through a shell.
    shell: process.platform === "win32",
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

export function createContext(overrides = {}) {
  return {
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
    run: runCommand,
    fs: { existsSync, statSync, copyFileSync },
    log: console.log,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: Date.now,
    nodeVersion: process.versions.node,
    ...overrides,
  };
}

/** `docker compose ps --format json` prints one JSON object per line (or an array on older versions). */
export function parseComposePs(output) {
  const trimmed = output.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  return trimmed.split("\n").map((line) => JSON.parse(line));
}

function dbStatus(ctx) {
  const result = ctx.run("docker", ["compose", "ps", "--format", "json", "db"], { cwd: ctx.root });
  const [db] = parseComposePs(result.stdout);
  return { running: db?.State === "running", healthy: db?.Health === "healthy" };
}

function mustSucceed(result, message) {
  if (result.status !== 0) throw new SetupError(message);
}

/** Each step: `skip` says why nothing needs doing (or null), `run` does the work. Order = README "Running locally". */
export const steps = [
  {
    name: "Node.js version",
    skip: (ctx) => {
      const [major, minor] = ctx.nodeVersion.split(".").map(Number);
      const [minMajor, minMinor] = MIN_NODE_VERSION;
      const supported = major > minMajor || (major === minMajor && minor >= minMinor);
      return supported ? `Node ${ctx.nodeVersion}` : null;
    },
    run: (ctx) => {
      ctx.log(`  ⚠️  Node ${ctx.nodeVersion} is older than ${MIN_NODE_VERSION.join(".")} – the app runs, but unit tests need a newer Node.`);
      return "warned";
    },
  },
  {
    name: "Dependencies (npm install)",
    skip: (ctx) => {
      // npm writes node_modules/.package-lock.json after every install; older than the lockfile = stale.
      const installed = path.join(ctx.root, "node_modules/.package-lock.json");
      const lockfile = path.join(ctx.root, "package-lock.json");
      if (!ctx.fs.existsSync(installed)) return null;
      return ctx.fs.statSync(installed).mtimeMs >= ctx.fs.statSync(lockfile).mtimeMs ? "up to date with package-lock.json" : null;
    },
    run: (ctx) => {
      mustSucceed(ctx.run("npm", ["install"], { cwd: ctx.root, inherit: true }), "npm install failed – see the output above.");
      return "installed";
    },
  },
  {
    name: "Environment file (.env)",
    skip: (ctx) => (ctx.fs.existsSync(path.join(ctx.root, ".env")) ? ".env exists (left untouched)" : null),
    run: (ctx) => {
      const example = path.join(ctx.root, ".env.example");
      if (!ctx.fs.existsSync(example)) {
        throw new SetupError("`.env.example` is missing – restore it with `git checkout .env.example` and run `npm run setup` again.");
      }
      ctx.fs.copyFileSync(example, path.join(ctx.root, ".env"));
      return "created from .env.example";
    },
  },
  {
    name: "PostgreSQL (docker compose)",
    skip: (ctx) => {
      if (ctx.run("docker", ["info"], { cwd: ctx.root }).status !== 0) {
        throw new SetupError("Docker is not installed or not running. Install/start Docker Desktop and run `npm run setup` again.");
      }
      const { running, healthy } = dbStatus(ctx);
      return running && healthy ? "db container running and healthy" : null;
    },
    run: async (ctx) => {
      mustSucceed(ctx.run("docker", ["compose", "up", "-d", "db"], { cwd: ctx.root, inherit: true }), "`docker compose up -d db` failed – see the output above.");
      const deadline = ctx.now() + DB_HEALTH_TIMEOUT_MS;
      while (ctx.now() < deadline) {
        if (dbStatus(ctx).healthy) return "started and healthy";
        await ctx.sleep(DB_POLL_INTERVAL_MS);
      }
      throw new SetupError(`The db container did not become healthy within ${DB_HEALTH_TIMEOUT_MS / 1000}s. Check \`docker compose logs db\`.`);
    },
  },
  {
    name: "Database migrations",
    skip: (ctx) => {
      const pending = ctx.run("npm", ["exec", "-w", "@devmentor/db", "--", "mikro-orm", "migration:pending"], { cwd: ctx.root });
      mustSucceed(pending, `Could not check pending migrations:\n${pending.stdout}${pending.stderr}`);
      return pending.stdout.includes("No pending migrations") ? "no pending migrations" : null;
    },
    run: (ctx) => {
      mustSucceed(ctx.run("npm", ["run", "db:migrate"], { cwd: ctx.root, inherit: true }), "`npm run db:migrate` failed – see the output above.");
      return "applied";
    },
  },
];

/** Runs every step in order. Returns the process exit code (0 = ready, 1 = a step failed). */
export async function runSetup(ctx = createContext()) {
  ctx.log("DevMentor setup\n");
  for (const step of steps) {
    try {
      const reason = await step.skip(ctx);
      const outcome = reason ? `skipped – ${reason}` : `done – ${await step.run(ctx)}`;
      ctx.log(`✓ ${step.name}: ${outcome}`);
    } catch (error) {
      if (!(error instanceof SetupError)) throw error;
      ctx.log(`✗ ${step.name}: failed – ${error.message}`);
      return 1;
    }
  }
  ctx.log("\nReady. Start the app with `npm run dev`:");
  ctx.log("  app          http://localhost:3000");
  ctx.log("  admin panel  http://localhost:3000/admin");
  ctx.log("  health       http://localhost:3000/api/health");
  return 0;
}

export function isEntryPoint(argv1, moduleUrl = import.meta.url) {
  return argv1 !== undefined && pathToFileURL(argv1).href === moduleUrl;
}

if (isEntryPoint(process.argv[1])) {
  process.exitCode = await runSetup();
}

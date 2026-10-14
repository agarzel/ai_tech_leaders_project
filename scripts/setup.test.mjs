import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { DB_HEALTH_TIMEOUT_MS, createContext, parseComposePs, runSetup, steps } from "./setup.mjs";

const ROOT = "/repo";
const ok = (stdout = "") => ({ status: 0, stdout, stderr: "" });
const fail = (stderr = "boom") => ({ status: 1, stdout: "", stderr });
const composeDb = (state, health) => ok(JSON.stringify({ Service: "db", State: state, Health: health }));

/**
 * A fake machine: by default everything is already set up (a second run).
 * Override `responses` (keyed by "command args…") and `files` to model other states.
 */
function setup({ responses = {}, files = {}, nodeVersion = "22.22.2", dbHealthAfterStart = [] } = {}) {
  const defaults = {
    "docker info": ok(),
    "docker compose ps --format json db": composeDb("running", "healthy"),
    "docker compose up -d db": ok(),
    "npm install": ok(),
    "npm exec -w @devmentor/db -- mikro-orm migration:pending": ok("No pending migrations"),
    "npm run db:migrate": ok(),
  };
  const table = { ...defaults, ...responses };
  const healthQueue = [...dbHealthAfterStart];
  const fileState = {
    [path.join(ROOT, "node_modules/.package-lock.json")]: { mtimeMs: 200 },
    [path.join(ROOT, "package-lock.json")]: { mtimeMs: 100 },
    [path.join(ROOT, ".env")]: {},
    [path.join(ROOT, ".env.example")]: {},
    ...files,
  };
  const calls = [];
  let clock = 0;
  const ctx = createContext({
    root: ROOT,
    nodeVersion,
    log: vi.fn(),
    sleep: vi.fn(async (ms) => {
      clock += ms;
    }),
    now: () => clock,
    run: vi.fn((command, args) => {
      const key = [command, ...args].join(" ");
      calls.push(key);
      if (key === "docker compose ps --format json db" && healthQueue.length > 0) return healthQueue.shift();
      if (!(key in table)) throw new Error(`unexpected command: ${key}`);
      return table[key];
    }),
    fs: {
      existsSync: vi.fn((file) => fileState[file] !== undefined),
      statSync: vi.fn((file) => fileState[file]),
      copyFileSync: vi.fn(),
    },
  });
  const output = () => ctx.log.mock.calls.map(([line]) => line).join("\n");
  return { ctx, calls, output };
}

describe("runSetup", () => {
  it("skips every step on a machine that is already set up (second run)", async () => {
    const { ctx, calls, output } = setup();

    expect(await runSetup(ctx)).toBe(0);

    expect(output()).toContain("✓ Node.js version: skipped – Node 22.22.2");
    expect(output()).toContain("✓ Dependencies (npm install): skipped – up to date with package-lock.json");
    expect(output()).toContain("✓ Environment file (.env): skipped – .env exists (left untouched)");
    expect(output()).toContain("✓ PostgreSQL (docker compose): skipped – db container running and healthy");
    expect(output()).toContain("✓ Database migrations: skipped – no pending migrations");
    expect(output()).toContain("Ready. Start the app with `npm run dev`");
    expect(calls).not.toContain("npm install");
    expect(calls).not.toContain("docker compose up -d db");
    expect(calls).not.toContain("npm run db:migrate");
    expect(ctx.fs.copyFileSync).not.toHaveBeenCalled();
  });

  it("does every step on a fresh clone", async () => {
    const { ctx, calls, output } = setup({
      files: { [path.join(ROOT, "node_modules/.package-lock.json")]: undefined, [path.join(ROOT, ".env")]: undefined },
      responses: {
        "docker compose ps --format json db": ok(""),
        "npm exec -w @devmentor/db -- mikro-orm migration:pending": ok("Migration20261013122932"),
      },
      dbHealthAfterStart: [ok(""), composeDb("running", "starting"), composeDb("running", "healthy")],
    });

    expect(await runSetup(ctx)).toBe(0);

    expect(calls).toEqual([
      "npm install",
      "docker info",
      "docker compose ps --format json db",
      "docker compose up -d db",
      "docker compose ps --format json db",
      "docker compose ps --format json db",
      "npm exec -w @devmentor/db -- mikro-orm migration:pending",
      "npm run db:migrate",
    ]);
    expect(ctx.fs.copyFileSync).toHaveBeenCalledWith(path.join(ROOT, ".env.example"), path.join(ROOT, ".env"));
    expect(ctx.sleep).toHaveBeenCalledTimes(1);
    expect(output()).toContain("✓ Dependencies (npm install): done – installed");
    expect(output()).toContain("✓ Environment file (.env): done – created from .env.example");
    expect(output()).toContain("✓ PostgreSQL (docker compose): done – started and healthy");
    expect(output()).toContain("✓ Database migrations: done – applied");
  });

  it("passes the repo root to every command and streams long-running ones", async () => {
    const { ctx } = setup({
      files: { [path.join(ROOT, "node_modules/.package-lock.json")]: undefined },
    });

    await runSetup(ctx);

    expect(ctx.run).toHaveBeenCalledWith("npm", ["install"], { cwd: ROOT, inherit: true });
    expect(ctx.run).toHaveBeenCalledWith("docker", ["info"], { cwd: ROOT });
  });

  it("reinstalls dependencies when package-lock.json changed after the last install", async () => {
    const { ctx, calls } = setup({ files: { [path.join(ROOT, "package-lock.json")]: { mtimeMs: 300 } } });

    await runSetup(ctx);

    expect(calls).toContain("npm install");
  });

  it("never overwrites an existing .env", async () => {
    const { ctx } = setup();

    await runSetup(ctx);

    expect(ctx.fs.copyFileSync).not.toHaveBeenCalled();
  });

  it("starts an existing but unhealthy db container", async () => {
    const { ctx, calls } = setup({
      responses: { "docker compose ps --format json db": composeDb("exited", "") },
      dbHealthAfterStart: [composeDb("exited", ""), composeDb("running", "healthy")],
    });

    expect(await runSetup(ctx)).toBe(0);
    expect(calls).toContain("docker compose up -d db");
  });

  it.each([
    ["22.12.0", "skipped – Node 22.12.0"],
    ["24.1.0", "skipped – Node 24.1.0"],
    ["22.11.9", "done – warned"],
    ["20.19.0", "done – warned"],
  ])("Node %s → %s", async (nodeVersion, outcome) => {
    const { ctx, output } = setup({ nodeVersion });

    expect(await runSetup(ctx)).toBe(0);
    expect(output()).toContain(`✓ Node.js version: ${outcome}`);
  });

  it("warns (but continues) on an old Node", async () => {
    const { ctx, output } = setup({ nodeVersion: "22.11.0" });

    expect(await runSetup(ctx)).toBe(0);
    expect(output()).toContain("⚠️  Node 22.11.0 is older than 22.12");
  });

  describe("failures stop the run with exit code 1 and an actionable message", () => {
    it("Docker is not running", async () => {
      const { ctx, calls, output } = setup({ responses: { "docker info": fail("Cannot connect") } });

      expect(await runSetup(ctx)).toBe(1);
      expect(output()).toContain("✗ PostgreSQL (docker compose): failed – Docker is not installed or not running.");
      expect(calls).not.toContain("npm run db:migrate");
      expect(output()).not.toContain("Ready.");
    });

    it(".env.example is missing", async () => {
      const { ctx, output } = setup({
        files: { [path.join(ROOT, ".env")]: undefined, [path.join(ROOT, ".env.example")]: undefined },
      });

      expect(await runSetup(ctx)).toBe(1);
      expect(output()).toContain("✗ Environment file (.env): failed – `.env.example` is missing");
      expect(ctx.fs.copyFileSync).not.toHaveBeenCalled();
    });

    it("npm install fails", async () => {
      const { ctx, output } = setup({
        files: { [path.join(ROOT, "node_modules/.package-lock.json")]: undefined },
        responses: { "npm install": fail() },
      });

      expect(await runSetup(ctx)).toBe(1);
      expect(output()).toContain("✗ Dependencies (npm install): failed – npm install failed");
    });

    it("docker compose up fails", async () => {
      const { ctx, output } = setup({
        responses: { "docker compose ps --format json db": ok(""), "docker compose up -d db": fail() },
      });

      expect(await runSetup(ctx)).toBe(1);
      expect(output()).toContain("failed – `docker compose up -d db` failed");
    });

    it("the db never becomes healthy", async () => {
      const { ctx, output } = setup({
        responses: { "docker compose ps --format json db": composeDb("running", "unhealthy") },
      });

      expect(await runSetup(ctx)).toBe(1);
      expect(output()).toContain(`did not become healthy within ${DB_HEALTH_TIMEOUT_MS / 1000}s`);
    });

    it("pending migrations cannot be checked", async () => {
      const { ctx, output } = setup({
        responses: { "npm exec -w @devmentor/db -- mikro-orm migration:pending": { status: 1, stdout: "out ", stderr: "connection refused" } },
      });

      expect(await runSetup(ctx)).toBe(1);
      expect(output()).toContain("Could not check pending migrations:\nout connection refused");
    });

    it("migrations fail", async () => {
      const { ctx, output } = setup({
        responses: {
          "npm exec -w @devmentor/db -- mikro-orm migration:pending": ok("Migration1"),
          "npm run db:migrate": fail(),
        },
      });

      expect(await runSetup(ctx)).toBe(1);
      expect(output()).toContain("✗ Database migrations: failed – `npm run db:migrate` failed");
    });
  });

  it("rethrows unexpected errors instead of hiding them", async () => {
    const { ctx } = setup();
    ctx.fs.existsSync.mockImplementation(() => {
      throw new TypeError("disk on fire");
    });

    await expect(runSetup(ctx)).rejects.toThrow("disk on fire");
  });
});

describe("parseComposePs", () => {
  it("handles empty output", () => {
    expect(parseComposePs("  \n")).toEqual([]);
  });

  it("handles one JSON object per line (Compose v2.21+)", () => {
    expect(parseComposePs('{"Service":"db"}\n{"Service":"app"}\n')).toEqual([{ Service: "db" }, { Service: "app" }]);
  });

  it("handles a JSON array (older Compose)", () => {
    expect(parseComposePs('[{"Service":"db"}]')).toEqual([{ Service: "db" }]);
  });
});

describe("steps", () => {
  it("follow the README order", () => {
    expect(steps.map((step) => step.name)).toEqual([
      "Node.js version",
      "Dependencies (npm install)",
      "Environment file (.env)",
      "PostgreSQL (docker compose)",
      "Database migrations",
    ]);
  });
});

describe("createContext", () => {
  it("defaults to the repository root and real implementations", async () => {
    const ctx = createContext();

    expect(ctx.root).toBe(path.resolve(import.meta.dirname, ".."));
    expect(ctx.nodeVersion).toBe(process.versions.node);
    expect(typeof ctx.now()).toBe("number");
    vi.useFakeTimers();
    const slept = ctx.sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(slept).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

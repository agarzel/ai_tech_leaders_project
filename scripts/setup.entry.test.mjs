import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// Command-line entry and the real command runner, with child processes and the filesystem mocked
// so nothing is installed or started.
vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));
vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => true),
  statSync: vi.fn(() => ({ mtimeMs: 1 })),
  copyFileSync: vi.fn(),
}));

const SETUP = fileURLToPath(new URL("./setup.mjs", import.meta.url));

function respondLikeAReadyMachine() {
  vi.mocked(spawnSync).mockImplementation((command, args) => {
    const key = [command, ...args].join(" ");
    if (key.startsWith("docker compose ps")) return { status: 0, stdout: '{"State":"running","Health":"healthy"}', stderr: "" };
    if (key.includes("migration:pending")) return { status: 0, stdout: "No pending migrations", stderr: "" };
    return { status: 0, stdout: "", stderr: "" };
  });
}

describe("command-line entry", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = undefined;
    vi.resetModules();
  });

  it("runs the setup and sets the exit code when executed directly", async () => {
    respondLikeAReadyMachine();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    process.argv = [process.argv[0], SETUP];

    await import("./setup.mjs");

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith("✓ Database migrations: skipped – no pending migrations");
  });

  it("does nothing when imported as a module", async () => {
    const { isEntryPoint } = await import("./setup.mjs");

    expect(isEntryPoint(undefined)).toBe(false);
    expect(isEntryPoint("/somewhere/else.mjs")).toBe(false);
    expect(spawnSync).not.toHaveBeenCalled();
  });
});

describe("runCommand", () => {
  it("captures output by default and streams it on request", async () => {
    const { runCommand } = await import("./setup.mjs");
    vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: "hi", stderr: "" });

    expect(runCommand("echo", ["hi"], { cwd: "/repo" })).toEqual({ status: 0, stdout: "hi", stderr: "" });
    const shell = process.platform === "win32";
    expect(spawnSync).toHaveBeenCalledWith("echo", ["hi"], { cwd: "/repo", encoding: "utf8", stdio: "pipe", shell });

    runCommand("npm", ["install"], { cwd: "/repo", inherit: true });
    expect(spawnSync).toHaveBeenLastCalledWith("npm", ["install"], { cwd: "/repo", encoding: "utf8", stdio: "inherit", shell });
  });

  it("treats a killed or unstartable process as a failure without output", async () => {
    const { runCommand } = await import("./setup.mjs");
    vi.mocked(spawnSync).mockReturnValue({ status: null, stdout: null, stderr: null });

    expect(runCommand("missing-binary", [])).toEqual({ status: 1, stdout: "", stderr: "" });
  });
});

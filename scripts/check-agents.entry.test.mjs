import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// Command-line entry, in its own file so the module is imported fresh with a fake argv.
const SCRIPT = fileURLToPath(new URL("./check-agents.mjs", import.meta.url));

describe("command-line entry", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = undefined;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("checks the repository and sets the exit code when executed directly", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    process.argv = [process.argv[0], SCRIPT];

    await import("./check-agents.mjs");

    expect(process.exitCode).toBe(0);
  });
});

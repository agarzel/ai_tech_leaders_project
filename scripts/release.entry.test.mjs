import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// Command-line entry, in its own file so the module is imported fresh with a fake argv.
const SCRIPT = fileURLToPath(new URL("./release.mjs", import.meta.url));

describe("command-line entry", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = undefined;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("prints the release notes of the repository and sets the exit code when executed directly", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    process.argv = [process.argv[0], SCRIPT, "notes"];

    await import("./release.mjs");

    expect(process.exitCode).toBe(0);
    expect(log.mock.calls[0][0]).toMatch(/^# \d+\.\d+\.\d+ \(\d{4}-\d{2}-\d{2}\)/);
  });
});

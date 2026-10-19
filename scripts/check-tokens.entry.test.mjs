import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// Command-line entry, in its own file so the module is imported fresh with a fake argv.
const SCRIPT = fileURLToPath(new URL("./check-tokens.mjs", import.meta.url));

describe("command-line entry", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = undefined;
    vi.resetModules();
  });

  it("runs the check on the given paths and sets the exit code when executed directly", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    process.argv = [process.argv[0], SCRIPT, "packages/ui/src/lib/utils.ts"];

    await import("./check-tokens.mjs");

    expect(process.exitCode).toBe(0);
  });

  it("does nothing when imported as a module", async () => {
    const { isEntryPoint } = await import("./check-tokens.mjs");
    expect(isEntryPoint(undefined)).toBe(false);
    expect(isEntryPoint("/somewhere/else.mjs")).toBe(false);
    expect(isEntryPoint(SCRIPT)).toBe(true);
  });
});

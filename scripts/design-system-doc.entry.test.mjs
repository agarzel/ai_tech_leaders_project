import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// Command-line entry, in its own file so the module is imported fresh with a fake argv.
const SCRIPT = fileURLToPath(new URL("./design-system-doc.mjs", import.meta.url));

describe("command-line entry", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = undefined;
    vi.resetModules();
  });

  it("checks the document and sets the exit code when executed directly", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    process.argv = [process.argv[0], SCRIPT, "--check"];

    await import("./design-system-doc.mjs");

    expect(process.exitCode).toBe(0);
  });

  it("does nothing when imported as a module", async () => {
    const { isEntryPoint } = await import("./design-system-doc.mjs");
    expect(isEntryPoint(undefined)).toBe(false);
    expect(isEntryPoint("/somewhere/else.mjs")).toBe(false);
    expect(isEntryPoint(SCRIPT)).toBe(true);
  });
});

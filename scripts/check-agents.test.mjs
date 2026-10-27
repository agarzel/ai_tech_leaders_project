import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findProblems, isEntryPoint, lineCount, parseRoutes, ROOT_BUDGET, run, UNIT_BUDGET } from "./check-agents.mjs";

const ROUTE_TABLE = "| Task | Read |\n|---|---|\n| Bug fix | `docs/bug.md` |\n";

let root;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "check-agents-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function write(file, text) {
  const full = path.join(root, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, text);
}

/** A repo that passes unless a test changes one part of it. */
function repo({ rootText = `# Root\n\n${ROUTE_TABLE}`, claude = "@AGENTS.md\n", units = {} } = {}) {
  write("AGENTS.md", rootText);
  if (claude !== null) write("CLAUDE.md", claude);
  write("docs/bug.md", "# Bug\n");
  mkdirSync(path.join(root, "packages"), { recursive: true });
  for (const [name, text] of Object.entries(units)) {
    write(`packages/${name}/AGENTS.md`, text);
    write(`packages/${name}/CLAUDE.md`, "@AGENTS.md\n");
  }
}

describe("lineCount", () => {
  it("counts lines without the trailing newline", () => {
    expect(lineCount("a\nb\n")).toBe(2);
  });
});

describe("parseRoutes", () => {
  it("returns the backticked paths in the Read column of the Task table", () => {
    const markdown = "| Task | Read |\n|---|---|\n| Bug fix | `docs/bug.md` |\n| Feature | `docs/a.md`, `docs/b.md` |\n";
    expect(parseRoutes(markdown)).toEqual(["docs/bug.md", "docs/a.md", "docs/b.md"]);
  });

  it("ignores tables that do not have the Task and Read header", () => {
    expect(parseRoutes("| Name | Value |\n|---|---|\n| x | `docs/x.md` |\n")).toEqual([]);
  });

  it("stops at the first line that is not a table row", () => {
    const markdown = `${ROUTE_TABLE}\nSome paragraph with \`docs/other.md\`.\n| Late | \`docs/late.md\` |\n`;
    expect(parseRoutes(markdown)).toEqual(["docs/bug.md"]);
  });

  it("skips a row that has no Read cell", () => {
    expect(parseRoutes(`${ROUTE_TABLE}|\n`)).toEqual(["docs/bug.md"]);
  });
});

describe("findProblems", () => {
  it("reports nothing for a repo that follows the budgets and routes", () => {
    repo({ units: { core: "# core\n" } });
    expect(findProblems(root)).toEqual([]);
  });

  it("reports a root file over its line budget", () => {
    const rootText = `# Root\n\n${ROUTE_TABLE}${"line\n".repeat(ROOT_BUDGET)}`;
    repo({ rootText });
    expect(findProblems(root)).toContain(`AGENTS.md is ${lineCount(rootText)} lines, budget ${ROOT_BUDGET}`);
  });

  it("reports a root file without a routing table", () => {
    repo({ rootText: "# Root\n" });
    expect(findProblems(root)).toEqual(["AGENTS.md has no `| Task | Read |` routing table"]);
  });

  it("reports a routed path that does not exist", () => {
    repo({ rootText: "# Root\n\n| Task | Read |\n|---|---|\n| Bug fix | `docs/missing.md` |\n" });
    expect(findProblems(root)).toEqual(["AGENTS.md routes to a missing path: docs/missing.md"]);
  });

  it("reports a package AGENTS.md over its line budget", () => {
    repo({ units: { core: "line\n".repeat(UNIT_BUDGET + 1) } });
    expect(findProblems(root)).toEqual([`packages/core/AGENTS.md is ${UNIT_BUDGET + 1} lines, budget ${UNIT_BUDGET}`]);
  });

  it("ignores package folders without an AGENTS.md", () => {
    repo();
    write("packages/empty/README.md", "# nothing here\n");
    expect(findProblems(root)).toEqual([]);
  });

  it("reports a missing root CLAUDE.md", () => {
    repo({ claude: null });
    expect(findProblems(root)).toEqual(["root: missing CLAUDE.md next to AGENTS.md"]);
  });

  it("reports a root CLAUDE.md that says more than the import", () => {
    repo({ claude: "@AGENTS.md\nExtra rule\n" });
    expect(findProblems(root)).toEqual(["root: CLAUDE.md must contain only @AGENTS.md"]);
  });

  it("reports a package AGENTS.md without a CLAUDE.md next to it", () => {
    repo();
    write("packages/core/AGENTS.md", "# core\n");
    expect(findProblems(root)).toEqual(["packages/core: missing CLAUDE.md next to AGENTS.md"]);
  });
});

describe("run", () => {
  it("logs OK and returns 0 when the instructions pass", () => {
    repo();
    const log = vi.fn();
    expect(run(root, log)).toBe(0);
    expect(log).toHaveBeenCalledWith("Agent instructions: OK");
  });

  it("logs each problem and returns 1 when the instructions fail", () => {
    repo({ rootText: "# Root\n" });
    const log = vi.fn();
    expect(run(root, log)).toBe(1);
    expect(log).toHaveBeenCalledWith("- AGENTS.md has no `| Task | Read |` routing table");
  });
});

describe("isEntryPoint", () => {
  it("is false when there is no argv entry", () => {
    expect(isEntryPoint(undefined)).toBe(false);
  });

  it("is true only for this script's own path", () => {
    expect(isEntryPoint("/somewhere/else.mjs")).toBe(false);
    expect(isEntryPoint(fileURLToPath(new URL("./check-agents.mjs", import.meta.url)))).toBe(true);
  });
});

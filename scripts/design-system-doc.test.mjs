import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  BEGIN_MARKER,
  DATA_FILE,
  DOC_FILE,
  DocError,
  END_MARKER,
  ROOT,
  importPath,
  loadData,
  renderTables,
  replaceGenerated,
  run,
} from "./design-system-doc.mjs";

const DATA_SOURCE = `
export type Entry = { name: string };
export const GROUPS: { name: string; intro: string }[] = [
  { name: "Actions", intro: "x" },
  { name: "Empty group", intro: "y" },
];
export const COMPONENTS = [
  { name: "Button", group: "Actions", importLine: \`import { Button } from "@devmentor/ui/components/ui/button"\`, when: "One action.", whenNot: "A link | a menu." },
  { name: "TextLink", group: "Actions", importLine: \`<a className="link-text"> (utility)\`, when: "In text.", whenNot: "An action." },
];
`;

const doc = (body) => `# Doc\n\n${BEGIN_MARKER}\n\n${body}\n\n${END_MARKER}\n\nTail\n`;

describe("importPath", () => {
  it("takes the path after the package prefix of an import line", () => {
    expect(importPath('import { A } from "@devmentor/ui/backend/forms/CrudForm"')).toBe("backend/forms/CrudForm");
  });

  it("shows the class for the utility-only row", () => {
    expect(importPath('<a className="link-text"> (utility)')).toBe('class="link-text"');
  });

  it("fails loudly when neither form is present", () => {
    expect(() => importPath("something else")).toThrow(DocError);
  });
});

describe("loadData and renderTables", () => {
  it("evaluates the TypeScript data file and renders one table per group, escaping pipes", async () => {
    const markdown = renderTables(await loadData(DATA_SOURCE));
    expect(markdown).toBe(
      [
        "### Actions",
        "",
        "| Component | Import path | Use when | Not when |",
        "|---|---|---|---|",
        "| Button | `components/ui/button` | One action. | A link \\| a menu. |",
        '| TextLink | `class="link-text"` | In text. | An action. |',
        "",
        "### Empty group",
        "",
        "| Component | Import path | Use when | Not when |",
        "|---|---|---|---|",
      ].join("\n"),
    );
  });
});

describe("replaceGenerated", () => {
  it("replaces only the text between the markers", () => {
    expect(replaceGenerated(doc("old"), "new")).toBe(doc("new"));
  });

  it.each([
    ["no markers", "# Doc\n"],
    ["only the begin marker", `${BEGIN_MARKER}\n`],
    ["markers in the wrong order", `${END_MARKER}\n${BEGIN_MARKER}\n`],
  ])("fails with an actionable message for %s", (_name, text) => {
    expect(() => replaceGenerated(text, "x")).toThrow(/must contain/);
  });
});

describe("run", () => {
  const dataPath = path.join("/repo", DATA_FILE);
  const docPath = path.join("/repo", DOC_FILE);
  const setup = (current) => {
    const files = { [dataPath]: DATA_SOURCE, [docPath]: current };
    return {
      root: "/repo",
      readFile: (f) => files[f],
      writeFile: vi.fn(),
      log: vi.fn(),
    };
  };
  const generated = async () => renderTables(await loadData(DATA_SOURCE));

  it("writes the regenerated section when the document is stale", async () => {
    const deps = setup(doc("stale"));
    expect(await run([], deps)).toBe(0);
    expect(deps.writeFile).toHaveBeenCalledWith(docPath, doc(await generated()));
    expect(deps.log).toHaveBeenCalledWith(`✓ ${DOC_FILE} updated from ${DATA_FILE}.`);
  });

  it("reports an up-to-date document without writing", async () => {
    const deps = setup(doc(await generated()));
    expect(await run([], deps)).toBe(0);
    expect(deps.writeFile).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith(`✓ ${DOC_FILE} is up to date with ${DATA_FILE}.`);
  });

  it("fails in check mode when the document is stale and never writes", async () => {
    const deps = setup(doc("stale"));
    expect(await run(["--check"], deps)).toBe(1);
    expect(deps.writeFile).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith(`✗ ${DOC_FILE} is out of date with ${DATA_FILE}. Run: npm run docs:design-system`);
  });

  it("passes in check mode when the document is current", async () => {
    expect(await run(["--check"], setup(doc(await generated())))).toBe(0);
  });

  it("returns 1 with the message when the markers are missing", async () => {
    const deps = setup("# no markers");
    expect(await run([], deps)).toBe(1);
    expect(deps.log.mock.calls[0][0]).toMatch(/must contain/);
  });

  it("rethrows unexpected errors", async () => {
    const deps = { ...setup(doc("x")), readFile: () => { throw new Error("disk"); } };
    await expect(run([], deps)).rejects.toThrow("disk");
  });

  it("reads and writes real files by default", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "design-system-doc-"));
    mkdirSync(path.dirname(path.join(root, DATA_FILE)), { recursive: true });
    mkdirSync(path.dirname(path.join(root, DOC_FILE)), { recursive: true });
    writeFileSync(path.join(root, DATA_FILE), DATA_SOURCE);
    writeFileSync(path.join(root, DOC_FILE), doc("stale"));
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    expect(await run([], { root })).toBe(0);

    expect(readFileSync(path.join(root, DOC_FILE), "utf8")).toBe(doc(await generated()));
  });

  it("uses the real files and console by default: the committed document is current", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    expect(await run(["--check"])).toBe(0);
    expect(log).toHaveBeenCalledWith(`✓ ${DOC_FILE} is up to date with ${DATA_FILE}.`);
    expect(ROOT).toBe(path.resolve(import.meta.dirname, ".."));
  });
});

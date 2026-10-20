import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  ALLOWED,
  DEFAULT_PATHS,
  ROOT,
  TOKENS_FILE,
  collectFiles,
  findViolations,
  run,
  stripMdxCode,
  tokenize,
  utilityOf,
} from "./check-tokens.mjs";

/** A fake file tree: keys are absolute paths, string values are file contents, objects are directories. */
function fakeFs(tree) {
  const lookup = (p) => p.split(path.sep).filter(Boolean).reduce((node, part) => node?.[part], tree);
  return {
    statSync: (p) => {
      const node = lookup(p);
      if (node === undefined) throw new Error(`ENOENT ${p}`);
      return { isDirectory: () => typeof node === "object" };
    },
    readdirSync: (p) => Object.keys(lookup(p)),
    readFile: (p) => lookup(p),
  };
}

describe("tokenize", () => {
  it("splits on whitespace, quotes and code punctuation but keeps arbitrary parts whole", () => {
    expect(tokenize(`className={cn("p-2 [&_svg:not([class*='size-'])]:size-4", x)}`)).toEqual([
      "className=",
      "cn",
      "p-2",
      "[&_svg:not([class*='size-'])]:size-4",
      "x",
    ]);
  });
});

describe("utilityOf", () => {
  it("drops variants, including arbitrary ones, and important/negative prefixes", () => {
    expect(utilityOf("hover:bg-primary")).toBe("bg-primary");
    expect(utilityOf("data-[size=sm]:rounded-lg")).toBe("rounded-lg");
    expect(utilityOf("[&_svg:not([class*='size-'])]:size-4")).toBe("size-4");
    expect(utilityOf("!-mt-2")).toBe("mt-2");
  });
});

describe("stripMdxCode", () => {
  it("blanks fenced and inline code but keeps line numbers", () => {
    const text = "Avoid `bg-zinc-900`.\n```tsx\n<div className=\"text-white\" />\n```\nok";
    const stripped = stripMdxCode(text);
    expect(stripped).not.toContain("bg-zinc-900");
    expect(stripped).not.toContain("text-white");
    expect(stripped.split("\n")).toHaveLength(5);
  });
});

describe("findViolations", () => {
  it("reports colour literals outside the tokens file", () => {
    const text = "a { color: #fff; }\nb { color: oklch(1 0 0); background: rgba(0,0,0,.5); }";
    expect(findViolations(text, "packages/ui/src/x.css")).toEqual([
      { line: 1, kind: "colour literal", match: "#fff" },
      { line: 2, kind: "colour literal", match: "oklch(" },
      { line: 2, kind: "colour literal", match: "rgba(" },
    ]);
  });

  it("allows colour literals in the tokens file", () => {
    expect(findViolations(":root { --raw-white: oklch(1 0 0); }", TOKENS_FILE)).toEqual([]);
  });

  it("ignores anchors and other hash words that are not colours", () => {
    expect(findViolations('<a href="#mentors">x</a> // #region', "a.tsx")).toEqual([]);
  });

  it("reports Tailwind palette classes, also with variants and opacity", () => {
    const text = '<p className="bg-zinc-900 hover:text-white border-x-red-500/50 text-muted-foreground">';
    expect(findViolations(text, "a.tsx").map((v) => [v.kind, v.match])).toEqual([
      ["palette class", "bg-zinc-900"],
      ["palette class", "hover:text-white"],
      ["palette class", "border-x-red-500/50"],
    ]);
  });

  it("reports arbitrary values and properties but not arbitrary variants", () => {
    const text = '"p-[13px] data-[size=sm]:rounded-lg [--x:--spacing(4)] has-[>svg]:gap-2"';
    expect(findViolations(text, "a.tsx").map((v) => v.match)).toEqual(["p-[13px]", "[--x:--spacing(4)]"]);
  });

  it("skips code examples in MDX", () => {
    expect(findViolations("Never `bg-zinc-900`, use `bg-muted`.", "page.mdx")).toEqual([]);
  });

  it("reports gradient utilities (also from/via/to stops) and gradient functions", () => {
    const text = '"bg-gradient-to-r from-primary via-muted to-muted bg-linear-to-b bg-radial"\n.x { background: linear-gradient(red, blue); }';
    expect(findViolations(text, "a.tsx").map((v) => [v.kind, v.match])).toEqual([
      ["gradient", "bg-gradient-to-r"],
      ["gradient", "from-primary"],
      ["gradient", "via-muted"],
      ["gradient", "to-muted"],
      ["gradient", "bg-linear-to-b"],
      ["gradient", "bg-radial"],
      ["gradient", "linear-gradient("],
    ]);
  });

  it("does not take hyphenated words such as to-do for gradient stops", () => {
    expect(findViolations("a to-do list", "a.tsx")).toEqual([]);
  });

  it("reports backdrop blur and filter", () => {
    expect(findViolations('"backdrop-blur-md" and backdrop-filter: blur(4px)', "a.tsx").map((v) => v.kind)).toEqual([
      "backdrop blur",
      "backdrop blur",
    ]);
  });

  it("reports shadow utilities but allows shadow-none and prose that merely says shadow", () => {
    expect(findViolations('<p className="shadow-md inset-shadow-sm shadow-none rounded-lg" />', "a.tsx").map((v) => v.match)).toEqual([
      "shadow-md",
      "inset-shadow-sm",
    ]);
    expect(findViolations('<p className="shadow" />', "a.tsx").map((v) => v.match)).toEqual(["shadow"]);
    expect(findViolations("// a line, not a shadow, separates it", "a.tsx")).toEqual([]);
  });

  it("reports box-shadow in CSS, except in the tokens file", () => {
    const css = ".a { box-shadow: 0 0 0 1px red; }";
    expect(findViolations(css, "packages/ui/src/styles/theme.css").map((v) => v.kind)).toEqual(["shadow"]);
    expect(findViolations(css, TOKENS_FILE)).toEqual([]);
  });

  it("reports rounded-full (also per corner) except in the allow-listed files", () => {
    expect(findViolations('"rounded-full rounded-t-full rounded-lg"', "a.tsx").map((v) => v.match)).toEqual([
      "rounded-full",
      "rounded-t-full",
    ]);
    expect(findViolations('"rounded-full"', "packages/ui/src/components/ui/switch.tsx")).toEqual([]);
  });

  it("reports emoji in tsx and mdx text, not plain symbols or other file types", () => {
    expect(findViolations("<p>Done ✨ 😅 \u2713 \u00a9</p>", "a.tsx").map((v) => v.match)).toEqual(["✨", "😅"]);
    expect(findViolations("Done ✨", "page.mdx")).toHaveLength(1);
    expect(findViolations("// done ✨", "a.ts")).toEqual([]);
  });

  it("reports the Sparkles icon but not the lowercase word", () => {
    const text = 'import { Sparkles, SparklesIcon } from "lucide-react";\n// no sparkles here';
    expect(findViolations(text, "a.tsx").map((v) => v.match)).toEqual(["Sparkles", "SparklesIcon"]);
  });

  it("allows a rule only in its own allow-listed files", () => {
    expect(findViolations("✨ Sparkles", "packages/ui/stories/design-system/WhatToAvoid.mdx")).toEqual([]);
    expect(findViolations("✨", "packages/ui/stories/design-system/Other.mdx")).toHaveLength(1);
  });

  it("gives every allow-list entry a reason", () => {
    for (const files of Object.values(ALLOWED)) {
      for (const reason of Object.values(files)) expect(reason.length).toBeGreaterThan(10);
    }
  });

  it("normalizes Windows-style separators when recognizing the tokens file", () => {
    const windowsPath = TOKENS_FILE.split("/").join(path.sep);
    expect(findViolations("--raw: #fff;", windowsPath)).toEqual([]);
  });
});

describe("collectFiles", () => {
  it("walks directories in order, keeps supported extensions, skips tests, build output and missing paths", () => {
    const fs = fakeFs({
      repo: {
        ui: {
          "b.tsx": "",
          "a.css": "",
          "a.test.tsx": "",
          "readme.txt": "",
          node_modules: { "x.ts": "" },
          "storybook-static": { "y.js": "" },
        },
      },
    });
    const files = collectFiles(["ui", "missing"], "/repo", fs);
    expect(files).toEqual([path.resolve("/repo/ui/a.css"), path.resolve("/repo/ui/b.tsx")]);
  });
});

describe("run", () => {
  it("returns 0 and a success line when nothing is outside tokens", () => {
    const fs = fakeFs({ repo: { ui: { "a.tsx": '<p className="bg-primary" />' } } });
    const log = vi.fn();
    expect(run(["ui"], { root: "/repo", fs, readFile: fs.readFile, log })).toBe(0);
    expect(log).toHaveBeenCalledWith("✓ Tokens: 1 files checked, no values outside tokens.");
  });

  it("returns 1 and prints file:line for each violation with an actionable summary", () => {
    const fs = fakeFs({ repo: { ui: { "a.tsx": '\n<p className="p-[13px]" />' } } });
    const log = vi.fn();
    expect(run(["ui"], { root: "/repo", fs, readFile: fs.readFile, log })).toBe(1);
    expect(log).toHaveBeenCalledWith(`${path.join("ui", "a.tsx")}:2  arbitrary value  p-[13px]`);
    expect(log.mock.calls.at(-1)[0]).toMatch(/1 value\(s\) outside tokens in 1 files\. Use a semantic token class/);
  });

  it("checks the design-system folders and the app by default", () => {
    const log = vi.fn();
    const fs = fakeFs({});
    run([], { root: "/repo", fs, readFile: fs.readFile, log });
    expect(DEFAULT_PATHS).toEqual(["packages/ui/src", "packages/ui/stories", "packages/ui/.storybook", "packages/app/src"]);
    expect(log).toHaveBeenCalledWith("✓ Tokens: 0 files checked, no values outside tokens.");
  });

  it("uses the real filesystem and console by default", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const code = run(["packages/ui/src/lib/utils.ts"]);
    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith("✓ Tokens: 1 files checked, no values outside tokens.");
    expect(ROOT).toBe(path.resolve(import.meta.dirname, ".."));
  });
});

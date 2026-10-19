#!/usr/bin/env node
// Design-token guard (lesson 6, prompt rule 3): fails when design-system code uses a value that does
// not come from a token – a colour literal outside the tokens file, a Tailwind palette class
// (bg-zinc-900, text-white) or an arbitrary Tailwind value (p-[13px]).
// Usage: node scripts/check-tokens.mjs [file-or-dir ...]   (defaults to the design-system folders)
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_PATHS = ["packages/ui/src", "packages/ui/stories", "packages/ui/.storybook"];
/** The only file allowed to hold colour literals. */
export const TOKENS_FILE = "packages/ui/src/styles/tokens.css";
export const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".mdx"]);
const SKIPPED_DIRS = new Set(["node_modules", "storybook-static", "dist"]);

const PALETTES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTILITIES =
  "bg|text|border|border-[xytrblse]|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|divide|placeholder|caret|accent|shadow|inset-shadow|drop-shadow";
const PALETTE_CLASS = new RegExp(`^(?:${COLOR_UTILITIES})-(?:(?:${PALETTES})-\\d{2,3}|white|black)(?:/\\d+)?$`);
const ARBITRARY_VALUE = /^[a-z][a-z0-9-]*-\[/;
const ARBITRARY_PROPERTY = /^\[[a-z-]+:/;
const HEX = /(?:^|[^\w&#/-])(#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4}))(?![\w-])/g;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g;

/** The utility part of a class token: drops variants (`hover:`, `data-[x]:`, `[&_svg]:`) and `!`/`-` prefixes. */
export function utilityOf(token) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (ch === ":" && depth === 0) start = i + 1;
  }
  return token.slice(start).replace(/^[!-]+/, "");
}

/** Splits a line into class-like tokens on whitespace and quotes, but not inside a `[...]` arbitrary part. */
export function tokenize(lineText) {
  const tokens = [];
  let depth = 0;
  let current = "";
  for (const ch of lineText) {
    if (ch === "[") depth++;
    else if (ch === "]" && depth > 0) depth--;
    if (depth === 0 && /[\s"'`(){},;]/.test(ch)) {
      if (current) tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

/** In MDX, code shown as an example (fenced blocks and inline code) is documentation, not styling. */
export function stripMdxCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/`[^`\n]*`/g, (code) => " ".repeat(code.length));
}

/** Violations in one file's text: `{ line, kind, match }`. */
export function findViolations(text, file) {
  const normalized = file.split(path.sep).join("/");
  const isTokensFile = normalized.endsWith(TOKENS_FILE);
  const source = normalized.endsWith(".mdx") ? stripMdxCode(text) : text;
  const violations = [];
  source.split("\n").forEach((lineText, index) => {
    const line = index + 1;
    if (!isTokensFile) {
      for (const m of lineText.matchAll(HEX)) violations.push({ line, kind: "colour literal", match: m[1] });
      for (const m of lineText.matchAll(COLOR_FUNCTION)) violations.push({ line, kind: "colour literal", match: m[0] });
    }
    for (const token of tokenize(lineText)) {
      const utility = utilityOf(token);
      if (PALETTE_CLASS.test(utility)) violations.push({ line, kind: "palette class", match: token });
      else if (ARBITRARY_VALUE.test(utility) || ARBITRARY_PROPERTY.test(utility))
        violations.push({ line, kind: "arbitrary value", match: token });
    }
  });
  return violations;
}

/** Files to check under the given paths (relative to `root`); missing paths are skipped. */
export function collectFiles(paths, root = ROOT, fs = { readdirSync, statSync }) {
  const files = [];
  const walk = (abs) => {
    let stats;
    try {
      stats = fs.statSync(abs);
    } catch {
      return;
    }
    if (stats.isDirectory()) {
      if (SKIPPED_DIRS.has(path.basename(abs))) return;
      for (const entry of fs.readdirSync(abs).sort()) walk(path.join(abs, entry));
    } else if (EXTENSIONS.has(path.extname(abs)) && !/\.test\.[a-z]+$/.test(abs)) {
      files.push(abs);
    }
  };
  for (const p of paths) walk(path.resolve(root, p));
  return files;
}

/** Runs the check and prints one line per violation. Returns the exit code. */
export function run(argv = [], { root = ROOT, readFile = (f) => readFileSync(f, "utf8"), log = console.log, fs } = {}) {
  const paths = argv.length > 0 ? argv : DEFAULT_PATHS;
  const files = collectFiles(paths, root, fs);
  let count = 0;
  for (const file of files) {
    const rel = path.relative(root, file);
    for (const v of findViolations(readFile(file), rel)) {
      count++;
      log(`${rel}:${v.line}  ${v.kind}  ${v.match}`);
    }
  }
  if (count === 0) {
    log(`✓ Tokens: ${files.length} files checked, no values outside tokens.`);
    return 0;
  }
  log(
    `✗ Tokens: ${count} value(s) outside tokens in ${files.length} files. ` +
      `Use a semantic token class (bg-primary, text-muted-foreground, gap-in-group …); colour values belong only in ${TOKENS_FILE}.`,
  );
  return 1;
}

export function isEntryPoint(argv1, moduleUrl = import.meta.url) {
  return argv1 !== undefined && pathToFileURL(argv1).href === moduleUrl;
}

if (isEntryPoint(process.argv[1])) {
  process.exitCode = run(process.argv.slice(2));
}

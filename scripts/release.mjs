#!/usr/bin/env node
// Release helper (lesson 24). Two commands:
//   bump <major|minor|patch|x.y.z>  – sets the version in every package.json, the pinned @devmentor/* dependencies
//                                     and package-lock.json. Run it on a release branch; the change ships in a PR.
//   notes [x.y.z] [--out <file>]    – checks that every manifest is at that version (default: the root one) and
//                                     that CHANGELOG.md has a "# x.y.z (YYYY-MM-DD)" entry, then prints the entry
//                                     (or writes it to <file>). The Release workflow uses it before tagging.
// Usage: node scripts/release.mjs bump minor | node scripts/release.mjs notes --out notes.md
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

export class ReleaseError extends Error {}

/** The next version for a bump keyword, or `target` itself when it is an explicit x.y.z. */
export function nextVersion(current, target) {
  const parts = SEMVER.exec(current);
  if (!parts) throw new ReleaseError(`current version "${current}" is not x.y.z`);
  const [major, minor, patch] = parts.slice(1).map(Number);
  if (target === "major") return `${major + 1}.0.0`;
  if (target === "minor") return `${major}.${minor + 1}.0`;
  if (target === "patch") return `${major}.${minor}.${patch + 1}`;
  if (SEMVER.test(target)) return target;
  throw new ReleaseError(`"${target}" is not major, minor, patch or x.y.z`);
}

/** package.json paths relative to `root`: the root manifest first, then one per workspace under packages/. */
export function manifestPaths(root) {
  const packages = path.join(root, "packages");
  const workspaces = readdirSync(packages)
    .filter((name) => existsSync(path.join(packages, name, "package.json")))
    .sort()
    .map((name) => path.join("packages", name, "package.json"));
  return ["package.json", ...workspaces];
}

function readJson(root, file) {
  return JSON.parse(readFileSync(path.join(root, file), "utf8"));
}

function writeJson(root, file, value) {
  writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
}

/** Sets `version` and every dependency on one of `names` to `version`, in place. */
export function applyVersion(manifest, names, version) {
  if ("version" in manifest) manifest.version = version;
  for (const field of DEPENDENCY_FIELDS) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (names.has(name)) manifest[field][name] = version;
    }
  }
  return manifest;
}

/** Writes `target` (bump keyword or x.y.z) into every manifest and the lockfile. Returns the new version. */
export function bump(root, target) {
  const files = manifestPaths(root);
  const manifests = files.map((file) => readJson(root, file));
  const version = nextVersion(manifests[0].version, target);
  const names = new Set(manifests.map((manifest) => manifest.name));

  files.forEach((file, index) => writeJson(root, file, applyVersion(manifests[index], names, version)));

  const lockFile = "package-lock.json";
  if (existsSync(path.join(root, lockFile))) {
    const lock = readJson(root, lockFile);
    lock.version = version;
    for (const file of files) {
      const key = path.dirname(file) === "." ? "" : path.dirname(file).split(path.sep).join("/");
      if (lock.packages?.[key]) applyVersion(lock.packages[key], names, version);
    }
    writeJson(root, lockFile, lock);
  }
  return version;
}

/** The CHANGELOG.md entry for `version`: its heading and everything up to the next release heading or `---`. */
export function changelogEntry(changelog, version) {
  const lines = changelog.split("\n");
  const heading = new RegExp(`^# ${version.replaceAll(".", "\\.")} \\(\\d{4}-\\d{2}-\\d{2}\\)\\s*$`);
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) throw new ReleaseError(`CHANGELOG.md has no "# ${version} (YYYY-MM-DD)" entry`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^# \d+\.\d+\.\d+ /.test(line) || line.trim() === "---");
  return lines.slice(start, start + 1 + (end === -1 ? rest.length : end)).join("\n").trim();
}

/** Checks the manifests and returns the release notes for `version` (default: the root manifest's version). */
export function releaseNotes(root, version) {
  const files = manifestPaths(root);
  const expected = version ?? readJson(root, files[0]).version;
  nextVersion(expected, expected);
  const behind = files.filter((file) => readJson(root, file).version !== expected);
  if (behind.length > 0) {
    throw new ReleaseError(`not at ${expected}: ${behind.join(", ")} – run "node scripts/release.mjs bump ${expected}" in a PR`);
  }
  return { version: expected, notes: changelogEntry(readFileSync(path.join(root, "CHANGELOG.md"), "utf8"), expected) };
}

export function run(argv, root = ROOT, log = console.log) {
  const [command, ...args] = argv;
  try {
    if (command === "bump" && args.length === 1) {
      log(bump(root, args[0]));
      return 0;
    }
    if (command === "notes") {
      const outIndex = args.indexOf("--out");
      const out = outIndex === -1 ? undefined : args[outIndex + 1];
      if (outIndex !== -1 && !out) throw new ReleaseError("--out needs a file name");
      const rest = outIndex === -1 ? args : args.filter((_, index) => index !== outIndex && index !== outIndex + 1);
      const { version, notes } = releaseNotes(root, rest[0]);
      if (out) {
        writeFileSync(out, `${notes}\n`);
        log(version);
      } else {
        log(notes);
      }
      return 0;
    }
    log("Usage: node scripts/release.mjs bump <major|minor|patch|x.y.z> | notes [x.y.z] [--out <file>]");
    return 2;
  } catch (error) {
    if (!(error instanceof ReleaseError)) throw error;
    log(`release: ${error.message}`);
    return 1;
  }
}

export function isEntryPoint(argv1, moduleUrl = import.meta.url) {
  return argv1 !== undefined && pathToFileURL(argv1).href === moduleUrl;
}

if (isEntryPoint(process.argv[1])) {
  process.exitCode = run(process.argv.slice(2));
}

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyVersion,
  bump,
  changelogEntry,
  compareVersions,
  isEntryPoint,
  manifestPaths,
  nextVersion,
  ReleaseError,
  releaseNotes,
  run,
} from "./release.mjs";

const CHANGELOG = [
  "# 0.2.0 (2026-12-01)",
  "",
  "## ✨ Features",
  "- ✨ New thing. (#2)",
  "",
  "---",
  "",
  "# 0.1.0 (2026-11-13)",
  "",
  "## Highlights",
  "First release.",
  "",
].join("\n");

let root;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "release-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function write(file, value) {
  const full = path.join(root, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function read(file) {
  return JSON.parse(readFileSync(path.join(root, file), "utf8"));
}

/** A two-workspace repo at `version`: app pins core exactly, like the real repo. */
function repo({ version = "0.1.0", lock = true, changelog = CHANGELOG } = {}) {
  write("package.json", { name: "devmentor", version, workspaces: ["packages/*"] });
  write("packages/core/package.json", { name: "@devmentor/core", version, dependencies: { zod: "^4.0.0" } });
  write("packages/app/package.json", {
    name: "@devmentor/app",
    version,
    dependencies: { "@devmentor/core": version, next: "16.0.0" },
  });
  mkdirSync(path.join(root, "packages/empty"));
  if (lock) {
    write("package-lock.json", {
      name: "devmentor",
      version,
      packages: {
        "": { name: "devmentor", version },
        "packages/app": { name: "@devmentor/app", version, dependencies: { "@devmentor/core": version } },
        "packages/app/node_modules/next": { version: "16.0.0" },
      },
    });
  }
  if (changelog !== null) write("CHANGELOG.md", changelog);
}

describe("nextVersion", () => {
  it("bumps each part and resets the lower ones", () => {
    expect(nextVersion("1.4.7", "major")).toBe("2.0.0");
    expect(nextVersion("1.4.7", "minor")).toBe("1.5.0");
    expect(nextVersion("1.4.7", "patch")).toBe("1.4.8");
  });

  it("accepts an explicit version, including the current one", () => {
    expect(nextVersion("0.1.0", "1.0.0")).toBe("1.0.0");
    expect(nextVersion("0.1.0", "0.1.0")).toBe("0.1.0");
  });

  it("rejects a malformed current version or target", () => {
    expect(() => nextVersion("1.0", "patch")).toThrow(ReleaseError);
    expect(() => nextVersion("1.0.0", "v1.1.0")).toThrow(/not major, minor, patch or x\.y\.z/);
  });
});

describe("compareVersions", () => {
  it("compares numerically, part by part", () => {
    expect(compareVersions("0.10.0", "0.9.9")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.2.3", "1.2.4")).toBeLessThan(0);
    expect(compareVersions("2.0.0", "10.0.0")).toBeLessThan(0);
  });
});

describe("applyVersion", () => {
  it("leaves a manifest without a version field without one", () => {
    expect(applyVersion({ name: "x", dependencies: { a: "1" } }, new Set(["a"]), "2.0.0")).toEqual({
      name: "x",
      dependencies: { a: "2.0.0" },
    });
  });
});

describe("bump", () => {
  it("lists the root manifest first and skips folders without a package.json", () => {
    repo();
    expect(manifestPaths(root)).toEqual([
      "package.json",
      path.join("packages", "app", "package.json"),
      path.join("packages", "core", "package.json"),
    ]);
  });

  it("sets every manifest, the pinned workspace dependencies and the lockfile", () => {
    repo();

    expect(bump(root, "minor")).toBe("0.2.0");

    expect(read("package.json").version).toBe("0.2.0");
    expect(read("packages/core/package.json")).toMatchObject({ version: "0.2.0", dependencies: { zod: "^4.0.0" } });
    expect(read("packages/app/package.json").dependencies).toEqual({ "@devmentor/core": "0.2.0", next: "16.0.0" });
    const lock = read("package-lock.json");
    expect(lock.version).toBe("0.2.0");
    expect(lock.packages[""].version).toBe("0.2.0");
    expect(lock.packages["packages/app"]).toMatchObject({ version: "0.2.0", dependencies: { "@devmentor/core": "0.2.0" } });
    expect(lock.packages["packages/app/node_modules/next"].version).toBe("16.0.0");
  });

  it("refuses a version that is not newer, and changes nothing", () => {
    repo({ version: "0.2.0" });
    expect(() => bump(root, "0.2.0")).toThrow(/0\.2\.0 is not newer than the current 0\.2\.0/);
    expect(() => bump(root, "0.1.9")).toThrow(ReleaseError);
    expect(read("package.json").version).toBe("0.2.0");
  });

  it("works without a lockfile", () => {
    repo({ lock: false });
    expect(bump(root, "2.0.0")).toBe("2.0.0");
    expect(read("packages/core/package.json").version).toBe("2.0.0");
  });
});

describe("changelogEntry", () => {
  it("cuts the entry at the separator", () => {
    expect(changelogEntry(CHANGELOG, "0.2.0")).toBe("# 0.2.0 (2026-12-01)\n\n## ✨ Features\n- ✨ New thing. (#2)");
  });

  it("cuts the entry at the next release heading when there is no separator", () => {
    const text = "# 0.2.0 (2026-12-01)\nnew\n# 0.1.0 (2026-11-13)\nold\n";
    expect(changelogEntry(text, "0.2.0")).toBe("# 0.2.0 (2026-12-01)\nnew");
  });

  it("runs to the end for the last entry", () => {
    expect(changelogEntry(CHANGELOG, "0.1.0")).toBe("# 0.1.0 (2026-11-13)\n\n## Highlights\nFirst release.");
  });

  it("does not match a version that only looks similar", () => {
    expect(() => changelogEntry("# 0x1x0 (2026-11-13)\n", "0.1.0")).toThrow(/no "# 0\.1\.0 \(YYYY-MM-DD\)" entry/);
    expect(() => changelogEntry(CHANGELOG, "0.1")).toThrow(ReleaseError);
  });

  it("treats the version as text, never as a pattern", () => {
    expect(() => changelogEntry(CHANGELOG, ".*")).toThrow(ReleaseError);
    expect(() => changelogEntry(CHANGELOG, "0.1.0|0.2.0")).toThrow(ReleaseError);
  });
});

describe("releaseNotes", () => {
  it("defaults to the root version", () => {
    repo({ version: "0.2.0" });
    expect(releaseNotes(root)).toMatchObject({ version: "0.2.0", notes: expect.stringContaining("New thing") });
  });

  it("names every manifest that is behind the requested version", () => {
    repo();
    expect(() => releaseNotes(root, "0.2.0")).toThrow(/not at 0\.2\.0: package\.json, .*app.*, .*core.* – run/);
  });

  it("rejects a requested version that is not x.y.z", () => {
    repo();
    expect(() => releaseNotes(root, "latest")).toThrow(ReleaseError);
  });
});

describe("run", () => {
  let lines;
  let errors;
  const log = (line) => lines.push(line);
  const warn = (line) => errors.push(line);

  beforeEach(() => {
    lines = [];
    errors = [];
  });

  it("bumps and prints the new version", () => {
    repo();
    expect(run(["bump", "patch"], root, log, warn)).toBe(0);
    expect(lines).toEqual(["0.1.1"]);
  });

  it("prints the notes", () => {
    repo();
    expect(run(["notes"], root, log, warn)).toBe(0);
    expect(lines[0]).toContain("# 0.1.0 (2026-11-13)");
  });

  it("writes the notes to a file and prints only the version", () => {
    repo({ version: "0.2.0" });
    const out = path.join(root, "notes.md");
    expect(run(["notes", "--out", out, "0.2.0"], root, log, warn)).toBe(0);
    expect(lines).toEqual(["0.2.0"]);
    expect(readFileSync(out, "utf8")).toContain("New thing");
  });

  it("reports a missing --out file name", () => {
    repo();
    expect(run(["notes", "--out"], root, log, warn)).toBe(1);
    expect(run(["notes", "--out", "--other"], root, log, warn)).toBe(1);
    expect(errors).toEqual(["release: --out needs a file name", "release: --out needs a file name"]);
    expect(lines).toEqual([]);
  });

  it("reports release problems with exit code 1", () => {
    repo({ changelog: "# Changelog\n" });
    expect(run(["notes"], root, log, warn)).toBe(1);
    expect(errors[0]).toMatch(/^release: CHANGELOG\.md has no/);
    expect(lines).toEqual([]);
  });

  it("prints usage for an unknown command", () => {
    expect(run(["publish"], root, log, warn)).toBe(2);
    expect(run(["bump"], root, log, warn)).toBe(2);
    expect(errors[0]).toMatch(/^Usage:/);
  });

  it("rethrows unexpected errors", () => {
    expect(() => run(["notes"], path.join(root, "missing"), log, warn)).toThrow(/ENOENT/);
  });
});

describe("isEntryPoint", () => {
  it("is true only for this script's own path", () => {
    const self = fileURLToPath(new URL("./release.mjs", import.meta.url));
    expect(isEntryPoint(self)).toBe(true);
    expect(isEntryPoint("/elsewhere/release.mjs")).toBe(false);
    expect(isEntryPoint(undefined)).toBe(false);
  });
});

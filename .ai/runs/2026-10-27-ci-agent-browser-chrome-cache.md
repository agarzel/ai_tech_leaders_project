# Execution plan – cache agent-browser Chrome in the CI integration job

Issue: #18. Engine: om-auto-create-pr (steps: 4, --loop: no).

## Goal

The Integration tests job restores Chrome for Testing from the GitHub Actions cache instead of downloading it (~186 MB) on every run.

## Scope

- `.github/workflows/ci.yml`, job `integration-tests` only: restore `~/.agent-browser/browsers` before `npx agent-browser install --with-deps`, save it after.
- The install step stays as it is, so the Linux system libraries are still installed on every run.

**Non-goals:** caching the testcontainers PostgreSQL image, changing the test suite, other jobs.

## Finding that changes the issue's suggested key

`agent-browser install` (0.39.0) installs the latest known-good Chrome, not a version pinned by the lockfile. Checked locally on 2026-10-27: the first run downloaded Chrome 156 next to an existing 155; a second run printed "Chrome 156.0.8078.47 is already installed" and took 0.4 s. A key from `hashFiles('package-lock.json')` would keep hitting a stale cache after every Chrome release and download again on every run, because a cache whose key hit is never re-saved. So the cache is keyed by the **installed Chrome directory** instead:

1. `actions/cache/restore` with the prefix `Linux-agent-browser-chrome-` (newest matching cache wins).
2. Install as today (skips the download when the restored Chrome is the current one).
3. Remove older `chrome-*` directories, keep the newest.
4. `actions/cache/save` with the key `Linux-agent-browser-chrome-<directory>` only when it differs from the restored key.

## Risks

- A cache miss or a broken cache falls back to the normal download (today's behaviour).
- Tests: a workflow change has no unit tests; the evidence is the CI log of two runs (miss, then hit). The repo gate (lint, typecheck, coverage, build) is unaffected but is run anyway.
- `actions/cache` v6.1.0 is the latest release (checked with `gh api`).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Cache Chrome in the integration job

- [x] 1.1 Restore and save the agent-browser browsers directory around the install step — 2f1ebd0
- [x] 1.2 Keep only the newest Chrome directory before saving — 2f1ebd0

### Phase 2: Verify in CI

- [ ] 2.1 First CI run: cache miss, Chrome downloaded and saved
- [ ] 2.2 Second CI run: cache hit, download skipped, durations recorded

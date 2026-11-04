---
name: om-code-review
description: Use when reviewing a DevMentor PR or diff with om-code-review. Adds the repo-specific rules R1–R5 (contract registry sync, actionable script errors, no destruction of local state, real-run evidence, self-review disclosure) on top of the installed skill, never replacing it.
---

# om-code-review – DevMentor extension

@.agents/skills/om-code-review/SKILL.md

Apply the installed skill above **in full** (validation gate, checklist, `CODE_REVIEW.md`, `BACKWARD_COMPATIBILITY.md`, severities, verdict rule, output format). The rules below are **added** for this repository. They only make the review stricter; if anything here seems to relax the installed skill, the installed skill wins.

Each rule comes from a real review in this repo – keep the "Why" when editing.

## R1 – Contract registry stays in sync

When the diff adds, renames or removes any of the following, `BACKWARD_COMPATIBILITY.md` must be updated **in the same PR**:

| Surface | Where it is defined | Section |
|---|---|---|
| Root npm script | `package.json` → `scripts` | §5 |
| Environment variable | `packages/core/src/config/env.ts`, `.env.example`, `docker-compose.yml` | §4 |
| Package entry point | `packages/*/package.json` → `exports` | §3 |
| API route or error `code` | `packages/app/src/app/api/**`, `packages/core/src/http/errors.ts` | §1 |

- Added surface not listed → **minor** (it silently becomes a contract nobody protects).
- Renamed/removed surface without the documented path in `BACKWARD_COMPATIBILITY.md` → **blocker** (already a rule of the installed skill – cite the section).

*Why:* PR #14 added `npm run setup` and documented it in README and AGENTS.md, but the protected-scripts list in §5 was missed; only a manual read caught it.

## R2 – Repo scripts (`scripts/**`) fail with actionable messages

- Scripts run before `npm install`: they may import **Node built-ins only** – any other import → **major**.
- Every *expected* failure (missing file, missing or stopped binary such as Docker, non-zero exit of a command it runs) ends with a one-line message saying what to do next and a non-zero exit code. An expected failure that surfaces as an uncaught exception/stack trace → **minor**; name the trigger and the message to add.
- A message must not misdiagnose the cause (e.g. "not running" when the binary may be missing) → **minor**.
- Spawning `npm`/`npx` must work on Windows (`.cmd` shims need `shell: true` there) → **nit** when missing.

*Why:* the first version of `scripts/setup.mjs` crashed with `ENOENT` when `.env.example` was missing and said "Docker is not running" when Docker was not installed.

## R3 – Never destroy a developer's local state

Scripts, tests and documented verification steps must not run commands that delete local data or configuration outside temporary/test resources: `docker compose down -v`, `docker volume rm`, dropping the dev database, deleting or overwriting `.env`, `git clean -fdx`, `rm -rf` on non-temporary paths. Integration tests must use their own ephemeral resources (testcontainers, `.next-test`).

- In code that runs automatically (scripts, tests, CI against a dev machine) → **blocker**.
- In a PR's described verification steps, without a warning and backup step → **major**.

*Why:* while verifying PR #14 an agent ran `docker compose down -v` and wiped the developer's local database volume without asking.

## R4 – Evidence of a real run for scripts and migrations

Changes to `scripts/**` or to migrations need, in the PR body, evidence of at least one **real** run (command + observed outcome), not only unit tests with mocks. For setup-like scripts that means the first run and an idempotent rerun. Missing → **minor**.

## R5 – Disclose self-review

If this review runs in the same session/agent that wrote the change (or the PR author is the only reviewer), add this line directly under the Verdict:

> ⚠️ Self-review: the reviewer also authored this change – a second reviewer (human, or `om-auto-review-pr` in a fresh session) is recommended before merge.

This does not change the verdict rule; it makes the limitation visible.

## R6 – Access-control tests make three checks

A new or changed route that reads or writes another user's data (`api/bookings/[id]/**`, `api/mentor/**`, `api/users/**`, `api/admin/**`) needs an integration test that, against the same record id:

1. **Positive control for both accounts:** the owner reads the record (200) and the other account is answered on a route it may use (200). Without this, a 401/403/404 can mean "not signed in", not "not allowed".
2. **Refused read and refused write** from the other account (404 for objects of another user, 403 for a missing role – keep the policy consistent).
3. **Owner's data after the attempt:** read it again and compare whole objects (or stored rows), not counts.

Missing on such a route → **major**. Reference: `packages/app/tests/integration/access-boundaries.int.test.ts`, threats T-04/T-05 in `docs/security/threat-model.md`.

*Why:* lesson 16 – an agent writes the endpoint and a green owner-only test; nobody gave it the "only the owner" rule, so only the happy path gets tested.

## Report additions

- Tag findings that come from this extension with the rule id, e.g. `[R1]`, so it is clear which rules are DevMentor-specific.
- In the summary, state that the DevMentor extension (`.ai/skills/om-code-review/SKILL.md`) was applied.

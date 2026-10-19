# Run: lesson 4 — discovery, synthetic users, backlog

- Date: 2026-10-19
- Branch: `lesson-4-discovery`
- Owner: Arkadiusz (product decisions); agent: Claude Code

## Goal

Turn the course discovery material into a product brief, test one flow with a synthetic panel, and file a backlog the next lessons can implement.

## Plan and what was done

1. **Research input** — the course's DevMentor discovery set copied to `.ai/specs/research/` (commit 56807dd).
2. **`om-discover DevMentor --mode own`** — full pass, three interview rounds with the owner and a skeptic subagent. Output: `.ai/specs/product-brief.md` and decisions D01–D08 under `.ai/specs/research/decisions/`. Coverage: 51 claims, 46 sourced, 5 assumed; 2 collection-plan entries.
3. **`om-synthetic-users`** (optional step) — run on the course's reduced exercise brief in `devmentor-synthetic-input/` (not committed, excluded through `.git/info/exclude`): stance adversary, 1 run × 2 personas, held-out fintech interview. One run gives no findings, only *Seen once* items; the strongest one — a minimum lead time before a session misses the window in which help is still useful — bears on our open Q02. Results stay outside the brief, as the exercise asks.
4. **`om-backlog .ai/specs/product-brief.md`** — dry run reviewed, then filed after the owner's yes: epics #21–#24, stories and tasks #25–#36; record in `.ai/specs/backlog.md`.

## Decisions and why

- Q02 left open in the brief at the owner's choice ("Zapisz, Q02 otwarte"); to be resolved during spec writing in lesson 5. E02-S03 (#32) is marked blocked by Q02, E03-S03 (#35) by Q03.
- The brief has no decision on accounts and sign-in, yet every story needs a mentor and a mentee identity. On the owner's instruction a task E01-S01-T01 (#26, minimal accounts and sign-in) was added; the sign-in method is a blocking question on that issue.
- Almost every story is `risk-high`: per `SDLC.md` money and schema migrations are high risk, so these PRs need QA and no self-QA.
- Issues were created with `gh` following `om-prepare-issue`'s body template and label rules (category, priority, risk, label-rationale section) in one scripted pass rather than sixteen separate skill invocations; no semantic duplicates existed (open issues #16–#19 are infrastructure). #16 is an external dependency of the first relation.

## Verified

- All 16 issues exist with `feature` + one priority + one risk label (`gh issue list --label feature`).
- Epic checklists for E01–E03 list their children; E04 lists parked items only.
- The synthetic input matched its `MANIFEST.json` SHA-256 for all 12 files.
- No code changed, so lint/typecheck/tests/build were not run for this docs-only change.

## Open issues

- Q01 (commission), Q04 (terms/legal) block launch; Q02, Q03 block two stories; sign-in method blocks #26.
- `SDLC.md` has no Definition of Ready section, so `om-backlog`'s formal readiness gate was skipped; readiness was read from the brief's own DoR addendum.

## Handoff

Next is lesson 5: write the first spec with `om-spec-writing` from the backlog (likely E01 with #26), resolve Q02 and the sign-in method there, and get an independent review by another model.

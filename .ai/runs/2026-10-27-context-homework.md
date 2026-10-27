# Context homework – measurements, changes and findings (2026-10-27)

## Goal

Lesson 10 homework on this repo: measure the starting context, tidy the instructions, review skills, run `task-router`, and review the sessions in Context Scope. Done on branch `context-homework` (based on `epik-02-phase-2`, whose fix merged to `main` as PR #71).

## Measurements (`/context`, claude-opus-5-5)

| Category | Start | After step 2 | After step 4 (router) |
|---|---|---|---|
| Total | 38.8k | 37.9k | 33.7k |
| AGENTS.md (memory file) | 6.4k | 5.5k | 2.7k |
| Memory files, total | 6.7k | 5.8k | 3.0k |
| MCP server instructions | 4.0k | 4.0k | 2.6k |
| System prompt | 3.6k | 3.5k | 3.5k |
| System tools | 14.0k | 14.0k | 14.0k |
| Skills | 10.0k | 10.0k | 10.0k |

The change in MCP server instructions (-1.4k) is not explained by the repo changes. Most likely the disabled `shopify-dev-mcp` took effect in a new session. Not verified.

## Changes

- **Step 1:** `shopify-dev-mcp` disabled for this project in `/mcp` (global config left alone; other Shopify projects use it).
- **Step 2:** root `AGENTS.md` trimmed (commit `9c42c40`), details moved to `packages/app/AGENTS.md` and `packages/ui/AGENTS.md`.
- **Step 3:** the only project skill override, `.ai/skills/om-code-review`, got a description that says when to use it (commit `ce0b509`). The 43 other skills are installed from Open Mercato and were not reviewed.
- **Step 4:** `task-router` installed from `pat-lewczuk/skills` (commit `2c99e94`). Root `AGENTS.md` became a router with a `Where to read` table, 173 -> 100 lines (commit `3d5041f`). New docs: `.ai/docs/architecture.md`, `testing.md`, `ai-folder.md`, `ai-skills.md`. New check `scripts/check-agents.mjs` (`npm run check:agents`) with tests; `check:agents` added to the protected npm scripts list in `BACKWARD_COMPATIBILITY.md`.

## Verified

- `npm run check:agents`: OK.
- `npm run test:coverage`: exit 0, 77 files, 945 tests (coverage gate passes).
- `npm run lint`: exit 0. `npm run typecheck`: exit 0.
- `npm run build`: run by the owner in the terminal before the phase 2 fix commit; not rerun after step 4 because the step changes docs and a script only.

## Context Scope findings (13 Oct session and 8 sessions in this repo)

1. **Instruction chain oversized (HIGH, 8 sessions, ~11.2k tokens).** Suggested fix: move path-specific guidance into `.claude/rules/<topic>.md` with `paths:` frontmatter; keep `CLAUDE.md` to conventions and pointers. First candidate: `packages/ui/AGENTS.md` (3,782 tokens, claude-calibrated).
2. **Startup base about 21.8k tokens (estimated).** The trend chart rises after edits to the package `AGENTS.md` files and the root file (10 instruction edits marked).
3. **Context at session end (mean):** Shell 27.1% (21.4k), file reads 13.2% (10.1k), skills 10.9% (5.08k), attachments 6.6% (11.9k). Shell and reads together are about 40%.
4. **Largest single tool results (13 Oct):** `Read` 36.9k, `Write` 35.2k, `Read` 24.0k, a large generated HTML file read 23.5k. Reads of large files without `offset`/`limit` are the cost.
5. **13 Oct session:** 3 compactions, 50 subagents, peak window 96.7%. Subagent handoffs (about 500-590 tokens each) are fine.
6. **Cache:** 97.8% of reads are cache reads. The 1.19B processed tokens are mostly cache reads, not new context.
7. **Old cached skills:** the lesson says to remove older cached copies. Not checked yet in the Setup tab.

## Chosen for next week

Finding 1: move the UI rules (tokens, stories, Storybook) from `packages/ui/AGENTS.md` to `.claude/rules/ui.md` with `paths: packages/ui/**`.

## Open issues

- Verify in the Claude Code docs that `.claude/rules/` with `paths:` frontmatter loads only for matching files before implementing finding 1.
- `check:agents` is not in CI yet. The validation gate in `.ai/agentic.config.json` and `SDLC.md` does not list it, so the hard rule "gate stays in sync with CI" is not met for this script.
- `task-router` symlink missing in `.claude/skills/` (sandbox blocked the write). Needed for Claude Code to see the skill by name: `ln -s ../../.agents/skills/task-router .claude/skills/task-router`.
- The `task-router` skill itself has not been run; its steps were applied by hand. Its check script is the one in `scripts/`.
- Context Scope Setup tab: old cached skills not yet checked.
- Re-measure `/context` in a new session after the next change.

## Handoff

Branch `context-homework`, commits `9c42c40`, `ce0b509`, `2c99e94`, `3d5041f`, plus this file (not committed yet). `.claude/settings.json` is the owner's local change and is not part of this work.

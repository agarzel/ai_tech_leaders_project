# Run: lesson 5 — specs for the first eight backlog items

- Date: 2026-10-19
- Branch: `lesson-5-spec`
- Owner: Arkadiusz (decisions); author: Claude Code (Claude); cross-model reviewer: Codex (GPT)

## Goal

Turn backlog #25–#32 (epics #21, #22) into implementation-ready specs through the lesson's process: `om-spec-writing` draft → owner answers → scope-cohesion review → review by another model → Grill Me → owner decisions.

## What was done

1. Installed `grill-me` and `grilling` from mattpocock/skills per project (Claude Code + Codex), pinned in `skills-lock.json`; reviewed both skill files before use (plain interview instructions, nothing executable). `grill-me` only delegates to `grilling` and disables model invocation, so the agent runs `grilling`.
2. **Spec 1** `.ai/specs/2026-10-19-mentor-accounts-and-offer.md` (#26, #25, #27, #28): 7 gate questions (D09–D12), scope-cohesion subagent (10 findings, all applied), Codex review (5 accepted, 1 rejected), Grill Me (11 answers).
3. **Spec 2** `.ai/specs/2026-10-19-booking-and-prepayment.md` (#29–#32): 9 gate questions (D13–D15; D13 supersedes D09 after spotting that a 12 h booking window left mentors minutes to accept), subagent + Codex reviews merged (D16 card-only; 10 fixes; 1 rejected; 1 Codex claim corrected), Grill Me (9 answers).
4. Brief updated: D09–D16, Q02 answered (D09, tightened by D13); decision records in `research/decisions/`. Requirement comments on #30 (price snapshot at booking).
5. Data-model graphs: Mermaid in each spec plus interactive views in `.ai/data-model/`.

## Decisions and why

- Reviews by two different reviewers caught different classes of defects: the same-model subagent found phase-ordering and Stripe-API constraints; Codex found the hold-vs-payment race, checkout-creation recovery and refund-lifecycle gaps. Both independently flagged delayed payment methods.
- The recurring Codex "too much detail" finding was rejected both times: the shared foundations were an explicit requirement, research is part of the skill's format, and the phase plan feeds `om-auto-create-pr`.

## Verified

- Docs only; no code changed, so lint/typecheck/tests/build were not run.
- Codex ran `codex exec -s read-only`; its reports are summarized in each spec's *Review decisions*.

## Open issues

- Q01 (commission), Q03 (no-show proof), Q04 (legal), Q05/D14 (payouts) still open; booking spec is not launchable without the payout spec.
- Specs move to `.ai/specs/implemented/` only when their code is merged.

## Handoff

Next: lesson 6 (mockups/design system) uses these specs as input for `om-mockup-prototype`; implementation can start from spec 1 Phase 1 (#16 first).

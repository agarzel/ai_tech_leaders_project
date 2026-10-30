# Lesson 13 – backlog triage by type of work (2026-10-30)

Lesson 13 homework: every task gets one of four types, from two questions – is it **disjoint** (own files and data model) and can it be **verified without my attention** (CI and tests decide)?

| Type | Meaning | Limit |
|---|---|---|
| **parallel** | disjoint and verified by CI – research, maintenance, variants, review by a cheaper model | no limit; good for the night |
| **2–3 at once** | features from a good spec in disjoint modules | 2–3 in flight |
| **sequential** | same files or data model, or on the critical path | one after another |
| **interactive** | decisions, unclear requirements | human in the loop, not a queue |

## Ten tasks

| # | Task | Source | Type | Why |
|---|---|---|---|---|
| 1 | Clear the dependency advisories: `npm audit --omit=dev` reports 6 high, 2 moderate, 1 low (undici, body-parser, zod, shadcn, systeminformation, qs, fast-uri, deepmerge), all with fixes available | `npm audit`, 2026-10-30 | parallel | small diff per package, CI decides; a major bump (zod, shadcn) is split out if it breaks the gate |
| 2 | CI: prune glob `chrome-[0-9]*` and `timeout-minutes` on the agent-browser install step | review of PR #83 | parallel | one workflow file, verified by the next CI run – **done in this branch** (same file as the automation, so sequential with it) |
| 3 | Close the issues whose work is merged: #21, #22, #29, #30, #32, #33, #34, #36 (`om-close-fixed-issues`) | tracker | parallel | tracker only, no code |
| 4 | Markdown scenarios in `.ai/qa/` for the ~60 older integration tests (lesson 12 rule) | lesson 12 | parallel | docs per test file, no code; reviewed in batches |
| 5 | Upgrade to Node.js 24 LTS (local, CI, Docker) | #19 | sequential | touches CI, Docker and every job at once; nothing else should change the workflow meanwhile |
| 6 | Make the Docker socket default (Docker Desktop setting) or `DOCKER_HOST` in the integration setup | lesson 12 | sequential | one place (`global-setup.ts` / docs), blocks reliable local integration runs |
| 7 | No-show settlement | #35 | interactive → 2–3 at once | blocked by decision Q03 (what proves a no-show); after it, a feature from the E03 spec |
| 8 | Stripe test-mode run and `bookings-*` screenshots, then move the booking spec to `implemented/` | #31, Epic 02 | interactive | owner's Stripe keys and a manual check |
| 9 | Mentor payouts / Stripe Connect | product brief Q01, Q05, D14 | interactive | open product questions before any spec |
| 10 | E04 – parked items | #24 | interactive | needs a product decision on what comes next |

**Distribution:** 4 parallel, 2 sequential, 4 interactive (one becomes 2–3 at once after its decision). Nothing is 2–3 at once today – the features left are blocked by decisions, which is the serial part (Amdahl) of this project now.

## Automation

The nightly run of the full CI on `main` (see `.github/workflows/ci.yml`, `schedule`) plus a dependency audit job: tasks 1 and 2 are exactly what it catches – a new advisory or a Chrome / runner change that breaks the integration job.

The first nightly runs will be red on the audit job until task 1 is done – that is the automation working, not a broken workflow.

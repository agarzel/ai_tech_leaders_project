---
name: om-integration-tests
description: Use when writing, running or fixing DevMentor integration tests with om-integration-tests. Adds the repo rules on top of the installed skill – a Markdown scenario for every test in .ai/qa/{AREA}/, linked both ways, the integration-test best practices, and this repo's test conventions – never replacing it.
---

# om-integration-tests – DevMentor extension

@.agents/skills/om-integration-tests/SKILL.md

Apply the installed skill above **in full** (environment attach via `om-prepare-test-env`, observing the running app before writing, verification, failure triage, security boundaries). The rules below are **added** for this repository and only make it stricter.

## R1 – A Markdown scenario for every test (mandatory here)

The installed skill makes the scenario optional; here it is **required** for every new or changed test.

- Path: `.ai/qa/{AREA}/{AREA}-{number}-{slug}.md` – `AREA` is the upper-case app area (`AUTH`, `ADMIN`, `MENTOR`, `SLOTS`, `PUBLIC`, `BOOKINGS`, `SESSION`), `number` is the next free three-digit number in that folder (`001`, `002`, …), `slug` is kebab-case and says the condition and the result.
- Content: title, area, priority, type (UI / API), the **business rule and its source** (spec section or decision id), Given / When / Then, edge cases not covered, and a link to the test – `Test: [packages/app/tests/integration/<file>.int.test.ts](../../../packages/app/tests/integration/<file>.int.test.ts) › "<it name>"`.
- The test links back: a comment above the `it(...)` – `// Scenario: .ai/qa/{AREA}/{AREA}-{number}-{slug}.md`.
- Fill the scenario with the actions and results actually observed in the running app, not guessed ones.

## R2 – Best practices

Apply every rule in [references/best-practices.md](references/best-practices.md) when designing and reviewing a test. A test that breaks one of them is not finished.

## R3 – Repository conventions

- Tests live in `packages/app/tests/integration/*.int.test.ts` (Vitest + agent-browser through `support/browser.ts`); run one file with `npx vitest run --config vitest.integration.config.mts <file>`, the whole suite with `npm run test:integration` (needs Docker).
- One file per area or flow, **one `it` per business case**, each file with its own browser session names (`new Browser("devmentor-it-<file>-<role>", baseUrl)`); files share one app and database, so never rely on rows created by another file.
- Set up data the shortest way – the API helpers in `support/flow.ts` (invite, profile, slot, register, book and pay) – and drive the UI only for the behaviour under test. Move time with SQL on `slots.starts_at` (`support/database.ts`), never with sleeps.
- Every POST from a test carries `x-devmentor-client: 1` (CSRF; without it the API answers 403). The payment webhook is the only exception.
- The fake payment gateway signs webhook events with HMAC-SHA256 of the raw body using the sweep secret (`inject("sweepSecret")`), header `x-fake-signature`.
- Locate elements by role + accessible name or by label; take a screenshot at the key assertion (`browser.screenshot(name)`).
- Read `.ai/lessons.md` first – it holds the traps already met in these tests (Suspense + `notFound()`, browser session names, focus waits).

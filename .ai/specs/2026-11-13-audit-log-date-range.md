# Audit log: filter by date range

Extends: .ai/specs/implemented/2026-11-11-audit-log.md

## 📝 TLDR

An admin investigating an incident ("who changed roles last Tuesday night?") can narrow `/admin/audit` to a time window. `GET /api/admin/audit-events` gains optional `from` and `to`. The page gains two date fields next to the Action filter. Nothing that the 2026-11-11 spec defines stops being true, so the relation is `Extends`.

## 📝 Prior spec drift

Compared with the code on `main` at `cf9728b` (2026-11-13):

| Spec, section | The spec says | The code does | Where |
|---|---|---|---|
| 2026-11-11-audit-log.md, TLDR (line 5) | Every action that changes who can do what leaves an `audit_events` row. | The production bootstrap of the first admin on 2026-11-13 promoted the account with SQL inside the Postgres container, so that one change has no row. The runbook documents it as an accepted exception. | `README.md:240` (Railway step 7) |
| 2026-11-11-audit-log.md, UI/UX (line 81) | The Action filter narrows the list. | `load()` sets state from whichever response arrives last, so changing the filter quickly can show rows for the previous filter. This is the open follow-up to #119. | `packages/app/src/app/admin/audit/audit-admin.tsx:25-36` |
| 2026-11-11-audit-log.md, Risks (line 105) | T-03 is open, so failed-login rows have no hard growth bound. | T-03 was mitigated on 2026-11-04 with `TRUSTED_PROXY_HOPS`. The production app now runs behind Railway's proxy, so the residual applies only to a direct exposure. | `docs/security/threat-model.md:134`, `packages/core/src/config/env.ts:20` |

Open question Q-D1: should the README bootstrap path write an audit row (for example `auth:set-password` run inside the app image), or stay a documented exception? Default: documented exception, because it happens once per environment.

## 📝 Delta

### Capability: audit log reading

#### ADDED Requirement: date range filter

The system SHALL accept optional `from` and `to` (ISO 8601 date-time with an offset) on `GET /api/admin/audit-events` and return only entries with `from ≤ occurred_at < to`, newest first. Either bound may be given alone.

##### Scenario: window on the API
- WHEN an admin requests `?from=2026-11-10T00:00:00Z&to=2026-11-11T00:00:00Z`
- THEN only entries that occurred on 10 November (UTC) are returned, with `total` counting only those

##### Scenario: reversed window
- WHEN `from` is later than or equal to `to`
- THEN the API answers 400 `validation_error` ("`from` must be before `to`")

##### Scenario: window on the page
- WHEN an admin sets "From" and "To" on `/admin/audit` (date pickers in the viewer's time zone, which is named above the table as today)
- THEN the list shows that window, page 1, and combines it with the Action filter

#### MODIFIED Requirement: query schema of the audit list

The strict `auditEventListQuerySchema` accepts the two new keys. Every other key is still refused with 400.

##### Scenario: unknown keys stay refused
- WHEN the query carries `sort=asc`
- THEN the API answers 400 `validation_error`, as before

Frozen by: `packages/core/src/validators/audit/audit-event-list.schema.test.ts` ("an unknown key", line 33) and `packages/app/tests/integration/audit-log.int.test.ts` ("lets only an admin read the log, and nobody change it", line 138)

#### MODIFIED Requirement: stale responses on `/admin/audit`

The page shows only the response to the latest filter (action or dates). A response to an outdated request is ignored, which closes the follow-up to #119.

##### Scenario: fast filter change
- WHEN the admin changes the filter twice before the first response arrives
- THEN the table shows rows for the second filter only

Frozen by: `packages/app/tests/integration/audit-log.int.test.ts` ("records a role change, a delete and invitations made through the admin UI, and shows them in plain words", line 83)

## 📝 Data Model

No change. `audit_events_occurred_at_index` and `(action, occurred_at)` already serve both filters (`packages/db/src/migrations/Migration20261111160000_audit_events.ts:9-11`), so no migration is needed.

## 📝 Backward compatibility

The change is additive. The two new optional query keys are documented in `BACKWARD_COMPATIBILITY.md` §1. Existing callers send neither key and get the same result as today.

## 📋 Implementation Plan

1. `core`: add `from` and `to` to `auditEventListQuerySchema` (`z.iso.datetime({ offset: true })`, plus a refine for `from < to`). In `AuditService.list`, add `occurredAt: { $gte, $lt }`. Unit tests cover each bound alone, both bounds, the reversed window, and an unknown key still refused.
2. `app`: add "From" and "To" fields and ignore outdated responses (request counter or `AbortController`) in `audit-admin.tsx`. The integration test gets a date-window case and a fast filter change.
3. `ui`: no new component, because the date inputs come from the design system.
4. Gate: lint, typecheck, `test:coverage` 100%, integration tests.

Not implemented in this spec's PR: this document is the lesson 25 homework (new requirement, new spec). Implementation ships on its own PR.

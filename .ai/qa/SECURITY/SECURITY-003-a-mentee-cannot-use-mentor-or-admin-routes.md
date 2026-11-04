# SECURITY-003 – A mentee cannot use mentor or admin routes

- **Area:** SECURITY · **Priority:** High · **Type:** API
- **Rule:** mentor routes require the `mentor` role and user management requires `admin`; a mentee gets 403 (threat model T-05; routes `api/users`, `api/users/[id]`, `api/mentor/slots`).
- **Test:** [packages/app/tests/integration/access-boundaries.int.test.ts](../../../packages/app/tests/integration/access-boundaries.int.test.ts) › "answers 403 when a mentee calls a mentor route or makes themselves admin, and stores nothing"

## Given
- Mentee B, signed in.
- Positive controls: the admin reads mentee B's account (200, role `mentee`); mentee B reads their own list (200).

## When
- Mentee B lists users, sets their own role to `admin` (PUT) and publishes a slot.

## Then
- All three answer 403 with error code `forbidden`.
- The admin reads the same account as before (still a mentee), and the number of slots is unchanged.

## Edge cases not covered here
- A mentor calling admin routes (same `requireAdmin` path).
- An anonymous visitor (401).

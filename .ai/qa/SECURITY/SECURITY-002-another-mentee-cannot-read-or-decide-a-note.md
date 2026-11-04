# SECURITY-002 – Another mentee cannot read or decide the session note

- **Area:** SECURITY · **Priority:** High · **Type:** API
- **Rule:** only the booking's mentee reads and decides the mentor's note; anyone else gets 404 (threat model T-04; routes `api/bookings/[id]/note`, `api/bookings/[id]/note/approve`).
- **Test:** [packages/app/tests/integration/access-boundaries.int.test.ts](../../../packages/app/tests/integration/access-boundaries.int.test.ts) › "answers 404 when another mentee reads or decides the mentor's draft note, and the draft stays undecided"

## Given
- The same booking; its session ended an hour ago and the mentor wrote a draft note.
- Positive controls: mentee A reads the draft (200, `draft`); mentee B reads their own list (200).

## When
- Mentee B reads the note and approves it.

## Then
- Both answer 404 with no note data.
- Mentee A reads the same draft as before; the stored note is still `draft` with no decision time.

## Edge cases not covered here
- Rejecting instead of approving (same service check).
- A mentor of another booking (same 404 path as any outsider).

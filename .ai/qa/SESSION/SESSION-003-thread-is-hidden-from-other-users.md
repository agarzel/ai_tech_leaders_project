# SESSION-003 – The session thread is hidden from other users

- **Area:** SESSION · **Priority:** High · **Type:** API
- **Rule:** only the booking's mentee and mentor can read or write its thread; anyone else gets 404, so the booking's existence is not revealed (`.ai/specs/2026-10-27-session-and-aftermath.md`; route `api/bookings/[id]/messages`).
- **Test:** [packages/app/tests/integration/session-thread-access.int.test.ts](../../../packages/app/tests/integration/session-thread-access.int.test.ts) › "answers 404 to a signed-in user outside the booking, for reading and for writing, even while the session runs"

## Given
- A confirmed booking whose session started 5 minutes ago (the window is open), with one message from its mentee.
- Another signed-in mentee who is not part of the booking.

## When
- The other mentee reads the thread (GET) and posts to it (POST).

## Then
- Both answer 404.
- Only the mentee's message is stored.

## Edge cases not covered here
- An anonymous visitor (401 from the session check).
- A mentor of another booking (same 404 path as any outsider).

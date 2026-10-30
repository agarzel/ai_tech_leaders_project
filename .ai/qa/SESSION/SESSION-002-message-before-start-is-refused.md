# SESSION-002 – A message before the session starts is refused

- **Area:** SESSION · **Priority:** Medium · **Type:** API
- **Rule:** messages can be sent only while the session runs, from its start to its end (`.ai/specs/2026-10-27-session-and-aftermath.md`; `isMessagingOpen`).
- **Test:** [packages/app/tests/integration/session-thread-access.int.test.ts](../../../packages/app/tests/integration/session-thread-access.int.test.ts) › "refuses a message from the booking's own mentee before the session starts and stores nothing"

## Given
- A confirmed, paid booking whose session starts in 3 days.

## When
- The booking's own mentee posts a message to `/api/bookings/{id}/messages`.

## Then
- The reply is 409 with "The session window is closed".
- No message is stored for the booking.

## Edge cases not covered here
- A message after the session ends (same rule, closing side).
- A message on a booking that is not confirmed yet (409 "The thread opens once the booking is confirmed").

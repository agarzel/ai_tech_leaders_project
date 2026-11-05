# SESSION-004 – A note changed before approval is refused, then shown in its new version

- **Area:** SESSION · **Priority:** High · **Type:** UI
- **Rule:** the mentee approves "with the note shown in full before the choice" (`.ai/specs/2026-10-27-session-and-aftermath.md`). A decision applies only to the text the mentee was shown, so a draft the mentor replaced after that is refused with 409 (#136; `SessionNoteService.decide`, route `api/bookings/[id]/note/approve`).
- **Test:** [packages/app/tests/integration/session.int.test.ts](../../../packages/app/tests/integration/session.int.test.ts) › "refuses the mentee's approval of a draft the mentor replaced after it was shown, then shows the new text (#136)"

## Given
- A confirmed booking whose session has ended, with the mentor's draft note "Version A".
- The mentee's booking page is open and shows "Version A".

## When
- The mentor replaces the draft with "Version B".
- The mentee clicks **Approve** on the page that still shows "Version A".

## Then
- The decision is refused: "The mentor changed this note. Read the new version before you decide."
- The note is still an undecided draft (`draft`, no `decided_at`).
- The page now shows "Version B"; approving again approves "Version B".

## Edge cases not covered here
- Rejecting a changed draft (same check, unit test in `session-note.service.test.ts`).
- The mentor replacing the draft with identical text (the decision goes through – the mentee saw that text).

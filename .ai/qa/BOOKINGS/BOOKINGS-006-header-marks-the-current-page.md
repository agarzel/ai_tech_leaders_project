# The header marks the current page and keeps link labels on one line

- **Area:** BOOKINGS
- **Priority:** P2
- **Type:** UI
- **Business rule:** The header shows where the user is: the link of the current page (or of the page above it, e.g. `/bookings` on `/bookings/123`) has `aria-current="page"` and the current-page style. A link label never wraps inside the link; when the row is full, the whole link moves to the next line (#137, found by the human QA pass on PR #133).
- **Test:** [packages/app/tests/integration/header-navigation.int.test.ts](../../../packages/app/tests/integration/header-navigation.int.test.ts) › "marks the current page in the header and keeps every link label on one line (issue 137)"

## Given

- A signed-in mentor.

## When

- The mentor opens `/mentor/bookings`, then `/bookings`.

## Then

- On `/mentor/bookings` only "Bookings" is the current page; every header link has `white-space: nowrap`.
- On `/bookings` only "My bookings" is the current page.

## Edge cases not covered here

- The 375 px layout itself (checked by a person in DevTools; the computed `nowrap` is what prevents the wrap).
- A detail page such as `/bookings/123` (prefix rule, unit test `isCurrentNavHref` in `packages/ui/src/backend/layout/layout.test.tsx`).

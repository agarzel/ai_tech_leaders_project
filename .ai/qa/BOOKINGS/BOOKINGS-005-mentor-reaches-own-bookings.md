# A mentor reaches both received and own bookings from the header

- **Area:** BOOKINGS
- **Priority:** P2
- **Type:** UI
- **Business rule:** Any signed-in user may book a mentor (#98), so a mentor is also a mentee for the sessions they book. The header links a mentor to the bookings they receive (`/mentor/bookings`) and to their own (`/bookings`); a mentee sees only their own; an admin sees neither (#106, [booking spec](../../specs/implemented/2026-10-19-booking-and-prepayment.md)).
- **Test:** [packages/app/tests/integration/header-navigation.int.test.ts](../../../packages/app/tests/integration/header-navigation.int.test.ts) › "gives a mentor both received and own bookings, a mentee only their own, an admin neither"

## Given

- A signed-in mentor, a signed-in mentee and the signed-in admin, each on the home page.

## When

- Each reads the navigation links in the header.

## Then

- Mentor: "Bookings → /mentor/bookings" and "My bookings → /bookings".
- Mentee: "My bookings → /bookings", no link to `/mentor/bookings`.
- Admin: "Admin → /admin", no bookings link.

## Edge cases not covered here

- Following the links (both pages are covered by their own scenarios).
- A visitor (Log in / Register only, `auth.int.test.ts`).

# Backlogs

## .ai/specs/product-brief.md

Backlog source: .ai/specs/product-brief.md
Last filed: 2026-10-19

Blocked stories: E02-S03 (#32) by Q02; E03-S03 (#35) by Q03. External dependency: #16 (entity singletons before the first relation).

| Id | Issue | Title | Parent | Depends on | Adopted |
|---|---|---|---|---|---|
| E01 | #21 | Mentor offer — slots, prices, share link | — | — | no |
| E02 | #22 | Booking and prepayment | — | — | no |
| E03 | #23 | Session and aftermath | — | — | no |
| E04 | #24 | Later (parked) | — | — | no |
| E01-S01 | #25 | A mentor can set prices for 25- and 50-minute sessions | #21 | #26 | no |
| E01-S01-T01 | #26 | Minimal mentor and mentee accounts and sign-in | #25 (story) | — | no |
| E01-S02 | #27 | A mentor can publish bookable slots | #21 | #25 | no |
| E01-S03 | #28 | A mentor gets a share link and can opt in to the public list | #21 | #27 | no |
| E02-S01 | #29 | A mentee can open a mentor via link or list and see open slots and prices | #22 | #28 | no |
| E02-S02 | #30 | A mentee can book a slot with a question and prepay | #22 | #29, #31 | no |
| E02-S02-T01 | #31 | Stripe prepayment and refund integration (test mode) | #30 (story) | — | no |
| E02-S03 | #32 | A mentor accepts or declines the question until 12 h before the session | #22 | #30 | no |
| E03-S01 | #33 | Mentor and mentee hold the text session at the booked time | #23 | #32 | no |
| E03-S02 | #34 | A mentee can cancel a booking and sees whether it is refunded | #23 | #30 | no |
| E03-S03 | #35 | No-shows are settled for both sides | #23 | #33 | no |
| E03-S04 | #36 | A mentor can write an optional private note the mentee approves | #23 | #33 | no |

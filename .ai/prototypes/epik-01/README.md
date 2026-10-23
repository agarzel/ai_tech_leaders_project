# Clickable prototype: Epic 01 (accounts, roles, the mentor offer)

A clickable prototype of the 12 screens in `lekcja-07/mapa-ekranow.md` (s01-s12), built from `@devmentor/ui` components and tokens. Everything is a simulation held in memory: no server, no e-mail, no real log-in. Progress, decisions and the verification table are in `POSTEP.md`.

## Run it

```bash
cd .ai/prototypes/epik-01 && npx vite build        # output: packages/ui/.storybook/public/prototypes/epik-01/ (not committed)
npm run storybook                                    # then open http://localhost:6006/prototypes/epik-01/index.html
# or only static files: python3 -m http.server 4175 -d packages/ui/.storybook/public
npx vite                                             # dev server on port 5174 (work on the prototype)
```

The page needs an HTTP server (ES modules do not load from `file://`).

## Demo accounts (fictitious, shown on the log-in screen)

| Role | E-mail | Password |
|---|---|---|
| mentee | ola.wisniewska@example.com | ingress-1-28-upgrade |
| mentor | marek.zielinski@example.com | helm-chart-rollback-2 |
| admin | oliwia.nowak@example.com | demo-admin-passphrase-1 |

The invited mentor is Anna Maj (anna.maj@example.com): the admin invites her on `/admin/invitations`, or use scenario c02 "Valid". Public mentors without log-in: Kasia Lewandowska, Piotr Wojcik, Nina Kaminska. The review bar's **Role (c01)** switches accounts without a password.

## Review bar (outside the product)

Screen map (s01-s12), Role (c01), Width (c22), Reset, Clickable / Comment, hotspots, Presentation, Threads, Dark theme, and the **Scenario controls** panel:

| Id | Control | Shows |
|---|---|---|
| c02 | open invitation link: valid / used / expired / revoked / unknown | s04.2, s04.3 |
| c03 | invitation used in the meantime | s04.4 |
| c04 | address already registered | s02.4, s04.6 |
| c05 | failing credentials | s03.3 |
| c06 | too many attempts: log in / register (mentee) / register (mentor) | s03.4, s02.5, s04.7 (5 failed log-ins also lock the account) |
| c07 | session ends on the next save; "End the session now" | s03.7, s12.4 |
| c08 | next request: network error / server error 500 | error states and "Try again" on every screen |
| c09 | slow loading (3.5 s) | loading and sending states |
| c10 | invitation list: full / empty / error | s06.1, s06.3, s06.4 |
| c11, c12 | invite Tomasz again / lose the invitation link | s06.10, s06.7 |
| c13 | offer state: new / profile and prices / only times under 24 h / ready / ready and listed | s07.1-s07.5 (overwrites the mentor's data until Reset) |
| c14 | opt-in on the public list | s08.9, s08.10 |
| c15 | slots: normal / none / 60 | s09.2, s09.14, s11.3, s11.6 |
| c16 | slot booked in the meantime | s09.12 |
| c17 | demo clock: Fri 23 Oct 2026 10:00 (Europe/Warsaw) / +6 h / +24 h | slots turn "starts too soon" |
| c19 | daylight saving: time that does not exist (28 Mar 2027 02:30) / happens twice (25 Oct 2026 02:30) | s09.8, s09.9 |
| c20, c21 | public list: a few / empty / 25 / long values; stack filter | s10.1-s10.8 |
| x01-x03 | extras: unknown mentor link, unknown address, registration link without a token | s11.4, s12.3, s04.10 |

c18 (viewer time zone) is not built: the prototype shows times in Europe/Warsaw only.

## Limits of the simulation

- Nothing leaves the browser tab. Passwords typed on the registration screens are only length-checked and kept in memory until reload; the demo passwords are fictitious.
- No e-mail, no payment, no bookings: *Book* is disabled with the reason written on the page (Epic 02 is out of scope).
- Errors, delays, rate limits and the clock are scenario switches, not real services. "Next request" errors (c08) apply to the next request only.
- Reload resets all data. Review comments live in the reviewer's browser (`localStorage`) and are exported with "Export for repository" / "Export Markdown".
- Only the current screen is rendered. Comments on another screen show as "orphaned" in the Threads panel until that screen is open; the comment itself is attached to the screen ID.
- Drafts are not restored after the session ends (the owner decision L03 only returns to the page).
- Known design-system gaps are marked `LUKA DS Gxx` in the code and listed in `POSTEP.md`.

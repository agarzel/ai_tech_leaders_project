# Mentor onboarding: discovery prototype, revision 001

- Brief: `.ai/specs/product-brief.md` (decisions D01-D16, rules R01-R08, non-goals N01-N03)
- Screen map and owner decisions: `lekcja-07/mapa-ekranow.md` (section 4, "Decyzje właściciela (2026-10-23)")
- Revision date: 2026-10-23. Previous revision: none. Panel report: none supplied (no `[SYNTHETIC]` input used).
- Open: `index.html` in a browser (file URL, no server). Reset: the "Reset simulation" button in the Test state area. All data is fictitious and held in memory only. This prototype does not establish demand, evidence or readiness.

## Flow mapping (confirmed by the owner, 2026-10-23)

The brief has no flow named "mentor onboarding". The confirmed mapping: Key flows, future state, step (1) "the mentor publishes slots and prices (R07)", extended with the share link and opt-in (R07, R08, D03) and with the admin invitation and mentor registration as entry screens (D11). Source of the entry screens: the spec and the screen map, not the brief (the brief covers invitations only in D11).

- Actor: a mentor invited by an admin (founder). Start: admin on `/admin/invitations`, or the mentor opening an invitation link.
- Success: mentor registered, profile and both prices saved, at least one slot at least 24 h ahead, share link visible, opt-in on and the mentor is on the public list.
- Screens: s06 invitations, s04 mentor registration, s03 login, s07 dashboard, s08 profile and prices, s09 slots, s11 public page, s12 access and not-found (shown as login redirect and "Not found").
- Outside the prototype (labelled, with a way back): mentor list `/mentors` (the mentee landing from L04), booking, payment, acceptance, session, cancellation, session note, `/admin/users`, payouts and commission (Q01, Q05, D14).

## Rules and decisions preserved

R01 (25 and 50 minutes only), R07 (mentor sets both prices, PLN, D12, no commission shown, Q01 open), R08 and D03 (share link for every mentor; list by opt-in), D10 (email + password), D11 (invitation only, admins are the founders), D13 (slots bookable from 24 h ahead; "now" is Fri 2026-10-23 10:00 Europe/Warsaw), D15 (no email: the invitation link is copied and sent by hand), N01 (no video), N02 (no ratings anywhere), N03 (no same-day help; the public page states the 24 h notice). Owner decisions L01-L14 as recorded in the screen map: L01 no email verification; L02/L03 guests and wrong roles go to login and return afterwards, an ended session shows "Your session has ended"; L04 landing by role; L05 "Book" disabled with a reason, no "My bookings"; L06 slots without prices allowed (not listed), list grouped by day, "less than 24 h ahead" rejected; L07/L08 missing items in the checklist, share link from the moment the profile is saved on `/mentor` and `/mentor/profile`; L10 no revoke without a new invitation; L11 "This address already has an account - log in"; L12 "Ask the founders for a new link"; L14 24 h notice stated on the public page. L09, L13, L15, L16 stay open.

## Assumptions (all `[ASSUMPTION]`, reversible)

Owner decision 2026-10-23: A01-A06 accepted as written. A07-A10 stay open assumptions.

- A01: Wrong role on a protected page redirects to login with "This page is for X accounts" and keeps the current session until the next login replaces it. Need: L02 says "redirect to /login" without a message. Check: owner review.
- A02: Entries typed into a form are kept when the session ends during a save and are restored after logging back in. Need: L03 covers the message and return, not data. Check: owner review.
- A03: After "Log out" the person lands on the prototype start page. Need: the destination was not decided (L02 question, not in the recorded decisions).
- A04: A mentor needs both prices for "Prices set"; one price alone counts as not set. Need: spec says only that both prices are shown.
- A05: A new invitation to an e-mail with a pending invitation marks the old one "Revoked" (spec Q6); the invitation list has four statuses (Pending, Used, Expired, Revoked). L10 is silent on the statuses.
- A06: A public page exists only after the profile is saved (before that, "Not found"), so the share link is shown only after the first save (L08).
- A07: The invitation e-mail must be valid in format; the "already has an account" check is done at invitation time (L11) and also at sign-up (toggle).
- A08: All times are treated as Europe/Warsaw without daylight-saving handling; the DST states (s09.8, s09.9) are not simulated. A mentor reaching `/mentors` after login (mentee) sees an "Outside this prototype" screen.
- A09: Opt-in is a checkbox saved with the profile (not an immediate switch), as in the spec. A mentor with opt-in on but not ready sees "Public list is on, but you are not visible yet. Missing: ...".
- A10: A logged-in person opening `/login` or a registration link is not blocked (L13 stays open); login shows a note that a new login replaces the session.

## Screen and state map

| Route (hash) | Screens and states | Rules / assumptions |
|---|---|---|
| `#/admin/invitations` | form, list (full, empty, load error with Try again), invalid email, e-mail already has an account, link shown once with Copy / Open / Done, link closed, re-invite revokes the old one, network error, too many attempts | D11, D15, L10, L11, A05, A07 |
| `#/register/<token>` | valid (invited e-mail read-only), name and password validation, network error, e-mail has an account, used in the meantime, success to `#/mentor`; invalid link for used, expired, revoked, unknown and no token (identical text) | D11, L12, A07 |
| `#/login` | default, invalid credentials, network error, too many attempts, return to the previous page, "Your session has ended", wrong-role message, landing by role | L02-L04, A01, A02, A10 |
| `#/mentor` | checklist for a new mentor, missing prices or slots, only slots under 24 h, ready, on the list | R08, D13, L07, L08 |
| `#/mentor/profile` | prefilled form, validation (name, headline up to 120, https links up to 5, price 10-10,000 PLN), saved status, opt-in, share link after save, session ended on save | R01, R07, D12, L08, A02, A04, A09 |
| `#/mentor/slots` | empty, no prices notice, add (24 h, 60 days, 15-minute step, 50-minute spacing, duplicate, invalid input), grouped by day, too soon, booked (no delete), delete with confirmation | D13, L06, A08 |
| `#/m/<slug>` | profile, prices, times grouped by day, 24 h notice, "Book" disabled with reason, no times, Not found; no ratings | N02, R08, L05, L14, A06 |
| other | prototype start, "Outside this prototype" (`#/mentors`), "Page not found" | L04 |

Demo clock, server response (normal, network error, too many attempts), invitation list state, "invitation used in the meantime", "e-mail already has an account", "Expire session now" and role shortcuts live in the Test state area. Loading skeletons and DST states are not simulated.

## Verification

Browser: agent-browser 0.39.0 from `node_modules/.bin`, isolated session `qa-mo1`, local `file://`, closed after each walk. Tag `[OBSERVED]` = seen in the browser. Result: `passed`.

Static review: passed. One `index.html`; no external URL, script, font, image, fetch, storage or cookie; forms cannot submit to a server; every field has a label; errors use `role="alert"`, statuses `role="status"`; "Book" is exposed as disabled with a reason linked by `aria-describedby`.

### Keyboard-only path (Tab, Shift+Tab, Enter, Space, Escape, typing; no mouse, no clicks)

Exceptions to "keys only": setting the address hash in K14 and K15's expire button and focus jump (the Test state controls and the address bar are not product controls). Everything else was key presses. Each step was run from a fresh page load and checked by reading the focused element and the page text. All steps passed.

| Step | Action | Observed result |
|---|---|---|
| K1 | Guest: Tab to the "Invitations" link on the start page, Enter | Redirected to login, banner "Log in to continue.", focus on the heading |
| K2 | Type admin e-mail and a wrong password, Enter | "Invalid email or password", focus on that message; fix the password with Backspace and retype, Enter: back on Invitations (return to the previous page), heading focused |
| K3 | Invitee e-mail "bad", Enter; Backspace, valid e-mail, Enter | "Enter a valid email address." with focus on the field; then the invitation link panel is shown once and receives focus |
| K4 | Tab to "Copy link", Space; Tab to "Open this link in the prototype", Enter | "Link copied (simulated)."; registration page for the invited e-mail, heading focused |
| K5 | Submit with empty name and short password; type name, complete password, Enter | Errors with focus on the first invalid field; mentor dashboard with focused heading |
| K6 | Tab to "Profile", Enter | Profile page, heading focused |
| K7 | Enter with empty headline; type headline; Space on a topic; price "5", Enter; fix price; second price; Space on the list opt-in; Enter | Focus on the invalid field with its message each time; opt-in checked by Space; "Profile saved." receives focus; share link shown |
| K8 | Tab to "Slots", Enter; slot 24 Oct 09:30, Enter; Backspace and retype a valid slot, Enter | "A slot must start at least 24 hours from now." with focus on the date field; valid slot added, heading focused, slot listed |
| K9 | Second slot; Tab to its Delete button, Enter; Escape; Enter again; Shift+Tab; Tab Tab; Enter | Enter opens the confirmation and focus moves to "Keep slot"; Escape cancels and focus returns to that Delete button, slot kept; Shift+Tab moves to the previous row's Delete; Tab reaches "Yes, delete this slot"; Enter deletes it, heading focused |
| K10 | Tab to "Dashboard", Enter | "Your offer is ready and you are on the public list." |
| K11 | Tab to "Open your public page", Enter | Public page, prices, times, "Book" disabled with its reason |
| K12 | Tab to "Log out", Enter | Start page, "You have been logged out." |
| K13 | Tab to "Log in", Enter, fill and Enter as the demo mentor | Mentor dashboard, heading focused |
| K14 | Mentor opens the admin page (address typed into the prototype's address bar is not possible with a file URL, so the hash was changed by script; every other action was a key press); log in as admin with the keyboard | Login with "This page is for admin accounts. Log in with a different account."; after login the admin page is shown (return to the previous page) |
| K15 | Edit the headline, mark the session as expired (a click on the Test state button, not part of the product), move focus to the Save button by script and press Enter | Login with "Your session has ended"; after logging in the profile opens with the edited headline restored |

Also observed in this and the earlier walk: unknown fragment shows "Page not found" with a link back; browser back and forward work on hash routes; 320 px viewport has no horizontal scroll (profile, invitations); focus outline is visible on every focused control; the heading receives focus on each navigation; Reset restores the start and removes the simulated outcome; demo clock +24 h turns the nearest slots into "not bookable - starts too soon" (checked on the dashboard and slot list).

### Defects found and fixed in this revision (all in `index.html`)

1. After a successful profile save focus fell to the page body. Now the "Profile saved." message takes focus.
2. Form-level and network errors (invalid login, e-mail already has an account, network error, too many attempts) were not focused. They now take focus.
3. The delete confirmation had no keyboard cancel and focus stayed on the old button. Opening it focuses "Keep slot"; Escape and "Keep slot" return focus to that slot's Delete button; the confirm button is "Yes, delete this slot".
4. Earlier fixes kept: the summary line "Fix the highlighted fields" is not shown for form-level-only errors; a stale return address is cleared when leaving login.

### Not simulated (out of scope, by owner decision)

Loading skeletons and daylight-saving states (s09.8, s09.9). Not tested: screen readers; browsers other than the one above; the "Test state" controls with a keyboard (checkboxes and selects are native controls).

### Harness notes

Two checks read the page before the simulated 250 ms save finished and reported a false failure; the same step passed on every rerun with a longer wait (3 of 3). A password typed during one walk differed from the one planned because the field kept earlier typing; this was a test-script slip, not a prototype defect (the field keeps entries after a validation error, checked separately).

Evidence: `evidence/*.png`, viewport screenshots. Retaken in the last walk (same names): 03, 04, 05, 07, 09, 12, 13, 15, 16, 17, 20, 21, 22, 23, 26, 27, 30 and `k-profile-saved`. The remaining files come from the earlier walk and show screens the fixes did not change.

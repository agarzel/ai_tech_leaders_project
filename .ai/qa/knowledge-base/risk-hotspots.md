# QA risk hotspots

Gotchas worth checking first. Add a bullet only for a new, undocumented one.

- **Test server reload loop (environment, not product):** if a page "jumps" and `document.readyState` stays `loading`, check `GET /` growth in the app log. A dev-server log inside the repo is watched by Turbopack, and every logged request causes a rebuild and a full reload. Fixed by logging to `$TMPDIR` (branch `fix/test-env-log-outside-watch`); a server started by the old script still loops. (2026-11-04, PR #133 session)
- **Header reads in the DOM see two headers:** after client navigation Next.js keeps the previous route's header in the DOM, invisible (zero size). A DOM query on `header a` returns both sets, e.g. "Log in" next to "Log out". Judge by visible elements or by screenshot. (2026-11-04, PR #133)
- **Narrow-screen checks need a human (Claude in Chrome):** resizing a maximized window has no effect, and the app refuses to load in a frame (security headers), so the agent cannot get a 375 px view. Leave layout cases at phone width to the tester. (2026-11-04, PR #133)
- **Header nav labels and current page:** `navLinkClassName` (`@devmentor/ui/backend/layout/links`) has no `whitespace-nowrap`, so two-word links ("My bookings") wrap at phone width. Header links also do not set `aria-current="page"`, even though the class styles it. Check both whenever a header link is added. (2026-11-05, human pass on PR #133)

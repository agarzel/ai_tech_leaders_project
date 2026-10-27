import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Browser } from "./support/browser";

const baseUrl = inject("baseUrl");
const mentee = new Browser("devmentor-it-booking-404", baseUrl);
const stamp = Date.now();
// A well-formed id that no booking has.
const missing = "00000000-0000-4000-8000-000000000000";

describe("booking page for a booking that does not exist", () => {
  beforeAll(async () => {
    await mentee.open("/");
    const registered = await mentee.run(
      "eval",
      `fetch('/api/auth/register', { method: 'POST', headers: { 'x-devmentor-client': '1', 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Missing Booking ${stamp}', email: 'missing.${stamp}@devmentor.test', password: 'correct horse battery' }) }).then((r) => String(r.status))`,
    );
    expect(JSON.parse(registered)).toBe("201");
  });

  afterAll(async () => {
    await mentee.close();
  });

  // Regression: notFound() inside a Suspense boundary answered 200 with the not-found content.
  it("answers 404 for a signed-in mentee", async () => {
    const status = await mentee.run("eval", `fetch('/bookings/${missing}', { credentials: 'include' }).then((r) => String(r.status))`);

    expect(JSON.parse(status)).toBe("404");
  });
});

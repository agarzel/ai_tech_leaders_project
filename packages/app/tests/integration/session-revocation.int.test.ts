import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Browser } from "./support/browser";
import { api, registerMentee, TEST_PASSWORD } from "./support/flow";

// Threat model T-07: logging out must end the session everywhere, not only delete one browser's cookie.
const baseUrl = inject("baseUrl");
const laptop = new Browser("devmentor-it-revocation-laptop", baseUrl);
const phone = new Browser("devmentor-it-revocation-phone", baseUrl);

const email = `revocation.${Date.now()}@devmentor.test`;

describe("session revocation", () => {
  beforeAll(async () => {
    await registerMentee(laptop, "Revocation Mentee", email);
    await phone.open("/");
    expect((await api(phone, "POST", "/api/auth/login", { email, password: TEST_PASSWORD })).status).toBe(200);
  });

  afterAll(async () => {
    for (const browser of [laptop, phone]) await browser.close();
  });

  // Scenario: .ai/qa/SECURITY/SECURITY-006-logout-ends-every-session.md
  it("refuses the other device's session after a logout and lets it sign in again", async () => {
    // Given: positive controls – both devices are signed in to the same account.
    expect((await api(laptop, "GET", "/api/bookings")).status).toBe(200);
    expect((await api(phone, "GET", "/api/bookings")).status).toBe(200);

    // When: the laptop logs out.
    expect((await api(laptop, "POST", "/api/auth/logout")).status).toBe(200);

    // Then: the phone's cookie no longer opens a session, and a fresh login works.
    expect((await api(phone, "GET", "/api/bookings")).status).toBe(401);
    expect((await api(laptop, "GET", "/api/bookings")).status).toBe(401);
    expect((await api(phone, "POST", "/api/auth/login", { email, password: TEST_PASSWORD })).status).toBe(200);
    expect((await api(phone, "GET", "/api/bookings")).status).toBe(200);
  });
});

import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";
import { sql } from "./support/database";
import { api, bookAndPay, inviteMentor, publishSlot, registerMentee, saveOffer } from "./support/flow";

// Threat model T-04 (same role) and T-05 (cross role), docs/security/threat-model.md.
// Every boundary is checked the same way: a positive control for both accounts (each is signed in and is
// answered on a route it may use), the refused read, the refused write, and the owner's data after the attempt.
const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-access-admin", baseUrl);
const mentor = new Browser("devmentor-it-access-mentor", baseUrl);
const owner = new Browser("devmentor-it-access-owner", baseUrl);
const intruder = new Browser("devmentor-it-access-intruder", baseUrl);

const stamp = Date.now();
const intruderEmail = `access.intruder.${stamp}@devmentor.test`;

describe("access boundaries – another account swaps the id", () => {
  let bookingId = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(admin, mentor, `access.mentor.${stamp}@devmentor.test`, `Access Mentor ${stamp}`);
    await saveOffer(mentor, `Access Mentor ${stamp}`);
    const slotId = await publishSlot(mentor, 3);
    await registerMentee(owner, `Access Owner ${stamp}`, `access.owner.${stamp}@devmentor.test`);
    await registerMentee(intruder, `Access Intruder ${stamp}`, intruderEmail);
    ({ bookingId } = await bookAndPay(owner, slotId));
    expect((await api(mentor, "POST", `/api/mentor/bookings/${bookingId}/accept`)).status).toBe(200);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, owner, intruder]) await browser.close();
  });

  // Scenario: .ai/qa/SECURITY/SECURITY-001-another-mentee-cannot-read-or-cancel-a-booking.md
  it("answers 404 when another mentee reads or cancels the booking, and the booking and payment stay as they were", async () => {
    // Given: positive controls – the owner reads the booking, the intruder is answered on their own list.
    const baseline = await api(owner, "GET", `/api/bookings/${bookingId}`);
    expect(baseline.status).toBe(200);
    expect(baseline.body.data).toMatchObject({ status: "confirmed" });
    expect((await api(intruder, "GET", "/api/bookings")).status).toBe(200);
    const paymentBefore = await sql(`select status || ' ' || amount from payments where booking_id = '${bookingId}'`);

    // When: the intruder reads and cancels the owner's booking by its id.
    const read = await api(intruder, "GET", `/api/bookings/${bookingId}`);
    const cancel = await api(intruder, "POST", `/api/bookings/${bookingId}/cancel`);

    // Then: both are 404 like a missing booking, and nothing changed for the owner.
    expect(read.status).toBe(404);
    expect(read.body.data).toBeUndefined();
    expect(cancel.status).toBe(404);
    const after = await api(owner, "GET", `/api/bookings/${bookingId}`);
    expect(after.status).toBe(200);
    expect(after.body.data).toEqual(baseline.body.data);
    expect(await sql(`select status || ' ' || amount from payments where booking_id = '${bookingId}'`)).toBe(paymentBefore);
  });

  // Scenario: .ai/qa/SECURITY/SECURITY-002-another-mentee-cannot-read-or-decide-a-note.md
  it("answers 404 when another mentee reads or decides the mentor's draft note, and the draft stays undecided", async () => {
    // Given: the session ended an hour ago and the mentor wrote a draft; the owner sees it.
    await sql(`update slots set starts_at = now() - interval '1 hour' where id = (select slot_id from bookings where id = '${bookingId}')`);
    expect((await api(mentor, "PUT", `/api/mentor/bookings/${bookingId}/note`, { body: "Keep the failing test first." })).status).toBe(200);
    const baseline = await api(owner, "GET", `/api/bookings/${bookingId}/note`);
    expect(baseline.status).toBe(200);
    expect(baseline.body.data).toMatchObject({ status: "draft", body: "Keep the failing test first." });
    expect((await api(intruder, "GET", "/api/bookings")).status).toBe(200);

    // When: the intruder reads the note and approves it.
    const read = await api(intruder, "GET", `/api/bookings/${bookingId}/note`);
    const approve = await api(intruder, "POST", `/api/bookings/${bookingId}/note/approve`, { decision: "approve", body: "Keep the failing test first." });

    // Then: both are 404, and the note is still the undecided draft.
    expect(read.status).toBe(404);
    expect(read.body.data).toBeUndefined();
    expect(approve.status).toBe(404);
    const after = await api(owner, "GET", `/api/bookings/${bookingId}/note`);
    expect(after.body.data).toEqual(baseline.body.data);
    expect(await sql(`select status || ' ' || coalesce(decided_at::text, 'none') from session_notes where booking_id = '${bookingId}'`)).toBe("draft none");
  });

  // Scenario: .ai/qa/SECURITY/SECURITY-003-a-mentee-cannot-use-mentor-or-admin-routes.md
  it("answers 403 when a mentee calls a mentor route or makes themselves admin, and stores nothing", async () => {
    // Given: positive controls – the admin reads the intruder's account, the intruder is answered on their own list.
    const intruderId = await sql(`select id from users where email = '${intruderEmail}'`);
    const baseline = await api(admin, "GET", `/api/users/${intruderId}`);
    expect(baseline.status).toBe(200);
    expect(baseline.body.data).toMatchObject({ role: "mentee" });
    expect((await api(intruder, "GET", "/api/bookings")).status).toBe(200);
    const slotsBefore = await sql("select count(*) from slots");

    // When: the intruder reads the user list, promotes their own account and publishes a slot.
    const read = await api(intruder, "GET", "/api/users");
    const promote = await api(intruder, "PUT", `/api/users/${intruderId}`, { name: "Access Intruder", email: intruderEmail, role: "admin" });
    const publish = await api(intruder, "POST", "/api/mentor/slots", { startsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() });

    // Then: all three are 403, the account is still a mentee and no slot was added.
    expect(read.status).toBe(403);
    expect(read.body.error?.code).toBe("forbidden");
    expect(promote.status).toBe(403);
    expect(publish.status).toBe(403);
    const after = await api(admin, "GET", `/api/users/${intruderId}`);
    expect(after.body.data).toEqual(baseline.body.data);
    expect(await sql("select count(*) from slots")).toBe(slotsBefore);
  });
});

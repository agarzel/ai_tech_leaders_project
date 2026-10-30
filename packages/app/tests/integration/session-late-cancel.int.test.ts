import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";
import { sql } from "./support/database";
import { api, bookAndPay, confirmInDialog, inviteMentor, publishSlot, registerMentee, saveOffer } from "./support/flow";

const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-late-cancel-admin", baseUrl);
const mentor = new Browser("devmentor-it-late-cancel-mentor", baseUrl);
const mentee = new Browser("devmentor-it-late-cancel-mentee", baseUrl);

const stamp = Date.now();
const mentorName = `Late Cancel Mentor ${stamp}`;

describe("cancelling after the free period", () => {
  let bookingId = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(admin, mentor, `late.mentor.${stamp}@devmentor.test`, mentorName);
    await saveOffer(mentor, mentorName);
    const slotId = await publishSlot(mentor, 3);
    await registerMentee(mentee, `Late Cancel Mentee ${stamp}`, `late.mentee.${stamp}@devmentor.test`);
    ({ bookingId } = await bookAndPay(mentee, slotId));
    expect((await api(mentor, "POST", `/api/mentor/bookings/${bookingId}/accept`)).status).toBe(200);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, mentee]) await browser.close();
  });

  // Scenario: .ai/qa/SESSION/SESSION-001-late-cancellation-keeps-the-payment.md
  it("cancels a confirmed booking 6 hours before the start without a refund, and tells the mentee before and after", async () => {
    // Given: the session starts in 6 hours – inside the 12-hour window, so the free period has ended (R04).
    await sql(`update slots set starts_at = now() + interval '6 hours' where id = (select slot_id from bookings where id = '${bookingId}')`);

    // When: the mentee cancels from the booking page.
    await mentee.open(`/bookings/${bookingId}`);
    await mentee.waitForText("Confirmed");
    await mentee.click("button", "Cancel booking");
    await mentee.waitForText("Cancel this booking?");
    await mentee.waitForText("The free cancellation period has ended.");
    await confirmInDialog(mentee, "Cancel booking");

    // Then: cancelled without a refund – the mentor keeps the payment.
    await mentee.waitForText("Cancelled — no refund");
    await mentee.screenshot("booking-cancelled-late");
    expect(await sql(`select status || ' ' || cancel_reason from bookings where id = '${bookingId}'`)).toBe("cancelled mentee_late");
    expect(await sql(`select status from payments where booking_id = '${bookingId}'`)).toBe("paid");
  });
});

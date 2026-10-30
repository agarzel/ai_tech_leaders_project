import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";
import { sql } from "./support/database";
import { api, bookAndPay, inviteMentor, publishSlot, saveOffer } from "./support/flow";

const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-mentor-books-mentor-admin", baseUrl);
const mentorA = new Browser("devmentor-it-mentor-books-mentor-a", baseUrl);
const mentorB = new Browser("devmentor-it-mentor-books-mentor-b", baseUrl);

const stamp = Date.now();
const mentorAName = `Booked Mentor ${stamp}`;
const mentorBName = `Booking Mentor ${stamp}`;

// Scenario: .ai/qa/BOOKINGS/BOOKINGS-003-mentor-books-another-mentor.md
describe("a mentor who booked another mentor", () => {
  let bookingId = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(admin, mentorA, `mentor.a.${stamp}@devmentor.test`, mentorAName);
    await inviteMentor(admin, mentorB, `mentor.b.${stamp}@devmentor.test`, mentorBName);
    await saveOffer(mentorA, mentorAName);

    const slotId = await publishSlot(mentorA, 3);
    ({ bookingId } = await bookAndPay(mentorB, slotId));
    expect((await api(mentorA, "POST", `/api/mentor/bookings/${bookingId}/accept`)).status).toBe(200);
  });

  afterAll(async () => {
    for (const browser of [admin, mentorA, mentorB]) await browser.close();
  });

  it("cancels its own booking and gets the free-period refund, not a 403", async () => {
    const cancelled = await api(mentorB, "POST", `/api/bookings/${bookingId}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.outcome).toBe("refunded");
    expect(await sql(`select status || ' ' || cancel_reason from bookings where id = '${bookingId}'`)).toBe("cancelled mentee_free");
  });

  it("reads and decides the mentor's note on a separate booking, not a 403", async () => {
    const slotId = await publishSlot(mentorA, 4);
    const { bookingId: noted } = await bookAndPay(mentorB, slotId);
    expect((await api(mentorA, "POST", `/api/mentor/bookings/${noted}/accept`)).status).toBe(200);

    // The session has ended: writing and deciding the note are both open.
    await sql(`update slots set starts_at = now() - interval '1 hour' where id = (select slot_id from bookings where id = '${noted}')`);
    const written = await api(mentorA, "PUT", `/api/mentor/bookings/${noted}/note`, { body: "Good session, keep practicing." });
    expect(written.status).toBe(200);

    const read = await api(mentorB, "GET", `/api/bookings/${noted}/note`);
    expect(read.status).toBe(200);
    expect(read.body.data).toMatchObject({ status: "draft", body: "Good session, keep practicing." });

    const decided = await api(mentorB, "POST", `/api/bookings/${noted}/note/approve`, { decision: "approve" });
    expect(decided.status).toBe(200);
    expect(decided.body.data).toMatchObject({ status: "approved" });
  });

  it("still rejects someone who is not the booking's mentee, mentor role or not", async () => {
    expect((await api(mentorA, "POST", `/api/bookings/${bookingId}/cancel`)).status).toBe(404);
    expect((await api(mentorA, "GET", `/api/bookings/${bookingId}/note`)).status).toBe(404);
    expect((await api(mentorA, "POST", `/api/bookings/${bookingId}/note/approve`, { decision: "approve" })).status).toBe(404);
  });
});

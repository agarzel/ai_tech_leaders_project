import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";
import { sql } from "./support/database";
import { api, bookAndPay, inviteMentor, publishSlot, registerMentee, saveOffer } from "./support/flow";

const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-thread-access-admin", baseUrl);
const mentor = new Browser("devmentor-it-thread-access-mentor", baseUrl);
const mentee = new Browser("devmentor-it-thread-access-mentee", baseUrl);
const outsider = new Browser("devmentor-it-thread-access-outsider", baseUrl);

const stamp = Date.now();

describe("session thread – window and access", () => {
  let bookingId = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(admin, mentor, `thread.mentor.${stamp}@devmentor.test`, `Thread Mentor ${stamp}`);
    await saveOffer(mentor, `Thread Mentor ${stamp}`);
    const slotId = await publishSlot(mentor, 3);
    await registerMentee(mentee, `Thread Mentee ${stamp}`, `thread.mentee.${stamp}@devmentor.test`);
    await registerMentee(outsider, `Thread Outsider ${stamp}`, `thread.outsider.${stamp}@devmentor.test`);
    ({ bookingId } = await bookAndPay(mentee, slotId));
    expect((await api(mentor, "POST", `/api/mentor/bookings/${bookingId}/accept`)).status).toBe(200);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, mentee, outsider]) await browser.close();
  });

  // Scenario: .ai/qa/SESSION/SESSION-002-message-before-start-is-refused.md
  it("refuses a message from the booking's own mentee before the session starts and stores nothing", async () => {
    // Given: a confirmed booking whose session starts in 3 days.
    // When: the mentee posts to the thread now.
    const reply = await api(mentee, "POST", `/api/bookings/${bookingId}/messages`, { body: "Can we start early?" });

    // Then: 409 with the closed-window message, and no message row.
    expect(reply.status).toBe(409);
    expect(reply.body.error?.message).toBe("The session window is closed");
    expect(await sql(`select count(*) from messages where booking_id = '${bookingId}'`)).toBe("0");
  });

  // Scenario: .ai/qa/SESSION/SESSION-003-thread-is-hidden-from-other-users.md
  it("answers 404 to a signed-in user outside the booking, for reading and for writing, even while the session runs", async () => {
    // Given: the session is running (started 5 minutes ago), so the window is open for its participants.
    await sql(`update slots set starts_at = now() - interval '5 minutes' where id = (select slot_id from bookings where id = '${bookingId}')`);
    expect((await api(mentee, "POST", `/api/bookings/${bookingId}/messages`, { body: "Hello from the mentee" })).status).toBe(200);

    // When: another mentee reads and writes the thread.
    const read = await api(outsider, "GET", `/api/bookings/${bookingId}/messages`);
    const write = await api(outsider, "POST", `/api/bookings/${bookingId}/messages`, { body: "Let me in" });

    // Then: both are 404 (the booking's existence is not revealed) and only the mentee's message is stored.
    expect(read.status).toBe(404);
    expect(write.status).toBe(404);
    expect(await sql(`select count(*) from messages where booking_id = '${bookingId}'`)).toBe("1");
  });
});

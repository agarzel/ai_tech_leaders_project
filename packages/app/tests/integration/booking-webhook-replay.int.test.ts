import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";
import { sql } from "./support/database";
import { api, bookAndPay, inviteMentor, publishSlot, registerMentee, saveOffer } from "./support/flow";

const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-webhook-admin", baseUrl);
const mentor = new Browser("devmentor-it-webhook-mentor", baseUrl);
const mentee = new Browser("devmentor-it-webhook-mentee", baseUrl);

const stamp = Date.now();

/** Posts a "payment completed" event signed like the fake gateway signs it (HMAC-SHA256 with the sweep secret). */
async function postPaidEvent(checkoutSessionId: string, bookingId: string): Promise<number> {
  const rawBody = JSON.stringify({
    sessionId: checkoutSessionId,
    bookingId,
    paymentStatus: "paid",
    amountTotal: 15000,
    currency: "PLN",
    paymentIntentId: `fake_pi_${checkoutSessionId}`,
  });
  const signature = createHmac("sha256", inject("sweepSecret")).update(rawBody).digest("hex");
  const response = await fetch(`${baseUrl}/api/payments/webhook`, { method: "POST", body: rawBody, headers: { "content-type": "application/json", "x-fake-signature": signature } });
  return response.status;
}

describe("payment webhook delivered twice", () => {
  let bookingId = "";
  let checkoutSessionId = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(admin, mentor, `webhook.mentor.${stamp}@devmentor.test`, `Webhook Mentor ${stamp}`);
    await saveOffer(mentor, `Webhook Mentor ${stamp}`);
    const slotId = await publishSlot(mentor, 3);
    await registerMentee(mentee, `Webhook Mentee ${stamp}`, `webhook.mentee.${stamp}@devmentor.test`);
    ({ bookingId, checkoutSessionId } = await bookAndPay(mentee, slotId));
    expect((await api(mentor, "POST", `/api/mentor/bookings/${bookingId}/accept`)).status).toBe(200);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, mentee]) await browser.close();
  });

  // Scenario: .ai/qa/BOOKINGS/BOOKINGS-001-repeated-payment-webhook-changes-nothing.md
  it("keeps a confirmed, paid booking unchanged and records one payment when the same paid event arrives again", async () => {
    // Given: paid and accepted by the mentor.
    expect((await api(mentee, "GET", `/api/bookings/${bookingId}`)).body.data).toMatchObject({ status: "confirmed", paymentStatus: "paid" });

    // When: the provider delivers the same "paid" event twice more (retries are normal for webhooks).
    expect(await postPaidEvent(checkoutSessionId, bookingId)).toBe(200);
    expect(await postPaidEvent(checkoutSessionId, bookingId)).toBe(200);

    // Then: still confirmed and paid, one payment row, no refund requested.
    expect((await api(mentee, "GET", `/api/bookings/${bookingId}`)).body.data).toMatchObject({ status: "confirmed", paymentStatus: "paid" });
    expect(await sql(`select count(*) from payments where booking_id = '${bookingId}'`)).toBe("1");
    expect(await sql(`select status from payments where booking_id = '${bookingId}'`)).toBe("paid");

    await mentee.open(`/bookings/${bookingId}`);
    await mentee.waitForText("Confirmed");
    await mentee.screenshot("booking-webhook-replayed");
  });
});

import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";
import { sql } from "./support/database";
import { api, bookAndPay, inviteMentor, publishSlot, registerMentee, saveOffer } from "./support/flow";

const baseUrl = inject("baseUrl");
const sweepSecret = inject("sweepSecret");
const admin = new Browser("devmentor-it-refund-retry-admin", baseUrl);
const mentor = new Browser("devmentor-it-refund-retry-mentor", baseUrl);
const mentee = new Browser("devmentor-it-refund-retry-mentee", baseUrl);
const stamp = Date.now();

async function postFailedRefundEvent(paymentIntentId: string, refundId: string): Promise<number> {
  const rawBody = JSON.stringify({ type: "refund.updated", paymentIntentId, refundId, status: "failed" });
  const signature = createHmac("sha256", sweepSecret).update(rawBody).digest("hex");
  const response = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: "POST",
    body: rawBody,
    headers: { "content-type": "application/json", "x-fake-signature": signature },
  });
  return response.status;
}

async function runSweep(): Promise<{ status: number; summary: Record<string, number> }> {
  const response = await fetch(`${baseUrl}/api/system/sweep`, {
    method: "POST",
    headers: { "x-sweep-token": sweepSecret, "x-devmentor-client": "1" },
  });
  const body = (await response.json()) as { data?: Record<string, number> };
  return { status: response.status, summary: body.data ?? {} };
}

describe("fake refund failure and retry", () => {
  let bookingId = "";
  let paymentIntentId = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(admin, mentor, `refund.retry.mentor.${stamp}@devmentor.test`, `Refund Retry Mentor ${stamp}`);
    await saveOffer(mentor, `Refund Retry Mentor ${stamp}`);
    const slotId = await publishSlot(mentor, 3);
    await registerMentee(mentee, `Refund Retry Mentee ${stamp}`, `refund.retry.mentee.${stamp}@devmentor.test`);
    const checkout = await bookAndPay(mentee, slotId);
    bookingId = checkout.bookingId;
    paymentIntentId = `fake_pi_${checkout.checkoutSessionId}`;
    expect((await api(mentor, "POST", `/api/mentor/bookings/${bookingId}/decline`, {})).status).toBe(200);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, mentee]) await browser.close();
  });

  // Scenario: .ai/qa/BOOKINGS/BOOKINGS-004-refund-failure-is-counted-once-and-retried.md
  it("counts a failed refund webhook once and lets the sweep retry it successfully", async () => {
    const refundId = `fake_re_failed_${stamp}`;

    expect(await sql(`select status from payments where booking_id = '${bookingId}'`)).toBe("refund_requested");
    expect(await postFailedRefundEvent(paymentIntentId, refundId)).toBe(200);
    expect(await postFailedRefundEvent(paymentIntentId, refundId)).toBe(200);
    expect(await sql(`select refund_attempts::text || '|' || refund_failure_ids::text from payments where booking_id = '${bookingId}'`)).toBe(`1|["${refundId}"]`);

    expect(await runSweep()).toMatchObject({ status: 200, summary: { refundsReconciled: 1 } });
    expect(await sql(`select status || '|' || refund_attempts::text || '|' || refund_id from payments where booking_id = '${bookingId}'`)).toBe(
      `refunded|1|fake_re_refund:${bookingId}`,
    );
  });
});

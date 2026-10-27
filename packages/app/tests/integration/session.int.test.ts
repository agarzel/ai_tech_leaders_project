import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { sql } from "./support/database";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";

const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-session-admin", baseUrl);
const mentor = new Browser("devmentor-it-session-mentor", baseUrl);
const mentee = new Browser("devmentor-it-session-mentee", baseUrl);

const stamp = Date.now();
const password = "correct horse battery";
const mentorName = `Session Mentor ${stamp}`;
const menteeName = `Session Mentee ${stamp}`;
const QUESTION = "Why does my migration fail on the second run?";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReplyData = any;
type ApiReply = { status: number; body: { ok: boolean; data?: ReplyData; error?: { code: string; message: string } } };

/** A request from inside the browser session, so its cookie is used. */
async function api(browser: Browser, method: string, path: string, body?: unknown): Promise<ApiReply> {
  const call = `fetch(${JSON.stringify(path)}, { method: ${JSON.stringify(method)}, headers: { 'x-devmentor-client': '1', 'content-type': 'application/json' }, body: ${
    body === undefined ? "undefined" : JSON.stringify(JSON.stringify(body))
  } }).then(async (response) => ({ status: response.status, body: await response.json() }))`;
  return JSON.parse(JSON.parse(await browser.run("eval", `${call}.then((reply) => JSON.stringify(reply))`)) as string) as ApiReply;
}

/** The admin invites `email`; the mentor registers through the link and lands signed in. */
async function inviteMentor(email: string, name: string) {
  await admin.open("/admin/invitations");
  await admin.waitForText("Invite a mentor");
  await admin.fill("Mentor email", email);
  await admin.click("button", "Create invitation");
  await admin.waitForText(`Invitation for ${email}`);
  const link = JSON.parse(await admin.run("eval", "document.querySelector('input[readonly]').value")) as string;

  await mentor.open(new URL(link).pathname + new URL(link).search);
  await mentor.waitForText(email);
  await mentor.fill("Name", name);
  await mentor.fill("Password", password);
  await mentor.click("button", "Create account");
  await mentor.waitForText("Your offer");
}

/** A slot `days` ahead at 10:00 UTC (on the 15-minute grid in every zone). */
async function publishSlot(days: number): Promise<string> {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setUTCHours(10, 0, 0, 0);
  const reply = await api(mentor, "POST", "/api/mentor/slots", { startsAt: date.toISOString() });
  expect(reply.status).toBe(201);
  return reply.body.data.id as string;
}

/** Books through the API and "pays" on the fake checkout route; returns the booking id. */
async function bookAndPay(slotId: string): Promise<string> {
  const booked = await api(mentee, "POST", "/api/bookings", { slotId, lengthMinutes: 25, question: QUESTION, entryPoint: "link" });
  expect(booked.status).toBe(201);
  const sessionId = new URL(booked.body.data.checkoutUrl as string).pathname.split("/").pop() as string;
  expect((await api(mentee, "POST", `/api/dev/fake-checkout/${sessionId}`)).status).toBe(200);
  return booked.body.data.bookingId as string;
}

/** Clicks a button inside the open alert dialog; the trigger with the same name stays behind it. */
async function confirmInDialog(browser: Browser, name: string) {
  await browser.run("eval", `[...document.querySelectorAll('[role="alertdialog"] button')].find((button) => button.textContent === ${JSON.stringify(name)}).click()`);
}

describe("session thread, note and cancellation", () => {
  let inSession = "";
  let cancellable = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(`session.mentor.${stamp}@devmentor.test`, mentorName);
    const saved = await api(mentor, "PUT", "/api/mentor/profile", { name: mentorName, headline: "Session headline", price25: 15000, price50: 27000, listed: true });
    expect(saved.status).toBe(200);

    const sessionSlot = await publishSlot(3);
    const cancelSlot = await publishSlot(4);

    await mentee.open("/");
    const registered = await api(mentee, "POST", "/api/auth/register", { name: menteeName, email: `session.mentee.${stamp}@devmentor.test`, password });
    expect(registered.status).toBe(201);

    inSession = await bookAndPay(sessionSlot);
    cancellable = await bookAndPay(cancelSlot);
    expect((await api(mentor, "POST", `/api/mentor/bookings/${inSession}/accept`)).status).toBe(200);
    expect((await api(mentor, "POST", `/api/mentor/bookings/${cancellable}/accept`)).status).toBe(200);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, mentee]) await browser.close();
  });

  it("the mentee and the mentor exchange messages while the session runs", async () => {
    // The session starts five minutes ago and lasts 25 minutes: the messaging window is open now.
    await sql(`update slots set starts_at = now() - interval '5 minutes' where id = (select slot_id from bookings where id = '${inSession}')`);

    await mentee.open(`/bookings/${inSession}`);
    await mentee.waitForText("Session thread");
    await mentee.fill("Message", "Could you look at the second run?");
    await mentee.click("button", "Send");
    await mentee.waitForText("Could you look at the second run?");
    await mentee.screenshot("session-thread-mentee");

    await mentor.open(`/mentor/bookings/${inSession}`);
    await mentor.waitForText("Session thread");
    await mentor.waitForText("Could you look at the second run?");
    await mentor.fill("Message", "Yes, the unique index is written by hand.");
    await mentor.click("button", "Send");
    await mentor.waitForText("Yes, the unique index is written by hand.");
    await mentor.screenshot("session-thread-mentor");
  });

  it("the mentor writes a note after the session and the mentee approves it", async () => {
    // The session ended an hour ago: writing the note is open, the thread is read-only.
    await sql(`update slots set starts_at = now() - interval '1 hour' where id = (select slot_id from bookings where id = '${inSession}')`);

    await mentor.open(`/mentor/bookings/${inSession}`);
    await mentor.waitForText("Session note");
    await mentor.fill("Your note", "Good questions. Next time, bring the failing query.");
    await mentor.click("button", "Write note");
    await mentor.waitForText("Save note");

    await mentee.open(`/bookings/${inSession}`);
    await mentee.waitForText("Session note");
    await mentee.waitForText("Good questions. Next time, bring the failing query.");
    await mentee.click("button", "Approve");
    await mentee.waitForText("You approved this note");
    await mentee.screenshot("session-note-approved");
  });

  it("the mentee cancels a booking before the free deadline and sees the refund on its way", async () => {
    await mentee.open(`/bookings/${cancellable}`);
    // "Your booking" is the page title and shows before the content; the status panel renders with the cancel action.
    await mentee.waitForText("Confirmed");
    await mentee.click("button", "Cancel booking");
    await mentee.waitForText("Cancel this booking?");
    await mentee.waitForText("Free cancellation until");
    await confirmInDialog(mentee, "Cancel booking");

    await mentee.waitForText("Cancelled — refund on its way");
    await mentee.screenshot("booking-cancelled");
    expect(await sql(`select status from bookings where id = '${cancellable}'`)).toBe("cancelled");
    expect(await sql(`select cancel_reason from bookings where id = '${cancellable}'`)).toBe("mentee_free");
  });
});

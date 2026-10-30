import { expect } from "vitest";
import type { Browser } from "./browser";

/** Throw-away password for accounts the tests create. */
export const TEST_PASSWORD = "correct horse battery";

// The replies are shaped per call; the tests read the fields they know.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReplyData = any;
export type ApiReply = { status: number; body: { ok: boolean; data?: ReplyData; error?: { code: string; message: string } } };

/** A request from inside the browser session, so its cookie is used; POSTs carry the CSRF header. */
export async function api(browser: Browser, method: string, path: string, body?: unknown): Promise<ApiReply> {
  const call = `fetch(${JSON.stringify(path)}, { method: ${JSON.stringify(method)}, headers: { 'x-devmentor-client': '1', 'content-type': 'application/json' }, body: ${
    body === undefined ? "undefined" : JSON.stringify(JSON.stringify(body))
  } }).then(async (response) => ({ status: response.status, body: await response.json() }))`;
  return JSON.parse(JSON.parse(await browser.run("eval", `${call}.then((reply) => JSON.stringify(reply))`)) as string) as ApiReply;
}

/** The signed-in admin invites `email`; `mentor` registers through the link and lands signed in. */
export async function inviteMentor(admin: Browser, mentor: Browser, email: string, name: string) {
  await admin.open("/admin/invitations");
  await admin.waitForText("Invite a mentor");
  await admin.fill("Mentor email", email);
  await admin.click("button", "Create invitation");
  await admin.waitForText(`Invitation for ${email}`);
  const link = JSON.parse(await admin.run("eval", "document.querySelector('input[readonly]').value")) as string;

  await mentor.open(new URL(link).pathname + new URL(link).search);
  await mentor.waitForText(email);
  await mentor.fill("Name", name);
  await mentor.fill("Password", TEST_PASSWORD);
  await mentor.click("button", "Create account");
  await mentor.waitForText("Your offer");
}

/** Saves a bookable profile: 150 PLN for 25 minutes, 270 PLN for 50. */
export async function saveOffer(mentor: Browser, name: string) {
  const saved = await api(mentor, "PUT", "/api/mentor/profile", { name, headline: "Integration test headline", price25: 15000, price50: 27000, listed: false });
  expect(saved.status).toBe(200);
}

/** A slot `days` ahead at 10:00 UTC (on the 15-minute grid in every zone); returns its id. */
export async function publishSlot(mentor: Browser, days: number): Promise<string> {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setUTCHours(10, 0, 0, 0);
  const reply = await api(mentor, "POST", "/api/mentor/slots", { startsAt: date.toISOString() });
  expect(reply.status).toBe(201);
  return reply.body.data.id as string;
}

/** A mentee account made through the register API; the browser session keeps its cookie. */
export async function registerMentee(browser: Browser, name: string, email: string) {
  await browser.open("/");
  const reply = await api(browser, "POST", "/api/auth/register", { name, email, password: TEST_PASSWORD });
  expect(reply.status).toBe(201);
}

/** Books a 25-minute session through the API and "pays" on the fake checkout route. */
export async function bookAndPay(mentee: Browser, slotId: string): Promise<{ bookingId: string; checkoutSessionId: string }> {
  const booked = await api(mentee, "POST", "/api/bookings", { slotId, lengthMinutes: 25, question: "How do I test this flow?", entryPoint: "link" });
  expect(booked.status).toBe(201);
  const checkoutSessionId = new URL(booked.body.data.checkoutUrl as string).pathname.split("/").pop() as string;
  expect((await api(mentee, "POST", `/api/dev/fake-checkout/${checkoutSessionId}`)).status).toBe(200);
  return { bookingId: booked.body.data.bookingId as string, checkoutSessionId };
}

/** Clicks a button inside the open alert dialog; the trigger with the same name stays behind it. */
export async function confirmInDialog(browser: Browser, name: string) {
  await browser.run("eval", `[...document.querySelectorAll('[role="alertdialog"] button')].find((button) => button.textContent === ${JSON.stringify(name)}).click()`);
}

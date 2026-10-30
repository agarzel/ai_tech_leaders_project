import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { sql } from "./support/database";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";

const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-bookings-admin", baseUrl);
const mentor = new Browser("devmentor-it-bookings-mentor", baseUrl);
const mentee1 = new Browser("devmentor-it-bookings-mentee1", baseUrl);
const mentee2 = new Browser("devmentor-it-bookings-mentee2", baseUrl);
const mentee3 = new Browser("devmentor-it-bookings-mentee3", baseUrl);
const visitor = new Browser("devmentor-it-bookings-visitor", baseUrl);

const stamp = Date.now();
const password = "correct horse battery";
const mentorName = `Booking Mentor ${stamp}`;
const menteeOneName = `Booking Mentee One ${stamp}`;
const menteeTwo = { name: `Booking Mentee Two ${stamp}`, email: `bookings.two.${stamp}@devmentor.test` };
const menteeThree = { name: `Booking Mentee Three ${stamp}`, email: `bookings.three.${stamp}@devmentor.test` };
const QUESTION = "Why does my useEffect run twice in development?";

// The replies are shaped per call; the tests read the fields they know.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReplyData = any;
type ApiReply = { status: number; body: { ok: boolean; data?: ReplyData; error?: { code: string; message: string } } };

/** A request from inside the browser session, so its cookie is used. */
async function api(browser: Browser, method: string, path: string, body?: unknown): Promise<ApiReply> {
  return (await apiAll(browser, [{ method, path, body }]))[0];
}

async function apiAll(browser: Browser, requests: { method: string; path: string; body?: unknown }[]): Promise<ApiReply[]> {
  const calls = requests.map(
    ({ method, path, body }) =>
      `fetch(${JSON.stringify(path)}, { method: ${JSON.stringify(method)}, headers: { 'x-devmentor-client': '1', 'content-type': 'application/json' }, body: ${
        body === undefined ? "undefined" : JSON.stringify(JSON.stringify(body))
      } }).then(async (response) => ({ status: response.status, body: await response.json() }))`,
  );
  return JSON.parse(JSON.parse(await browser.run("eval", `Promise.all([${calls.join(", ")}]).then((all) => JSON.stringify(all))`)) as string) as ApiReply[];
}

/** The scheduler's call: the sweep token plus the client header every POST carries. */
async function sweep(token = inject("sweepSecret")): Promise<{ status: number; summary: Record<string, number> }> {
  const response = await fetch(`${baseUrl}/api/system/sweep`, { method: "POST", headers: { "x-sweep-token": token, "x-devmentor-client": "1" } });
  const body = (await response.json()) as { data?: Record<string, number> };
  return { status: response.status, summary: body.data ?? {} };
}

/** The admin invites `email`; the mentor registers through the link and lands signed in. */
async function inviteMentor(browser: Browser, email: string, name: string) {
  await admin.open("/admin/invitations");
  await admin.waitForText("Invite a mentor");
  await admin.fill("Mentor email", email);
  await admin.click("button", "Create invitation");
  await admin.waitForText(`Invitation for ${email}`);
  const link = JSON.parse(await admin.run("eval", "document.querySelector('input[readonly]').value")) as string;

  await browser.open(new URL(link).pathname + new URL(link).search);
  await browser.waitForText(email);
  await browser.fill("Name", name);
  await browser.fill("Password", password);
  await browser.click("button", "Create account");
  await browser.waitForText("Your offer");
}

/** A mentee account made through the register API; the browser session keeps its cookie. */
async function registerMentee(browser: Browser, name: string, email: string) {
  await browser.open("/");
  const reply = await api(browser, "POST", "/api/auth/register", { name, email, password });
  expect(reply.status).toBe(201);
}

/** A slot `days` ahead at 10:00 UTC (on the 15-minute grid in every zone). */
async function publishSlot(days: number): Promise<string> {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setUTCHours(10, 0, 0, 0);
  const reply = await api(mentor, "POST", "/api/mentor/slots", { startsAt: date.toISOString() });
  expect(reply.status).toBe(201);
  return reply.body.data.id as string;
}

/** Books through the API and "pays" on the fake checkout page's route; returns the booking id. */
async function bookAndPay(browser: Browser, slotId: string): Promise<string> {
  const booked = await book(browser, slotId);
  expect(booked.status).toBe(201);
  const sessionId = new URL(booked.body.data.checkoutUrl as string).pathname.split("/").pop() as string;
  expect((await api(browser, "POST", `/api/dev/fake-checkout/${sessionId}`)).status).toBe(200);
  return booked.body.data.bookingId as string;
}

function book(browser: Browser, slotId: string, entryPoint = "link"): Promise<ApiReply> {
  return api(browser, "POST", "/api/bookings", { slotId, lengthMinutes: 25, question: QUESTION, entryPoint });
}

/** Public: the slots a mentor still offers, by id. */
async function openSlotIds(slug: string): Promise<string[]> {
  const body = (await (await fetch(`${baseUrl}/api/mentors/${slug}`)).json()) as { data: { slots: { id: string }[] } };
  return body.data.slots.map((slot) => slot.id);
}

async function clickBySelector(browser: Browser, selector: string) {
  await browser.run("eval", `document.querySelector(${JSON.stringify(selector)}).click()`);
}

async function bookingStatus(browser: Browser, id: string): Promise<{ status: string; paymentStatus: string }> {
  return (await api(browser, "GET", `/api/bookings/${id}`)).body.data;
}

describe("booking and prepayment", () => {
  let slug = "";
  let slotB = "";
  let slotC = "";
  let slotD = "";
  let slotE = "";
  let slotF = "";
  let slotG = "";
  let slotH = "";
  let slotI = "";
  let acceptedBookingId = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(mentor, `bookings.mentor.${stamp}@devmentor.test`, mentorName);
    const profile = await api(mentor, "GET", "/api/mentor/profile");
    slug = profile.body.data.shareSlug as string;
    const saved = await api(mentor, "PUT", "/api/mentor/profile", { name: mentorName, headline: "Bookings headline", price25: 15000, price50: 27000, listed: true });
    expect(saved.status).toBe(200);
    // The soonest time (3 days ahead) is the one the page flow books; the others are for the API-driven tests.
    await publishSlot(3);
    [slotB, slotC, slotD, slotE, slotF, slotG, slotH, slotI] = [
      await publishSlot(4),
      await publishSlot(5),
      await publishSlot(6),
      await publishSlot(7),
      await publishSlot(8),
      await publishSlot(9),
      await publishSlot(10),
      await publishSlot(11),
    ];

    await registerMentee(mentee1, menteeOneName, `bookings.one.${stamp}@devmentor.test`);
    await registerMentee(mentee2, menteeTwo.name, menteeTwo.email);
    await registerMentee(mentee3, menteeThree.name, menteeThree.email);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, mentee1, mentee2, mentee3, visitor]) await browser.close();
  });

  it("books through the page, pays on the fake checkout, waits for the mentor, who accepts: Confirmed", async () => {
    await mentee1.open(`/m/${slug}`);
    await mentee1.waitForText(mentorName);
    await mentee1.waitForText("Book 25 min");
    await mentee1.screenshot("bookings-mentor-page-book-actions");
    await clickBySelector(mentee1, 'a[href*="/book/"][href*="length=25"]');

    await mentee1.waitForText("Your question");
    await mentee1.waitForText("Card payment");
    await mentee1.screenshot("bookings-book-page");
    await mentee1.fill("Your question", QUESTION);
    await mentee1.run("eval", "[...document.querySelectorAll('button')].find((button) => button.textContent.startsWith('Pay')).click()");

    await mentee1.waitForText("Fake checkout");
    await mentee1.screenshot("bookings-fake-checkout");
    await mentee1.click("button", "Pay (fake)");

    await mentee1.waitForText("Waiting for");
    await mentee1.screenshot("bookings-waiting-for-mentor");
    acceptedBookingId = new URL(await mentee1.url()).pathname.split("/").pop() as string;
    expect(await sql(`select entry_point || ':' || status from bookings where id = '${acceptedBookingId}'`)).toBe("link:awaiting_acceptance");

    await mentor.open("/mentor");
    await mentor.waitForText("1 booking waiting for your decision");
    await mentor.screenshot("bookings-mentor-pending-notice");
    await mentor.open("/mentor/bookings");
    await mentor.waitForText(menteeOneName);
    await mentor.waitForText(QUESTION);
    await mentor.screenshot("bookings-mentor-list-awaiting");
    await clickBySelector(mentor, `button[aria-label^="Accept ${menteeOneName}"]`);
    await mentor.waitForText("Confirmed");
    await mentor.screenshot("bookings-mentor-list-confirmed");

    await mentee1.open(`/bookings/${acceptedBookingId}`);
    await mentee1.waitForText("Your session with");
    await mentee1.screenshot("bookings-confirmed");
    await mentee1.open("/bookings");
    await mentee1.waitForText(mentorName);
    await mentee1.waitForText("Confirmed");
    await mentee1.screenshot("bookings-mentee-list");
    expect((await api(mentee1, "GET", "/api/bookings")).body.data.items.map((item: { id: string }) => item.id)).toContain(acceptedBookingId);
  });

  it("refunds a declined booking and makes its slot bookable again", async () => {
    const declinedId = await bookAndPay(mentee1, slotB);
    expect(await openSlotIds(slug)).not.toContain(slotB);

    await mentor.open("/mentor/bookings");
    await mentor.waitForText(menteeOneName);
    await clickBySelector(mentor, `button[aria-label^="Decline ${menteeOneName}"]`);
    await mentor.waitForText("The mentee gets a full refund");
    await mentor.screenshot("bookings-mentor-decline-dialog");
    await mentor.click("button", "Decline booking");
    await mentor.waitForText("Declined");

    await mentee1.open(`/bookings/${declinedId}`);
    await mentee1.waitForText("Declined — refund on its way");
    await mentee1.screenshot("bookings-declined-refund-on-its-way");

    expect((await sweep()).summary.refundsReconciled).toBeGreaterThanOrEqual(1);
    expect(await bookingStatus(mentee1, declinedId)).toMatchObject({ status: "declined", paymentStatus: "refunded" });
    await mentee1.open(`/bookings/${declinedId}`);
    await mentee1.waitForText("Refunded");
    await mentee1.screenshot("bookings-declined-refunded");
    expect(await openSlotIds(slug)).toContain(slotB);
  });

  it("expires a booking whose acceptance deadline passed, refunds it and frees the slot", async () => {
    const lapsedId = await bookAndPay(mentee1, slotC);
    // The deadline is startsAt - 12 h; moving it into the past stands in for waiting.
    await sql(`update bookings set accept_by = now() - interval '1 hour' where id = '${lapsedId}'`);

    // Even before the sweep the booking already reads as expired and cannot be accepted.
    expect((await bookingStatus(mentee1, lapsedId)).status).toBe("expired");
    const late = await api(mentor, "POST", `/api/mentor/bookings/${lapsedId}/accept`);
    expect(late.status).toBe(409);
    expect(late.body.error?.message).toBe("The acceptance deadline has passed");

    const { summary } = await sweep();
    expect(summary.bookingsExpired).toBeGreaterThanOrEqual(1);
    expect(await bookingStatus(mentee1, lapsedId)).toMatchObject({ status: "expired", paymentStatus: "refunded" });
    expect(await sql(`select status from bookings where id = '${lapsedId}'`)).toBe("expired");
    expect(await openSlotIds(slug)).toContain(slotC);
    // A second sweep right after changes nothing.
    expect((await sweep()).summary).toMatchObject({ bookingsExpired: 0, holdsExpired: 0, refundsReconciled: 0, failed: 0 });

    await mentee1.open(`/bookings/${lapsedId}`);
    await mentee1.waitForText("Refunded");
    await mentee1.screenshot("bookings-expired-refunded");
  });

  it("releases the slot of an abandoned checkout after the hold passes and a sweep", async () => {
    const booked = await book(mentee1, slotD);
    expect(booked.status).toBe(201);
    const abandonedId = booked.body.data.bookingId as string;
    expect(await openSlotIds(slug)).not.toContain(slotD);
    await mentee1.open(`/bookings/${abandonedId}`);
    await mentee1.waitForText("Payment processing");
    await mentee1.screenshot("bookings-payment-processing");

    await sql(`update bookings set hold_expires_at = now() - interval '1 minute' where id = '${abandonedId}'`);
    expect((await sweep()).summary.holdsExpired).toBeGreaterThanOrEqual(1);

    expect((await bookingStatus(mentee1, abandonedId)).status).toBe("payment_expired");
    expect(await openSlotIds(slug)).toContain(slotD);
    await mentee1.open(`/bookings/${abandonedId}`);
    await mentee1.waitForText("Payment not completed");
    await mentee1.screenshot("bookings-payment-not-completed");
  });

  it("lets only one of two parallel bookings of the same time through", async () => {
    const replies = await Promise.all([book(mentee2, slotE), book(mentee3, slotE)]);

    expect(replies.map((reply) => reply.status).sort()).toEqual([201, 409]);
    const loser = replies.find((reply) => reply.status === 409);
    expect(loser?.body.error?.message).toBe("This time was just taken");
    expect(await sql(`select count(*) from bookings where slot_id = '${slotE}' and status in ('pending_payment','awaiting_acceptance','confirmed')`)).toBe("1");
  });

  // Scenario: .ai/qa/BOOKINGS/BOOKINGS-002-two-active-unpaid-bookings-per-mentee.md
  it("serializes parallel creates and limits each mentee to two active unpaid bookings", async () => {
    expect((await book(mentee1, slotF)).status).toBe(201);

    const parallel = await Promise.all([book(mentee1, slotG), book(mentee1, slotH)]);
    expect(parallel.map((reply) => reply.status).sort()).toEqual([201, 409]);
    expect(parallel.find((reply) => reply.status === 409)?.body.error?.message).toBe("Finish or abandon your previous payment first");
    expect(await sql(`select count(*) from bookings where mentee_id = (select id from users where email = 'bookings.one.${stamp}@devmentor.test') and status = 'pending_payment' and hold_expires_at > now()`)).toBe("2");

    expect((await book(mentee1, slotI)).status).toBe(409);
    await sql(`update bookings set hold_expires_at = now() - interval '1 minute' where slot_id = '${slotF}'`);
    expect((await book(mentee1, slotI)).status).toBe(201);
    await sql(`update bookings set hold_expires_at = now() - interval '1 minute' where slot_id = '${slotI}'`);
  });

  it("records `list` for a booking started from the public list", async () => {
    await mentee1.open("/mentors");
    await mentee1.waitForText(mentorName);
    await clickBySelector(mentee1, `a[href="/m/${slug}?from=list"]`);
    await mentee1.waitForText("Book 25 min");
    await clickBySelector(mentee1, 'a[href*="/book/"][href*="length=25"]');
    await mentee1.waitForText("Your question");
    expect(await mentee1.url()).toContain("from=list");
    await mentee1.fill("Your question", QUESTION);
    await mentee1.run("eval", "[...document.querySelectorAll('button')].find((button) => button.textContent.startsWith('Pay')).click()");
    await mentee1.waitForText("Fake checkout");

    const sessionId = new URL(await mentee1.url()).pathname.split("/").pop() as string;
    const rows = await sql(`select b.entry_point from bookings b join payments p on p.booking_id = b.id where p.checkout_session_id = '${sessionId}'`);
    expect(rows).toBe("list");
    await mentee1.screenshot("bookings-from-list-checkout");
  });

  it("sends a guest to sign-in and back to the booking page", async () => {
    await visitor.open(`/m/${slug}`);
    await visitor.waitForText("Book 25 min");
    await clickBySelector(visitor, 'a[href^="/login?from="]');
    await visitor.waitForText("No account yet?");
    expect(await visitor.url()).toContain("/login?from=%2Fbook%2F");
    await visitor.fill("Email", menteeThree.email);
    await visitor.fill("Password", password);
    await visitor.click("button", "Sign in");
    await visitor.run("wait", "--fn", "location.pathname.startsWith('/book/')");
    await visitor.waitForText("Your question");
    await visitor.screenshot("bookings-guest-returns-to-book");
  });

  it("keeps the bookings API closed to the wrong people", async () => {
    expect((await fetch(`${baseUrl}/api/bookings`)).status).toBe(401);
    expect((await api(mentee2, "GET", "/api/mentor/bookings")).status).toBe(403);
    // Another person's booking looks like a missing one.
    expect((await api(mentee2, "GET", `/api/bookings/${acceptedBookingId}`)).status).toBe(404);
    expect((await api(mentee2, "POST", `/api/mentor/bookings/${acceptedBookingId}/accept`)).status).toBe(403);
    // The mentor cannot book their own time.
    const own = await book(mentor, slotD);
    expect(own.status).toBe(403);
    // A tampered price or entry point is refused or normalised, never trusted.
    expect((await api(mentee2, "POST", "/api/bookings", { slotId: slotD, lengthMinutes: 30, question: QUESTION, entryPoint: "link" })).status).toBe(400);
    expect((await api(mentee2, "POST", "/api/bookings", { slotId: slotD, lengthMinutes: 25, question: QUESTION, entryPoint: "somewhere" })).status).toBe(400);
  });

  it("protects the sweep and the webhook, and hides the fake checkout from unknown sessions", async () => {
    expect((await sweep("wrong-token-wrong-token-wrong-token-0")).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/system/sweep`, { method: "POST", headers: { "x-devmentor-client": "1" } })).status).toBe(401);
    expect((await sweep()).status).toBe(200);

    // An unsigned body never reaches the booking logic.
    const unsigned = await fetch(`${baseUrl}/api/payments/webhook`, { method: "POST", body: JSON.stringify({ sessionId: "x", paymentStatus: "paid" }) });
    expect(unsigned.status).toBe(400);

    expect((await fetch(`${baseUrl}/dev/fake-checkout/fake_cs_unknown`)).status).toBe(404);
    expect((await api(mentee1, "POST", "/api/dev/fake-checkout/fake_cs_unknown")).status).toBe(404);
  });
});

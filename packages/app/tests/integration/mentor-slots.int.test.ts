import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";

const admin = new Browser("devmentor-it-slots-admin", inject("baseUrl"));
const first = new Browser("devmentor-it-slots-first", inject("baseUrl"));
const second = new Browser("devmentor-it-slots-second", inject("baseUrl"));

const stamp = Date.now();
const password = "correct horse battery";

/** The admin invites `email`; the mentor registers through the link and lands signed in. */
async function inviteAndRegister(browser: Browser, email: string, name: string) {
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

type ApiReply = { status: number; body: { ok: boolean; data?: unknown; error?: { message: string; fieldErrors?: Record<string, string[]> } } };

/** Requests sent from inside the browser session, so its cookie is used. Several at once start in the same tick. */
async function apiAll(browser: Browser, requests: { method: string; path: string; body?: unknown }[]): Promise<ApiReply[]> {
  const calls = requests.map(
    ({ method, path, body }) =>
      `fetch(${JSON.stringify(path)}, { method: ${JSON.stringify(method)}, headers: { 'x-devmentor-client': '1', 'content-type': 'application/json' }, body: ${
        body === undefined ? "undefined" : JSON.stringify(JSON.stringify(body))
      } }).then(async (response) => ({ status: response.status, body: await response.json() }))`,
  );
  return JSON.parse(await browser.run("eval", `Promise.all([${calls.join(", ")}]).then((all) => JSON.stringify(all))`).then((out) => JSON.parse(out) as string)) as ApiReply[];
}

async function api(browser: Browser, method: string, path: string, body?: unknown): Promise<ApiReply> {
  return (await apiAll(browser, [{ method, path, body }]))[0];
}

/** A moment `days` ahead at `hour:minute` UTC – on the 15-minute grid in every time zone. */
function slotAt(days: number, hour: number, minute: number): Date {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

/** The date and time as the browser's zone (this machine's) shows them, for the form fields. */
function localFields(date: Date): { day: string; time: string } {
  const two = (value: number) => String(value).padStart(2, "0");
  return {
    day: `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`,
    time: `${two(date.getHours())}:${two(date.getMinutes())}`,
  };
}

/** Date and time inputs ignore a plain fill in this browser; set the value the way the platform does and fire the event React listens to. */
async function setNative(browser: Browser, label: string, value: string) {
  const script = `(() => { const label = [...document.querySelectorAll('label')].find((item) => item.textContent.trim() === ${JSON.stringify(label)}); const input = document.getElementById(label.htmlFor); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); return input.value; })()`;
  expect(JSON.parse(await browser.run("eval", script))).toBe(value);
}

describe("mentor slots", () => {
  let firstSlotId = "";

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteAndRegister(first, `slots.first.${stamp}@devmentor.test`, "Slots First");
    await inviteAndRegister(second, `slots.second.${stamp}@devmentor.test`, "Slots Second");
  });

  afterAll(async () => {
    await admin.close();
    await first.close();
    await second.close();
  });

  it("shows a new mentor the slots step as to do", async () => {
    await first.open("/mentor");
    await first.waitForText("Add a time");
    await first.waitForText("Add at least one time");
  });

  it("publishes a slot 24 hours ahead or more, lists it, shows it on the checklist and deletes it", async () => {
    const { day, time } = localFields(slotAt(3, 10, 0));
    await first.open("/mentor/slots");
    await first.waitForText("You have no times yet");
    await setNative(first, "Date", day);
    await setNative(first, "Time", time);
    await first.click("button", "Add slot");
    await first.waitForText("Slot added.");
    await first.waitForText("Open for booking");
    await first.screenshot("mentor-slots-added");

    await first.open("/mentor");
    await first.waitForText("1 time is open for booking");
    await first.screenshot("mentor-checklist-with-slot");

    await first.open("/mentor/slots");
    await first.waitForText("Open for booking");
    await first.run("eval", "document.querySelector('button[aria-label^=\"Delete the slot on\"]').click()");
    await first.waitForText("Keep slot");
    await first.screenshot("mentor-slots-delete-dialog");
    await first.click("button", "Delete slot");
    await first.waitForText("You have no times yet");
    expect((await api(first, "GET", "/api/mentor/slots")).body.data).toEqual([]);
  });

  it("refuses a slot inside 24 hours with a readable message, in the form and from the API", async () => {
    const { day } = localFields(new Date());
    await first.open("/mentor/slots");
    await first.waitForText("You have no times yet");
    await setNative(first, "Date", day);
    await setNative(first, "Time", "23:45");
    await first.click("button", "Add slot");
    await first.waitForText("Start time must be at least 24 hours from now");
    await first.screenshot("mentor-slots-too-soon");

    const soon = new Date(Math.ceil((Date.now() + 2 * 60 * 60 * 1000) / 900_000) * 900_000);
    const reply = await api(first, "POST", "/api/mentor/slots", { startsAt: soon.toISOString() });
    expect(reply.status).toBe(400);
    expect(reply.body.error?.fieldErrors?.startsAt?.[0]).toMatch(/at least 24 hours/);
  });

  it("refuses a second slot at the same time and one too close to another", async () => {
    const at = slotAt(4, 9, 0).toISOString();
    const created = await api(first, "POST", "/api/mentor/slots", { startsAt: at });
    expect(created.status).toBe(201);
    firstSlotId = (created.body.data as { id: string }).id;

    const duplicate = await api(first, "POST", "/api/mentor/slots", { startsAt: at });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error?.fieldErrors?.startsAt?.[0]).toBe("You already have a slot at this time");

    const close = await api(first, "POST", "/api/mentor/slots", { startsAt: slotAt(4, 9, 15).toISOString() });
    expect(close.status).toBe(400);
    expect(close.body.error?.fieldErrors?.startsAt?.[0]).toMatch(/50 minutes apart/);

    const offGrid = await api(first, "POST", "/api/mentor/slots", { startsAt: slotAt(4, 12, 7).toISOString() });
    expect(offGrid.status).toBe(400);
  });

  it("lets only one of two parallel publishes 20 minutes apart through", async () => {
    const replies = await apiAll(first, [
      { method: "POST", path: "/api/mentor/slots", body: { startsAt: slotAt(5, 14, 0).toISOString() } },
      { method: "POST", path: "/api/mentor/slots", body: { startsAt: slotAt(5, 14, 20).toISOString() } },
    ]);
    const statuses = replies.map((reply) => reply.status).sort();
    expect(statuses).toEqual([201, 400]);

    const listed = (await api(first, "GET", "/api/mentor/slots")).body.data as { startsAt: string }[];
    const onDayFive = listed.filter((slot) => slot.startsAt.startsWith(slotAt(5, 14, 0).toISOString().slice(0, 10)));
    expect(onDayFive).toHaveLength(1);
  });

  it("does not let another mentor delete or see the slot", async () => {
    const reply = await api(second, "DELETE", `/api/mentor/slots/${firstSlotId}`);
    expect(reply.status).toBe(404);
    expect(((await api(second, "GET", "/api/mentor/slots")).body.data as unknown[]).length).toBe(0);

    const own = (await api(first, "GET", "/api/mentor/slots")).body.data as { id: string }[];
    expect(own.some((slot) => slot.id === firstSlotId)).toBe(true);
    expect((await api(first, "DELETE", `/api/mentor/slots/${firstSlotId}`)).status).toBe(200);
  });

  it("refuses an anonymous visitor and an admin on the slots API", async () => {
    const anonymous = await fetch(`${inject("baseUrl")}/api/mentor/slots`);
    expect(anonymous.status).toBe(401);
    expect((await api(admin, "GET", "/api/mentor/slots")).status).toBe(403);
    expect((await api(admin, "POST", "/api/mentor/slots", { startsAt: slotAt(6, 9, 0).toISOString() })).status).toBe(403);
  });
});

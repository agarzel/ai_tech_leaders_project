import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";

const admin = new Browser("devmentor-it-public-admin", inject("baseUrl"));
const listed = new Browser("devmentor-it-public-listed", inject("baseUrl"));
const unlisted = new Browser("devmentor-it-public-unlisted", inject("baseUrl"));
const visitor = new Browser("devmentor-it-public-visitor", inject("baseUrl"));

const stamp = Date.now();
const password = "correct horse battery";
const baseUrl = inject("baseUrl");

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

/** A request from inside the mentor's session, so its cookie is used. */
async function api(browser: Browser, method: string, path: string, body?: unknown): Promise<{ status: number; body: { data?: Record<string, unknown> } }> {
  const script = `fetch(${JSON.stringify(path)}, { method: ${JSON.stringify(method)}, headers: { 'x-devmentor-client': '1', 'content-type': 'application/json' }, body: ${
    body === undefined ? "undefined" : JSON.stringify(JSON.stringify(body))
  } }).then(async (response) => JSON.stringify({ status: response.status, body: await response.json() }))`;
  return JSON.parse(JSON.parse(await browser.run("eval", script)) as string);
}

/** Prices, optional opt-in and one bookable slot 3 days ahead; returns the share slug. */
async function setUpOffer(browser: Browser, name: string, headline: string, listedOnList: boolean): Promise<string> {
  const profile = await api(browser, "GET", "/api/mentor/profile");
  const slug = profile.body.data?.shareSlug as string;
  const saved = await api(browser, "PUT", "/api/mentor/profile", { name, headline, price25: 15000, price50: 27000, listed: listedOnList });
  expect(saved.status).toBe(200);
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  date.setUTCHours(10, 0, 0, 0);
  expect((await api(browser, "POST", "/api/mentor/slots", { startsAt: date.toISOString() })).status).toBe(201);
  return slug;
}

describe("public mentor list and share page", () => {
  let listedSlug = "";
  let unlistedSlug = "";
  const listedName = `Public Listed ${stamp}`;
  const unlistedName = `Public Hidden ${stamp}`;

  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteAndRegister(listed, `public.listed.${stamp}@devmentor.test`, listedName);
    await inviteAndRegister(unlisted, `public.unlisted.${stamp}@devmentor.test`, unlistedName);
    listedSlug = await setUpOffer(listed, listedName, "Kubernetes and platform work", true);
    unlistedSlug = await setUpOffer(unlisted, unlistedName, "Hidden headline", false);
  });

  afterAll(async () => {
    await admin.close();
    await listed.close();
    await unlisted.close();
    await visitor.close();
  });

  it("shows an opted-in mentor on /mentors to an anonymous visitor, with prices and the soonest time", async () => {
    await visitor.open("/mentors");
    await visitor.waitForText(listedName);
    await visitor.waitForText("Kubernetes and platform work");
    await visitor.waitForText("150.00");
    await visitor.waitForText("270.00");
    await visitor.waitForText("Next time:");
    expect(await visitor.url()).toMatch(/\/mentors$/);
    await visitor.screenshot("mentors-public-list");
  });

  it("keeps a mentor who is not on the list off /mentors", async () => {
    await visitor.open("/mentors");
    await visitor.waitForText(listedName);
    const text = JSON.parse(await visitor.run("eval", "document.body.innerText")) as string;
    expect(text).not.toContain(unlistedName);
    expect(text).not.toContain("Hidden headline");
  });

  it("opens the share page of an unlisted mentor from the link, with prices and Book links", async () => {
    await visitor.open(`/m/${unlistedSlug}`);
    await visitor.waitForText(unlistedName);
    await visitor.waitForText("Hidden headline");
    await visitor.waitForText("Available times");
    // A guest's Book links lead to sign-in first and come back to the booking page afterwards.
    await visitor.waitForText("Book 25 min");
    const links = JSON.parse(await visitor.run("eval", "JSON.stringify([...document.querySelectorAll('a[href^=\"/login?from=\"]')].map((a) => a.textContent))")) as string;
    expect(links).toContain("Book 25 min");
    await visitor.screenshot("mentor-share-page");
  });

  it("opens the share page of a listed mentor", async () => {
    await visitor.open(`/m/${listedSlug}`);
    await visitor.waitForText(listedName);
    await visitor.waitForText("Prices");
  });

  it("shows the not-found page for an unknown slug", async () => {
    await visitor.open("/m/no-such-mentor-000000");
    await visitor.waitForText("Mentor not found");
    await visitor.screenshot("mentor-share-not-found");
  });

  it("returns the list API without email or user id, and refuses an invalid query", async () => {
    const response = await fetch(`${baseUrl}/api/mentors`);
    expect(response.status).toBe(200);
    const raw = await response.text();
    const body = JSON.parse(raw) as { ok: boolean; data: { items: Record<string, unknown>[] } };
    expect(body.ok).toBe(true);
    expect(body.data.items.some((item) => item.name === listedName)).toBe(true);
    expect(body.data.items.some((item) => item.name === unlistedName)).toBe(false);
    expect(raw).not.toContain("@devmentor.test");
    for (const item of body.data.items) {
      expect(Object.keys(item)).not.toEqual(expect.arrayContaining(["email"]));
      expect(item).not.toHaveProperty("id");
      expect(item).not.toHaveProperty("userId");
    }

    const invalid = await fetch(`${baseUrl}/api/mentors?page=0`);
    expect(invalid.status).toBe(400);
    expect(await fetch(`${baseUrl}/api/mentors/no-such-mentor-000000`).then((r) => r.status)).toBe(404);
    const detail = await fetch(`${baseUrl}/api/mentors/${unlistedSlug}`);
    expect(detail.status).toBe(200);
    expect(await detail.text()).not.toContain("@devmentor.test");
  });
});

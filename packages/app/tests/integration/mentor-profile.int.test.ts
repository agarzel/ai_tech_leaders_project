import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";

const admin = new Browser("devmentor-it-profile-admin", inject("baseUrl"));
const first = new Browser("devmentor-it-profile-first", inject("baseUrl"));
const second = new Browser("devmentor-it-profile-second", inject("baseUrl"));

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

/** The HTTP status of a request sent from inside the browser session, so its cookie is used. */
async function statusOf(browser: Browser, method: string, body?: unknown): Promise<number> {
  const script = `fetch('/api/mentor/profile', { method: '${method}', headers: { 'x-devmentor-client': '1', 'content-type': 'application/json' }, body: ${
    body === undefined ? "undefined" : JSON.stringify(JSON.stringify(body))
  } }).then((response) => response.status)`;
  return JSON.parse(await browser.run("eval", script)) as number;
}

describe("mentor profile and prices", () => {
  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteAndRegister(first, `profile.first.${stamp}@devmentor.test`, "First Mentor");
    await inviteAndRegister(second, `profile.second.${stamp}@devmentor.test`, "Second Mentor");
  });

  afterAll(async () => {
    await admin.close();
    await first.close();
    await second.close();
  });

  it("lands a new mentor on a checklist with profile and prices still to do", async () => {
    expect(await first.url()).toMatch(/\/mentor$/);
    await first.waitForText("Complete profile");
    await first.waitForText("Set prices");
    await first.screenshot("mentor-checklist-empty");
  });

  it("saves the headline, the name and both prices and shows them again", async () => {
    await first.open("/mentor/profile");
    await first.waitForText("Headline");
    await first.fill("Name", "First Mentor Renamed");
    await first.fill("Headline", "Platform engineer – Kubernetes");
    await first.fill("25-minute session", "180");
    await first.fill("50-minute session", "300");
    await first.click("button", "Save profile");
    await first.waitForText("Profile saved.");
    await first.screenshot("mentor-profile-saved");

    await first.open("/mentor/profile");
    await first.waitForText("Headline");
    expect(await valueOf(first, "Headline")).toBe("Platform engineer – Kubernetes");
    expect(await valueOf(first, "Name")).toBe("First Mentor Renamed");
    expect(await valueOf(first, "25-minute session")).toBe("180.00");
    expect(await valueOf(first, "50-minute session")).toBe("300.00");

    await first.open("/mentor");
    await first.waitForText("Change prices");
    await first.waitForText("Edit profile");
    await first.screenshot("mentor-checklist-done");
  });

  it("shows the share link and saves the public-list option", async () => {
    await first.open("/mentor");
    await first.waitForText("Share link");
    const link = JSON.parse(await first.run("eval", "document.querySelector('input[readonly]').value")) as string;
    expect(link).toMatch(new RegExp(`^${inject("baseUrl")}/m/first-mentor-[a-z0-9]{6}$`));
    await first.waitForText("You are not on the public list");

    await first.open("/mentor/profile");
    await first.waitForText("Show me on the public list");
    await first.click("checkbox", "Show me on the public list");
    await first.click("button", "Save profile");
    await first.waitForText("Profile saved.");
    await first.screenshot("mentor-profile-listed");

    await first.open("/mentor/profile");
    await first.waitForText("Show me on the public list");
    expect(await isChecked(first, "Show me on the public list")).toBe(true);
    await first.open("/mentor");
    await first.waitForText("You opted in");
    await first.screenshot("mentor-checklist-listed");
  });

  it("keeps the first mentor's profile unchanged when the second mentor saves", async () => {
    expect(await statusOf(second, "PUT", { name: "Second Mentor", headline: "Someone else", price25: 2000, price50: 4000 })).toBe(200);

    await first.open("/mentor/profile");
    await first.waitForText("Headline");
    expect(await valueOf(first, "Headline")).toBe("Platform engineer – Kubernetes");
  });

  it("refuses an anonymous visitor and an admin on the profile API", async () => {
    const anonymous = await fetch(`${inject("baseUrl")}/api/mentor/profile`, {
      method: "PUT",
      headers: { "x-devmentor-client": "1", "content-type": "application/json" },
      body: JSON.stringify({ name: "X", headline: "Y" }),
    });
    expect(anonymous.status).toBe(401);
    expect(await statusOf(admin, "GET")).toBe(403);
    expect(await statusOf(admin, "PUT", { name: "X", headline: "Y" })).toBe(403);
  });

  it("sends visitors who are not mentors away from the mentor pages", async () => {
    await admin.open("/mentor");
    await admin.waitForText("Admin panel");
    expect(await admin.url()).toMatch(/\/admin$/);
  });
});

/** The current value of the input with this label. */
async function valueOf(browser: Browser, label: string): Promise<string> {
  const script = `document.getElementById([...document.querySelectorAll('label')].find((label) => label.textContent.trim().startsWith(${JSON.stringify(label)})).htmlFor).value`;
  return JSON.parse(await browser.run("eval", script)) as string;
}

/** Whether the checkbox with this label is checked (Base UI keeps the state on `aria-checked` or on a hidden input). */
async function isChecked(browser: Browser, label: string): Promise<boolean> {
  const script = `(() => { const control = document.getElementById([...document.querySelectorAll('label')].find((item) => item.textContent.trim().startsWith(${JSON.stringify(label)})).htmlFor); return control.getAttribute('aria-checked') === 'true' || control.checked === true; })()`;
  return JSON.parse(await browser.run("eval", script)) as boolean;
}

import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";

const browser = new Browser("devmentor-it-admin", inject("baseUrl"));

describe("admin panel", () => {
  beforeAll(async () => {
    await loginAs(browser, "admin");
  });

  it("shows the sections and a live database status", async () => {
    await browser.open("/admin");

    expect(await browser.title()).toBe("Admin – DevMentor");
    // The panel sits behind the session gate (Suspense): wait until it has streamed in.
    await browser.waitForText("Admin panel");
    expect(await browser.textOf("heading", "Admin panel")).toBe("Admin panel");
    // Streamed in after the static shell (Suspense + connection()).
    await browser.waitForText("Database: connected");
    await browser.waitForText("Coming soon.");
    await browser.screenshot("admin");
  });

  it("navigates to user management", async () => {
    await browser.click("link", "Users Mentors, mentees and administrators.");

    await browser.waitForText("Seeded Mentor");
    expect(await browser.url()).toMatch(/\/admin\/users$/);
    expect(await browser.textOf("heading", "Users")).toBe("Users");
  });
});

// One browser session (and one sign-in) for both blocks: the session is closed once, after the last test.
describe("admin users – CRUD through the UI", () => {
  afterAll(async () => {
    await browser.close();
  });

  it("lists the seeded user", async () => {
    await browser.open("/admin/users");

    await browser.waitForText("seeded.mentor@devmentor.test");
    await browser.screenshot("admin-users");
  });

  it("validates the form on the client", async () => {
    await browser.click("button", "New user");
    await browser.click("button", "Create user");

    await browser.waitForText("Name is required");
    await browser.waitForText("Enter a valid email address");
  });

  it("creates a user", async () => {
    await browser.fill("Name", "Grace Hopper");
    await browser.fill("Email", "Grace@DevMentor.test");
    await browser.select("role", "mentee");
    await browser.click("button", "Create user");

    // The form closes and the new row appears with a normalized email.
    await browser.waitForText("grace@devmentor.test");
    await browser.waitForText("New user");
    await browser.screenshot("admin-users-created");
  });

  it("shows the server's conflict error next to the email field", async () => {
    await browser.click("button", "New user");
    await browser.fill("Name", "Another Grace");
    await browser.fill("Email", "grace@devmentor.test");
    await browser.click("button", "Create user");

    await browser.waitForText("A user with this email already exists");
    await browser.screenshot("admin-users-conflict");
    await browser.click("button", "Cancel");
  });

  it("edits a user", async () => {
    await browser.click("button", "Edit Grace Hopper");
    await browser.fill("Name", "Grace B. Hopper");
    await browser.select("role", "mentor");
    await browser.click("button", "Save changes");

    await browser.waitForText("Grace B. Hopper");
  });

  it("deletes a user after confirmation", async () => {
    await browser.click("button", "Delete Grace B. Hopper");
    await browser.click("button", "Confirm delete Grace B. Hopper");

    await browser.run("wait", "--fn", "!document.body.innerText.includes('grace@devmentor.test')");
    await browser.waitForText("seeded.mentor@devmentor.test");
  });
});

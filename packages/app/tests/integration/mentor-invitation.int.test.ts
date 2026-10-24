import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";

const admin = new Browser("devmentor-it-invite-admin", inject("baseUrl"));
const mentor = new Browser("devmentor-it-invite-mentor", inject("baseUrl"));

// A fresh address per run: the database is shared by every test file of the run.
const email = `invited.mentor.${Date.now()}@devmentor.test`;
const password = "correct horse battery";
let link = "";

describe("mentor invitation and registration", () => {
  beforeAll(async () => {
    await loginAs(admin, "admin");
  });

  afterAll(async () => {
    await admin.close();
    await mentor.close();
  });

  it("lets the admin create an invitation link", async () => {
    await admin.open("/admin/invitations");
    await admin.waitForText("Invite a mentor");
    await admin.fill("Mentor email", email);
    await admin.click("button", "Create invitation");

    await admin.waitForText(`Invitation for ${email}`);
    // The link is shown once: read it from the page right away.
    link = JSON.parse(await admin.run("eval", "document.querySelector('input[readonly]').value")) as string;
    expect(link).toMatch(/\/register\/mentor\?token=.+/);
    await admin.screenshot("mentor-invitation-created");
  });

  it("shows the invited address and validates the form", async () => {
    await mentor.open(new URL(link).pathname + new URL(link).search);
    await mentor.waitForText(email);
    await mentor.click("button", "Create account");

    await mentor.waitForText("Name is required");
    await mentor.waitForText("Password must be at least 12 characters long");
    await mentor.screenshot("mentor-register-form");
  });

  it("registers the mentor, signs them in and lands on the mentor workspace", async () => {
    await mentor.fill("Name", "Invited Mentor");
    await mentor.fill("Password", password);
    await mentor.click("button", "Create account");

    await mentor.waitForText("Invited Mentor");
    expect(await mentor.textOf("button", "Log out")).toBe("Log out");
    expect(await mentor.url()).toMatch(/\/mentor$/);
    await mentor.screenshot("mentor-registered");
  });

  it("rejects the used link", async () => {
    await mentor.click("button", "Log out");
    await mentor.waitForText("Log in");
    await mentor.open(new URL(link).pathname + new URL(link).search);

    await mentor.waitForText("This invitation is no longer valid");
    expect(await mentor.textOf("link", "Sign in")).toBe("Sign in");
    await mentor.screenshot("mentor-invitation-used");
  });

  it("shows the same message for a link without a valid token", async () => {
    await mentor.open("/register/mentor?token=not-a-real-token");

    await mentor.waitForText("This invitation is no longer valid");
  });
});

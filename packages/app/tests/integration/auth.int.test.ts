import { afterAll, describe, expect, inject, it } from "vitest";
import { Browser } from "./support/browser";

const browser = new Browser("devmentor-it-auth", inject("baseUrl"));

// A fresh address per run: the database is shared by every test file of the run.
const email = `mentee.${Date.now()}@devmentor.test`;
const password = "correct horse battery";

async function signIn(address: string, secret: string) {
  await browser.open("/login");
  await browser.fill("Email", address);
  await browser.fill("Password", secret);
  await browser.click("button", "Sign in");
}

describe("accounts and sessions", () => {
  afterAll(async () => {
    await browser.close();
  });

  it("shows Log in and Register to a visitor", async () => {
    await browser.open("/");

    await browser.waitForText("Log in");
    expect(await browser.textOf("link", "Register")).toBe("Register");
    await browser.screenshot("auth-home-visitor");
  });

  it("validates the registration form on the client", async () => {
    await browser.open("/register");
    await browser.click("button", "Create account");

    await browser.waitForText("Name is required");
    await browser.waitForText("Enter a valid email address");
    await browser.waitForText("Password must be at least 12 characters long");
    await browser.screenshot("auth-register-errors");
  });

  it("registers a mentee and signs them in", async () => {
    await browser.fill("Name", "Test Mentee");
    await browser.fill("Email", email);
    await browser.fill("Password", password);
    await browser.click("button", "Create account");

    // Mentees land on the home page, whose header now shows the name and Log out.
    await browser.waitForText("Test Mentee");
    expect(await browser.textOf("button", "Log out")).toBe("Log out");
    expect(await browser.url()).toMatch(/\/$/);
    await browser.screenshot("auth-registered");
  });

  it("logs out", async () => {
    await browser.click("button", "Log out");

    await browser.waitForText("Log in");
    expect(await browser.textOf("link", "Register")).toBe("Register");
    await browser.screenshot("auth-logged-out");
  });

  it("logs in again with the same credentials", async () => {
    await signIn(email, password);

    await browser.waitForText("Test Mentee");
    expect(await browser.textOf("button", "Log out")).toBe("Log out");
  });

  it("keeps a mentee out of the admin panel", async () => {
    await browser.open("/admin");

    await browser.run("wait", "--fn", "!location.pathname.startsWith('/admin')");
    expect(await browser.url()).not.toMatch(/\/admin/);
  });

  it("answers a wrong password with the generic message", async () => {
    await browser.click("button", "Log out");
    await browser.waitForText("Log in");

    await signIn(email, "this is not the password");

    await browser.waitForText("Invalid email or password");
    expect(await browser.url()).toMatch(/\/login$/);
    await browser.screenshot("auth-login-error");
  });

  it("gives an unknown email the same message", async () => {
    await signIn("nobody@devmentor.test", password);

    await browser.waitForText("Invalid email or password");
  });

  it("refuses an anonymous visitor on admin pages", async () => {
    await browser.open("/admin");

    await browser.run("wait", "--fn", "location.pathname.startsWith('/login')");
    expect(await browser.textOf("heading", "Sign in")).toBe("Sign in");
    await browser.screenshot("auth-admin-refused");
  });
});

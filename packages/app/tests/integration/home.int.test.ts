import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Browser } from "./support/browser";

const browser = new Browser("devmentor-it-home", inject("baseUrl"));

describe("home page", () => {
  beforeAll(async () => {
    await browser.open("/");
  });

  afterAll(async () => {
    await browser.close();
  });

  it("renders the DevMentor home page with the real offer", async () => {
    expect(await browser.title()).toBe("DevMentor");
    expect(await browser.textOf("heading", "Book a senior engineer for one problem")).toBe(
      "Book a senior engineer for one problem",
    );
    await browser.waitForText("You pay for the session up front");
    await browser.screenshot("home");
  });

  it("links the word mark to the home page and has no link to a missing page", async () => {
    expect(await browser.textOf("link", "DevMentor")).toBe("DevMentor");
  });
});

describe("health endpoint", () => {
  it("reports the ephemeral database as reachable", async () => {
    const response = await fetch(new URL("/api/health", inject("baseUrl")));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", database: "ok" });
  });
});

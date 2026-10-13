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

  it("renders the DevMentor welcome screen", async () => {
    expect(await browser.title()).toBe("DevMentor");
    expect(await browser.textOf("heading", "Grow with a mentor who knows the way.")).toBe(
      "Grow with a mentor who knows the way.",
    );
    await browser.waitForText("Find an experienced mentor");
    await browser.screenshot("home");
  });

  it("has a call to action to find a mentor", async () => {
    expect(await browser.textOf("link", "Find a mentor")).toBe("Find a mentor");
  });
});

describe("health endpoint", () => {
  it("reports the ephemeral database as reachable", async () => {
    const response = await fetch(new URL("/api/health", inject("baseUrl")));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", database: "ok" });
  });
});

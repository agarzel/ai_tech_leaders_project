import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";
import { inviteMentor, registerMentee } from "./support/flow";

const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-header-admin", baseUrl);
const mentor = new Browser("devmentor-it-header-mentor", baseUrl);
const mentee = new Browser("devmentor-it-header-mentee", baseUrl);

const stamp = Date.now();

/** The header's navigation links as "text → href", read after the streamed account part has rendered. */
async function headerLinks(browser: Browser, readyText: string): Promise<string[]> {
  await browser.open("/");
  await browser.waitForText(readyText);
  const links = await browser.run("eval", "JSON.stringify([...document.querySelectorAll('header a')].map((a) => `${a.textContent.trim()} → ${a.getAttribute('href')}`))");
  return JSON.parse(JSON.parse(links) as string) as string[];
}

describe("site header navigation by role", () => {
  beforeAll(async () => {
    await loginAs(admin, "admin");
    await inviteMentor(admin, mentor, `header.mentor.${stamp}@devmentor.test`, `Header Mentor ${stamp}`);
    await registerMentee(mentee, `Header Mentee ${stamp}`, `header.mentee.${stamp}@devmentor.test`);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, mentee]) await browser.close();
  });

  // Scenario: .ai/qa/BOOKINGS/BOOKINGS-005-mentor-reaches-own-bookings.md
  it("gives a mentor both received and own bookings, a mentee only their own, an admin neither", async () => {
    const mentorLinks = await headerLinks(mentor, "My bookings");
    expect(mentorLinks).toEqual(expect.arrayContaining(["Bookings → /mentor/bookings", "My bookings → /bookings"]));

    const menteeLinks = await headerLinks(mentee, "My bookings");
    expect(menteeLinks).toContain("My bookings → /bookings");
    expect(menteeLinks).not.toContain("Bookings → /mentor/bookings");

    const adminLinks = await headerLinks(admin, "Admin");
    expect(adminLinks).toContain("Admin → /admin");
    expect(adminLinks.filter((link) => link.includes("bookings"))).toEqual([]);
  });

  // Scenario: .ai/qa/BOOKINGS/BOOKINGS-006-header-marks-the-current-page.md
  it("marks the current page in the header and keeps every link label on one line (issue 137)", async () => {
    // "Log out" streams in with the account part of the header, so the links are there once it shows.
    const current = async (path: string): Promise<{ current: string[]; wrap: string[] }> => {
      await mentor.open(path);
      await mentor.waitForText("Log out");
      const result = await mentor.run(
        "eval",
        "JSON.stringify({ current: [...document.querySelectorAll('header a[aria-current=\"page\"]')].map((a) => a.textContent.trim()), wrap: [...new Set([...document.querySelectorAll('header a')].map((a) => getComputedStyle(a).whiteSpace))] })",
      );
      return JSON.parse(JSON.parse(result) as string) as { current: string[]; wrap: string[] };
    };

    const received = await current("/mentor/bookings");
    expect(received.current).toEqual(["Bookings"]);
    expect(received.wrap).toEqual(["nowrap"]);

    const own = await current("/bookings");
    expect(own.current).toEqual(["My bookings"]);
  });
});

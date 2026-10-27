import { describe, expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");

describe("mentor share page for an unknown slug", () => {
  // Regression: notFound() inside a Suspense boundary answered 200 with the not-found content.
  it("answers 404, not 200", async () => {
    const response = await fetch(`${baseUrl}/m/no-such-mentor-${Date.now()}`);

    expect(response.status).toBe(404);
  });
});

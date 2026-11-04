import { describe, expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");

// `spoofed` is what a client prepends itself; `ip` is what the one trusted proxy appends (TRUSTED_PROXY_HOPS=1).
function preview(ip: string, spoofed = "10.0.0.1") {
  return fetch(`${baseUrl}/api/auth/invitations/preview`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-devmentor-client": "1", "x-forwarded-for": `${spoofed}, ${ip}` },
    body: JSON.stringify({ token: "not-a-real-token" }),
  });
}

describe("invitation preview rate limit", () => {
  it("refuses the 21st preview from one IP with 429 and leaves other IPs alone", async () => {
    // A documentation-range address no other test uses; only the entry the trusted proxy appended counts.
    for (let i = 0; i < 20; i += 1) expect((await preview("203.0.113.7")).status).toBe(404);

    // Rotating the prepended entry does not reset the limit (threat model T-03).
    const refused = await preview("203.0.113.7", "198.51.100.99");
    expect(refused.status).toBe(429);
    expect(((await refused.json()) as { error: { code: string } }).error.code).toBe("rate_limited");
    expect((await preview("203.0.113.8")).status).toBe(404);
  });
});

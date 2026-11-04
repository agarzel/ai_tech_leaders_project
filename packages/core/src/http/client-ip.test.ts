import { describe, expect, it } from "vitest";
import { clientIp, UNKNOWN_CLIENT_IP } from "./client-ip";

const request = (headers: Record<string, string>) => new Request("http://localhost/api/auth/login", { headers });

describe("clientIp", () => {
  it("takes the address the server or the one trusted proxy added, not one the client sent", () => {
    // A client-supplied x-forwarded-for comes first; the trusted proxy appends the real address last.
    expect(clientIp(request({ "x-forwarded-for": "203.0.113.9, 198.51.100.7" }), 1)).toBe("198.51.100.7");
  });

  it("counts trusted proxies from the right", () => {
    expect(clientIp(request({ "x-forwarded-for": "203.0.113.9, 198.51.100.7, 10.0.0.2" }), 2)).toBe("198.51.100.7");
  });

  it("uses the single entry when the chain is shorter than the trusted hops", () => {
    expect(clientIp(request({ "x-forwarded-for": "198.51.100.7" }), 2)).toBe("198.51.100.7");
  });

  it("trims spaces and ignores empty entries", () => {
    expect(clientIp(request({ "x-forwarded-for": " 198.51.100.7 , " }), 1)).toBe("198.51.100.7");
  });

  it("falls back to x-real-ip, then to a constant key", () => {
    expect(clientIp(request({ "x-real-ip": " 198.51.100.8 " }), 1)).toBe("198.51.100.8");
    expect(clientIp(request({}), 1)).toBe(UNKNOWN_CLIENT_IP);
  });
});

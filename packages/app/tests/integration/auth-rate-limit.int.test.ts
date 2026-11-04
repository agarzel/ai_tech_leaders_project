import { afterAll, describe, expect, inject, it } from "vitest";
import { Browser } from "./support/browser";

const browser = new Browser("devmentor-it-auth-rate-limit", inject("baseUrl"));
const password = "correct horse battery";
const stamp = Date.now();

async function request(path: string, body: unknown, ip: string) {
  await browser.run("set", "headers", JSON.stringify({ "x-forwarded-for": ip }));
  const call = `fetch(${JSON.stringify(path)}, { method: 'POST', headers: { 'x-devmentor-client': '1', 'content-type': 'application/json', 'x-forwarded-for': ${JSON.stringify(ip)} }, body: ${JSON.stringify(JSON.stringify(body))} }).then(async (response) => ({ status: response.status, body: await response.json() }))`;
  return JSON.parse(JSON.parse(await browser.run("eval", `${call}.then((reply) => JSON.stringify(reply))`)) as string) as {
    status: number;
    body: { ok: boolean; error?: { code: string } };
  };
}

describe("auth rate limits", () => {
  afterAll(async () => {
    await browser.close();
  });

  it("limits registrations by IP and scopes login lockout to IP plus email", async () => {
    await browser.open("/");
    const registrationIp = "198.51.100.31";
    for (let i = 0; i < 10; i += 1) {
      const reply = await request(
        "/api/auth/register",
        { name: `Rate Limit ${i}`, email: `rate-limit-${stamp}-${i}@devmentor.test`, password },
        registrationIp,
      );
      expect(reply.status).toBe(201);
    }

    const refusedRegistration = await request(
      "/api/auth/register",
      { name: "Rate Limit 11", email: `rate-limit-${stamp}-11@devmentor.test`, password },
      registrationIp,
    );
    expect(refusedRegistration.status).toBe(429);
    expect(refusedRegistration.body.error?.code).toBe("rate_limited");

    const email = `login-rate-limit-${stamp}@devmentor.test`;
    const account = await request("/api/auth/register", { name: "Login Rate Limit", email, password }, "198.51.100.32");
    expect(account.status).toBe(201);

    for (let i = 0; i < 5; i += 1) {
      const failedLogin = await request("/api/auth/login", { email, password: "incorrect password" }, "198.51.100.33");
      expect(failedLogin.status).toBe(401);
    }

    const validLogin = await request("/api/auth/login", { email, password }, "198.51.100.32");
    expect(validLogin.status).toBe(200);

    const sprayIp = "198.51.100.34";
    for (let i = 0; i < 20; i += 1) {
      const failedLogin = await request(
        "/api/auth/login",
        { email: `spray-${stamp}-${i}@devmentor.test`, password: "incorrect password" },
        sprayIp,
      );
      expect(failedLogin.status).toBe(401);
    }
    const refusedSpray = await request(
      "/api/auth/login",
      { email: `spray-${stamp}-last@devmentor.test`, password },
      sprayIp,
    );
    expect(refusedSpray.status).toBe(429);
  }, 60_000);
});

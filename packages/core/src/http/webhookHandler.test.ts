import { describe, expect, it, vi } from "vitest";
import { FakeGateway } from "../payments/fake.gateway";
import { ValidationError } from "./errors";
import { webhookHandler } from "./webhookHandler";

const secret = "s".repeat(32);

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/payments/webhook", { method: "POST", body, headers });
}

async function signedRequest(gateway: FakeGateway) {
  const { sessionId } = await gateway.createCheckout({
    bookingId: "b1",
    amount: 100,
    currency: "PLN",
    description: "d",
    successUrl: "http://x/s",
    cancelUrl: "http://x/c",
    expiresAt: new Date(),
    idempotencyKey: "k",
  });
  const event = gateway.createCompletedEvent(sessionId)!;
  return post(event.rawBody, event.headers);
}

describe("webhookHandler", () => {
  it("passes a verified event to the handler without a CSRF header and answers 200", async () => {
    const gateway = new FakeGateway({ secret, appUrl: "http://localhost:3000" });
    const handler = vi.fn().mockResolvedValue(undefined);
    const route = webhookHandler((raw, headers) => gateway.parseWebhook(raw, headers), handler);

    const response = await route(await signedRequest(gateway));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { received: true } });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: "checkout.completed", bookingId: "b1" }));
  });

  it("answers 400 and never calls the handler for an invalid signature", async () => {
    const gateway = new FakeGateway({ secret, appUrl: "http://localhost:3000" });
    const handler = vi.fn();
    const route = webhookHandler((raw, headers) => gateway.parseWebhook(raw, headers), handler);

    const response = await route(post('{"sessionId":"s"}', { "x-fake-signature": "bad" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: { code: "validation_error", message: "Invalid webhook signature" } });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the raw body and headers to verify untouched", async () => {
    const verify = vi.fn(() => {
      throw new ValidationError();
    });
    const route = webhookHandler(verify, vi.fn());

    await route(post(" raw  body ", { "x-test": "1" }));

    expect(verify).toHaveBeenCalledWith(" raw  body ", expect.any(Headers));
    expect((verify.mock.calls[0] as unknown as [string, Headers])[1].get("x-test")).toBe("1");
  });

  it("answers 500 without calling the handler when verification fails unexpectedly", async () => {
    const handler = vi.fn();
    const route = webhookHandler(() => {
      throw new Error("boom");
    }, handler);

    const response = await route(post("{}"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: { code: "internal_error", message: "Internal server error" } });
    expect(handler).not.toHaveBeenCalled();
  });

  it("answers 500 so the provider retries when the handler fails", async () => {
    const route = webhookHandler(
      () => "event",
      async () => {
        throw new Error("db down");
      },
    );

    const response = await route(post("{}"));

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "internal_error" } });
  });

  it("supports an asynchronous verify", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const route = webhookHandler(async () => "event", handler);

    expect((await route(post("{}"))).status).toBe(200);
    expect(handler).toHaveBeenCalledWith("event");
  });
});

import { describe, expect, it } from "vitest";
import type { Env } from "../config/env";
import { createPaymentGateway } from "./create-payment-gateway";
import { FakeGateway } from "./fake.gateway";
import { StripeGateway } from "./stripe.gateway";

const base = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://localhost/db",
  AUTH_SECRET: "a".repeat(32),
  LOG_LEVEL: "info",
  SWEEP_SECRET: "w".repeat(32),
  APP_URL: "http://localhost:3000",
} as const;

describe("createPaymentGateway", () => {
  it("returns the fake gateway for PAYMENTS_PROVIDER=fake", () => {
    const env: Env = { ...base, PAYMENTS_PROVIDER: "fake" };

    expect(createPaymentGateway(env)).toBeInstanceOf(FakeGateway);
  });

  it("returns the Stripe gateway for PAYMENTS_PROVIDER=stripe", () => {
    const env: Env = { ...base, PAYMENTS_PROVIDER: "stripe", STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" };

    expect(createPaymentGateway(env)).toBeInstanceOf(StripeGateway);
  });

  it.each([
    { STRIPE_SECRET_KEY: "sk_test_x" },
    { STRIPE_WEBHOOK_SECRET: "whsec_x" },
  ])("fails closed when a Stripe key is missing (%o)", (keys) => {
    const env: Env = { ...base, PAYMENTS_PROVIDER: "stripe", ...keys };

    expect(() => createPaymentGateway(env)).toThrow(/required when PAYMENTS_PROVIDER is stripe/);
  });
});

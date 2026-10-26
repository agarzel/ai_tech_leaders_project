import Stripe from "stripe";
import type { Env } from "../config/env";
import { FakeGateway } from "./fake.gateway";
import type { PaymentGateway } from "./payment-gateway";
import { StripeGateway } from "./stripe.gateway";

/** One provider per process, chosen by `PAYMENTS_PROVIDER`; there is no runtime switching. */
export function createPaymentGateway(env: Env): PaymentGateway {
  if (env.PAYMENTS_PROVIDER === "fake") return new FakeGateway({ secret: env.SWEEP_SECRET, appUrl: env.APP_URL });

  // getEnv already guarantees these; checked again so a hand-built Env still fails closed.
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required when PAYMENTS_PROVIDER is stripe");
  }
  return new StripeGateway({ client: new Stripe(env.STRIPE_SECRET_KEY), webhookSecret: env.STRIPE_WEBHOOK_SECRET });
}

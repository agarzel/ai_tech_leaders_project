import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { entities, Payment, PAYMENT_PROVIDERS, PAYMENT_STATUSES } from "../index";

// Metadata discovery only – MikroORM 7 connects lazily, so no database is needed.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ clientUrl: "postgres://unused@localhost:1/unused", entities });
});

afterAll(async () => {
  await orm.close();
});

function meta() {
  return orm.getMetadata().get(Payment);
}

describe("Payment entity", () => {
  it("maps to the plural snake_case table", () => {
    expect(meta().tableName).toBe("payments");
  });

  it("belongs to exactly one booking and is removed with it", () => {
    const { booking } = meta().properties;

    expect(booking.kind).toBe("1:1");
    expect(booking.fieldNames).toEqual(["booking_id"]);
    expect(booking.nullable).toBeFalsy();
    expect(booking.unique).toBeTruthy();
    expect(booking.deleteRule).toBe("cascade");
  });

  it("knows the providers and the payment states", () => {
    const { provider, status } = meta().properties;

    expect(PAYMENT_PROVIDERS).toEqual(["stripe", "fake"]);
    expect(PAYMENT_STATUSES).toEqual([
      "creating",
      "open",
      "paid",
      "expired",
      "refund_requested",
      "refunded",
      "refund_failed",
    ]);
    expect(provider.nullable).toBeFalsy();
    expect(status.default).toBe("creating");
    expect(status.nullable).toBeFalsy();
  });

  it("requires the checkout idempotency key", () => {
    const { checkoutIdempotencyKey } = meta().properties;

    expect(checkoutIdempotencyKey.fieldNames).toEqual(["checkout_idempotency_key"]);
    expect(checkoutIdempotencyKey.nullable).toBeFalsy();
  });

  it.each([
    ["checkoutSessionId", "checkout_session_id"],
    ["paymentIntentId", "payment_intent_id"],
  ] as const)("keeps %s unique and empty until the provider returns it", (name, column) => {
    const property = meta().properties[name];

    expect(property.fieldNames).toEqual([column]);
    expect(property.nullable).toBe(true);
    expect(property.unique).toBeTruthy();
  });

  it("stores the amount in grosze with a PLN default", () => {
    const { amount, currency } = meta().properties;

    expect(amount.nullable).toBeFalsy();
    expect(currency.default).toBe("PLN");
    expect(currency.nullable).toBeFalsy();
  });

  it("starts with no refund and counts attempts from zero", () => {
    const { refundId, refundAttempts, refundFailureIds } = meta().properties;

    expect(refundId.nullable).toBe(true);
    expect(refundAttempts.default).toBe(0);
    expect(refundAttempts.nullable).toBeFalsy();
    expect(refundFailureIds.default).toBe("[]");
    expect(refundFailureIds.nullable).toBeFalsy();
    expect(refundFailureIds.onCreate?.({} as never, {} as never)).toEqual([]);
  });

  it("leaves the payment, refund times and last error empty until they apply", () => {
    const { paidAt, refundedAt, lastError } = meta().properties;

    expect(paidAt.nullable).toBe(true);
    expect(refundedAt.nullable).toBe(true);
    expect(lastError.nullable).toBe(true);
  });

  it("is exported for discovery", () => {
    expect(entities).toContain(Payment);
  });
});

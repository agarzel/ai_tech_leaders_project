import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { CURRENCY } from "../../constants";
import { Booking } from "../bookings/booking.entity";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";

export const PAYMENT_PROVIDERS = ["stripe", "fake"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_STATUSES = [
  "creating",
  "open",
  "paid",
  "expired",
  "refund_requested",
  "refunded",
  "refund_failed",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const Payment = defineSingletonEntity("Payment", () =>
  defineEntity({
    name: "Payment",
    tableName: "payments",
    properties: {
      ...baseProperties(),
      // One payment per booking; it is removed only together with its booking.
      booking: () => p.oneToOne(Booking).unique().deleteRule("cascade"),
      provider: p.string().$type<PaymentProvider>(),
      status: p.string().$type<PaymentStatus>().default("creating"),
      // checkout:{bookingId}; makes a retried Checkout creation return the same session.
      checkoutIdempotencyKey: p.string(),
      // Null while `creating`.
      checkoutSessionId: p.string().unique().nullable(),
      // Null until paid.
      paymentIntentId: p.string().unique().nullable(),
      // Integer grosze, equal to Booking.priceAmount.
      amount: p.integer(),
      currency: p.string().length(3).default(CURRENCY),
      refundId: p.string().nullable(),
      refundAttempts: p.integer().default(0),
      paidAt: p.datetime().nullable(),
      refundedAt: p.datetime().nullable(),
      // Grosze the mentor keeps when a late cancellation keeps the payment; paying it out is a later spec (D14, Q05).
      mentorShareAmount: p.integer().nullable(),
      // Provider message only; never card data or the booking question.
      lastError: p.text().nullable(),
    },
  }),
);

export type IPayment = InferEntity<typeof Payment>;

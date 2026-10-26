import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  Booking,
  BOOKING_ENTRY_POINTS,
  BOOKING_STATUSES,
  entities,
  LIVE_BOOKING_STATUSES,
} from "../index";

// Metadata discovery only – MikroORM 7 connects lazily, so no database is needed.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ clientUrl: "postgres://unused@localhost:1/unused", entities });
});

afterAll(async () => {
  await orm.close();
});

function meta() {
  return orm.getMetadata().get(Booking);
}

describe("Booking entity", () => {
  it("maps to the plural snake_case table", () => {
    expect(meta().tableName).toBe("bookings");
  });

  it.each([
    ["slot", "slot_id"],
    ["mentee", "mentee_id"],
    ["mentor", "mentor_id"],
  ] as const)("keeps history by refusing to delete the %s while a booking references it", (name, column) => {
    const relation = meta().properties[name];

    expect(relation.kind).toBe("m:1");
    expect(relation.fieldNames).toEqual([column]);
    expect(relation.nullable).toBeFalsy();
    expect(relation.deleteRule).toBe("restrict");
  });

  it("knows exactly the states of the booking state machine", () => {
    const { status } = meta().properties;

    expect(BOOKING_STATUSES).toEqual([
      "pending_payment",
      "awaiting_acceptance",
      "confirmed",
      "declined",
      "expired",
      "payment_expired",
    ]);
    expect(status.default).toBe("pending_payment");
    expect(status.nullable).toBeFalsy();
  });

  it("treats only the states that hold a slot as live", () => {
    expect(LIVE_BOOKING_STATUSES).toEqual(["pending_payment", "awaiting_acceptance", "confirmed"]);
    for (const status of LIVE_BOOKING_STATUSES) expect(BOOKING_STATUSES).toContain(status);
  });

  it("stores the price in grosze and the session length at booking time", () => {
    const { priceAmount, lengthMinutes, currency } = meta().properties;

    expect(priceAmount.fieldNames).toEqual(["price_amount"]);
    expect(priceAmount.nullable).toBeFalsy();
    expect(lengthMinutes.fieldNames).toEqual(["length_minutes"]);
    expect(lengthMinutes.nullable).toBeFalsy();
    expect(currency.default).toBe("PLN");
    expect(currency.nullable).toBeFalsy();
  });

  it("requires the question and the hold deadline", () => {
    const { question, holdExpiresAt } = meta().properties;

    expect(question.nullable).toBeFalsy();
    expect(holdExpiresAt.fieldNames).toEqual(["hold_expires_at"]);
    expect(holdExpiresAt.nullable).toBeFalsy();
  });

  it("leaves the acceptance deadline, decision time and decline reason empty until they apply", () => {
    const { acceptBy, decidedAt, declineReason } = meta().properties;

    expect(acceptBy.nullable).toBe(true);
    expect(decidedAt.nullable).toBe(true);
    expect(declineReason.nullable).toBe(true);
    expect(declineReason.length).toBe(280);
  });

  it("records the entry point, unknown by default", () => {
    const { entryPoint } = meta().properties;

    expect(BOOKING_ENTRY_POINTS).toEqual(["link", "list", "unknown"]);
    expect(entryPoint.default).toBe("unknown");
    expect(entryPoint.nullable).toBeFalsy();
  });

  it("indexes status with the acceptance and hold deadlines for the sweep", () => {
    expect(meta().indexes).toEqual([
      expect.objectContaining({ name: "bookings_status_accept_by_index", properties: ["status", "acceptBy"] }),
      expect.objectContaining({
        name: "bookings_status_hold_expires_at_index",
        properties: ["status", "holdExpiresAt"],
      }),
    ]);
  });

  it("is exported for discovery", () => {
    expect(entities).toContain(Booking);
  });
});

import { describe, expect, it } from "vitest";
import { bookingDeclineSchema, DECLINE_REASON_MAX_LENGTH } from "./booking-decline.schema";

describe("bookingDeclineSchema", () => {
  it("accepts a missing reason", () => {
    expect(bookingDeclineSchema.parse({}).reason).toBeUndefined();
  });

  it("trims the reason", () => {
    expect(bookingDeclineSchema.parse({ reason: "  busy  " }).reason).toBe("busy");
  });

  it("accepts a reason of exactly the maximum length", () => {
    expect(bookingDeclineSchema.safeParse({ reason: "a".repeat(DECLINE_REASON_MAX_LENGTH) }).success).toBe(true);
  });

  it("refuses a reason over the maximum length", () => {
    expect(bookingDeclineSchema.safeParse({ reason: "a".repeat(DECLINE_REASON_MAX_LENGTH + 1) }).success).toBe(false);
  });

  it("refuses a reason that is not text", () => {
    expect(bookingDeclineSchema.safeParse({ reason: 5 }).success).toBe(false);
  });
});

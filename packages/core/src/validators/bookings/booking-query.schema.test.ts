import { describe, expect, it } from "vitest";
import { BOOKINGS_DEFAULT_PAGE_SIZE, BOOKINGS_MAX_PAGE_SIZE, bookingListQuerySchema } from "./booking-query.schema";

describe("bookingListQuerySchema", () => {
  it("applies the defaults to an empty query", () => {
    expect(bookingListQuerySchema.parse({})).toEqual({ page: 1, pageSize: BOOKINGS_DEFAULT_PAGE_SIZE });
  });

  it("coerces string query values and accepts a known status", () => {
    expect(bookingListQuerySchema.parse({ page: "2", pageSize: "10", status: "confirmed" })).toEqual({ page: 2, pageSize: 10, status: "confirmed" });
  });

  it("clamps a page size above the maximum", () => {
    expect(bookingListQuerySchema.parse({ pageSize: "1000" }).pageSize).toBe(BOOKINGS_MAX_PAGE_SIZE);
  });

  it.each([
    ["page below 1", { page: "0" }],
    ["non-numeric page", { page: "abc" }],
    ["page size below 1", { pageSize: "0" }],
    ["fractional page size", { pageSize: "2.5" }],
    ["unknown status", { status: "refunded" }],
  ])("rejects %s", (_name, query) => {
    expect(bookingListQuerySchema.safeParse(query).success).toBe(false);
  });
});

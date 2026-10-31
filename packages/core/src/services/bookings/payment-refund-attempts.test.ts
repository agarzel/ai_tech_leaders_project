import { describe, expect, it } from "vitest";
import { recordRefundFailures } from "./payment-refund-attempts";

describe("recordRefundFailures", () => {
  it("counts each new refund id once and leaves known ids unchanged", () => {
    const payment = { refundAttempts: 1, refundFailureIds: ["re_1"] };

    expect(recordRefundFailures(payment, ["re_1", "re_2", "re_2"])).toBe(1);
    expect(payment).toEqual({ refundAttempts: 2, refundFailureIds: ["re_1", "re_2"] });
  });

  it("does not change the payment when all refund ids were already counted", () => {
    const payment = { refundAttempts: 1, refundFailureIds: ["re_1"] };

    expect(recordRefundFailures(payment, ["re_1"])).toBe(0);
    expect(payment).toEqual({ refundAttempts: 1, refundFailureIds: ["re_1"] });
  });

  it("does not change the payment when no provider refund ids are supplied", () => {
    const payment = { refundAttempts: 1, refundFailureIds: ["re_1"] };

    expect(recordRefundFailures(payment, [])).toBe(0);
    expect(payment).toEqual({ refundAttempts: 1, refundFailureIds: ["re_1"] });
  });
});

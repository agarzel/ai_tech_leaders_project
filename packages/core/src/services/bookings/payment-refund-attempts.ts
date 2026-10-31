import type { IPayment } from "@devmentor/db";

/** Counts each provider refund failure once, even when the webhook and sweep report the same refund. */
export function recordRefundFailures(payment: Pick<IPayment, "refundAttempts" | "refundFailureIds">, refundIds: readonly string[]): number {
  const known = new Set(payment.refundFailureIds);
  let added = 0;
  for (const refundId of refundIds) {
    if (known.has(refundId)) continue;
    known.add(refundId);
    added += 1;
  }
  if (added > 0) {
    payment.refundFailureIds = [...known];
    payment.refundAttempts += added;
  }
  return added;
}

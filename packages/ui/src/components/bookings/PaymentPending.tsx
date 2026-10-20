import { Spinner } from "@devmentor/ui/components/ui/spinner";

/** `checking`: re-checking every few seconds for up to a minute; `slow`: the page stops waiting and says so. */
export type PaymentPendingPhase = "checking" | "slow";

/**
 * The page the card payment returns to (spec E02, UI/UX `/bookings/[id]`): *Payment processing…* while
 * the webhook has not landed. After about a minute the spinner stops and the page says it will update
 * shortly – no spinner that never ends (C66, WCAG 2.2.2). The checking itself is the page's job.
 */
export function PaymentPending({ phase }: { phase: PaymentPendingPhase }) {
  return (
    <section aria-labelledby="payment-pending-title" className="flex flex-col gap-in-group">
      <h2 id="payment-pending-title" className="flex items-center gap-in-group type-section-title">
        {phase === "checking" && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} />}
        {phase === "checking" ? "Payment processing…" : "This page will update shortly"}
      </h2>
      <p role="status" className="max-w-prose type-body text-muted-foreground">
        {phase === "checking"
          ? "We are waiting for your bank to confirm the payment. This usually takes a few seconds."
          : "The payment is still being confirmed. You do not need to do anything – the booking appears here as soon as it is."}
      </p>
    </section>
  );
}

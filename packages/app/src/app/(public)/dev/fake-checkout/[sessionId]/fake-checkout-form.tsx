"use client";

import { useState } from "react";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import type { ApiError } from "@devmentor/ui/backend/api/types";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { Button } from "@devmentor/ui/components/ui/button";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import { formatPrice } from "@devmentor/ui/lib/format";

type FakeCheckoutFormProps = { sessionId: string; amount: number; currency: string; description: string };

/** The stand-in for the provider's payment page: *Pay (fake)* completes the session and returns to the booking. */
export function FakeCheckoutForm({ sessionId, amount, currency, description }: FakeCheckoutFormProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function pay() {
    setPaying(true);
    setError(null);
    const result = await apiCall<{ returnPath: string }>(`/api/dev/fake-checkout/${sessionId}`, { method: "POST" });
    if (result.ok) {
      window.location.assign(result.data.returnPath);
      return;
    }
    setPaying(false);
    setError(result.error);
  }

  return (
    <section aria-labelledby="fake-checkout-heading" className="flex max-w-xl flex-col gap-in-group">
      <h2 id="fake-checkout-heading" className="type-section-title">
        {description}
      </h2>
      <p className="type-body tabular-nums">{formatPrice(amount, currency)}</p>
      {error && <ErrorMessage title="Could not complete the payment" error={error} />}
      <div>
        <Button disabled={paying} aria-busy={paying || undefined} onClick={() => void pay()}>
          {paying && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
          Pay (fake)
        </Button>
      </div>
    </section>
  );
}

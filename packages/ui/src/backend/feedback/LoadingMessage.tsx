import { Spinner } from "@devmentor/ui/components/ui/spinner";

export function LoadingMessage({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-in-group py-section type-body text-muted-foreground">
      {/* Decorative: the wrapper is the single live region, so the spinner must not announce itself too. */}
      <Spinner role="presentation" aria-hidden="true" aria-label={undefined} />
      {label}
    </div>
  );
}

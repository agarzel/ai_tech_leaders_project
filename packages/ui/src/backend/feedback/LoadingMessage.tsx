import { Spinner } from "@devmentor/ui/components/ui/spinner";

export function LoadingMessage({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
      {/* Decorative: the wrapper is the single live region, so the spinner must not announce itself too. */}
      <Spinner role="presentation" aria-hidden="true" aria-label={undefined} />
      {label}
    </div>
  );
}

import { Spinner } from "@devmentor/ui/components/ui/spinner";

export function LoadingMessage({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
      <Spinner />
      {label}
    </div>
  );
}

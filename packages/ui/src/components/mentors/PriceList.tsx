import { Skeleton } from "@devmentor/ui/components/ui/skeleton";
import { formatPrice } from "@devmentor/ui/lib/format";

type PriceListProps = {
  /** Grosze; `null` = not set yet (the mentor's own view). */
  price25: number | null;
  price50: number | null;
  currency: string;
};

/**
 * The two session prices (R01, R07, D12): length and amount, amounts in tabular figures. A price not set
 * yet reads "Not set" – only the mentor sees that, a mentor without both prices is listed nowhere.
 */
export function PriceList({ price25, price50, currency }: PriceListProps) {
  const rows = [
    { length: "25 min", price: price25 },
    { length: "50 min", price: price50 },
  ];
  return (
    <dl className="grid grid-cols-content-action gap-x-between-groups gap-y-in-group type-body">
      {rows.map((row) => (
        <div key={row.length} className="contents">
          <dt className="text-muted-foreground">{row.length}</dt>
          <dd className="text-right tabular-nums">{row.price === null ? "Not set" : formatPrice(row.price, currency)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Placeholder while prices load (C3). */
export function PriceListSkeleton() {
  return (
    <div className="flex flex-col gap-in-group">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-5 w-40" />
    </div>
  );
}

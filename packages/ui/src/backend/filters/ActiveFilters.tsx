import { XIcon } from "lucide-react";
import { Button } from "@devmentor/ui/components/ui/button";

export type ActiveFilter = {
  key: string;
  /** What the filter is, in words: "Stack: React". */
  label: string;
};

type ActiveFiltersProps = {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  /** Accessible name of the group; name the list when a screen has more than one. */
  label?: string;
};

/**
 * The filters in effect on a list, each removable, and *Clear filters* to drop all of them (C9, C59).
 * Nothing is rendered without a filter, so the list stays quiet when it is unfiltered. Each remove
 * button names its filter (*Remove filter: Stack: React*) because the buttons repeat.
 */
export function ActiveFilters({ filters, onRemove, onClearAll, label = "Active filters" }: ActiveFiltersProps) {
  if (filters.length === 0) return null;
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-in-group">
      {filters.map((filter) => (
        <Button key={filter.key} variant="outline" size="sm" aria-label={`Remove filter: ${filter.label}`} onClick={() => onRemove(filter.key)}>
          {filter.label}
          <XIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear filters
      </Button>
    </div>
  );
}

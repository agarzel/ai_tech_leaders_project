import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-in-group rounded-lg border border-dashed px-panel py-section text-center">
      <p className="type-label">{title}</p>
      {description && <p className="type-body text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

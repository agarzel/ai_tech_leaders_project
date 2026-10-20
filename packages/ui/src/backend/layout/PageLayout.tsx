import type { ReactNode } from "react";
import { cn } from "@devmentor/ui/lib/utils";

type PageLayoutProps = {
  /** Usually `AppHeader`. */
  header: ReactNode;
  /** The page title – one `h1` per page (`type-page-title`, P2). */
  title: string;
  /** One sentence under the title: what the page is for. */
  description?: string;
  /** `content`: lists and panels, up to 1024 px (F2); `narrow`: a single form such as sign-in, 384 px. */
  width?: "content" | "narrow";
  children: ReactNode;
};

/**
 * The frame of every page: header, then `main` with the title and the content, aligned left with the
 * maximum content width (F2) and section spacing (T8). Not centred text, no hero (A01).
 */
export function PageLayout({ header, title, description, width = "content", children }: PageLayoutProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      {header}
      <main className={cn("mx-auto flex w-full flex-col gap-section px-panel py-section", width === "narrow" ? "max-w-sm" : "max-w-5xl")}>
        <div className="flex flex-col gap-in-group">
          <h1 className="type-page-title">{title}</h1>
          {description && <p className="max-w-prose type-body text-muted-foreground">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}

import { cn } from "@devmentor/ui/lib/utils"

// Adapted from shadcn base-nova (POSTEP.md, stage 2, batch 5): rounded-md (B3) and bg-muted were
// already token-based; only the motion rule was missing – the pulse stops with
// prefers-reduced-motion (B60, follows F3, WCAG 2.3.3). A skeleton never gets a border or text.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton }

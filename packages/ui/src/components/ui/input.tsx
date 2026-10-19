import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@devmentor/ui/lib/utils"

// Adapted from shadcn base-nova (POSTEP.md, stage 2): token height (P4), 12 px padding (B8),
// type-body with 16 px on coarse pointers (P2, B9), transparent fill in both themes (B6),
// neutral focus ring also on an invalid field (T4, B13).
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-control w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 type-body transition-colors outline-none pointer-coarse:text-base motion-reduce:transition-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:type-label file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:focus-visible:ring-ring/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:aria-invalid:focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }

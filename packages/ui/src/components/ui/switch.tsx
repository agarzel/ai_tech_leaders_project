"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@devmentor/ui/lib/utils"

// Adapted from shadcn base-nova (POSTEP.md, stage 2, batch 2): one size, track 32 × 20 px from the
// spacing scale instead of arbitrary 32 × 18.4 / 24 × 14 px (B29, rule 3), round track (answer 2.2),
// "on" in the neutral foreground, not the accent (B26), the same thumb in both themes (B5),
// colour/transform transitions off with prefers-reduced-motion (B16), hit area like Checkbox (B27).
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch relative inline-flex h-5 w-8 shrink-0 items-center rounded-full border border-transparent px-px transition-colors outline-none motion-reduce:transition-none after:absolute after:-inset-x-3 after:-inset-y-2 pointer-coarse:after:-inset-y-3 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:focus-visible:ring-ring/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:aria-invalid:focus-visible:ring-ring/50 data-checked:bg-foreground data-unchecked:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform motion-reduce:transition-none data-checked:translate-x-3 data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

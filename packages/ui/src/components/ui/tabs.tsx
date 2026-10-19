"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@devmentor/ui/lib/utils"

// Adapted from shadcn base-nova (POSTEP.md, stage 2, batch 4): one look – the line style (tabs on a
// 1 px rule, the active one underlined in foreground and in foreground text), like the GitHub
// references (R01, B57); the segmented `default` variant and the vertical orientation removed
// (rule 6); tabs h-control (P4), type-label (P2), neutral focus ring (T4); 16 px to the panel (T8).

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("group/tabs flex flex-col gap-between-groups", className)}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "group/tabs-list flex w-full items-center gap-1 overflow-x-auto border-b border-border text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-control shrink-0 items-center justify-center gap-2 rounded-md px-3 type-label whitespace-nowrap text-muted-foreground transition-colors outline-none motion-reduce:transition-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset data-disabled:pointer-events-none data-disabled:opacity-50 data-active:text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-foreground after:opacity-0 data-active:after:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 type-body outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

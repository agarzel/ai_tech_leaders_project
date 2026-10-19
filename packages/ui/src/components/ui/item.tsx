import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@devmentor/ui/lib/utils"

// Adapted from shadcn base-nova (POSTEP.md, stage 2, batch 3) into the dense list row (S11, S21):
// - ItemGroup is the list: one 1 px frame and 1 px lines between rows, no box per row (R01.1, R01.3, P3, B35).
// - Item is a row: list-row padding (T9), title text-sm medium + one metadata line text-xs (T12).
// - A clickable row has a link in its title stretched over the row, so the row stays a list item (B36).
// Not taken (rule 6): item variants and sizes, ItemHeader, ItemFooter, ItemSeparator, the image media.

function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn(
        "group/item-group flex w-full flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
        className
      )}
      {...props}
    />
  )
}

function Item({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        role: "listitem",
        className: cn(
          "group/item relative flex w-full items-center gap-in-group px-list-row py-list-row type-body transition-colors outline-none motion-reduce:transition-none has-[a[data-slot=item-link]]:hover:bg-muted has-[a[data-slot=item-link]:focus-visible]:ring-3 has-[a[data-slot=item-link]:focus-visible]:ring-ring/50 has-[a[data-slot=item-link]:focus-visible]:ring-inset",
          className
        ),
      },
      props
    ),
    render,
    state: { slot: "item" },
  })
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:self-start group-has-data-[slot=item-description]/item:translate-y-0.5 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn("flex min-w-0 flex-1 flex-col", className)}
      {...props}
    />
  )
}

/** Row title: text-sm medium in foreground, one line (T12). */
function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn("flex min-w-0 items-center gap-2 type-label [&>*]:truncate", className)}
      {...props}
    />
  )
}

/** The row link: put it inside ItemTitle; it covers the whole row (B36). */
function ItemLink({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      data-slot="item-link"
      className={cn(
        "outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

/** The one metadata line: text-xs in muted-foreground (R01.1, T12). */
function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn("truncate type-meta text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Row actions sit above the stretched link, so they stay clickable. */
function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("relative flex shrink-0 items-center gap-in-group", className)}
      {...props}
    />
  )
}

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemLink,
  ItemMedia,
  ItemTitle,
}

"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@devmentor/ui/lib/utils"

import { Button } from "@devmentor/ui/components/ui/button"
import { Input } from "@devmentor/ui/components/ui/input"
import { Textarea } from "@devmentor/ui/components/ui/textarea"

// Adapted from shadcn base-nova (POSTEP.md, stage 2, batch 2): the group carries the field look of
// Input – h-control (P4), border-input (T3), transparent fill (B6), neutral focus also when invalid
// (B13), 12 px padding (B8), 48 px on touch when it holds a button (B31); addons in type-label / type-body (P2); no arbitrary offsets or radii
// (rule 3); InputGroupButton sizes follow Button (B30).
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-control pointer-coarse:has-[>[data-align^=inline]_button]:h-12 w-full min-w-0 items-center rounded-lg border border-input transition-colors outline-none motion-reduce:transition-none has-disabled:bg-muted has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:has-[[data-slot][aria-invalid=true]]:border-destructive/50 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 dark:has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-2 has-[>[data-align=inline-start]]:[&>input]:pl-2",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 type-label text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3 has-[>button]:pl-0.5 has-[>kbd]:pl-1.5",
        "inline-end": "order-last pr-3 has-[>button]:pr-0.5 has-[>kbd]:pr-1.5",
        "block-start":
          "order-first w-full justify-start px-3 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-3 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus()
      }}
      {...props}
    />
  )
}

/**
 * A button inside the field: `sm` (text) or `icon-sm`, the dense-row sizes of Button (B30, B2).
 * On touch it is 40 px (P4); the group grows to 48 px when it holds a button (B31).
 */
function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "icon-sm",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> & {
  size?: "sm" | "icon-sm"
  type?: "button" | "submit" | "reset"
}) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      size={size}
      className={className}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 type-body text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "h-auto flex-1 self-stretch rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 aria-invalid:focus-visible:ring-0 dark:aria-invalid:ring-0 dark:aria-invalid:focus-visible:ring-0",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 aria-invalid:focus-visible:ring-0 dark:aria-invalid:ring-0 dark:aria-invalid:focus-visible:ring-0",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}

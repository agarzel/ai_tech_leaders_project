import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@devmentor/ui/lib/utils"

// Adapted from shadcn base-nova (POSTEP.md, stage 2, batch 3): named grid template instead of
// an arbitrary "auto 1fr" grid (B20), 12 × 8 px padding like a control row (B40, B8), type roles (P2),
// links in the foreground and underlined (T11). role="alert" by default; pass role="status" (or none)
// for a message that is already on the page when it loads (B42).
const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border border-border px-3 py-2 text-left type-body has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 pointer-coarse:has-data-[slot=alert-action]:min-h-12 has-[>svg]:grid-cols-icon-content has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive *:[svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "type-label group-has-[>svg]/alert:col-start-2 [&_a]:link-text",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "type-body text-balance text-muted-foreground md:text-pretty [&_a]:link-text [&_p:not(:last-child)]:mb-in-group",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-1 right-1", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }

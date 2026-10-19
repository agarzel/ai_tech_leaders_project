"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleAlertIcon } from "lucide-react"
import { cn } from "@devmentor/ui/lib/utils"

import { Label } from "@devmentor/ui/components/ui/label"

// Adapted from shadcn base-nova (POSTEP.md, stage 2). Batch 1: Field, FieldGroup, FieldLabel,
// FieldDescription, FieldError. Batch 2 restored FieldSet, FieldLegend, FieldContent and the horizontal
// orientation for checkbox, radio and switch. Not taken (rule 6): FieldTitle, FieldSeparator, the
// "responsive" orientation and the choice-card label (B28, B33).
// Spacing: 8 px inside a field or option group, 16 px between fields (T8).

/** A group of options or fields with one question: <fieldset> + FieldLegend. */
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("flex min-w-0 flex-col gap-in-group", className)}
      {...props}
    />
  )
}

/** The question of a FieldSet, in the label role (B32, P2). */
function FieldLegend({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="field-legend"
      className={cn("mb-in-group type-label", className)}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("group/field-group flex w-full flex-col gap-between-groups", className)}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-in-group data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        // Checkbox, radio, switch beside their label; the control aligns with the first text line.
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio],[role=switch]]:mt-0.5",
      },
    },
    defaultVariants: { orientation: "vertical" },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

/** Label and hint stacked beside a checkbox, radio or switch – title + one line, like a list row (B32). */
function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("group/field-content flex flex-1 flex-col", className)}
      {...props}
    />
  )
}

/** Label of a field. `optional` adds "(optional)"; required fields carry no marker (answer 2.5, WCAG 3.3.2). */
function FieldLabel({
  className,
  optional = false,
  children,
  ...props
}: React.ComponentProps<typeof Label> & { optional?: boolean }) {
  return (
    <Label
      data-slot="field-label"
      className={cn("w-fit group-data-[disabled=true]/field:opacity-50", className)}
      {...props}
    >
      {children}
      {optional ? <span className="font-normal text-muted-foreground">(optional)</span> : null}
    </Label>
  )
}

/** Hint under a control: format, limit, consequence. muted-foreground, 7.3:1 (answer 2.4). */
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-left type-body text-muted-foreground [&>a]:link-text",
        className
      )}
      {...props}
    />
  )
}

/**
 * Error of a field: what happened and what to do, always with an icon so colour is not the only
 * signal (answer 2.4, WCAG 1.4.1, 3.3.1). Renders nothing without content.
 */
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  let content: React.ReactNode = children
  if (!content && errors?.length) {
    const messages = [...new Set(errors.map((error) => error?.message).filter(Boolean))]
    content =
      messages.length === 0 ? null : messages.length === 1 ? (
        messages[0]
      ) : (
        <ul className="ml-4 flex list-disc flex-col gap-1">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )
  }

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("flex items-start gap-2 type-body text-destructive", className)}
      {...props}
    >
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>{content}</div>
    </div>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
}

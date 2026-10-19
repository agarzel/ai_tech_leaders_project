"use client"

import * as React from "react"
import { CircleAlertIcon } from "lucide-react"
import { cn } from "@devmentor/ui/lib/utils"

import { Label } from "@devmentor/ui/components/ui/label"

// Adapted from shadcn base-nova (POSTEP.md, stage 2, batch 1). Kept only the parts batch 1 documents:
// Field, FieldGroup, FieldLabel, FieldDescription, FieldError (rule 6). FieldSet, FieldLegend,
// FieldContent and the horizontal orientation return with checkbox, radio and switch (batch 2).
// Spacing: 8 px inside a field, 16 px between fields (T8).

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("group/field-group flex w-full flex-col gap-between-groups", className)}
      {...props}
    />
  )
}

function Field({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="field"
      className={cn(
        "group/field flex w-full flex-col gap-in-group *:w-full data-[invalid=true]:text-destructive [&>.sr-only]:w-auto",
        className
      )}
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
        "text-left type-body text-muted-foreground [&>a]:text-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:decoration-2",
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

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel }

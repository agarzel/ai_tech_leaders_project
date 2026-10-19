"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { z } from "zod";
import { Button } from "@devmentor/ui/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@devmentor/ui/components/ui/field";
import { Input } from "@devmentor/ui/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@devmentor/ui/components/ui/native-select";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import type { ApiError, ApiResult, FieldErrors } from "../api/types";
import { ErrorMessage } from "../feedback/ErrorMessage";

type FormSchema = z.ZodObject<z.ZodRawShape>;

export type CrudFormField<S extends FormSchema> = {
  name: keyof z.infer<S> & string;
  /** Always visible; the placeholder is only an example, never the field's name. */
  label: string;
  /** An example value (format), not the label. */
  placeholder?: string;
  /** Hint under the field: format, limit or consequence. Linked with aria-describedby. */
  description?: string;
  /** Adds "(optional)" to the label (answer 2.5). Required fields carry no marker. */
  optional?: boolean;
  /** `autocomplete` attribute; password fields default to "current-password" (use "new-password" on sign-up). */
  autoComplete?: string;
};

type CrudFormProps<S extends FormSchema> = {
  /** The same Zod schema the API route validates with. */
  schema: S;
  fields: CrudFormField<S>[];
  initialValues?: Partial<z.infer<S>>;
  submitLabel?: string;
  /** Title of the form-level error, naming the action that failed ("Could not create the account"). */
  errorTitle?: string;
  onSubmit: (values: z.infer<S>) => Promise<ApiResult<unknown>>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type FieldKind = { type: "text" | "email" | "number" | "password" } | { type: "select"; options: string[] };

/**
 * Schema-driven create/edit form (pattern "Form"): labels always visible, validation when a changed field
 * is left and on submit, focus on the first error after a failed submit, values kept, one submit at a
 * time, success only after the server confirms. Cmd/Ctrl+Enter submits, Escape cancels.
 */
export function CrudForm<S extends FormSchema>({
  schema,
  fields,
  initialValues,
  submitLabel = "Save",
  errorTitle = "Could not save",
  onSubmit,
  onSuccess,
  onCancel,
}: CrudFormProps<S>) {
  const formId = useId();
  const [initial] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, initialValue(schema, field.name, initialValues)])),
  );
  const [values, setValues] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Element to focus after the next render (fields are disabled while submitting, so focus waits for it).
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    if (pendingFocus.current === null) return;
    (document.getElementById(pendingFocus.current) as HTMLElement).focus();
    pendingFocus.current = null;
  });

  const fieldId = (name: string) => `${formId}-${name}`;
  const formErrorId = `${formId}-form-error`;

  /** Client-side errors for the current values, keyed by field. */
  function validate(current: Record<string, string>): FieldErrors {
    const parsed = schema.safeParse(toInput(schema, current));
    return parsed.success ? {} : (z.flattenError(parsed.error).fieldErrors as FieldErrors);
  }

  function focusFirstError(errors: FieldErrors) {
    const first = fields.find((field) => errors[field.name]);
    pendingFocus.current = first ? fieldId(first.name) : formErrorId;
  }

  /** Re-checks one field, leaving the others' messages as they are. */
  function revalidateField(name: string, current: Record<string, string>) {
    const errors = validate(current)[name];
    setFieldErrors((previous) => {
      const next = { ...previous };
      if (errors) next[name] = errors;
      else delete next[name];
      return next;
    });
  }

  function handleChange(name: string, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    // A field already showing an error is re-checked as the person fixes it, so the message clears.
    if (fieldErrors[name]) revalidateField(name, next);
  }

  function handleBlur(name: string) {
    // Only fields the person changed: tabbing through an empty form does not paint it red.
    if (values[name] !== initial[name]) revalidateField(name, values);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = schema.safeParse(toInput(schema, values));
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors as FieldErrors;
      setFieldErrors(errors);
      setFormError(null);
      focusFirstError(errors);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    const result = await onSubmit(parsed.data as z.infer<S>);
    setIsSubmitting(false);

    if (result.ok) {
      setFieldErrors({});
      onSuccess?.();
      return;
    }
    const serverErrors = result.error.fieldErrors ?? {};
    setFieldErrors(serverErrors);
    setFormError(result.error);
    focusFirstError(serverErrors);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    } else if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-between-groups">
      {formError && (
        // Focus target when the server rejects the form without pointing at a field.
        <div id={formErrorId} tabIndex={-1} className="outline-none">
          <ErrorMessage title={errorTitle} error={formError} />
        </div>
      )}

      <FieldGroup>
        {fields.map((field) => {
          const id = fieldId(field.name);
          const errors = fieldErrors[field.name];
          const kind = fieldKind(schema, field.name);
          const describedBy = [field.description && `${id}-description`, errors && `${id}-error`].filter(Boolean).join(" ");
          const common = {
            id,
            name: field.name,
            value: values[field.name],
            disabled: isSubmitting,
            "aria-invalid": errors ? true : undefined,
            "aria-describedby": describedBy || undefined,
            onBlur: () => handleBlur(field.name),
          };

          return (
            <Field key={field.name} data-invalid={errors ? true : undefined}>
              <FieldLabel htmlFor={id} optional={field.optional}>
                {field.label}
              </FieldLabel>
              {kind.type === "select" ? (
                <NativeSelect {...common} onChange={(event) => handleChange(field.name, event.target.value)}>
                  {kind.options.map((option) => (
                    <NativeSelectOption key={option} value={option}>
                      {option}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <Input
                  {...common}
                  type={kind.type}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete ?? (kind.type === "password" ? "current-password" : undefined)}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                />
              )}
              {field.description && <FieldDescription id={`${id}-description`}>{field.description}</FieldDescription>}
              {errors && <FieldError id={`${id}-error`}>{errors[0]}</FieldError>}
            </Field>
          );
        })}
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-in-group">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting || undefined}>
          {isSubmitting && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

const WRAPPER_TYPES = new Set(["optional", "default", "nullable"]);

function unwrap(schema: z.ZodType): z.ZodType {
  let current = schema;
  while (WRAPPER_TYPES.has(current.def.type)) {
    current = (current.def as unknown as { innerType: z.ZodType }).innerType;
  }
  return current;
}

function fieldKind(schema: FormSchema, name: string): FieldKind {
  const outer = schema.shape[name] as z.ZodType;
  const field = unwrap(outer);
  // Password fields are declared in the shared schema: z.string().meta({ input: "password" }) (spec E01, UI/UX).
  if ((outer.meta()?.input ?? field.meta()?.input) === "password") return { type: "password" };
  if (field instanceof z.ZodEnum) return { type: "select", options: field.options.map(String) };
  if (field instanceof z.ZodNumber) return { type: "number" };
  // z.email() is a string format, not a ZodString instance – detect it by its `format`.
  if ("format" in field && field.format === "email") return { type: "email" };
  return { type: "text" };
}

function initialValue(schema: FormSchema, name: string, initialValues: Record<string, unknown> | undefined): string {
  const provided = initialValues?.[name];
  if (provided !== undefined && provided !== null) return String(provided);
  const kind = fieldKind(schema, name);
  return kind.type === "select" ? (kind.options[0] ?? "") : "";
}

/** Form values are strings: number fields are converted (empty → omitted); text stays as typed so schema messages apply. */
function toInput(schema: FormSchema, values: Record<string, string>): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(values)) {
    if (fieldKind(schema, name).type !== "number") input[name] = value;
    else if (value !== "") input[name] = Number(value);
  }
  return input;
}

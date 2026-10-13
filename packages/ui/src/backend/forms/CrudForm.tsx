"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { z } from "zod";
import { Button } from "@devmentor/ui/components/ui/button";
import { Input } from "@devmentor/ui/components/ui/input";
import { Label } from "@devmentor/ui/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@devmentor/ui/components/ui/native-select";
import type { ApiResult, FieldErrors } from "../api/types";
import { ErrorMessage } from "../feedback/ErrorMessage";

type FormSchema = z.ZodObject<z.ZodRawShape>;

export type CrudFormField<S extends FormSchema> = {
  name: keyof z.infer<S> & string;
  label: string;
  placeholder?: string;
};

type CrudFormProps<S extends FormSchema> = {
  /** The same Zod schema the API route validates with. */
  schema: S;
  fields: CrudFormField<S>[];
  initialValues?: Partial<z.infer<S>>;
  submitLabel?: string;
  onSubmit: (values: z.infer<S>) => Promise<ApiResult<unknown>>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type FieldKind = { type: "text" | "email" | "number" } | { type: "select"; options: string[] };

/**
 * Schema-driven create/edit form: client-side validation with the shared schema, server `fieldErrors`
 * next to the right field, loading state, Cmd/Ctrl+Enter submits, Escape cancels.
 */
export function CrudForm<S extends FormSchema>({
  schema,
  fields,
  initialValues,
  submitLabel = "Save",
  onSubmit,
  onSuccess,
  onCancel,
}: CrudFormProps<S>) {
  const formId = useId();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, initialValue(schema, field.name, initialValues)])),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = schema.safeParse(toInput(schema, values));
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors as FieldErrors);
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
    setFieldErrors(result.error.fieldErrors ?? {});
    setFormError(result.error.message);
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
    <form noValidate onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
      {formError && <ErrorMessage title="Could not save" message={formError} />}

      {fields.map((field) => {
        const id = `${formId}-${field.name}`;
        const errors = fieldErrors[field.name];
        const kind = fieldKind(schema, field.name);
        const common = {
          id,
          name: field.name,
          value: values[field.name],
          disabled: isSubmitting,
          "aria-invalid": errors ? true : undefined,
          "aria-describedby": errors ? `${id}-error` : undefined,
        };

        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={id}>{field.label}</Label>
            {kind.type === "select" ? (
              <NativeSelect {...common} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}>
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
                onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
              />
            )}
            {errors && (
              <p id={`${id}-error`} className="text-destructive text-sm">
                {errors[0]}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
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
  const field = unwrap(schema.shape[name] as z.ZodType);
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

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CopyIcon } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@devmentor/ui/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@devmentor/ui/components/ui/input-group";

type CopyFieldProps = {
  label: string;
  value: string;
  /** Hint under the field: what the value is for, how long it is valid. */
  description?: string;
  /** Verb + object on the button (*Copy link*). */
  copyLabel?: string;
  /** Moves focus to the value when it appears (a link shown once). */
  autoFocus?: boolean;
};

type CopyState = "idle" | "copied" | "failed";

const MESSAGES: Record<CopyState, string> = {
  idle: "",
  copied: "Copied to the clipboard.",
  failed: "Could not copy. The text is selected – press Ctrl+C (⌘C on a Mac) to copy it.",
};

/**
 * A read-only value with a copy button: invitation and share links (C9). The result is confirmed in
 * words in a polite live region, never in a toast (S10); when the clipboard is unavailable the text is
 * selected so it can be copied by hand.
 */
export function CopyField({ label, value, description, copyLabel = "Copy link", autoFocus = false }: CopyFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (autoFocus) (inputRef.current as HTMLInputElement).focus();
  }, [autoFocus]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      (inputRef.current as HTMLInputElement).select();
      setState("failed");
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          id={id}
          readOnly
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          aria-describedby={description ? `${id}-description` : undefined}
          className="type-code"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="sm" variant="ghost" onClick={() => void copy()}>
            <CopyIcon aria-hidden="true" data-icon="inline-start" />
            {copyLabel}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <p role="status" className={state === "failed" ? "type-body text-foreground" : "type-body text-muted-foreground"}>
        {MESSAGES[state]}
      </p>
    </Field>
  );
}

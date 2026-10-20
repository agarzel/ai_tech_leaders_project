"use client";

import { useId, useState } from "react";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@devmentor/ui/components/ui/field";
import { Input } from "@devmentor/ui/components/ui/input";
import { formatDateTime, formatZoneLabel } from "@devmentor/ui/lib/format";
import { localToUtc } from "@devmentor/ui/lib/time";

type SlotTimeFieldProps = {
  /** The viewer's IANA zone, e.g. "Europe/Warsaw" (`browserTimeZone()` in the app). */
  timeZone: string;
  /** The slot as ISO UTC once date and time form a real moment in `timeZone`, otherwise `null`. */
  onChange: (startsAt: string | null) => void;
  /** A message from the form or the server (for example the 24-hour rule); a DST error of the field itself comes first. */
  error?: string;
  disabled?: boolean;
  /** Base for the element ids; the date input is `{id}-date` so a form can move focus to it. */
  id?: string;
};

const LOCAL_ERRORS = {
  nonexistent: "This time does not exist in your time zone. The clocks skip it on that day – choose another time.",
  invalid: "Enter a real date and time.",
};

/**
 * Date and time of a new slot (spec E01, `/mentor/slots`; Edge Cases "Time zones and DST"): the mentor's
 * local reading is converted to UTC in the browser. A time the clocks skip is refused; a time that happens
 * twice is previewed with its UTC offset so the mentor sees which one is saved (C54). The field keeps its
 * own draft – remount it with a `key` to clear it. The 24 h, 60 days, 15-minute and spacing rules stay on
 * the server (C55).
 */
export function SlotTimeField({ timeZone, onChange, error, disabled, id }: SlotTimeFieldProps) {
  const generated = useId();
  const base = id ?? generated;
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const converted = date && time ? localToUtc(date, time, timeZone) : null;
  const localError = converted && !converted.ok ? LOCAL_ERRORS[converted.reason] : undefined;
  const message = localError ?? error;
  const preview = converted?.ok ? converted : null;

  function update(nextDate: string, nextTime: string) {
    setDate(nextDate);
    setTime(nextTime);
    const result = nextDate && nextTime ? localToUtc(nextDate, nextTime, timeZone) : null;
    onChange(result?.ok ? result.iso : null);
  }

  const described = [`${base}-zone`, preview && `${base}-preview`, message && `${base}-error`].filter(Boolean).join(" ");

  return (
    <FieldSet data-invalid={message ? true : undefined}>
      <FieldLegend>Date and time of the slot</FieldLegend>
      <div className="flex flex-wrap items-start gap-between-groups">
        <Field className="w-auto" data-invalid={message ? true : undefined}>
          <FieldLabel htmlFor={`${base}-date`}>Date</FieldLabel>
          <Input
            id={`${base}-date`}
            type="date"
            value={date}
            disabled={disabled}
            aria-invalid={message ? true : undefined}
            aria-describedby={described}
            onChange={(event) => update(event.target.value, time)}
          />
        </Field>
        <Field className="w-auto" data-invalid={message ? true : undefined}>
          <FieldLabel htmlFor={`${base}-time`}>Time</FieldLabel>
          <Input
            id={`${base}-time`}
            type="time"
            step={900}
            value={time}
            disabled={disabled}
            aria-invalid={message ? true : undefined}
            aria-describedby={described}
            onChange={(event) => update(date, event.target.value)}
          />
        </Field>
      </div>
      <FieldDescription id={`${base}-zone`}>
        Your time zone: {timeZone}. Mentees see the slot in their own zone.
      </FieldDescription>
      {preview && (
        <p id={`${base}-preview`} aria-live="polite" className="type-body">
          Starts {formatDateTime(preview.iso, timeZone)} ({formatZoneLabel(timeZone, new Date(preview.iso))})
          {preview.ambiguous && (
            <span className="text-muted-foreground">
              {" "}
              – this time happens twice when the clocks change; the first one is used.
            </span>
          )}
        </p>
      )}
      {message && <FieldError id={`${base}-error`}>{message}</FieldError>}
    </FieldSet>
  );
}

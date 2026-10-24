"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import type { ApiError, ApiResult, FieldErrors } from "@devmentor/ui/backend/api/types";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { Button } from "@devmentor/ui/components/ui/button";
import { Checkbox } from "@devmentor/ui/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@devmentor/ui/components/ui/field";
import { Input } from "@devmentor/ui/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@devmentor/ui/components/ui/input-group";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import { Textarea } from "@devmentor/ui/components/ui/textarea";
import { formatPrice, formatPriceInput, parsePrice } from "@devmentor/ui/lib/format";
import type { MentorProfileInput } from "./types";

export type { MentorProfile, MentorProfileInput } from "./types";

// Limits from spec E01 (Data Model `MentorProfile`, API Contracts). Prices: 1,000–1,000,000 grosze are
// sanity bounds, not a business rule; the server checks all of them again.
const HEADLINE_MAX = 120;
const BIO_MAX = 2000;
const LINKS_MAX = 5;
const PRICE_MIN = 1_000;
const PRICE_MAX = 1_000_000;

type MentorProfileFormProps = {
  initialValues: MentorProfileInput;
  /** MENTOR_TAGS from the API (ui does not import db constants). */
  tagOptions: string[];
  currency: string;
  /** `apiCall("/api/mentor/profile", { method: "PUT", body: values })`. */
  onSubmit: (values: MentorProfileInput) => Promise<ApiResult<unknown>>;
  /** After the server confirmed the save. */
  onSaved?: () => void;
  /** Hide "Show me on the public list" until the page can honour it; the stored value is sent unchanged. Default: shown. */
  showVisibility?: boolean;
};

type Draft = Omit<MentorProfileInput, "price25" | "price50"> & { price25: string; price50: string };
type Errors = Record<string, string>;

/**
 * Profile, prices and list visibility in one form (spec E01, `/mentor/profile`). A bespoke form on the
 * `Field` parts because `CrudForm` cannot infer tags, a list of links, a price with its currency or a
 * switch (C7). Behaviour follows the Form pattern: changed fields checked on blur, focus on the first
 * error, values kept, one submit at a time, "saved" only after the server confirms, and focus moves to the
 * "Profile saved." status so keyboard and screen-reader users know it worked.
 */
export function MentorProfileForm({ initialValues, tagOptions, currency, onSubmit, onSaved, showVisibility = true }: MentorProfileFormProps) {
  const id = useId();
  const [initial] = useState<Draft>(() => ({
    ...initialValues,
    links: initialValues.links.length > 0 ? initialValues.links : [""],
    price25: formatPriceInput(initialValues.price25),
    price50: formatPriceInput(initialValues.price50),
  }));
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    if (pendingFocus.current === null) return;
    (document.getElementById(pendingFocus.current) as HTMLElement).focus();
    pendingFocus.current = null;
  });

  const fid = (key: string) => `${id}-${key}`;
  const priceRange = `${formatPrice(PRICE_MIN, currency)} to ${formatPrice(PRICE_MAX, currency)}`;

  function validate(values: Draft): Errors {
    const found: Errors = {};
    if (!values.name.trim()) found.name = "Enter your name.";
    if (!values.headline.trim()) found.headline = "Add one line about what you can help with.";
    else if (values.headline.trim().length > HEADLINE_MAX) found.headline = `Keep the headline to ${HEADLINE_MAX} characters.`;
    if (values.bio.length > BIO_MAX) found.bio = `Keep the bio to ${BIO_MAX.toLocaleString("en-US")} characters.`;
    values.links.forEach((link, index) => {
      if (link.trim() && !isHttpsUrl(link.trim())) found[`links.${index}`] = "Use a full https:// address, like https://github.com/marek.";
    });
    for (const key of ["price25", "price50"] as const) {
      const minor = parsePrice(values[key]);
      if (minor !== null && !(minor >= PRICE_MIN && minor <= PRICE_MAX)) found[key] = `Enter an amount from ${priceRange}, like 180 or 180.50.`;
    }
    return found;
  }

  /** Keys in the order the fields appear, so focus goes to the first error on the page. */
  function order(): string[] {
    return ["name", "headline", "bio", "tags", ...draft.links.map((_, index) => `links.${index}`), "links", "price25", "price50", "listed"];
  }

  function focusTarget(key: string): string {
    if (key === "tags") return fid("tag-0");
    if (key === "links") return fid("links.0");
    return fid(key);
  }

  function update(next: Draft, key: string) {
    setDraft(next);
    setSaved(false);
    if (errors[key]) recheck(next, key);
  }

  function recheck(values: Draft, key: string) {
    const message = validate(values)[key];
    setErrors((previous) => {
      const next = { ...previous };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  }

  function blur(key: string) {
    const changed = key.startsWith("links.")
      ? draft.links[Number(key.slice(6))] !== (initial.links[Number(key.slice(6))] ?? "")
      : draft[key as "name"] !== initial[key as "name"];
    if (changed) recheck(draft, key);
  }

  function focusFirst(found: Errors) {
    const first = order().find((key) => found[key]);
    pendingFocus.current = first ? focusTarget(first) : `${id}-form-error`;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const found = validate(draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFormError(null);
      focusFirst(found);
      return;
    }
    setIsSaving(true);
    setFormError(null);
    const result = await onSubmit({
      name: draft.name.trim(),
      headline: draft.headline.trim(),
      bio: draft.bio,
      tags: draft.tags,
      links: draft.links.map((link) => link.trim()).filter(Boolean),
      price25: parsePrice(draft.price25),
      price50: parsePrice(draft.price50),
      listed: draft.listed,
    });
    setIsSaving(false);
    if (result.ok) {
      setErrors({});
      setSaved(true);
      pendingFocus.current = `${id}-saved`;
      onSaved?.();
      return;
    }
    const serverErrors = firstMessages(result.error.fieldErrors ?? {});
    setErrors(serverErrors);
    setFormError(result.error);
    focusFirst(serverErrors);
  }

  const describe = (key: string, hint = false) =>
    [hint && fid(`${key}-hint`), errors[key] && fid(`${key}-error`)].filter(Boolean).join(" ") || undefined;
  const invalid = (key: string) => (errors[key] ? true : undefined);

  return (
    <form noValidate onSubmit={submit} className="flex max-w-xl flex-col gap-section">
      {formError && (
        <div id={`${id}-form-error`} tabIndex={-1} className="outline-none">
          <ErrorMessage title="Could not save the profile" error={formError} />
        </div>
      )}

      <FieldSet>
        <FieldLegend className="type-section-title">Profile</FieldLegend>
        <FieldGroup>
          <Field data-invalid={invalid("name")}>
            <FieldLabel htmlFor={fid("name")}>Name</FieldLabel>
            <Input
              id={fid("name")}
              value={draft.name}
              autoComplete="name"
              disabled={isSaving}
              aria-invalid={invalid("name")}
              aria-describedby={describe("name", true)}
              onChange={(event) => update({ ...draft, name: event.target.value }, "name")}
              onBlur={() => blur("name")}
            />
            <FieldDescription id={fid("name-hint")}>Shown on your profile, your share link and to mentees on bookings.</FieldDescription>
            {errors.name && <FieldError id={fid("name-error")}>{errors.name}</FieldError>}
          </Field>

          <Field data-invalid={invalid("headline")}>
            <FieldLabel htmlFor={fid("headline")}>Headline</FieldLabel>
            <Input
              id={fid("headline")}
              value={draft.headline}
              placeholder="Platform engineer – Kubernetes, Helm, CI"
              disabled={isSaving}
              aria-invalid={invalid("headline")}
              aria-describedby={describe("headline", true)}
              onChange={(event) => update({ ...draft, headline: event.target.value }, "headline")}
              onBlur={() => blur("headline")}
            />
            <FieldDescription id={fid("headline-hint")}>One line about what you can help with, up to {HEADLINE_MAX} characters.</FieldDescription>
            {errors.headline && <FieldError id={fid("headline-error")}>{errors.headline}</FieldError>}
          </Field>

          <Field data-invalid={invalid("bio")}>
            <FieldLabel htmlFor={fid("bio")} optional>
              Bio
            </FieldLabel>
            <Textarea
              id={fid("bio")}
              value={draft.bio}
              rows={6}
              disabled={isSaving}
              aria-invalid={invalid("bio")}
              aria-describedby={describe("bio", true)}
              onChange={(event) => update({ ...draft, bio: event.target.value }, "bio")}
              onBlur={() => blur("bio")}
            />
            <FieldDescription id={fid("bio-hint")}>
              Plain text, up to {BIO_MAX.toLocaleString("en-US")} characters ({draft.bio.length.toLocaleString("en-US")} used).
            </FieldDescription>
            {errors.bio && <FieldError id={fid("bio-error")}>{errors.bio}</FieldError>}
          </Field>

          <FieldSet data-invalid={invalid("tags")} aria-describedby={describe("tags")}>
            <FieldLegend>
              Stack <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLegend>
            {tagOptions.map((tag, index) => (
              <Field key={tag} orientation="horizontal">
                <Checkbox
                  id={fid(`tag-${index}`)}
                  checked={draft.tags.includes(tag)}
                  disabled={isSaving}
                  onCheckedChange={(checked) =>
                    update({ ...draft, tags: checked ? [...draft.tags, tag] : draft.tags.filter((item) => item !== tag) }, "tags")
                  }
                />
                <FieldLabel htmlFor={fid(`tag-${index}`)}>{tag}</FieldLabel>
              </Field>
            ))}
            {errors.tags && <FieldError id={fid("tags-error")}>{errors.tags}</FieldError>}
          </FieldSet>

          <FieldSet aria-describedby={[fid("links-hint"), errors.links && fid("links-error")].filter(Boolean).join(" ")}>
            <FieldLegend>
              Public work <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLegend>
            <FieldDescription id={fid("links-hint")}>
              Up to {LINKS_MAX} links mentees can check – GitHub, talks, posts. Shown instead of ratings.
            </FieldDescription>
            {draft.links.map((link, index) => {
              const key = `links.${index}`;
              return (
                <Field key={index} data-invalid={invalid(key)}>
                  <div className="flex items-center gap-in-group">
                    <Input
                      id={fid(key)}
                      type="url"
                      inputMode="url"
                      value={link}
                      placeholder="https://github.com/marek"
                      aria-label={`Link ${index + 1}`}
                      disabled={isSaving}
                      aria-invalid={invalid(key)}
                      aria-describedby={errors[key] ? fid(`${key}-error`) : undefined}
                      onChange={(event) =>
                        update({ ...draft, links: draft.links.map((item, i) => (i === index ? event.target.value : item)) }, key)
                      }
                      onBlur={() => blur(key)}
                    />
                    {draft.links.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove link ${index + 1}`}
                        disabled={isSaving}
                        onClick={() => {
                          // Positions shift, so link errors are dropped; they come back on blur or submit.
                          setDraft({ ...draft, links: draft.links.filter((_, i) => i !== index) });
                          setSaved(false);
                          setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([name]) => !name.startsWith("links."))));
                        }}
                      >
                        <XIcon aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                  {errors[key] && <FieldError id={fid(`${key}-error`)}>{errors[key]}</FieldError>}
                </Field>
              );
            })}
            {errors.links && <FieldError id={fid("links-error")}>{errors.links}</FieldError>}
            {draft.links.length < LINKS_MAX ? (
              <Button
                type="button"
                variant="outline"
                className="self-start"
                disabled={isSaving}
                onClick={() => {
                  pendingFocus.current = fid(`links.${draft.links.length}`);
                  update({ ...draft, links: [...draft.links, ""] }, "links");
                }}
              >
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                Add link
              </Button>
            ) : (
              <p className="type-body text-muted-foreground">You have added {LINKS_MAX} links, the most a profile shows.</p>
            )}
          </FieldSet>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="type-section-title">Prices</FieldLegend>
        <FieldDescription>Mentees pay when they book. A change applies only to new bookings.</FieldDescription>
        <FieldGroup>
          {(["price25", "price50"] as const).map((key) => (
            <Field key={key} data-invalid={invalid(key)}>
              <FieldLabel htmlFor={fid(key)}>{key === "price25" ? "25-minute session" : "50-minute session"}</FieldLabel>
              <InputGroup className="max-w-48">
                <InputGroupInput
                  id={fid(key)}
                  inputMode="decimal"
                  value={draft[key]}
                  placeholder="180.00"
                  className="tabular-nums"
                  disabled={isSaving}
                  aria-invalid={invalid(key)}
                  aria-describedby={describe(key, true)}
                  onChange={(event) => update({ ...draft, [key]: event.target.value }, key)}
                  onBlur={() => blur(key)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{currency}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription id={fid(`${key}-hint`)}>From {priceRange}. Leave empty until you decide.</FieldDescription>
              {errors[key] && <FieldError id={fid(`${key}-error`)}>{errors[key]}</FieldError>}
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>

      {showVisibility && (
        <FieldSet>
          <FieldLegend className="type-section-title">Visibility</FieldLegend>
          <Field orientation="horizontal" data-invalid={invalid("listed")}>
            <Checkbox
              id={fid("listed")}
              checked={draft.listed}
              disabled={isSaving}
              aria-describedby={describe("listed", true)}
              onCheckedChange={(checked) => update({ ...draft, listed: checked }, "listed")}
            />
            <FieldContent>
              <FieldLabel htmlFor={fid("listed")}>Show me on the public list</FieldLabel>
              <FieldDescription id={fid("listed-hint")}>
                You appear there once you have prices and a time mentees can book. Your share link works either way.
              </FieldDescription>
              {errors.listed && <FieldError id={fid("listed-error")}>{errors.listed}</FieldError>}
            </FieldContent>
          </Field>
        </FieldSet>
      )}

      <div className="flex flex-wrap items-center gap-between-groups">
        <Button type="submit" disabled={isSaving} aria-busy={isSaving || undefined}>
          {isSaving && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
          {isSaving ? "Saving…" : "Save profile"}
        </Button>
        <p id={`${id}-saved`} role="status" tabIndex={-1} className="type-body text-muted-foreground outline-none">
          {saved ? "Profile saved." : ""}
        </p>
      </div>
    </form>
  );
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function firstMessages(fieldErrors: FieldErrors): Errors {
  return Object.fromEntries(Object.entries(fieldErrors).map(([key, messages]) => [key, messages[0]]));
}

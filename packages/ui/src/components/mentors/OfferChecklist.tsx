import { CircleCheckIcon, CircleDashedIcon, CircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CopyField } from "@devmentor/ui/backend/forms/CopyField";
import { renderAnchor, type RenderLink } from "@devmentor/ui/backend/layout/links";
import { buttonVariants } from "@devmentor/ui/components/ui/button";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@devmentor/ui/components/ui/item";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";

type OfferChecklistProps = {
  /** Name and a headline (1–120 characters) set – what a profile save requires (spec E01, Q8). */
  profileComplete: boolean;
  /** Both prices set. */
  pricesSet: boolean;
  /** Open slots with `bookable: true` in `SlotDto` (computed by the server, D13 – spec E01, Q9). */
  bookableSlots: number;
  /** Open slots that start too soon to be booked (inside 24 h). */
  slotsTooSoon: number;
  /** The share link (`/m/[slug]`), built by the app from `shareSlug`. */
  shareUrl: string;
  /** "Show me on the public list" (R08). */
  listed: boolean;
  hrefs: { profile: string; slots: string };
  renderLink?: RenderLink;
};

type Status = "done" | "todo" | "optional";

const STATUS: Record<Status, { word: string; icon: ReactNode }> = {
  done: { word: "Done", icon: <CircleCheckIcon aria-hidden="true" /> },
  todo: { word: "To do", icon: <CircleIcon aria-hidden="true" /> },
  optional: { word: "Optional", icon: <CircleDashedIcon aria-hidden="true" /> },
};

type Step = { key: string; title: string; status: Status; text: string; action?: { label: string; href: string }; extra?: ReactNode };

/**
 * What stands between a mentor and being bookable, one step per row (spec E01, UI/UX `/mentor`): each
 * with its state in words and the next action, so a mentor never wonders why nobody can book them.
 * The first unfinished step's action is the screen's one accent (R01.5, P5/K3, C45). No progress bar or
 * percentage (A02).
 */
export function OfferChecklist({
  profileComplete,
  pricesSet,
  bookableSlots,
  slotsTooSoon,
  shareUrl,
  listed,
  hrefs,
  renderLink = renderAnchor,
}: OfferChecklistProps) {
  const bookable = profileComplete && pricesSet && bookableSlots > 0;
  const steps: Step[] = [
    {
      key: "profile",
      title: "Profile",
      status: profileComplete ? "done" : "todo",
      text: profileComplete
        ? "Your name and headline are set."
        : "Add a headline so mentees know what you can help with.",
      action: { label: profileComplete ? "Edit profile" : "Complete profile", href: hrefs.profile },
    },
    {
      key: "prices",
      title: "Prices",
      status: pricesSet ? "done" : "todo",
      text: pricesSet ? "Both session prices are set." : "Set your prices for 25- and 50-minute sessions.",
      action: { label: pricesSet ? "Change prices" : "Set prices", href: hrefs.profile },
    },
    {
      key: "slots",
      title: "A time mentees can book",
      status: bookableSlots > 0 ? "done" : "todo",
      text:
        bookableSlots > 0
          ? `${bookableSlots === 1 ? "1 time is" : `${bookableSlots} times are`} open for booking.`
          : slotsTooSoon > 0
            ? "Your times start within 24 hours, so nobody can book them. Add a time at least 24 hours from now."
            : "Add at least one time, starting 24 hours from now or later.",
      action: { label: bookableSlots > 0 ? "Manage times" : "Add a time", href: hrefs.slots },
    },
    {
      key: "share",
      title: "Share link",
      status: profileComplete ? "done" : "todo",
      text: !profileComplete
        ? "Your link appears here once you save your profile."
        : bookable
          ? "Anyone with this link can see your profile and book your open times."
          : "Works now; it shows “No times available” until you are bookable.",
      extra: profileComplete ? <CopyField label="Your share link" value={shareUrl} /> : undefined,
    },
    {
      key: "list",
      title: "Public list",
      status: listed ? (bookable ? "done" : "todo") : "optional",
      text: listed
        ? bookable
          ? "You are on the public list of mentors."
          : "You opted in. You appear on the list once you have prices and a time mentees can book."
        : "You are not on the public list – only people with your link can book you.",
      action: { label: listed ? "Change" : "Show me on the list", href: hrefs.profile },
    },
  ];
  const next = steps.find((step) => step.status === "todo");

  return (
    <ItemGroup aria-label="Steps to being bookable">
      {steps.map((step) => (
        <Item key={step.key} className="flex-wrap items-start">
          <ItemMedia className="text-muted-foreground [&_svg]:size-4">{STATUS[step.status].icon}</ItemMedia>
          <ItemContent className="min-w-0 basis-56">
            <ItemTitle>
              {step.title}
              <span className="type-meta font-normal text-muted-foreground">{STATUS[step.status].word}</span>
            </ItemTitle>
            <p className="max-w-prose type-body text-muted-foreground">{step.text}</p>
            {step.extra && <div className="pt-in-group">{step.extra}</div>}
          </ItemContent>
          {step.action && (
            <ItemActions>
              {renderLink({
                href: step.action.href,
                className: buttonVariants({ variant: step === next ? "default" : "outline" }),
                "aria-label": `${step.action.label}: ${step.title}`,
                children: step.action.label,
              })}
            </ItemActions>
          )}
        </Item>
      ))}
    </ItemGroup>
  );
}

/** Placeholder while the profile and slots load (C3). */
export function OfferChecklistSkeleton() {
  return (
    <div className="flex flex-col gap-in-group" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <Skeleton key={row} className="h-12 w-full" />
      ))}
    </div>
  );
}

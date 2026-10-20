// Story data taken from the specs (prompt rule 7: invented but realistic, no ratings, no hype numbers).
// ui must not import core, so the schemas below mirror the spec's validators for documentation only;
// the app passes the real schemas from @devmentor/core.
import { z } from "zod";

import type { CrudFormField } from "../../src/backend/forms/CrudForm";
import type { Booking } from "../../src/components/bookings/types";

/** Mentee registration – spec E01, `POST /api/auth/register` `{ name, email, password }`, password 12–128 characters. */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.email("Enter an email address, like ola@example.com."),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(128, "Use at most 128 characters.")
    .meta({ input: "password" }),
});

export const registerFields: CrudFormField<typeof registerSchema>[] = [
  { name: "name", label: "Name", autoComplete: "name", description: "Mentors see this name on your bookings." },
  { name: "email", label: "Email", autoComplete: "email" },
  { name: "password", label: "Password", autoComplete: "new-password", description: "12 to 128 characters." },
];

/** A mentee who fills in the form in the stories. */
export const mentee = { name: "Ola Wiśniewska", email: "ola.wisniewska@example.com", password: "ingress-1-28-upgrade" };

/** `SessionUserDto` returned by registration (spec E01: name and role; no password, no token). */
export const sessionUser = { id: "6f1c2a9e-3b5d-4a7e-9c11-2d8e4f0a6b31", name: mentee.name, role: "mentee" };

/** Admin invitation of a mentor – spec E01, `POST /api/admin/invitations` `{ email }`. */
export const invitationSchema = z.object({
  email: z.email("Enter the mentor's email address, like marek@example.com."),
});

/** Admin user list rows (`UserDto` shape of `/api/users`: name, email, role, created). */
export type UserRow = { id: string; name: string; email: string; role: "mentor" | "mentee" | "admin"; createdAt: string };

export const users: UserRow[] = [
  { id: "u1", name: "Marek Zieliński", email: "marek.zielinski@example.com", role: "mentor", createdAt: "2026-10-12T09:14:00Z" },
  { id: "u2", name: "Ola Wiśniewska", email: "ola.wisniewska@example.com", role: "mentee", createdAt: "2026-10-14T18:02:00Z" },
  { id: "u3", name: "Kasia Lewandowska", email: "kasia.lewandowska@example.com", role: "mentor", createdAt: "2026-10-15T07:45:00Z" },
  { id: "u4", name: "Tomasz Kowalczyk", email: "tomasz.kowalczyk@example.com", role: "mentee", createdAt: "2026-10-16T21:30:00Z" },
  { id: "u5", name: "Oliwia Nowak", email: "oliwia.nowak@example.com", role: "admin", createdAt: "2026-10-01T08:00:00Z" },
];

/** A row with long values, for the long-content stories. */
export const userWithLongValues: UserRow = {
  id: "u6",
  name: "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska",
  email: "aleksandra.konstantynopolitanczykiewiczowna@platform-engineering.example.com",
  role: "mentor",
  createdAt: "2026-10-17T12:00:00Z",
};

/** Log-in – spec E01, `POST /api/auth/login` `{ email, password }`; wrong credentials → generic 401. */
export const loginSchema = z.object({
  email: z.email("Enter the email address you registered with."),
  password: z.string().min(1, "Enter your password.").meta({ input: "password" }),
});

export const loginFields: CrudFormField<typeof loginSchema>[] = [
  { name: "email", label: "Email", autoComplete: "email" },
  { name: "password", label: "Password", autoComplete: "current-password" },
];

/** Mentor registration from an invitation – spec E01, `POST /api/auth/register/mentor` `{ token, name, password }`; the email comes from the invitation. */
export const mentorRegisterSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(128, "Use at most 128 characters.")
    .meta({ input: "password" }),
});

export const mentorRegisterFields: CrudFormField<typeof mentorRegisterSchema>[] = [
  { name: "name", label: "Name", autoComplete: "name", description: "Shown on your public profile and your share link." },
  { name: "password", label: "Password", autoComplete: "new-password", description: "12 to 128 characters." },
];

/** An invited mentor. */
export const mentor = { name: "Marek Zieliński", email: "marek.zielinski@example.com", password: "helm-chart-rollback-2" };

/** Short navigation per role (R02.6/P12) – only pages that exist in the specs. */
export const nav = {
  visitor: [{ label: "Mentors", href: "/mentors" }],
  mentee: [
    { label: "Mentors", href: "/mentors" },
    { label: "My bookings", href: "/bookings" },
  ],
  mentor: [
    { label: "Overview", href: "/mentor" },
    { label: "Profile", href: "/mentor/profile" },
    { label: "Slots", href: "/mentor/slots" },
    { label: "Bookings", href: "/mentor/bookings" },
  ],
  admin: [
    { label: "Users", href: "/admin/users" },
    { label: "Invitations", href: "/admin/invitations" },
  ],
};

export const signedIn = {
  mentee: { id: "u2", name: "Ola Wiśniewska", role: "mentee" as const },
  mentor: { id: "u1", name: "Marek Zieliński", role: "mentor" as const },
  admin: { id: "u5", name: "Oliwia Nowak", role: "admin" as const },
};

/** The zone the stories display times in. */
export const timeZone = "Europe/Warsaw";

/** Admin invitation list (`GET /api/admin/invitations`): pending, used, expired; 14-day validity. */
export const invitations = [
  { id: "i1", email: "kasia.lewandowska@example.com", status: "pending" as const, createdAt: "2026-10-18T09:10:00Z", expiresAt: "2026-11-01T09:10:00Z" },
  { id: "i2", email: "marek.zielinski@example.com", status: "used" as const, createdAt: "2026-10-10T16:40:00Z", expiresAt: "2026-10-24T16:40:00Z" },
  { id: "i3", email: "piotr.wojcik@example.com", status: "expired" as const, createdAt: "2026-09-20T11:00:00Z", expiresAt: "2026-10-04T11:00:00Z" },
];

/** The POST response: the new row plus the link with the raw token, returned only this once. */
export const newInvitation = {
  invitation: { id: "i4", email: "tomasz.kowalczyk@example.com", status: "pending" as const, createdAt: "2026-10-19T08:00:00Z", expiresAt: "2026-11-02T08:00:00Z" },
  link: "https://devmentor.example/register/mentor?token=q7Vt2mKx9LwR4sNp8ZcB1yHd6Jf3Ua0E",
};

/** MENTOR_TAGS from spec E01 – the UI receives them from the API. */
export const tagOptions = ["TypeScript", "React", "Python", "AI agents"];

/** `GET /api/mentor/profile` for an invited mentor who filled everything in. */
export const mentorProfile = {
  name: "Marek Zieliński",
  headline: "Platform engineer – Kubernetes, Helm, CI pipelines",
  bio:
    "I run the platform team at a payments company: clusters, deploy pipelines and the incidents that come with them.\nBring the error message and what you already tried – we will get your rollout unstuck.",
  tags: ["Python", "AI agents"],
  links: ["https://github.com/marek-zielinski", "https://kubecon.example/talks/helm-rollbacks-without-tears"],
  price25: 18000,
  price50: 32000,
  currency: "PLN",
  shareSlug: "marek-zielinski-k3x9q2",
  listed: true,
};

/** The profile created lazily on the first visit to `/mentor` (spec E01): name only. */
export const newMentorProfile = {
  ...mentorProfile,
  headline: null,
  bio: null,
  tags: [],
  links: [],
  price25: null,
  price50: null,
  listed: false,
};

export const shareUrl = `https://devmentor.example/m/${mentorProfile.shareSlug}`;

/** Five public-work links – the most a profile keeps (spec E01). */
export const fiveLinks = [
  "https://github.com/marek-zielinski",
  "https://github.com/marek-zielinski/helm-charts",
  "https://kubecon.example/talks/helm-rollbacks-without-tears",
  "https://blog.example/marek/ingress-nginx-1-28-upgrade-notes",
  "https://gitlab.example/platform/ci-templates",
];

/** `SlotDto` list for `/api/mentor/slots` (spec E01): open/booked, bookable = starts ≥ 24 h from now (D13). */
export const slots = {
  none: [],
  tooSoon: [{ id: "s1", startsAt: "2026-10-20T16:00:00Z", status: "open", bookable: false }],
  bookable: [
    { id: "s2", startsAt: "2026-10-22T16:00:00Z", status: "open", bookable: true },
    { id: "s3", startsAt: "2026-10-24T08:00:00Z", status: "open", bookable: true },
  ],
};

/** A long bio with paragraphs, for long-content stories. */
export const longBio = [
  "I run the platform team at a payments company in Warsaw: twelve Kubernetes clusters, the deploy pipelines on top of them and the incidents that come with both.",
  "Most of my week is spent on upgrades nobody wants to do – ingress-nginx, cert-manager, Helm charts that were copied from a blog post four years ago – and on making rollbacks boring.",
  "Good sessions with me start with the exact error message, the command you ran and what you already tried. If it is a pipeline problem, paste the failing job definition; if it is a cluster problem, tell me the Kubernetes version and how it is hosted.",
  "I will not write your service for you, but I will sit with you until you understand why it fails and what to change. Text works best for me: I can read your YAML carefully instead of squinting at a shared screen.",
].join("\n\n");

/** `SlotDto` list as the owner sees it (`GET /api/mentor/slots`): too soon, bookable (two on one day), booked. Fixed dates around 2026-10-20. */
export const ownerSlots = [
  { id: "o1", startsAt: "2026-10-20T16:00:00Z", status: "open" as const, bookable: false },
  { id: "o2", startsAt: "2026-10-22T16:00:00Z", status: "open" as const, bookable: true },
  { id: "o3", startsAt: "2026-10-22T17:30:00Z", status: "open" as const, bookable: true },
  { id: "o4", startsAt: "2026-10-24T08:00:00Z", status: "booked" as const, bookable: false },
  { id: "o5", startsAt: "2026-10-27T15:00:00Z", status: "open" as const, bookable: true },
];

/** Sixty slots over twenty days, three a day – the longest list a mentor realistically keeps. */
export const manySlots = Array.from({ length: 60 }, (_, index) => {
  const day = 22 + Math.floor(index / 3);
  const hour = [8, 12, 16][index % 3];
  const date = new Date(Date.UTC(2026, 9, day, hour, 0));
  return { id: `m${index}`, startsAt: date.toISOString(), status: "open" as const, bookable: true };
});

/** Public mentors for `GET /api/mentors` (`PublicMentorDto`: no email, no ratings – N02). */
export const publicMentors = [
  {
    slug: "marek-zielinski-k3x9q2",
    name: "Marek Zieliński",
    headline: "Platform engineer – Kubernetes, Helm, CI pipelines",
    bio: null,
    tags: ["Python", "AI agents"],
    links: ["https://github.com/marek-zielinski", "https://kubecon.example/talks/helm-rollbacks-without-tears"],
    price25: 18000,
    price50: 32000,
    currency: "PLN",
    soonestSlotAt: "2026-10-22T16:00:00Z",
  },
  {
    slug: "kasia-lewandowska-7fh2m4",
    name: "Kasia Lewandowska",
    headline: "Frontend lead – React performance and accessibility",
    bio: null,
    tags: ["TypeScript", "React"],
    links: ["https://github.com/kasia-lewandowska"],
    price25: 15000,
    price50: 26000,
    currency: "PLN",
    soonestSlotAt: "2026-10-21T18:00:00Z",
  },
  {
    slug: "piotr-wojcik-9d4n6b",
    name: "Piotr Wójcik",
    headline: "Backend engineer – Postgres, queues and the incidents between them",
    bio: null,
    tags: ["TypeScript", "Python"],
    links: ["https://blog.example/piotr", "https://github.com/piotr-wojcik"],
    price25: 20000,
    price50: 36000,
    currency: "PLN",
    soonestSlotAt: "2026-10-23T09:30:00Z",
  },
  {
    slug: "nina-kaminska-2c8v1x",
    name: "Nina Kamińska",
    headline: "Building agents with tool calling and evals",
    bio: null,
    tags: ["AI agents", "Python", "TypeScript"],
    links: ["https://github.com/nina-kaminska"],
    price25: 22000,
    price50: 40000,
    currency: "PLN",
    soonestSlotAt: "2026-10-25T07:00:00Z",
  },
];

/** A mentor with the longest values the spec allows: 120-character headline, five links, all four tags. */
export const publicMentorLong = {
  slug: "aleksandra-konstantynopolitanczykiewiczowna-5h3k8p",
  name: "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska",
  headline: "Staff engineer – distributed tracing, Kubernetes operators, Postgres replication and the long tail of on-call lore",
  bio: null,
  tags: ["TypeScript", "React", "Python", "AI agents"],
  links: fiveLinks,
  price25: 120000,
  price50: 1000000,
  currency: "PLN",
  soonestSlotAt: "2026-10-26T15:45:00Z",
};

/** A listed mentor whose optional fields are empty: no headline, no tags, no links, no next time. */
export const publicMentorPartial = {
  slug: "tomasz-kowalczyk-6j1q9z",
  name: "Tomasz Kowalczyk",
  headline: null,
  bio: null,
  tags: [],
  links: [],
  price25: 15000,
  price50: null,
  currency: "PLN",
  soonestSlotAt: null,
};

/** Twenty-five mentors, for the paginated list. */
export const manyMentors = Array.from({ length: 25 }, (_, index) => ({
  ...publicMentors[index % publicMentors.length],
  slug: `mentor-${index}`,
  name: `${publicMentors[index % publicMentors.length].name} ${index + 1}`,
}));


/** What the booking page shows before paying (spec E02): slot 27 Oct 17:00 Warsaw, 25 minutes, the price stored by the server. */
export const bookingSummary = {
  mentorName: "Marek Zieliński",
  startsAt: "2026-10-27T16:00:00Z",
  lengthMinutes: 25 as const,
  priceAmount: 18000,
  currency: "PLN",
  timeZone,
};

/** `BookingDto` in every state of the state machine (spec E02); decide-by = start − 12 h (R05). */
const baseBooking: Booking = {
  id: "b1",
  mentor: { name: "Marek Zieliński", slug: mentorProfile.shareSlug },
  startsAt: "2026-10-27T16:00:00Z",
  lengthMinutes: 25,
  priceAmount: 18000,
  currency: "PLN",
  status: "awaiting_acceptance",
  paymentStatus: "paid",
  acceptBy: "2026-10-27T04:00:00Z",
  declineReason: null,
  question:
    "After upgrading ingress-nginx to 1.28 our canary rollout hangs at 20%.\nThe controller logs show no errors, only the admission webhook timing out.\nWhat should I check first?",
};

export const bookings = {
  waiting: baseBooking,
  pending: { ...baseBooking, status: "pending_payment", paymentStatus: "open", acceptBy: null } satisfies Booking,
  confirmed: { ...baseBooking, status: "confirmed" } satisfies Booking,
  declined: { ...baseBooking, status: "declined", paymentStatus: "refund_requested", declineReason: "I am on leave that week – please pick a later time." } satisfies Booking,
  declinedNoReason: { ...baseBooking, status: "declined", paymentStatus: "refund_requested" } satisfies Booking,
  expired: { ...baseBooking, status: "expired", paymentStatus: "refund_requested" } satisfies Booking,
  refunded: { ...baseBooking, status: "declined", paymentStatus: "refunded", declineReason: "I am on leave that week – please pick a later time." } satisfies Booking,
  refundDelayed: { ...baseBooking, status: "expired", paymentStatus: "refund_failed" } satisfies Booking,
  paymentNotCompleted: { ...baseBooking, status: "payment_expired", paymentStatus: "expired", acceptBy: null } satisfies Booking,
  latePayment: { ...baseBooking, status: "payment_expired", paymentStatus: "refund_requested", acceptBy: null } satisfies Booking,
};

/** A question at the limit: long paragraphs, a stack trace pasted as text, a very long URL. */
export const longQuestion = [
  "After upgrading ingress-nginx from 1.26 to 1.28 our canary rollout hangs at 20% and never finishes. I have checked the obvious things and I would like a second pair of eyes before I roll back.",
  "Controller logs:\nW1019 07:41:12.113 admission webhook \"validate.nginx.ingress.kubernetes.io\" timeout after 10s\nE1019 07:41:12.114 failed calling webhook: Post \"https://ingress-nginx-controller-admission.ingress-nginx.svc:443/networking/v1/ingresses?timeout=10s\": context deadline exceeded",
  "The chart values I changed are in https://gitlab.example/platform/deploy/-/merge_requests/4812/diffs?commit_id=3b1f0c2d9e8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c&view=inline&w=1 and the rollout is controlled by Argo Rollouts 1.7 with a 5-step canary.",
].join("\n\n");

/** Default tails for the booking MSW routes. */
export const startedBooking = { bookingId: "b1", checkoutUrl: "https://checkout.example/pay/cs_test_a1b2c3" };

// Story data taken from the specs (prompt rule 7: invented but realistic, no ratings, no hype numbers).
// ui must not import core, so the schemas below mirror the spec's validators for documentation only;
// the app passes the real schemas from @devmentor/core.
import { z } from "zod";

import type { CrudFormField } from "../../src/backend/forms/CrudForm";

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

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

// Symulacja "serwera" prototypu Epiku 01: wszystko w pamięci, dane fikcyjne z lekcja-07/mapa-ekranow.md (sekcja 3).
// Nic nie jest wysyłane ani zapisywane poza pamięcią karty. Reset przywraca stan początkowy.
import { useSyncExternalStore } from "react";

import type { ApiResult } from "@devmentor/ui/backend/api/types";
import type { Slot } from "@devmentor/ui/components/availability/types";
import type { Invitation } from "@devmentor/ui/components/mentors/types";
import type { PublicMentor } from "@devmentor/ui/components/mentors/types";

export const TIME_ZONE = "Europe/Warsaw";
/** Stały "teraz" zegara demo: piątek 2026-10-23, 10:00 Europe/Warsaw (UTC+2). */
export const NOW = new Date("2026-10-23T08:00:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const TAG_OPTIONS = ["TypeScript", "React", "Python", "AI agents"];

export type Role = "mentee" | "mentor" | "admin";
export type Account = { id: string; name: string; email: string; password: string; role: Role };
export type Profile = {
  headline: string | null;
  bio: string | null;
  tags: string[];
  links: string[];
  price25: number | null;
  price50: number | null;
  listed: boolean;
  /** Profil zapisany przynajmniej raz (L08: link na /mentor/profile od zapisu). */
  saved: boolean;
  slug: string;
};
type StoredInvitation = Invitation & { token: string };
type Route = { slug?: string; token?: string };
type State = {
  accounts: Account[];
  profiles: Record<string, Profile>;
  slots: Record<string, Slot[]>;
  invitations: StoredInvitation[];
  sessionId: string | null;
  returnTo: string | null;
  notice: string | null;
  route: Route;
  seq: number;
};

const iso = (value: string) => new Date(value).toISOString();
const slot = (id: string, startsAt: string, status: Slot["status"] = "open"): Slot => ({
  id,
  startsAt: iso(startsAt),
  status,
  bookable: new Date(startsAt).getTime() - NOW.getTime() >= DAY,
});

/** Konta demo (mapa, sekcja 3). Hasła są fikcyjne i jawne (E11). */
export const DEMO_ACCOUNTS: Account[] = [
  { id: "u-ola", name: "Ola Wiśniewska", email: "ola.wisniewska@example.com", password: "ingress-1-28-upgrade", role: "mentee" },
  { id: "u-marek", name: "Marek Zieliński", email: "marek.zielinski@example.com", password: "helm-chart-rollback-2", role: "mentor" },
  { id: "u-oliwia", name: "Oliwia Nowak", email: "oliwia.nowak@example.com", password: "demo-admin-passphrase-1", role: "admin" },
];

/** Mentorzy publiczni bez logowania (mapa, sekcja 3); ceny w groszach. */
const OTHER_MENTORS: (PublicMentor & { slots: Slot[] })[] = [
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
    soonestSlotAt: iso("2026-10-27T18:00:00Z"),
    slots: [slot("k1", "2026-10-27T18:00:00Z"), slot("k2", "2026-11-03T18:00:00Z")],
  },
  {
    slug: "piotr-wojcik-9d4n6b",
    name: "Piotr Wójcik",
    headline: "Backend engineer – Postgres, queues and the incidents between them",
    bio: null,
    tags: ["TypeScript", "Python"],
    links: ["https://github.com/piotr-wojcik"],
    price25: 20000,
    price50: 36000,
    currency: "PLN",
    soonestSlotAt: iso("2026-10-29T17:30:00Z"),
    slots: [slot("p1", "2026-10-29T17:30:00Z"), slot("p2", "2026-11-05T17:30:00Z")],
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
    soonestSlotAt: iso("2026-10-30T16:30:00Z"),
    slots: [slot("n1", "2026-10-30T16:30:00Z"), slot("n2", "2026-11-06T16:30:00Z")],
  },
];

function initial(): State {
  return {
    accounts: DEMO_ACCOUNTS.map((a) => ({ ...a })),
    profiles: {
      "u-marek": {
        headline: "Platform engineer – Kubernetes, Helm, CI pipelines",
        bio: "I run the platform team at a payments company: clusters, deploy pipelines and the incidents that come with them.\nBring the error message and what you already tried – we will get your rollout unstuck.",
        tags: ["Python", "AI agents"],
        links: ["https://github.com/marek-zielinski", "https://kubecon.example/talks/helm-rollbacks-without-tears"],
        price25: 18000,
        price50: 32000,
        listed: true,
        saved: true,
        slug: "marek-zielinski-k3x9q2",
      },
    },
    slots: {
      "u-marek": [
        slot("m1", "2026-10-23T14:00:00Z"),
        slot("m2", "2026-10-24T07:30:00Z"),
        slot("m3", "2026-10-24T10:00:00Z"),
        slot("m4", "2026-10-26T17:00:00Z"),
        slot("m5", "2026-10-26T18:30:00Z"),
        slot("m6", "2026-10-28T17:00:00Z", "booked"),
        slot("m7", "2026-10-30T16:00:00Z"),
        slot("m8", "2026-11-02T17:00:00Z"),
      ],
    },
    invitations: [
      { id: "i-anna", email: "anna.maj@example.com", status: "pending", createdAt: iso("2026-10-23T07:00:00Z"), expiresAt: iso("2026-11-06T07:00:00Z"), token: "demo-anna" },
      { id: "i-marek", email: "marek.zielinski@example.com", status: "used", createdAt: iso("2026-10-10T08:00:00Z"), expiresAt: iso("2026-10-24T08:00:00Z"), token: "demo-marek" },
      { id: "i-jan", email: "jan.sowa@example.com", status: "expired", createdAt: iso("2026-09-20T08:00:00Z"), expiresAt: iso("2026-10-04T08:00:00Z"), token: "demo-jan" },
    ],
    sessionId: null,
    returnTo: null,
    notice: null,
    route: {},
    seq: 1,
  };
}

let state: State = initial();
const listeners = new Set<() => void>();
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}
export function useStore(): State {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
export const getState = () => state;
export function resetSimulation() {
  state = initial();
  listeners.forEach((listener) => listener());
}

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const ok = <T,>(data: T, status = 200): ApiResult<T> => ({ ok: true, data, status });
const fail = (status: number, code: string, message: string, fieldErrors?: Record<string, string[]>): ApiResult<never> => ({
  ok: false,
  status,
  error: { code, message, fieldErrors },
});

export const sessionAccount = (s: State = state): Account | null => s.accounts.find((a) => a.id === s.sessionId) ?? null;

/** Demo skrót c01: wybór roli ustawia sesję bez hasła (nie jest funkcją produktu, E5). */
export function setSessionFor(accountId: string | null) {
  set({ sessionId: accountId, notice: null, returnTo: null });
}
export function setReturnTo(returnTo: string | null, notice: string | null) {
  set({ returnTo, notice });
}
export function setRoute(route: Route) {
  set({ route });
}

export async function login(email: string, password: string): Promise<ApiResult<{ id: string }>> {
  await delay();
  const account = state.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  if (!account || account.password !== password) return fail(401, "unauthorized", "Invalid email or password.");
  set({ sessionId: account.id });
  return ok({ id: account.id });
}
export async function logout(): Promise<ApiResult<null>> {
  await delay(100);
  set({ sessionId: null, notice: null, returnTo: null });
  return ok(null);
}

const statusOf = (inv: StoredInvitation): Invitation["status"] =>
  inv.status === "pending" && new Date(inv.expiresAt).getTime() <= NOW.getTime() ? "expired" : inv.status;
export const invitationRows = (s: State = state): Invitation[] =>
  s.invitations
    .map((inv) => ({ id: inv.id, email: inv.email, status: statusOf(inv), createdAt: inv.createdAt, expiresAt: inv.expiresAt }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/** POST /api/admin/invitations: nowy link jest zwracany tylko raz, poprzednie oczekujące zaproszenie tego e-maila jest unieważnione (U10). */
export async function createInvitation(email: string): Promise<ApiResult<{ invitation: Invitation; link: string }>> {
  await delay();
  const normalized = email.trim().toLowerCase();
  if (state.accounts.some((a) => a.email === normalized)) {
    return fail(409, "conflict", "This address already has an account – log in.", { email: ["This address already has an account – log in."] });
  }
  const token = `demo-${String(state.seq).padStart(4, "0")}-q7Vt2mKx9LwR4sNp8ZcB1yHd6`;
  const invitation: StoredInvitation = {
    id: `i-${state.seq}`,
    email: normalized,
    status: "pending",
    createdAt: NOW.toISOString(),
    expiresAt: new Date(NOW.getTime() + 14 * DAY).toISOString(),
    token,
  };
  set({
    seq: state.seq + 1,
    invitations: [
      ...state.invitations.map((inv) => (inv.email === normalized && statusOf(inv) === "pending" ? { ...inv, status: "revoked" as const } : inv)),
      invitation,
    ],
  });
  const row: Invitation = { id: invitation.id, email: invitation.email, status: invitation.status, createdAt: invitation.createdAt, expiresAt: invitation.expiresAt };
  return ok({ invitation: row, link: `https://devmentor.example/register/mentor?token=${token}` }, 201);
}
/** Token z linku pokazanego w panelu (link ma postać .../register/mentor?token=...). */
export const tokenFromLink = (link: string) => new URL(link).searchParams.get("token") ?? "";

export function checkInvitation(token: string | undefined): { email: string } | null {
  const inv = state.invitations.find((i) => i.token === token);
  return inv && statusOf(inv) === "pending" ? { email: inv.email } : null;
}
export async function registerMentor(token: string, name: string, password: string): Promise<ApiResult<{ id: string }>> {
  await delay();
  const inv = state.invitations.find((i) => i.token === token);
  if (!inv || statusOf(inv) !== "pending") return fail(410, "gone", "This invitation is no longer valid");
  const id = `u-${state.seq}`;
  const account: Account = { id, name: name.trim(), email: inv.email, password, role: "mentor" };
  set({
    seq: state.seq + 1,
    accounts: [...state.accounts, account],
    invitations: state.invitations.map((i) => (i.id === inv.id ? { ...i, status: "used" as const } : i)),
    sessionId: id,
  });
  return ok({ id }, 201);
}

const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** U16: profil tworzony leniwie przy pierwszej wizycie na /mentor. */
export function ensureProfile(accountId: string) {
  if (state.profiles[accountId]) return;
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) return;
  const profile: Profile = { headline: null, bio: null, tags: [], links: [], price25: null, price50: null, listed: false, saved: false, slug: `${slugify(account.name)}-p4w7t${state.seq}` };
  set({ profiles: { ...state.profiles, [accountId]: profile }, seq: state.seq + 1 });
}

export type ProfileInput = {
  name: string;
  headline: string;
  bio: string;
  tags: string[];
  links: string[];
  price25: number | null;
  price50: number | null;
  listed: boolean;
};
const PRICE_MIN = 1000;
const PRICE_MAX = 1_000_000;
export async function saveProfile(accountId: string, input: ProfileInput): Promise<ApiResult<null>> {
  await delay();
  const errors: Record<string, string[]> = {};
  if (!input.name.trim()) errors.name = ["Enter your name."];
  if (!input.headline.trim()) errors.headline = ["Add one line about what you can help with."];
  else if (input.headline.length > 120) errors.headline = ["Keep the headline to 120 characters."];
  for (const key of ["price25", "price50"] as const) {
    const value = input[key];
    if (value !== null && (value < PRICE_MIN || value > PRICE_MAX)) errors[key] = ["Enter an amount from 10 to 10,000 PLN."];
  }
  if (Object.keys(errors).length > 0) return fail(400, "validation_error", "Check the highlighted fields.", errors);
  ensureProfile(accountId);
  const profile = state.profiles[accountId];
  set({
    accounts: state.accounts.map((a) => (a.id === accountId ? { ...a, name: input.name.trim() } : a)),
    profiles: {
      ...state.profiles,
      [accountId]: { ...profile, headline: input.headline.trim(), bio: input.bio, tags: input.tags, links: input.links, price25: input.price25, price50: input.price50, listed: input.listed, saved: true },
    },
  });
  return ok(null);
}

/** POST /api/mentor/slots: reguły U18 / D13 (serwer, nie ekran). */
export async function addSlot(accountId: string, startsAt: string): Promise<ApiResult<Slot>> {
  await delay();
  const start = new Date(startsAt).getTime();
  const own = state.slots[accountId] ?? [];
  const reject = (message: string) => fail(400, "validation_error", message, { startsAt: [message] });
  if (start - NOW.getTime() < DAY) return reject("A slot must start at least 24 hours from now.");
  if (start - NOW.getTime() > 60 * DAY) return reject("A slot can start at most 60 days from now.");
  if (start % (15 * 60_000) !== 0) return reject("Start times are on a 15-minute grid, like 18:00 or 18:15.");
  if (own.some((s) => new Date(s.startsAt).getTime() === start)) return reject("You already have a slot at this time.");
  if (own.some((s) => Math.abs(new Date(s.startsAt).getTime() - start) < 50 * 60_000)) return reject("Slots must start at least 50 minutes apart.");
  const created = slot(`s-${state.seq}`, new Date(start).toISOString());
  set({ seq: state.seq + 1, slots: { ...state.slots, [accountId]: [...own, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)) } });
  return ok(created, 201);
}

export type Offer = { profileComplete: boolean; pricesSet: boolean; bookableSlots: number; slotsTooSoon: number; bookable: boolean; listedVisible: boolean };
export function offerOf(accountId: string, s: State = state): Offer {
  const account = s.accounts.find((a) => a.id === accountId);
  const profile = s.profiles[accountId];
  const open = (s.slots[accountId] ?? []).filter((x) => x.status === "open");
  const profileComplete = Boolean(account?.name.trim() && profile?.headline?.trim());
  const pricesSet = profile?.price25 != null && profile?.price50 != null;
  const bookableSlots = open.filter((x) => x.bookable).length;
  const bookable = profileComplete && pricesSet && bookableSlots > 0;
  return { profileComplete, pricesSet, bookableSlots, slotsTooSoon: open.filter((x) => !x.bookable).length, bookable, listedVisible: Boolean(profile?.listed) && bookable };
}

export type MentorPage = PublicMentor & { slots: Slot[] };
function pageOf(account: Account, s: State): MentorPage | null {
  const profile = s.profiles[account.id];
  if (!profile) return null;
  const bookable = (s.slots[account.id] ?? []).filter((x) => x.bookable && x.status === "open");
  return {
    slug: profile.slug,
    name: account.name,
    headline: profile.headline,
    bio: profile.bio,
    tags: profile.tags,
    links: profile.links,
    price25: profile.price25,
    price50: profile.price50,
    currency: "PLN",
    soonestSlotAt: bookable[0]?.startsAt ?? null,
    slots: bookable,
  };
}
/** GET /api/mentors/[slug]: działa też dla niewylistowanych (D03); nieznany slug = null. */
export function mentorBySlug(slug: string | undefined, s: State = state): MentorPage | null {
  const other = OTHER_MENTORS.find((m) => m.slug === slug);
  if (other) return other;
  for (const account of s.accounts) {
    const page = pageOf(account, s);
    if (page && page.slug === slug) return page;
  }
  return null;
}
/** GET /api/mentors: tylko listed ∧ ceny ∧ >=1 slot do rezerwacji, wg najbliższego terminu (U21). */
export function listedMentors(s: State = state): PublicMentor[] {
  const own = s.accounts
    .filter((a) => a.role === "mentor" && offerOf(a.id, s).listedVisible)
    .map((a) => pageOf(a, s) as MentorPage);
  return [...own, ...OTHER_MENTORS]
    .sort((a, b) => (a.soonestSlotAt ?? "").localeCompare(b.soonestSlotAt ?? ""))
    .map((mentor) => ({ slug: mentor.slug, name: mentor.name, headline: mentor.headline, bio: mentor.bio, tags: mentor.tags, links: mentor.links, price25: mentor.price25, price50: mentor.price50, currency: mentor.currency, soonestSlotAt: mentor.soonestSlotAt }));
}

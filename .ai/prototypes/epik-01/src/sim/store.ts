// Symulacja "serwera" prototypu Epiku 01: wszystko w pamięci, dane fikcyjne z lekcja-07/mapa-ekranow.md (sekcja 3).
// Nic nie jest wysyłane ani zapisywane poza pamięcią karty. Reset przywraca stan początkowy.
// Etap 2: scenariusze c02-c21 (pasek przeglądu) sterują wynikami tej symulacji.
import { useSyncExternalStore } from "react";

import type { ApiError, ApiResult } from "@devmentor/ui/backend/api/types";
import type { Slot } from "@devmentor/ui/components/availability/types";
import type { Invitation, PublicMentor } from "@devmentor/ui/components/mentors/types";

export const TIME_ZONE = "Europe/Warsaw";
/** Stały "teraz" zegara demo: piątek 2026-10-23, 10:00 Europe/Warsaw (UTC+2). c17 przesuwa go o 6 lub 24 h. */
export const NOW = new Date("2026-10-23T08:00:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const TAG_OPTIONS = ["TypeScript", "React", "Python", "AI agents"];
/** Znacznik filtra bez wyników (c21): nikt nie ma tego stosu, więc jest tylko w kontrolce scenariusza. */
export const NO_MATCH_TAG = "Rust";
export const PAGE_SIZE = 10;

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
type Route = { slug?: string; token?: string; path?: string };
type Fault = "ok" | "network" | "server";
export type Scenario = {
  /** c03 */ usedMeanwhile: boolean;
  /** c04 */ emailTaken: boolean;
  /** c05 */ wrongPassword: boolean;
  /** c06 */ tooMany: "off" | "login" | "mentee" | "mentor";
  /** c07 (następny zapis) */ sessionExpires: boolean;
  /** c08: dotyczy następnego żądania */ fault: Fault;
  /** c09 */ slow: boolean;
  /** c10 */ invList: "full" | "empty" | "error";
  /** c16 */ bookedMeanwhile: boolean;
  /** c17 */ clockHours: 0 | 6 | 24;
  /** c19 */ dst: "none" | "gap" | "ambiguous";
  /** c20 */ publicList: "few" | "empty" | "many" | "long";
  /** c21 */ filter: string;
  /** c15 */ slotMode: "normal" | "none" | "many";
  /** c02 (ostatni wybór) */ invite: string;
};
type State = {
  accounts: Account[];
  profiles: Record<string, Profile>;
  slots: Record<string, Slot[]>;
  slotBackup: Record<string, Slot[]>;
  /** c16: sloty zarezerwowane na "serwerze" w międzyczasie; lista dowie się o tym przy następnym wejściu na ekran terminów. */
  bookedLater: string[];
  invitations: StoredInvitation[];
  linkPanel: { invitation: Invitation; link: string } | null;
  loginFails: Record<string, number>;
  sessionId: string | null;
  returnTo: string | null;
  notice: string | null;
  message: string | null;
  fill: { date: string; time: string; n: number } | null;
  route: Route;
  sc: Scenario;
  seq: number;
  /** Rośnie przy zmianach z paska przeglądu, żeby formularze z własnym stanem wczytały nowe dane. */
  rev: number;
};

const iso = (value: string) => new Date(value).toISOString();
const baseSlot = (id: string, startsAt: string, status: Slot["status"] = "open"): Slot => ({ id, startsAt: iso(startsAt), status, bookable: false });

/** Konta demo (mapa, sekcja 3). Hasła są fikcyjne i jawne (E11). */
export const DEMO_ACCOUNTS: Account[] = [
  { id: "u-ola", name: "Ola Wiśniewska", email: "ola.wisniewska@example.com", password: "ingress-1-28-upgrade", role: "mentee" },
  { id: "u-marek", name: "Marek Zieliński", email: "marek.zielinski@example.com", password: "helm-chart-rollback-2", role: "mentor" },
  { id: "u-oliwia", name: "Oliwia Nowak", email: "oliwia.nowak@example.com", password: "demo-admin-passphrase-1", role: "admin" },
];

const INITIAL_SCENARIO: Scenario = {
  usedMeanwhile: false,
  emailTaken: false,
  wrongPassword: false,
  tooMany: "off",
  sessionExpires: false,
  fault: "ok",
  slow: false,
  invList: "full",
  bookedMeanwhile: false,
  clockHours: 0,
  dst: "none",
  publicList: "few",
  filter: "",
  slotMode: "normal",
  invite: "",
};

/** Sloty Marka z mapy (czas Europe/Warsaw, w UTC), unikalne id na konto. */
const marekSlots = (prefix: string): Slot[] => [
  baseSlot(`${prefix}1`, "2026-10-23T14:00:00Z"),
  baseSlot(`${prefix}2`, "2026-10-24T07:30:00Z"),
  baseSlot(`${prefix}3`, "2026-10-24T10:00:00Z"),
  baseSlot(`${prefix}4`, "2026-10-26T17:00:00Z"),
  baseSlot(`${prefix}5`, "2026-10-26T18:30:00Z"),
  baseSlot(`${prefix}6`, "2026-10-28T17:00:00Z", "booked"),
  baseSlot(`${prefix}7`, "2026-10-30T16:00:00Z"),
  baseSlot(`${prefix}8`, "2026-11-02T17:00:00Z"),
];
/** 60 slotów (s09.14, s11.6): dwa dziennie przez 30 dni, od soboty 24.10, 15:45 i 17:30 czasu lokalnego (czas zimowy od 25.10, więc w UTC 13:45 i 15:30 dla 24.10, potem 14:45 i 16:30). */
function manySlots(prefix: string): Slot[] {
  const out: Slot[] = [];
  for (let day = 0; day < 30; day += 1) {
    const base = new Date("2026-10-24T00:00:00Z").getTime() + day * DAY;
    const winter = base >= new Date("2026-10-25T00:00:00Z").getTime();
    const offsetHours = winter ? 1 : 2;
    out.push(baseSlot(`${prefix}a${day}`, new Date(base + (15 * 60 + 45) * 60_000 - offsetHours * HOUR).toISOString()));
    out.push(baseSlot(`${prefix}b${day}`, new Date(base + (17 * 60 + 30) * 60_000 - offsetHours * HOUR).toISOString()));
  }
  return out;
}

type SeedMentor = PublicMentor & { slotTimes: string[] };
const FIXED_MENTORS: SeedMentor[] = [
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
    soonestSlotAt: null,
    slotTimes: ["2026-10-27T18:00:00Z", "2026-11-03T18:00:00Z"],
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
    soonestSlotAt: null,
    slotTimes: ["2026-10-29T17:30:00Z", "2026-11-05T17:30:00Z"],
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
    soonestSlotAt: null,
    slotTimes: ["2026-10-30T16:30:00Z", "2026-11-06T16:30:00Z"],
  },
];
/** c20 "długie wartości": nagłówek 120 znaków, pięć linków, cztery tagi (fixture publicMentorLong z DS); 60 slotów na stronie. */
const LONG_MENTOR: SeedMentor = {
  slug: "aleksandra-konstantynopolitanczykiewiczowna-5h3k8p",
  name: "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska",
  headline: "Staff engineer – distributed tracing, Kubernetes operators, Postgres replication and the long tail of on-call lore",
  bio: null,
  tags: ["TypeScript", "React", "Python", "AI agents"],
  links: [
    "https://github.com/aleksandra-grzybowska",
    "https://blog.example/aleksandra/tracing-the-long-tail",
    "https://conf.example/talks/operators-in-anger",
    "https://example.com/aleksandra/postgres-replication-notes",
    "https://gitlab.example/aleksandra/on-call-lore",
  ],
  price25: 120000,
  price50: 1000000,
  currency: "PLN",
  soonestSlotAt: null,
  slotTimes: [],
};
/** c20 "częściowy profil": brak nagłówka, tagów i linków; ceny i jeden termin są (U21 wymaga cen i slotu). */
const PARTIAL_MENTOR: SeedMentor = {
  slug: "tomasz-kowalczyk-6j1q9z",
  name: "Tomasz Kowalczyk",
  headline: null,
  bio: null,
  tags: [],
  links: [],
  price25: 15000,
  price50: 28000,
  currency: "PLN",
  soonestSlotAt: null,
  slotTimes: ["2026-10-28T08:00:00Z"],
};
const FIRST = ["Agnieszka", "Bartosz", "Celina", "Dawid", "Ewa", "Filip", "Grażyna", "Hubert", "Irena", "Jakub", "Karolina", "Łukasz", "Magda", "Norbert", "Olga", "Paweł", "Renata", "Szymon", "Teresa", "Urszula", "Wiktor", "Zofia"];
const LAST = ["Adamska", "Borowski", "Czarnecka", "Dudek", "Ekiert", "Falkowski", "Gajewska", "Hoffman", "Iwański", "Jabłońska", "Kozioł", "Lis", "Michalak", "Nowicki", "Ostrowska", "Pawlak", "Rutkowska", "Sikora", "Tomaszewska", "Urban", "Wrona", "Zalewska"];
const HEADLINES = [
  "Platform engineer – CI pipelines and release trains",
  "Backend engineer – APIs, queues and migrations",
  "Frontend engineer – design systems and accessibility",
  "Data engineer – warehouses and the pipelines that feed them",
  "Engineering manager – first-time leads and team health",
  "SRE – on-call, alerts and postmortems",
];
const STACKS = [["TypeScript"], ["React", "TypeScript"], ["Python"], ["AI agents", "Python"], ["TypeScript", "Python"], ["React"]];
/** c20 "25": dodatkowi mentorzy z fikcyjnymi nazwami (bez ocen i bez liczników, N02). */
function generatedMentors(count: number): SeedMentor[] {
  return Array.from({ length: count }, (_, index) => {
    const first = FIRST[index % FIRST.length];
    const last = LAST[index % LAST.length];
    const day = 27 + (index % 20);
    const month = day > 31 ? 11 : 10;
    const dd = String(day > 31 ? day - 31 : day).padStart(2, "0");
    return {
      slug: `${slugify(`${first} ${last}`)}-g${String(index).padStart(2, "0")}`,
      name: `${first} ${last}`,
      headline: HEADLINES[index % HEADLINES.length],
      bio: null,
      tags: STACKS[index % STACKS.length],
      links: index % 3 === 0 ? [`https://github.com/${slugify(`${first} ${last}`)}`] : [],
      price25: 12000 + (index % 5) * 2500,
      price50: 22000 + (index % 5) * 4500,
      currency: "PLN",
      soonestSlotAt: null,
      slotTimes: [`2026-${month}-${dd}T17:${index % 2 === 0 ? "00" : "30"}:00Z`],
    };
  });
}

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
    slots: { "u-marek": marekSlots("m") },
    slotBackup: {},
    bookedLater: [],
    invitations: [
      { id: "i-anna", email: "anna.maj@example.com", status: "pending", createdAt: iso("2026-10-23T07:00:00Z"), expiresAt: iso("2026-11-06T07:00:00Z"), token: "demo-anna" },
      { id: "i-tomasz", email: "tomasz.kowalczyk@example.com", status: "pending", createdAt: iso("2026-10-20T09:00:00Z"), expiresAt: iso("2026-11-03T09:00:00Z"), token: "demo-tomasz" },
      { id: "i-marek", email: "marek.zielinski@example.com", status: "used", createdAt: iso("2026-10-10T08:00:00Z"), expiresAt: iso("2026-10-24T08:00:00Z"), token: "demo-marek" },
      { id: "i-jan", email: "jan.sowa@example.com", status: "expired", createdAt: iso("2026-09-20T08:00:00Z"), expiresAt: iso("2026-10-04T08:00:00Z"), token: "demo-jan" },
    ],
    linkPanel: null,
    loginFails: {},
    sessionId: null,
    returnTo: null,
    notice: null,
    message: null,
    fill: null,
    route: {},
    sc: { ...INITIAL_SCENARIO },
    seq: 1,
    rev: 0,
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
/** Zmiana scenariusza (pasek przeglądu); nie jest funkcją produktu. */
export function setScenario(patch: Partial<Scenario>) {
  set({ sc: { ...state.sc, ...patch } });
}
export function setMessage(message: string | null) {
  set({ message });
}
/** Zegar demo: stały "teraz" + przesunięcie z c17. */
export const now = (s: State = state) => new Date(NOW.getTime() + s.sc.clockHours * HOUR);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ok = <T,>(data: T, status = 200): ApiResult<T> => ({ ok: true, data, status });
const fail = (status: number, code: string, message: string, fieldErrors?: Record<string, string[]>): ApiResult<never> => ({
  ok: false,
  status,
  error: { code, message, fieldErrors },
});
const faultError = (fault: Exclude<Fault, "ok">): ApiError =>
  fault === "network"
    ? { code: "network_error", message: "Could not reach the server." }
    : { code: "internal_error", message: "The server failed." };

/** Wspólny początek każdego "żądania": opóźnienie (c09), jednorazowy błąd sieci/serwera (c08). */
async function takeFault(baseDelay: number): Promise<ApiError | null> {
  await delay(state.sc.slow ? 3500 : baseDelay);
  const fault = state.sc.fault;
  if (fault === "ok") return null;
  setScenario({ fault: "ok" });
  return faultError(fault);
}
/** Ładowanie ekranu (GET): `null` = dane są, inaczej błąd z przyciskiem Try again. */
export const loadGate = (baseDelay = 0) => takeFault(baseDelay);

/** Zapis (POST/PUT/DELETE): błąd c08, wygaśnięcie sesji c07 (L03: /login z komunikatem). */
async function writeGate(): Promise<ApiResult<never> | null> {
  const error = await takeFault(250);
  if (error) return { ok: false, status: error.code === "network_error" ? 0 : 500, error };
  if (state.sc.sessionExpires && state.sessionId) {
    expireSession();
    return fail(401, "unauthorized", "Your session has ended. Log in to continue.");
  }
  return null;
}
/** s03.7 / s12.4: sesja kończy się; po zalogowaniu powrót na stronę, z której wyszliśmy (L03). */
export function expireSession() {
  set({ sessionId: null, notice: "Your session has ended. Log in to continue.", returnTo: state.route.path ?? null, sc: { ...state.sc, sessionExpires: false } });
  document.dispatchEvent(new CustomEvent("prototype:navigate", { detail: "s03" }));
}

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

const MAX_LOGIN_FAILS = 5;
export async function login(email: string, password: string): Promise<ApiResult<{ id: string }>> {
  const error = await takeFault(250);
  if (error) return { ok: false, status: 0, error };
  const key = email.trim().toLowerCase();
  if (state.sc.tooMany === "login" || (state.loginFails[key] ?? 0) >= MAX_LOGIN_FAILS) {
    return fail(429, "rate_limited", "Too many attempts. Try again in 15 minutes.");
  }
  const account = state.accounts.find((a) => a.email.toLowerCase() === key);
  if (state.sc.wrongPassword || !account || account.password !== password) {
    set({ loginFails: { ...state.loginFails, [key]: (state.loginFails[key] ?? 0) + 1 } });
    return fail(401, "unauthorized", "Invalid email or password.");
  }
  set({ sessionId: account.id, loginFails: { ...state.loginFails, [key]: 0 }, notice: null });
  return ok({ id: account.id });
}
export async function logout(): Promise<ApiResult<null>> {
  await delay(100);
  set({ sessionId: null, notice: null, returnTo: null });
  return ok(null);
}

/** s02: rejestracja mentee. Zajęty e-mail: ogólny `conflict` przy polu e-mail, bez potwierdzania konta (U2, A07). */
export async function registerMentee(name: string, email: string, password: string): Promise<ApiResult<{ id: string }>> {
  const error = await takeFault(250);
  if (error) return { ok: false, status: 0, error };
  if (state.sc.tooMany === "mentee") return fail(429, "rate_limited", "Too many accounts were created from your network. Try again in about an hour.");
  const normalized = email.trim().toLowerCase();
  if (state.sc.emailTaken || state.accounts.some((a) => a.email.toLowerCase() === normalized)) {
    const message = "We could not create an account with this email. If it is yours, log in instead.";
    return fail(409, "conflict", "Check the highlighted field.", { email: [message] });
  }
  const id = `u-${state.seq}`;
  set({ seq: state.seq + 1, accounts: [...state.accounts, { id, name: name.trim(), email: normalized, password, role: "mentee" }], sessionId: id, notice: null, returnTo: null });
  return ok({ id }, 201);
}

const statusOf = (inv: StoredInvitation, s: State = state): Invitation["status"] =>
  inv.status === "pending" && new Date(inv.expiresAt).getTime() <= now(s).getTime() ? "expired" : inv.status;
export const invitationRows = (s: State = state): Invitation[] =>
  s.invitations
    .map((inv) => ({ id: inv.id, email: inv.email, status: statusOf(inv, s), createdAt: inv.createdAt, expiresAt: inv.expiresAt }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/** Wspólne tworzenie zaproszenia: nowy token, poprzednie oczekujące tego e-maila unieważnione (U10). */
function makeInvitation(email: string) {
  const token = `demo-${String(state.seq).padStart(4, "0")}-q7Vt2mKx9LwR4sNp8ZcB1yHd6`;
  const invitation: StoredInvitation = {
    id: `i-${state.seq}`,
    email,
    status: "pending",
    createdAt: now().toISOString(),
    expiresAt: new Date(now().getTime() + 14 * DAY).toISOString(),
    token,
  };
  set({
    seq: state.seq + 1,
    invitations: [...state.invitations.map((inv) => (inv.email === email && statusOf(inv) === "pending" ? { ...inv, status: "revoked" as const } : inv)), invitation],
  });
  const row: Invitation = { id: invitation.id, email, status: "pending", createdAt: invitation.createdAt, expiresAt: invitation.expiresAt };
  return { invitation: row, link: `https://devmentor.example/register/mentor?token=${token}`, token };
}
/** POST /api/admin/invitations. E-mail z istniejącym kontem: `conflict` już przy zapraszaniu (L11, A07). */
export async function createInvitation(email: string): Promise<ApiResult<{ invitation: Invitation; link: string }>> {
  const error = await writeGate();
  if (error) return error;
  const normalized = email.trim().toLowerCase();
  if (state.accounts.some((a) => a.email.toLowerCase() === normalized)) {
    const message = "This address already has an account – log in.";
    return fail(409, "conflict", message, { email: [message] });
  }
  const created = makeInvitation(normalized);
  const data = { invitation: created.invitation, link: created.link };
  set({ linkPanel: data });
  return ok(data, 201);
}
export function closeLinkPanel() {
  set({ linkPanel: null });
}
/** c11: ponowne zaproszenie Tomasza (admin): stary wiersz Revoked, nowy link pokazany raz. */
export function reinviteTomasz() {
  const created = makeInvitation("tomasz.kowalczyk@example.com");
  set({ linkPanel: { invitation: created.invitation, link: created.link } });
}
/** c02: token do linku zaproszenia dla wybranego wariantu. */
export function demoToken(kind: string): string {
  if (kind === "used") return "demo-marek";
  if (kind === "expired") return "demo-jan";
  if (kind === "unknown") return "unknown-0000";
  if (kind === "revoked") {
    const old = state.invitations.find((i) => i.token === "demo-tomasz");
    if (old && statusOf(old) === "pending") makeInvitation("tomasz.kowalczyk@example.com");
    return "demo-tomasz";
  }
  const anna = state.invitations.find((i) => i.token === "demo-anna");
  if (anna && statusOf(anna) === "pending") return "demo-anna";
  return makeInvitation("anna.maj@example.com").token;
}

export function checkInvitation(token: string | undefined): { email: string } | null {
  const inv = state.invitations.find((i) => i.token === token);
  return inv && statusOf(inv) === "pending" ? { email: inv.email } : null;
}
/** Tokenu z linku pokazanego w panelu (link ma postać .../register/mentor?token=...). */
export const tokenFromLink = (link: string) => new URL(link).searchParams.get("token") ?? "";

export async function registerMentor(token: string, name: string, password: string): Promise<ApiResult<{ id: string }>> {
  const error = await takeFault(250);
  if (error) return { ok: false, status: 0, error };
  if (state.sc.tooMany === "mentor") return fail(429, "rate_limited", "Too many accounts were created from your network. Try again in about an hour.");
  const inv = state.invitations.find((i) => i.token === token);
  if (state.sc.usedMeanwhile && inv && statusOf(inv) === "pending") {
    // c03: ktoś zużył token w innej karcie, zanim ta rejestracja się zakończyła (U8: wygrywa dokładnie jedna).
    set({ invitations: state.invitations.map((i) => (i.id === inv.id ? { ...i, status: "used" as const } : i)), sc: { ...state.sc, usedMeanwhile: false } });
    return fail(410, "gone", "This invitation is no longer valid");
  }
  if (!inv || statusOf(inv) !== "pending") return fail(410, "gone", "This invitation is no longer valid");
  if (state.sc.emailTaken || state.accounts.some((a) => a.email.toLowerCase() === inv.email)) {
    return fail(409, "conflict", "This address already has an account – log in. The founders can also move your existing account to mentor.");
  }
  const id = `u-${state.seq}`;
  const account: Account = { id, name: name.trim(), email: inv.email, password, role: "mentor" };
  set({
    seq: state.seq + 1,
    accounts: [...state.accounts, account],
    invitations: state.invitations.map((i) => (i.id === inv.id ? { ...i, status: "used" as const } : i)),
    sessionId: id,
    notice: null,
    returnTo: null,
  });
  return ok({ id }, 201);
}

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  const gate = await writeGate();
  if (gate) return gate;
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

/** Slot z polem `bookable` liczonym względem zegara demo (D13: >=24 h; c17 przesuwa zegar). */
const viewSlot = (slot: Slot, s: State): Slot => ({ ...slot, bookable: slot.status === "open" && new Date(slot.startsAt).getTime() - now(s).getTime() >= DAY });
export const slotsOf = (accountId: string, s: State = state): Slot[] => (s.slots[accountId] ?? []).map((slot) => viewSlot(slot, s));

/** POST /api/mentor/slots: reguły U18 / D13 (serwer, nie ekran). */
export async function addSlot(accountId: string, startsAt: string): Promise<ApiResult<Slot>> {
  const gate = await writeGate();
  if (gate) return gate;
  const start = new Date(startsAt).getTime();
  const own = state.slots[accountId] ?? [];
  const reject = (message: string) => fail(400, "validation_error", message, { startsAt: [message] });
  if (start - now().getTime() < DAY) return reject("A slot must start at least 24 hours from now.");
  if (start - now().getTime() > 60 * DAY) return reject("A slot can start at most 60 days from now.");
  if (start % (15 * 60_000) !== 0) return reject("Start times are on a 15-minute grid, like 18:00 or 18:15.");
  if (own.some((s) => new Date(s.startsAt).getTime() === start)) return reject("You already have a slot at this time.");
  if (own.some((s) => Math.abs(new Date(s.startsAt).getTime() - start) < 50 * 60_000)) return reject("Slots must start at least 50 minutes apart.");
  const created = baseSlot(`s-${state.seq}`, new Date(start).toISOString());
  set({ seq: state.seq + 1, slots: { ...state.slots, [accountId]: [...own, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)) } });
  return ok(viewSlot(created, state), 201);
}
/** DELETE /api/mentor/slots/[id]: zarezerwowany slot = `conflict` (U20, #27-4); c16 rezerwuje slot w międzyczasie. */
export async function deleteSlot(accountId: string, slotId: string): Promise<ApiResult<null>> {
  const gate = await writeGate();
  if (gate) return gate;
  const own = state.slots[accountId] ?? [];
  const target = own.find((s) => s.id === slotId);
  if (!target) return fail(404, "not_found", "This slot no longer exists.");
  if (target.status === "booked" || state.bookedLater.includes(slotId) || state.sc.bookedMeanwhile) {
    // Rząd zmieni się na "Booked" dopiero przy następnym wczytaniu listy, żeby okno dialogowe zdążyło pokazać powód.
    set({ bookedLater: state.bookedLater.includes(slotId) ? state.bookedLater : [...state.bookedLater, slotId], sc: { ...state.sc, bookedMeanwhile: false } });
    return fail(409, "conflict", "Cancel the booking instead – a mentee booked this time.");
  }
  set({ slots: { ...state.slots, [accountId]: own.filter((s) => s.id !== slotId) } });
  return ok(null);
}

/** Wejście na ekran terminów: lista dowiaduje się o rezerwacjach z c16. */
export function settleBookings(accountId: string) {
  if (state.bookedLater.length === 0) return;
  const own = state.slots[accountId] ?? [];
  set({ slots: { ...state.slots, [accountId]: own.map((s) => (state.bookedLater.includes(s.id) ? { ...s, status: "booked" as const } : s)) }, bookedLater: [] });
}

export type Offer = {
  profileComplete: boolean;
  pricesSet: boolean;
  bookableSlots: number;
  slotsTooSoon: number;
  bookable: boolean;
  listedVisible: boolean;
  /** A09: czego brakuje, gdy opt-in jest włączony, a mentora nie widać na liście. */
  missing: string[];
};
export function offerOf(accountId: string, s: State = state): Offer {
  const account = s.accounts.find((a) => a.id === accountId);
  const profile = s.profiles[accountId];
  const open = slotsOf(accountId, s).filter((x) => x.status === "open");
  const profileComplete = Boolean(account?.name.trim() && profile?.headline?.trim());
  const pricesSet = profile?.price25 != null && profile?.price50 != null;
  const bookableSlots = open.filter((x) => x.bookable).length;
  const bookable = profileComplete && pricesSet && bookableSlots > 0;
  const missing = [!profileComplete && "a headline", !pricesSet && "both prices", bookableSlots === 0 && "a time at least 24 hours ahead"].filter(Boolean) as string[];
  return { profileComplete, pricesSet, bookableSlots, slotsTooSoon: open.filter((x) => !x.bookable).length, bookable, listedVisible: Boolean(profile?.listed) && bookable, missing };
}
/** A09: komunikat dla mentora z włączonym opt-in, którego jeszcze nie widać (null, gdy nic nie przeszkadza). */
export const notVisibleNotice = (accountId: string, s: State = state): string | null => {
  const profile = s.profiles[accountId];
  const offer = offerOf(accountId, s);
  return profile?.listed && !offer.bookable ? `Public list is on, but you are not visible yet. Missing: ${offer.missing.join(", ")}.` : null;
};

export type MentorPage = PublicMentor & { slots: Slot[] };
const withSlots = (mentor: PublicMentor, slots: Slot[]): MentorPage => {
  const bookable = slots.filter((x) => x.bookable && x.status === "open").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { ...mentor, soonestSlotAt: bookable[0]?.startsAt ?? null, slots: bookable };
};
function pageOf(account: Account, s: State): MentorPage | null {
  const profile = s.profiles[account.id];
  if (!profile) return null;
  return withSlots(
    { slug: profile.slug, name: account.name, headline: profile.headline, bio: profile.bio, tags: profile.tags, links: profile.links, price25: profile.price25, price50: profile.price50, currency: "PLN", soonestSlotAt: null },
    slotsOf(account.id, s),
  );
}
function seeded(mentor: SeedMentor, s: State): MentorPage {
  const { slotTimes, ...rest } = mentor;
  const slots = mentor === LONG_MENTOR ? manySlots(`${mentor.slug}-`) : slotTimes.map((time, index) => baseSlot(`${mentor.slug}-${index}`, time));
  return withSlots(rest, slots.map((slot) => viewSlot(slot, s)));
}
const EVERY_SEEDED = [...FIXED_MENTORS, LONG_MENTOR, PARTIAL_MENTOR, ...generatedMentors(25)];
/** GET /api/mentors/[slug]: działa też dla niewylistowanych (D03); nieznany slug = null. */
export function mentorBySlug(slug: string | undefined, s: State = state): MentorPage | null {
  const other = EVERY_SEEDED.find((m) => m.slug === slug);
  if (other) return seeded(other, s);
  for (const account of s.accounts) {
    const page = pageOf(account, s);
    if (page && page.slug === slug) return page;
  }
  return null;
}
/** GET /api/mentors: tylko listed ∧ ceny ∧ >=1 slot do rezerwacji, wg najbliższego terminu (U21). c20 wybiera zestaw, c21 filtr stosu. */
export function listedMentors(s: State = state): PublicMentor[] {
  const mode = s.sc.publicList;
  if (mode === "empty") return [];
  const own = s.accounts.filter((a) => a.role === "mentor" && offerOf(a.id, s).listedVisible).map((a) => pageOf(a, s) as MentorPage);
  const fixed = FIXED_MENTORS.map((m) => seeded(m, s));
  let list: MentorPage[] = [...own, ...fixed];
  if (mode === "long") list = [...list, seeded(LONG_MENTOR, s), seeded(PARTIAL_MENTOR, s)];
  if (mode === "many") list = [...list, ...generatedMentors(Math.max(0, 25 - list.length)).map((m) => seeded(m, s))];
  return list
    .filter((m) => m.soonestSlotAt !== null)
    .filter((m) => !s.sc.filter || m.tags.includes(s.sc.filter))
    .sort((a, b) => (a.soonestSlotAt ?? "").localeCompare(b.soonestSlotAt ?? ""))
    .map(toPublic);
}
const toPublic = (m: MentorPage): PublicMentor => ({ slug: m.slug, name: m.name, headline: m.headline, bio: m.bio, tags: m.tags, links: m.links, price25: m.price25, price50: m.price50, currency: m.currency, soonestSlotAt: m.soonestSlotAt });
/** Ile mentorów jest na liście bez filtra (żeby odróżnić "nikt na liście" od "brak wyników"). */
export const unfilteredCount = (s: State = state) => listedMentors({ ...s, sc: { ...s.sc, filter: "" } }).length;

/* Kontrolki scenariuszy, które zmieniają dane (c11, c13-c16, c19). Pasek przeglądu woła je i przenosi na właściwy ekran. */

/** Konto, na którym działają c13-c16: zalogowany mentor, a gdy go nie ma, Marek (sesja jest wtedy przełączana). */
export function scenarioMentorId(): string {
  const me = sessionAccount();
  if (me?.role === "mentor") return me.id;
  set({ sessionId: "u-marek", notice: null, returnTo: null });
  return "u-marek";
}
export type OfferKind = "new" | "prices" | "soon" | "ready" | "listed";
/** c13: ustawia stan oferty mentora (nadpisuje jego profil i terminy; Reset przywraca dane początkowe). */
export function applyOfferState(kind: OfferKind) {
  const id = scenarioMentorId();
  ensureProfile(id);
  const profile = state.profiles[id];
  const slots = marekSlots(`${id}-`);
  const fresh: Profile = { ...profile, headline: null, bio: null, tags: [], links: [], price25: null, price50: null, listed: false, saved: false };
  const configured: Profile = {
    ...profile,
    headline: profile.headline ?? "Platform engineer – Kubernetes, Helm, CI pipelines",
    price25: profile.price25 ?? 18000,
    price50: profile.price50 ?? 32000,
    saved: true,
    listed: kind === "listed",
  };
  const nextSlots = kind === "new" || kind === "prices" ? [] : kind === "soon" ? slots.slice(0, 2) : slots;
  set({
    profiles: { ...state.profiles, [id]: kind === "new" ? fresh : configured },
    slots: { ...state.slots, [id]: nextSlots },
    rev: state.rev + 1,
  });
}
/** c14: opt-in wł/wył na koncie scenariusza (w produkcie: pole wyboru zapisywane z profilem, A09). */
export function applyOptIn(listed: boolean) {
  const id = scenarioMentorId();
  ensureProfile(id);
  set({ profiles: { ...state.profiles, [id]: { ...state.profiles[id], listed } }, rev: state.rev + 1 });
}
/** c15: brak slotów / 60 slotów / normalnie (przywraca terminy sprzed pierwszej zmiany). */
export function applySlotMode(mode: Scenario["slotMode"]) {
  const id = scenarioMentorId();
  const backup = state.slotBackup[id] ?? state.slots[id] ?? [];
  const slots = mode === "none" ? [] : mode === "many" ? manySlots(`${id}-x`) : backup;
  set({ slotBackup: { ...state.slotBackup, [id]: backup }, slots: { ...state.slots, [id]: slots }, sc: { ...state.sc, slotMode: mode } });
}
/** c19: wypełnia pola formularza slotu godziną z przejścia na czas zimowy (dwukrotna) lub letni (nieistniejąca). */
export function fillDst(kind: "gap" | "ambiguous") {
  scenarioMentorId();
  const fill = kind === "gap" ? { date: "2027-03-28", time: "02:30" } : { date: "2026-10-25", time: "02:30" };
  set({ fill: { ...fill, n: (state.fill?.n ?? 0) + 1 }, sc: { ...state.sc, dst: kind } });
}
export function clearFill() {
  set({ fill: null });
}

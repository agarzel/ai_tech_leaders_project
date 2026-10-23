// s01 start, s02 rejestracja mentee, s03 logowanie, s04 rejestracja mentora, s05 admin, s12 nie znaleziono.
import { useState } from "react";
import { z } from "zod";

import { CrudForm, type CrudFormField } from "@devmentor/ui/backend/forms/CrudForm";
import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { Alert, AlertDescription, AlertTitle } from "@devmentor/ui/components/ui/alert";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemTitle } from "@devmentor/ui/components/ui/item";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";

import { Page } from "../chrome";
import { useLoad } from "../load";
import { afterLogin, go, Guard, Link, renderLink, ROLE_LANDING } from "../nav";
import { checkInvitation, DEMO_ACCOUNTS, login, registerMentee, registerMentor, sessionAccount, useStore } from "../sim/store";

type Section = { title: string; href: string; description: string };

function Sections({ label, sections }: { label: string; sections: Section[] }) {
  return (
    <ItemGroup aria-label={label}>
      {sections.map((section) => (
        <Item key={section.href}>
          <ItemContent>
            <ItemTitle>
              {section.href === "/admin/users" ? (
                <>
                  <span>{section.title}</span> <span className="type-meta font-normal text-muted-foreground">(not in this prototype)</span>
                </>
              ) : (
                <ItemLink href={section.href} onClick={(event) => (event.preventDefault(), go(section.href))}>
                  {section.title}
                </ItemLink>
              )}
            </ItemTitle>
            <ItemDescription>{section.description}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}

/** s01. LUKA DS G03: brak ekranu `/` dla gościa, mentee i mentora – najprostsza wersja z `Item` (bez hero i kart). Stany: s01.1-s01.4 wg roli, s01.5 ładowanie sesji (c09), s01.6 błąd sesji (c08). */
export function StartScreen() {
  const session = sessionAccount(useStore());
  const load = useLoad();
  const me = load.status === "ready" ? session : null;
  const sections: Section[] = [{ title: "Mentors", href: "/mentors", description: "Senior engineers who answer in writing, 25 or 50 minutes per session." }];
  if (me?.role === "mentor") sections.unshift({ title: "Overview", href: "/mentor", description: "What mentees need before they can book you." });
  if (me?.role === "admin") sections.unshift({ title: "Admin", href: "/admin", description: "Manage accounts and invite mentors." });
  return (
    <Page current="/" title="DevMentor" description="Get help with one problem from a senior engineer, in writing. Sessions are 25 or 50 minutes." sessionLoading={load.status === "loading"} asGuest={load.status === "error"}>
      {load.status === "loading" && (
        <div role="status" aria-label="Checking your session" className="flex flex-col gap-in-group">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-5 w-64" />
        </div>
      )}
      {load.status === "error" && load.error && <ErrorMessage title="We could not check your session" error={load.error} onRetry={load.retry} />}
      {load.status !== "loading" && <Sections label="Where to go" sections={sections} />}
      {load.status !== "loading" && !me && (
        <p className="type-body text-muted-foreground">
          Have an account? <Link className="link-text" href="/login">Log in</Link>. New here? <Link className="link-text" href="/register">Register</Link>.
        </p>
      )}
    </Page>
  );
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.email("Enter an email address, like ola@example.com."),
  password: z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters.").meta({ input: "password" }),
});
const registerFields: CrudFormField<typeof registerSchema>[] = [
  { name: "name", label: "Name", autoComplete: "name", description: "Mentors see this name on your bookings." },
  { name: "email", label: "Email", autoComplete: "email" },
  { name: "password", label: "Password", autoComplete: "new-password", description: "12 to 128 characters." },
];

/** s02: stany s02.1-s02.8. 429 = c06 (rejestracja mentee), 409 = c04 albo e-mail istniejącego konta (A07), sieć = c08, "już zalogowany" bez blokady (A10). */
export function RegisterScreen() {
  const me = sessionAccount(useStore());
  return (
    <Page current="/register" title="Register" description="Create a mentee account to book sessions." width="narrow">
      {me && <p className="type-meta text-muted-foreground">You are signed in as {me.name}. Registering creates a new account and replaces the session.</p>}
      <CrudForm
        schema={registerSchema}
        fields={registerFields}
        submitLabel="Create account"
        errorTitle="Could not create the account"
        onSubmit={(values) => registerMentee(values.name, values.email, values.password)}
        onSuccess={() => go(ROLE_LANDING.mentee)}
      />
      <p className="type-body text-muted-foreground">
        Already have an account? <Link className="link-text" href="/login">Log in</Link>
      </p>
      <p className="type-meta text-muted-foreground">Prototype: the account is simulated. The password is kept in this tab only and is never sent.</p>
    </Page>
  );
}

const loginSchema = z.object({
  email: z.email("Enter the email address you registered with."),
  password: z.string().min(1, "Enter your password.").meta({ input: "password" }),
});
const loginFields: CrudFormField<typeof loginSchema>[] = [
  { name: "email", label: "Email", autoComplete: "email" },
  { name: "password", label: "Password", autoComplete: "current-password" },
];

/** s03: stany s03.1-s03.8. LUKA DS G02: komunikat nad formularzem ("Your session has ended", bramka) to `Alert` z DS, bez osobnego wariantu. */
export function LoginScreen() {
  const state = useStore();
  const me = sessionAccount(state);
  return (
    <Page current="/login" title="Log in" width="narrow">
      {state.notice && (
        <Alert role="status">
          <AlertDescription>{state.notice}</AlertDescription>
        </Alert>
      )}
      {me && <p className="type-meta text-muted-foreground">You are signed in as {me.name}. A new login replaces the session.</p>}
      <div className="flex flex-col gap-between-groups">
        <CrudForm
          schema={loginSchema}
          fields={loginFields}
          submitLabel="Log in"
          errorTitle="Could not log in"
          onSubmit={(values) => login(values.email, values.password)}
          onSuccess={afterLogin}
        />
        <p className="type-body text-muted-foreground">
          No account yet? <Link className="link-text" href="/register">Register</Link>
        </p>
        <p className="type-meta text-muted-foreground">Forgot your password? Ask the founders to reset it. There is no reset page.</p>
      </div>
      <section aria-labelledby="demo-accounts" className="flex flex-col gap-in-group">
        <h2 id="demo-accounts" className="type-section-title">
          Demo accounts
        </h2>
        <p className="type-meta text-muted-foreground">Prototype: log-in is a simulation. Nothing is sent or stored; these passwords are fictitious.</p>
        <ul className="flex flex-col gap-in-group type-meta">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.id}>
              <span className="type-label">{account.role}</span>: {account.email} <span className="type-code">{account.password}</span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}

const mentorSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  password: z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters.").meta({ input: "password" }),
});
const mentorFields: CrudFormField<typeof mentorSchema>[] = [
  { name: "name", label: "Name", autoComplete: "name", description: "Shown on your public profile and your share link." },
  { name: "password", label: "Password", autoComplete: "new-password", description: "12 to 128 characters." },
];

const TITLE = "Join DevMentor as a mentor";

function InvalidInvitation({ extra }: { extra?: string }) {
  return (
    <Alert role="status">
      <AlertTitle>This invitation is no longer valid</AlertTitle>
      <AlertDescription>
        {extra ? `${extra} ` : ""}Links work once and for 14 days. Ask the founders for a new link.
      </AlertDescription>
    </Alert>
  );
}

/** s04: s04.1 sprawdzanie linku, .2 formularz, .3 nieważny (też .10 bez tokenu), .4 użyty w międzyczasie (c03), .5 walidacja, .6 konflikt (c04), .7 limit (c06), .8 sieć (c08), .9 sukces, .11 zalogowany (A10). */
function RegisterMentorInner({ token }: { token: string | undefined }) {
  const me = sessionAccount(useStore());
  const load = useLoad(300);
  const [lost, setLost] = useState(false);

  if (load.status === "loading") {
    return (
      <Page current="" title={TITLE} width="narrow">
        <div role="status" aria-label="Checking the invitation" className="flex flex-col gap-between-groups">
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-control w-full" />
        </div>
      </Page>
    );
  }
  if (load.status === "error" && load.error) {
    return (
      <Page current="" title={TITLE} width="narrow">
        <ErrorMessage title="Could not check the invitation" error={load.error} onRetry={load.retry} />
      </Page>
    );
  }
  const invited = lost ? null : checkInvitation(token);
  if (!invited) {
    return (
      <Page current="" title={TITLE} width="narrow">
        <InvalidInvitation extra={lost ? "Someone used this link while you were filling in the form. Your account was not created." : undefined} />
      </Page>
    );
  }
  return (
    <Page current="" title={TITLE} description={`You were invited as ${invited.email}. Choose the name mentees will see and a password.`} width="narrow">
      {me && <p className="type-meta text-muted-foreground">You are signed in as {me.name}. Creating this account signs you out of it.</p>}
      <CrudForm
        schema={mentorSchema}
        fields={mentorFields}
        submitLabel="Create mentor account"
        errorTitle="Could not create the account"
        onSubmit={async (values) => {
          const result = await registerMentor(token as string, values.name, values.password);
          if (!result.ok && result.status === 410) setLost(true);
          return result;
        }}
        onSuccess={() => go(ROLE_LANDING.mentor)}
      />
      <p className="type-meta text-muted-foreground">Prototype: the account is simulated. The password is only checked for length and is kept in this tab only.</p>
    </Page>
  );
}
export function RegisterMentorScreen() {
  const token = useStore().route.token;
  return <RegisterMentorInner key={token ?? "none"} token={token} />;
}

/** s05 (s05.1 domyślny; s05.2/s05.3 = bramka: przekierowanie na /login z komunikatem, L02). */
export function AdminHomeScreen() {
  return (
    <Guard role="admin" path="/admin">
      <Page current="/admin" title="Admin" description="Manage accounts and invite mentors.">
        <Sections
          label="Admin sections"
          sections={[
            { title: "Users", href: "/admin/users", description: "Mentors, mentees and administrators. Not in this prototype." },
            { title: "Invitations", href: "/admin/invitations", description: "Invite a mentor by email; each link works once, for 14 days." },
          ]}
        />
      </Page>
    </Guard>
  );
}

/** s12 (s12.3 nie znaleziono). LUKA DS G01: brak strony; wersja z `EmptyState` + link. 401/403 przechodzą na /login (L02), s12.4 = /login z "Your session has ended" (L03). */
export function NotFoundScreen() {
  return (
    <Page current="" title="Page not found">
      <EmptyState title="We could not find this page" description="Check the address, or go back to the start page." action={<Link className="link-text" href="/">Go to the start page</Link>} />
    </Page>
  );
}

export { renderLink };

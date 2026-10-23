// s01 start, s02 (placeholder), s03 logowanie, s04 rejestracja mentora, s05 admin, s12 nie znaleziono.
import { useEffect, useState } from "react";
import { z } from "zod";

import { CrudForm, type CrudFormField } from "@devmentor/ui/backend/forms/CrudForm";
import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { Alert, AlertDescription, AlertTitle } from "@devmentor/ui/components/ui/alert";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemTitle } from "@devmentor/ui/components/ui/item";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";

import { Page } from "../chrome";
import { afterLogin, go, Link, renderLink, ROLE_LANDING } from "../nav";
import { checkInvitation, DEMO_ACCOUNTS, login, registerMentor, sessionAccount, useStore } from "../sim/store";

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

/** s01. LUKA DS G03: brak ekranu `/` dla gościa, mentee i mentora – najprostsza wersja z `Item` (bez hero i kart). */
export function StartScreen() {
  const me = sessionAccount(useStore());
  const sections: Section[] = [{ title: "Mentors", href: "/mentors", description: "Senior engineers who answer in writing, 25 or 50 minutes per session." }];
  if (me?.role === "mentor") sections.unshift({ title: "Overview", href: "/mentor", description: "What mentees need before they can book you." });
  if (me?.role === "admin") sections.unshift({ title: "Admin", href: "/admin", description: "Manage accounts and invite mentors." });
  return (
    <Page current="/" title="DevMentor" description="Get help with one problem from a senior engineer, in writing. Sessions are 25 or 50 minutes.">
      <Sections label="Where to go" sections={sections} />
      {!me && (
        <p className="type-body text-muted-foreground">
          Have an account? <Link className="link-text" href="/login">Log in</Link>. New here? <Link className="link-text" href="/register">Register</Link>.
        </p>
      )}
    </Page>
  );
}

/** s02: poza etapem 1 (zadanie domowe). Ekran jest oznaczony, żeby link "Register" nie był martwy. */
export function RegisterPlaceholder() {
  return (
    <Page current="/register" title="Register" width="narrow">
      <Alert role="status">
        <AlertTitle>Not built in this stage of the prototype</AlertTitle>
        <AlertDescription>Mentee registration (s02) is planned for stage 2. To see a signed-in view now, choose a role in the review bar or use Log in.</AlertDescription>
      </Alert>
      <p className="type-body">
        <Link className="link-text" href="/login">Go to Log in</Link>
      </p>
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

/** s03. G02: "Your session has ended" wymaga osobnego wariantu (etap 2); tu komunikat bramki jako `Alert`. */
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
      {me && (
        <p className="type-meta text-muted-foreground">
          You are signed in as {me.name}. A new login replaces the session.
        </p>
      )}
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

/** s04: sprawdzenie linku (s04.1), formularz z zaproszonym adresem (s04.2), link nieważny (s04.3), sukces (s04.9). */
export function RegisterMentorScreen() {
  const token = useStore().route.token;
  const [done, setDone] = useState<string | undefined>();
  useEffect(() => {
    const timer = setTimeout(() => setDone(token ?? ""), 300);
    return () => clearTimeout(timer);
  }, [token]);
  const checked = done === (token ?? "") ? done : undefined;
  const invited = checked === undefined ? undefined : checkInvitation(checked);

  if (checked === undefined) {
    return (
      <Page current="" title="Join DevMentor as a mentor" width="narrow">
        <div role="status" aria-label="Checking the invitation" className="flex flex-col gap-between-groups">
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-control w-full" />
        </div>
      </Page>
    );
  }
  if (!invited) {
    return (
      <Page current="" title="Join DevMentor as a mentor" width="narrow">
        <Alert role="status">
          <AlertTitle>This invitation is no longer valid</AlertTitle>
          <AlertDescription>Links work once and for 14 days. Ask the founders for a new link.</AlertDescription>
        </Alert>
      </Page>
    );
  }
  return (
    <Page current="" title="Join DevMentor as a mentor" description={`You were invited as ${invited.email}. Choose the name mentees will see and a password.`} width="narrow">
      <CrudForm
        schema={mentorSchema}
        fields={mentorFields}
        submitLabel="Create mentor account"
        errorTitle="Could not create the account"
        onSubmit={(values) => registerMentor(checked, values.name, values.password)}
        onSuccess={() => go(ROLE_LANDING.mentor)}
      />
      <p className="type-meta text-muted-foreground">Prototype: the account is simulated. The password is only checked for length and is not stored.</p>
    </Page>
  );
}

/** s05 */
export function AdminHomeScreen() {
  return (
    <Page current="/admin" title="Admin" description="Manage accounts and invite mentors.">
      <Sections
        label="Admin sections"
        sections={[
          { title: "Users", href: "/admin/users", description: "Mentors, mentees and administrators. Not in this prototype." },
          { title: "Invitations", href: "/admin/invitations", description: "Invite a mentor by email; each link works once, for 14 days." },
        ]}
      />
    </Page>
  );
}

/** s12 (stan s12.3). LUKA DS G01: brak strony; wersja z `EmptyState` + link. 401/403 przechodzą na /login (L02). */
export function NotFoundScreen() {
  return (
    <Page current="" title="Page not found">
      <EmptyState
        title="We could not find this page"
        description="Check the address, or go back to the start page."
        action={<Link className="link-text" href="/">Go to the start page</Link>}
      />
    </Page>
  );
}

export { renderLink };

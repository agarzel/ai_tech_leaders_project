import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../components/site-header";
import { loginPathFor, safeReturnPath } from "../../../lib/return-path";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Create account – DevMentor",
};

// `?from=` is the page that sent the visitor here; it is read at request time, so it sits inside Suspense.
async function RegisterContent({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }) {
  const returnPath = safeReturnPath((await searchParams).from);
  return (
    <>
      <AuthForm mode="register" returnPath={returnPath} />
      <p className="type-body text-muted-foreground">
        Already have an account?{" "}
        <Link href={returnPath ? loginPathFor(returnPath) : "/login"} className="link-text">
          Sign in
        </Link>
        .
      </p>
    </>
  );
}

export default function RegisterPage(props: PageProps<"/register">) {
  return (
    <PageLayout header={<SiteHeader />} title="Create account" description="Create a mentee account to book a session." width="narrow">
      <Suspense>
        <RegisterContent searchParams={props.searchParams} />
      </Suspense>
    </PageLayout>
  );
}

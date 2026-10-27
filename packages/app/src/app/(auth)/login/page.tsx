import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../components/site-header";
import { safeReturnPath } from "../../../lib/return-path";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sign in – DevMentor",
};

// `?from=` is the page that sent the visitor here; it is read at request time, so it sits inside Suspense.
async function LoginContent({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }) {
  const returnPath = safeReturnPath((await searchParams).from);
  return (
    <>
      <AuthForm mode="login" returnPath={returnPath} />
      <p className="type-body text-muted-foreground">
        No account yet?{" "}
        <Link href={returnPath ? `/register?from=${encodeURIComponent(returnPath)}` : "/register"} className="link-text">
          Create one
        </Link>
        .
      </p>
    </>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <PageLayout header={<SiteHeader />} title="Sign in" description="Sign in to book sessions or manage your offer." width="narrow">
      <Suspense>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </PageLayout>
  );
}

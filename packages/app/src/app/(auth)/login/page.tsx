import type { Metadata } from "next";
import Link from "next/link";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../components/site-header";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sign in – DevMentor",
};

export default function LoginPage() {
  return (
    <PageLayout header={<SiteHeader />} title="Sign in" description="Sign in to book sessions or manage your offer." width="narrow">
      <AuthForm mode="login" />
      <p className="type-body text-muted-foreground">
        No account yet?{" "}
        <Link href="/register" className="link-text">
          Create one
        </Link>
        .
      </p>
    </PageLayout>
  );
}

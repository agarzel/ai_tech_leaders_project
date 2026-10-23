import type { Metadata } from "next";
import Link from "next/link";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../components/site-header";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Create account – DevMentor",
};

export default function RegisterPage() {
  return (
    <PageLayout header={<SiteHeader />} title="Create account" description="Create a mentee account to book a session." width="narrow">
      <AuthForm mode="register" />
      <p className="type-body text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="link-text">
          Sign in
        </Link>
        .
      </p>
    </PageLayout>
  );
}

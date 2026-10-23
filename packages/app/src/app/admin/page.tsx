import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "@devmentor/ui/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@devmentor/ui/components/ui/card";
import { createRequestScope } from "@devmentor/core";

export const metadata: Metadata = {
  title: "Admin – DevMentor",
};

const sections = [
  { title: "Users", description: "Mentors, mentees and administrators.", href: "/admin/users" },
  { title: "Invitations", description: "Invite mentors by link.", href: "/admin/invitations" },
  { title: "Mentors", description: "Profiles, verification and visibility." },
  { title: "Sessions", description: "Bookings, availability and calendar." },
  { title: "Payments", description: "Payouts, refunds and disputes." },
];

async function DatabaseStatus() {
  await connection();

  const { healthService } = (await createRequestScope()).cradle;
  const health = await healthService.check();

  return health.status === "ok" ? (
    <Badge variant="secondary">Database: connected</Badge>
  ) : (
    <Badge variant="destructive">Database: unreachable</Badge>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
          <p className="text-muted-foreground text-sm">
            Manage the DevMentor marketplace.
          </p>
        </div>
        <Suspense fallback={<Badge variant="outline">Database: checking…</Badge>}>
          <DatabaseStatus />
        </Suspense>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const card = (
            <Card className={section.href ? "hover:bg-muted/50 h-full transition-colors" : "h-full opacity-60"}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.href ? section.description : `${section.description} Coming soon.`}</CardDescription>
              </CardHeader>
            </Card>
          );
          return section.href ? (
            <Link key={section.title} href={section.href} className="rounded-xl">
              {card}
            </Link>
          ) : (
            <div key={section.title}>{card}</div>
          );
        })}
      </section>
    </main>
  );
}

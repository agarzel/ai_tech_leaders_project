import type { Metadata } from "next";
import Link from "next/link";
import { InvitationsAdmin } from "./invitations-admin";

export const metadata: Metadata = {
  title: "Invitations – Admin – DevMentor",
};

export default function InvitationsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <header className="space-y-1">
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← Admin panel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
        <p className="text-muted-foreground text-sm">Mentors join DevMentor only through a link you create here.</p>
      </header>
      <InvitationsAdmin />
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { UsersAdmin } from "./users-admin";

export const metadata: Metadata = {
  title: "Users – Admin – DevMentor",
};

export default function UsersPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <header className="space-y-1">
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← Admin panel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">Mentors, mentees and administrators.</p>
      </header>
      <UsersAdmin />
    </main>
  );
}

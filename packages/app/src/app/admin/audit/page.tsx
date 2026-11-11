import type { Metadata } from "next";
import Link from "next/link";
import { AuditAdmin } from "./audit-admin";

export const metadata: Metadata = {
  title: "Audit log – Admin – DevMentor",
};

export default function AuditPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <header className="space-y-1">
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← Admin panel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground text-sm">Who changed roles, deleted users and invited mentors – and every failed login.</p>
      </header>
      <AuditAdmin />
    </main>
  );
}

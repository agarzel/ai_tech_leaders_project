import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../components/site-header";
import { requireUser } from "../../../lib/require-user";
import { BookingsList } from "./bookings-list";

export const metadata: Metadata = {
  title: "My bookings – DevMentor",
};

async function Gate() {
  await connection();
  await requireUser("/bookings");
  return <BookingsList />;
}

export default function BookingsPage() {
  return (
    <PageLayout header={<SiteHeader />} title="My bookings" description="Your sessions and where each one stands.">
      <Suspense fallback={<LoadingMessage />}>
        <Gate />
      </Suspense>
    </PageLayout>
  );
}

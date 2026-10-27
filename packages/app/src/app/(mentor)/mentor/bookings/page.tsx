import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../components/site-header";
import { MentorBookings } from "./mentor-bookings";

export const metadata: Metadata = {
  title: "Bookings – DevMentor",
};

export default function MentorBookingsPage() {
  return (
    <PageLayout header={<SiteHeader />} title="Bookings" description="Read the question, then accept or decline before the deadline.">
      <Suspense fallback={<LoadingMessage />}>
        <MentorBookings />
      </Suspense>
    </PageLayout>
  );
}

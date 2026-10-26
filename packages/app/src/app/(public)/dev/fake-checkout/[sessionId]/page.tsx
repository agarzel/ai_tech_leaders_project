import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createRequestScope } from "@devmentor/core";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../../components/site-header";
import { isNotFound } from "../../../../../lib/require-user";
import { FakeCheckoutForm } from "./fake-checkout-form";

export const metadata: Metadata = {
  title: "Fake checkout – DevMentor",
};

// Only exists with PAYMENTS_PROVIDER=fake: the service answers not found for any other provider.
async function Checkout({ params }: { params: Promise<{ sessionId: string }> }) {
  await connection();
  const { sessionId } = await params;
  const { fakeCheckoutService } = (await createRequestScope()).cradle;
  let session;
  try {
    session = fakeCheckoutService.describe(sessionId);
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
  return <FakeCheckoutForm sessionId={session.sessionId} amount={session.amount} currency={session.currency} description={session.description} />;
}

export default function FakeCheckoutPage(props: PageProps<"/dev/fake-checkout/[sessionId]">) {
  return (
    <PageLayout header={<SiteHeader />} title="Fake checkout" description="Development only. No card is charged.">
      <Suspense>
        <Checkout params={props.params} />
      </Suspense>
    </PageLayout>
  );
}

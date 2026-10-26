import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createRequestScope } from "@devmentor/core";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../../components/site-header";
import { isNotFound } from "../../../../../lib/require-user";
import { FakeCheckoutForm } from "./fake-checkout-form";

export const metadata: Metadata = {
  title: "Fake checkout – DevMentor",
};

// Only exists with PAYMENTS_PROVIDER=fake: the service answers not found for any other provider.
// The lookup runs before anything streams: notFound() inside a Suspense boundary would answer 200, not 404.
// A blocking route: the lookup is not cached and cannot sit inside Suspense, so the shell is not prerendered.
export const instant = false;

export default async function FakeCheckoutPage(props: PageProps<"/dev/fake-checkout/[sessionId]">) {
  await connection();
  const { sessionId } = await props.params;
  const { fakeCheckoutService } = (await createRequestScope()).cradle;
  let session;
  try {
    session = fakeCheckoutService.describe(sessionId);
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
  return (
    <PageLayout header={<SiteHeader />} title="Fake checkout" description="Development only. No card is charged.">
      <FakeCheckoutForm sessionId={session.sessionId} amount={session.amount} currency={session.currency} description={session.description} />
    </PageLayout>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createRequestScope } from "@devmentor/core";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SlotBookActions } from "@devmentor/ui/components/bookings/SlotBookActions";
import { buttonVariants } from "@devmentor/ui/components/ui/button";
import { SiteHeader } from "../../../../components/site-header";
import { isNotFound, requireUser } from "../../../../lib/require-user";
import { BookFlow } from "./book-flow";

export const metadata: Metadata = {
  title: "Book a session – DevMentor",
};

type SearchParams = Promise<{ length?: string | string[]; from?: string | string[] }>;

async function BookContent({ params, searchParams }: { params: Promise<{ slotId: string }>; searchParams: SearchParams }) {
  await connection();
  const { slotId } = await params;
  const query = await searchParams;
  const length = query.length === "25" ? 25 : query.length === "50" ? 50 : null;
  // Where the visitor came from is recorded with the booking (A04); anything unexpected counts as `unknown`.
  const from = typeof query.from === "string" ? query.from : undefined;
  const entryPoint = from === undefined || from === "link" ? "link" : from === "list" ? "list" : "unknown";

  const returnQuery = new URLSearchParams({ ...(length ? { length: String(length) } : {}), ...(from ? { from } : {}) }).toString();
  const user = await requireUser(`/book/${encodeURIComponent(slotId)}${returnQuery ? `?${returnQuery}` : ""}`);

  const { bookingQueryService } = (await createRequestScope()).cradle;
  let offer;
  try {
    offer = await bookingQueryService.getOffer(user.id, slotId);
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }

  if (offer.ownSlot) {
    return <EmptyState title="This is your own time" description="You cannot book your own time. Mentors can book other mentors." />;
  }
  if (!offer.bookable) {
    return (
      <EmptyState
        title="This time is no longer available"
        description="It was booked, or it starts too soon. Pick another time."
        action={
          <Link href={`/m/${offer.mentor.slug}`} className={buttonVariants({ variant: "outline" })}>
            See {offer.mentor.name}&apos;s times
          </Link>
        }
      />
    );
  }

  const priceAmount = length === 25 ? offer.mentor.price25 : length === 50 ? offer.mentor.price50 : null;
  if (!length || priceAmount === null) {
    return (
      <section aria-labelledby="length-heading" className="flex flex-col gap-in-group">
        <h2 id="length-heading" className="type-section-title">
          Choose a session length
        </h2>
        <SlotBookActions
          slotLabel={offer.startsAt}
          price25={offer.mentor.price25}
          price50={offer.mentor.price50}
          currency={offer.mentor.currency}
          hrefFor={(chosen) => `/book/${offer.slotId}?length=${chosen}&from=${entryPoint}`}
        />
      </section>
    );
  }

  return (
    <BookFlow
      slotId={offer.slotId}
      startsAt={offer.startsAt}
      mentorName={offer.mentor.name}
      lengthMinutes={length}
      priceAmount={priceAmount}
      currency={offer.mentor.currency}
      entryPoint={entryPoint}
    />
  );
}

export default function BookPage(props: PageProps<"/book/[slotId]">) {
  return (
    <PageLayout header={<SiteHeader />} title="Book a session" description="One problem, one text session, paid up front.">
      <Suspense fallback={<LoadingMessage />}>
        <BookContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </PageLayout>
  );
}

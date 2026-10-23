// s10 Lista mentorów (stan domyślny), s11 Strona mentora (link do udostępniania).
import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { ResultCount } from "@devmentor/ui/backend/filters/ResultCount";
import { SlotList } from "@devmentor/ui/components/availability/SlotList";
import { MentorCard } from "@devmentor/ui/components/mentors/MentorCard";
import { MentorProfileHeader } from "@devmentor/ui/components/mentors/MentorProfileHeader";
import { PriceList } from "@devmentor/ui/components/mentors/PriceList";
import { Button } from "@devmentor/ui/components/ui/button";
import { ItemGroup } from "@devmentor/ui/components/ui/item";
import { formatDateTime } from "@devmentor/ui/lib/format";

import { Page } from "../chrome";
import { Link, renderLink } from "../nav";
import { listedMentors, mentorBySlug, TIME_ZONE, useStore } from "../sim/store";

/** s10.1. Filtr, paginacja i stany błędów: etap 2. Bez ocen (N02). */
export function MentorsScreen() {
  const mentors = listedMentors(useStore());
  return (
    <Page current="/mentors" title="Mentors" description="Senior engineers who answer in writing. Prices are per session; times are shown in Europe/Warsaw. A time can be booked at least 24 hours ahead.">
      <section aria-label="Mentor list" className="flex flex-col gap-in-group">
        <ResultCount total={mentors.length} noun="mentor" />
        {mentors.length === 0 ? (
          <EmptyState title="No mentors here yet" description="Mentors appear once they have set their prices and published a time. Check back soon." />
        ) : (
          <ItemGroup aria-label="Mentors">
            {mentors.map((mentor) => (
              <MentorCard key={mentor.slug} mentor={mentor} href={`/m/${mentor.slug}`} timeZone={TIME_ZONE} renderLink={renderLink} />
            ))}
          </ItemGroup>
        )}
      </section>
    </Page>
  );
}

const REASON_ID = "booking-reason";

/** s11: /m/[slug]. *Book* jest wyłączony z powodem napisanym tekstem (L05); 24 h wprost na stronie (L14, D13). */
export function MentorPageScreen() {
  const state = useStore();
  const mentor = mentorBySlug(state.route.slug, state);
  if (!mentor) {
    return (
      <Page current="" title="Mentor not found">
        <EmptyState
          title="We could not find this mentor"
          description="Check the link you were given, or look at the mentors who are on the list."
          action={<Link className="link-text" href="/mentors">See all mentors</Link>}
        />
      </Page>
    );
  }
  return (
    <Page current="" title={mentor.name}>
      <MentorProfileHeader mentor={mentor} />
      <section aria-labelledby="prices" className="flex max-w-xs flex-col gap-in-group">
        <h2 id="prices" className="type-section-title">
          Prices
        </h2>
        <PriceList price25={mentor.price25} price50={mentor.price50} currency={mentor.currency} />
      </section>
      <section aria-labelledby="times" className="flex flex-col gap-between-groups">
        <div className="flex flex-col gap-in-group">
          <h2 id="times" className="type-section-title">
            Available times
          </h2>
          <p id={REASON_ID} className="max-w-prose type-body text-muted-foreground">
            Booking is not open in this prototype, so Book is disabled. Times can be booked at least 24 hours ahead and are shown in Europe/Warsaw.
          </p>
        </div>
        <SlotList
          slots={mentor.slots}
          timeZone={TIME_ZONE}
          showStatus={false}
          emptyTitle="No times available right now"
          emptyDescription="Times can be booked at least 24 hours ahead. Check back soon."
          rowActions={(slot) => (
            <Button variant="outline" size="sm" disabled aria-describedby={REASON_ID} aria-label={`Book ${formatDateTime(slot.startsAt, TIME_ZONE)}`}>
              Book
            </Button>
          )}
        />
      </section>
    </Page>
  );
}

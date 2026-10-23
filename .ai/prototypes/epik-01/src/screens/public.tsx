// s10 Lista mentorów, s11 Strona mentora (link do udostępniania).
import { useId, useState } from "react";

import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { ActiveFilters } from "@devmentor/ui/backend/filters/ActiveFilters";
import { ResultCount } from "@devmentor/ui/backend/filters/ResultCount";
import { Pagination } from "@devmentor/ui/backend/tables/Pagination";
import { SlotList, SlotListSkeleton } from "@devmentor/ui/components/availability/SlotList";
import { MentorCard, MentorCardSkeleton } from "@devmentor/ui/components/mentors/MentorCard";
import { MentorProfileHeader } from "@devmentor/ui/components/mentors/MentorProfileHeader";
import { PriceList } from "@devmentor/ui/components/mentors/PriceList";
import { Button } from "@devmentor/ui/components/ui/button";
import { Field, FieldLabel } from "@devmentor/ui/components/ui/field";
import { ItemGroup } from "@devmentor/ui/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@devmentor/ui/components/ui/native-select";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";
import { formatDateTime } from "@devmentor/ui/lib/format";

import { Page } from "../chrome";
import { useLoad } from "../load";
import { Link, renderLink } from "../nav";
import { listedMentors, mentorBySlug, PAGE_SIZE, setScenario, TAG_OPTIONS, TIME_ZONE, unfilteredCount, useStore } from "../sim/store";

/** s10: .1 domyślny, .2 filtr stosu (c21), .3 brak wyników, .4 nikt na liście (c20 pusta), .5 ładowanie, .6 błąd, .7 25 mentorów z paginacją (c20), .8 długie wartości i częściowy profil (c20). Bez ocen (N02). */
export function MentorsScreen() {
  const state = useStore();
  const selectId = useId();
  const load = useLoad();
  const [page, setPage] = useState(1);
  const tag = state.sc.filter;
  const all = listedMentors(state);
  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const options = tag && !TAG_OPTIONS.includes(tag) ? [...TAG_OPTIONS, tag] : TAG_OPTIONS;
  const changeTag = (value: string) => {
    setPage(1);
    setScenario({ filter: value });
  };
  const filters = tag ? [{ key: "tag", label: `Stack: ${tag}` }] : [];
  return (
    <Page current="/mentors" title="Mentors" description="Senior engineers who answer in writing. Prices are per session; times are shown in Europe/Warsaw. A time can be booked at least 24 hours ahead.">
      <div className="flex flex-col gap-in-group">
        <Field className="max-w-48">
          <FieldLabel htmlFor={selectId}>Stack</FieldLabel>
          <NativeSelect id={selectId} value={tag} onChange={(event) => changeTag(event.target.value)}>
            <NativeSelectOption value="">All</NativeSelectOption>
            {options.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <ActiveFilters filters={filters} onRemove={() => changeTag("")} onClearAll={() => changeTag("")} label="Mentor filters" />
      </div>
      <section aria-label="Mentor list" className="flex flex-col gap-in-group">
        {load.status === "error" && load.error ? (
          <ErrorMessage title="Could not load the mentors" error={load.error} onRetry={load.retry} />
        ) : load.status === "loading" ? (
          <MentorCardSkeleton />
        ) : (
          <>
            <ResultCount total={all.length} noun="mentor" />
            {all.length === 0 ? (
              tag && unfilteredCount(state) > 0 ? (
                <EmptyState
                  title="No mentors match this filter"
                  description={`Nobody with ${tag} has a time to book right now.`}
                  action={
                    <Button variant="outline" onClick={() => changeTag("")}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState title="No mentors here yet" description="Mentors appear once they have set their prices and published a time that can be booked. Check back soon." />
              )
            ) : (
              <>
                <ItemGroup aria-label="Mentors">
                  {visible.map((mentor) => (
                    <MentorCard key={mentor.slug} mentor={mentor} href={`/m/${mentor.slug}`} timeZone={TIME_ZONE} renderLink={renderLink} />
                  ))}
                </ItemGroup>
                {all.length > PAGE_SIZE && <Pagination page={current} pageSize={PAGE_SIZE} total={all.length} onPageChange={setPage} label="Mentors pages" />}
              </>
            )}
          </>
        )}
      </section>
    </Page>
  );
}

const REASON_ID = "booking-reason";

/** s11: .1 domyślny, .2 *Book* wyłączony z powodem (L05), .3 brak terminów, .4 nie znaleziono, .5 częściowy profil, .6 długie wartości i 60 slotów, .7 ładowanie, .8 błąd. 24 h wprost (L14, D13). */
export function MentorPageScreen() {
  const state = useStore();
  const load = useLoad();
  if (load.status === "loading") {
    return (
      <Page current="" title="Mentor">
        <div role="status" aria-label="Loading the mentor" className="flex flex-col gap-between-groups">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-full max-w-prose" />
          <SlotListSkeleton />
        </div>
      </Page>
    );
  }
  if (load.status === "error" && load.error) {
    return (
      <Page current="" title="Mentor">
        <ErrorMessage title="Could not load this mentor" error={load.error} onRetry={load.retry} />
      </Page>
    );
  }
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

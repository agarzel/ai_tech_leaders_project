// s07 Panel mentora, s08 Profil i ceny, s09 Terminy.
import { useEffect } from "react";

import { CopyField } from "@devmentor/ui/backend/forms/CopyField";
import { AddSlotForm } from "@devmentor/ui/components/availability/AddSlotForm";
import { SlotList } from "@devmentor/ui/components/availability/SlotList";
import { MentorProfileForm } from "@devmentor/ui/components/mentors/MentorProfileForm";
import { OfferChecklist, OfferChecklistSkeleton } from "@devmentor/ui/components/mentors/OfferChecklist";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";

import { Page } from "../chrome";
import { Guard, Link, renderLink } from "../nav";
import { addSlot, ensureProfile, offerOf, saveProfile, sessionAccount, TAG_OPTIONS, TIME_ZONE, useStore } from "../sim/store";

const shareUrl = (slug: string) => `https://devmentor.example/m/${slug}`;

/** Sterowanie prototypu (nie produktu): w przeglądarce link do udostępniania otwiera stronę mentora, tu symulujemy to kliknięciem. */
function OpenShareLink({ slug }: { slug: string }) {
  return (
    <p className="type-meta text-muted-foreground">
      Prototype: <Link className="link-text" href={`/m/${slug}`}>open this link as a visitor (simulated)</Link>.
    </p>
  );
}

function useOwnProfile() {
  const state = useStore();
  const me = sessionAccount(state);
  useEffect(() => {
    if (me) ensureProfile(me.id);
  }, [me]);
  return { state, me, profile: me ? state.profiles[me.id] : undefined };
}

/** s07: lista kontrolna do stanu "bookable". Profil powstaje leniwie przy pierwszej wizycie (U16). */
function MentorHome() {
  const { state, me, profile } = useOwnProfile();
  const offer = me ? offerOf(me.id, state) : null;
  return (
    <Page current="/mentor" title="Overview" description="What mentees need before they can book you.">
      {!me || !profile || !offer ? (
        <OfferChecklistSkeleton />
      ) : (
        <div className="flex flex-col gap-between-groups">
        <OfferChecklist
          profileComplete={offer.profileComplete}
          pricesSet={offer.pricesSet}
          bookableSlots={offer.bookableSlots}
          slotsTooSoon={offer.slotsTooSoon}
          shareUrl={shareUrl(profile.slug)}
          listed={profile.listed}
          hrefs={{ profile: "/mentor/profile", slots: "/mentor/slots" }}
          renderLink={renderLink}
        />
        <OpenShareLink slug={profile.slug} />
        </div>
      )}
    </Page>
  );
}
export const MentorHomeScreen = () => (
  <Guard role="mentor" path="/mentor">
    <MentorHome />
  </Guard>
);

/** s08: profil, ceny i opt-in (Checkbox zapisywany z formularzem, P2). Link do udostępniania od pierwszego zapisu (L08). */
function MentorProfile() {
  const { me, profile } = useOwnProfile();
  return (
    <Page current="/mentor/profile" title="Profile and prices" description="What mentees see on your share link and on the public list.">
      {!me || !profile ? (
        <div role="status" aria-label="Loading your profile" className="flex max-w-xl flex-col gap-between-groups">
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <MentorProfileForm
            key={me.id}
            initialValues={{
              name: me.name,
              headline: profile.headline ?? "",
              bio: profile.bio ?? "",
              tags: profile.tags,
              links: profile.links,
              price25: profile.price25,
              price50: profile.price50,
              listed: profile.listed,
            }}
            tagOptions={TAG_OPTIONS}
            currency="PLN"
            onSubmit={(values) => saveProfile(me.id, values)}
          />
          {profile.saved && (
            <section aria-labelledby="share-title" className="flex max-w-xl flex-col gap-in-group">
              <h2 id="share-title" className="type-section-title">
                Your share link
              </h2>
              <CopyField label="Your share link" value={shareUrl(profile.slug)} description="Anyone with this link can see your profile and your open times." />
              <OpenShareLink slug={profile.slug} />
            </section>
          )}
        </>
      )}
    </Page>
  );
}
export const MentorProfileScreen = () => (
  <Guard role="mentor" path="/mentor/profile">
    <MentorProfile />
  </Guard>
);

/** s09: dodawanie slotów i lista wg dni. LUKA DS G05: brak siatki kalendarza. Usuwanie slotów: etap 2. */
function MentorSlots() {
  const state = useStore();
  const me = sessionAccount(state);
  return (
    <Page current="/mentor/slots" title="Slots" description="Times mentees can book. Each one blocks 50 minutes, and a time can be booked only if it starts at least 24 hours from now.">
      <section aria-labelledby="add-slot" className="flex flex-col gap-between-groups">
        <h2 id="add-slot" className="type-section-title">
          Add a slot
        </h2>
        <AddSlotForm timeZone={TIME_ZONE} onSubmit={(startsAt) => addSlot((me as { id: string }).id, startsAt)} />
      </section>
      <section aria-labelledby="your-slots" className="flex flex-col gap-between-groups">
        <h2 id="your-slots" className="type-section-title">
          Your slots
        </h2>
        <SlotList
          slots={me ? (state.slots[me.id] ?? []) : []}
          timeZone={TIME_ZONE}
          emptyTitle="No slots yet"
          emptyDescription="Add the first time mentees can book you with the form above."
        />
      </section>
    </Page>
  );
}
export const MentorSlotsScreen = () => (
  <Guard role="mentor" path="/mentor/slots">
    <MentorSlots />
  </Guard>
);

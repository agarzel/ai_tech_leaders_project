// s07 Panel mentora, s08 Profil i ceny, s09 Terminy.
import { useEffect } from "react";

import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { CopyField } from "@devmentor/ui/backend/forms/CopyField";
import { AddSlotForm } from "@devmentor/ui/components/availability/AddSlotForm";
import { DeleteSlotDialog } from "@devmentor/ui/components/availability/DeleteSlotDialog";
import { SlotList, SlotListSkeleton } from "@devmentor/ui/components/availability/SlotList";
import { MentorProfileForm } from "@devmentor/ui/components/mentors/MentorProfileForm";
import { OfferChecklist, OfferChecklistSkeleton } from "@devmentor/ui/components/mentors/OfferChecklist";
import { Alert, AlertDescription } from "@devmentor/ui/components/ui/alert";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";

import { Page } from "../chrome";
import { useLoad } from "../load";
import { Guard, Link, renderLink } from "../nav";
import { addSlot, clearFill, deleteSlot, ensureProfile, notVisibleNotice, now, offerOf, saveProfile, sessionAccount, settleBookings, slotsOf, TAG_OPTIONS, TIME_ZONE, useStore } from "../sim/store";

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

/** A09: opt-in włączony, a mentora jeszcze nie widać: czego brakuje (L07). */
function NotVisibleAlert({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <Alert role="status">
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}

/** s07: .1-.5 lista kontrolna (stan z danych, c13), .6 ładowanie (c09), .7 błąd (c08), .8 bramka. Profil powstaje leniwie przy pierwszej wizycie (U16). */
function MentorHome() {
  const { state, me, profile } = useOwnProfile();
  const load = useLoad();
  const offer = me ? offerOf(me.id, state) : null;
  return (
    <Page current="/mentor" title="Overview" description="What mentees need before they can book you.">
      {load.status === "error" && load.error ? (
        <ErrorMessage title="Could not load your overview" error={load.error} onRetry={load.retry} />
      ) : load.status === "loading" || !me || !profile || !offer ? (
        <OfferChecklistSkeleton />
      ) : (
        <div className="flex flex-col gap-between-groups">
          <NotVisibleAlert text={notVisibleNotice(me.id, state)} />
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
          {profile.saved && <OpenShareLink slug={profile.slug} />}
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

/** s08: .1 kompletny, .2 nowy, .3 ładowanie, .4 błąd, .5 zapisywanie, .6 zapisano, .7 walidacja, .8 błąd zapisu, .9/.10 opt-in (Checkbox zapisywany z profilem, A09), .11 ceny nieustawione. Link do udostępniania od pierwszego zapisu (L08). */
function MentorProfile() {
  const { state, me, profile } = useOwnProfile();
  const load = useLoad();
  return (
    <Page current="/mentor/profile" title="Profile and prices" description="What mentees see on your share link and on the public list.">
      {load.status === "error" && load.error ? (
        <ErrorMessage title="Could not load your profile" error={load.error} onRetry={load.retry} />
      ) : load.status === "loading" || !me || !profile ? (
        <div role="status" aria-label="Loading your profile" className="flex max-w-xl flex-col gap-between-groups">
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <NotVisibleAlert text={notVisibleNotice(me.id, state)} />
          <MentorProfileForm
            key={`${me.id}-${state.rev}`}
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

/** Wpisuje datę i godzinę w pola formularza slotu (natywne pola daty i godziny, jak zrobiłby to użytkownik). */
function applyFill(date: string, time: string) {
  const set = (input: HTMLInputElement, value: string) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const dateInput = document.querySelector<HTMLInputElement>(".screen.is-current input[type=date]");
  const timeInput = document.querySelector<HTMLInputElement>(".screen.is-current input[type=time]");
  if (!dateInput || !timeInput) return false;
  set(dateInput, date);
  set(timeInput, time);
  return true;
}

/** s09: .1 lista wg dni, .2 pusta, .3 ładowanie, .4 błąd, .5 dodawanie, .6 dodany, .7 czas odrzucony, .8/.9 DST (c19), .10 potwierdzenie usunięcia, .11 usunięty, .12 konflikt (c16), .13 tylko <24 h, .14 60 slotów (c15), .15 brak cen (L06), .16 bramka. LUKA DS G05: brak siatki kalendarza. */
function MentorSlots() {
  const { state, me, profile } = useOwnProfile();
  const load = useLoad();
  const ready = load.status === "ready";
  useEffect(() => {
    if (me) settleBookings(me.id);
  }, [me]);
  const fill = state.fill;
  useEffect(() => {
    if (!fill) return;
    const timer = setTimeout(() => {
      if (applyFill(fill.date, fill.time)) clearFill();
    }, 50);
    return () => clearTimeout(timer);
  }, [fill]);
  const slots = me ? slotsOf(me.id, state) : [];
  const noPrices = Boolean(profile) && !(profile?.price25 != null && profile?.price50 != null);
  return (
    <Page current="/mentor/slots" title="Slots" description="Times mentees can book. Each one blocks 50 minutes, and a time can be booked only if it starts at least 24 hours from now.">
      {noPrices && (
        <Alert role="status">
          <AlertDescription>You have not set both prices yet. You can add times now; mentees see them once your prices are set.</AlertDescription>
        </Alert>
      )}
      <section aria-labelledby="add-slot" className="flex flex-col gap-between-groups">
        <h2 id="add-slot" className="type-section-title">
          Add a slot
        </h2>
        <AddSlotForm timeZone={TIME_ZONE} onSubmit={(startsAt) => addSlot((me as { id: string }).id, startsAt)} />
      </section>
      <section aria-labelledby="your-slots" className="flex flex-col gap-between-groups">
        <h2 id="your-slots" tabIndex={-1} className="type-section-title outline-none">
          Your slots
        </h2>
        {load.status === "loading" ? (
          <SlotListSkeleton />
        ) : (
          <SlotList
            slots={ready ? slots : undefined}
            error={load.status === "error" ? load.error : null}
            onRetry={load.retry}
            timeZone={TIME_ZONE}
            emptyTitle="No slots yet"
            emptyDescription="Add the first time mentees can book you with the form above."
            rowActions={(slot) =>
              slot.status === "booked" ? (
                <span className="type-meta text-muted-foreground">Cannot be deleted: cancel the booking instead</span>
              ) : new Date(slot.startsAt).getTime() < now(state).getTime() ? (
                <span className="type-meta text-muted-foreground">Past: this time has passed</span>
              ) : (
                <DeleteSlotDialog
                  slot={slot}
                  timeZone={TIME_ZONE}
                  onConfirm={(target) => deleteSlot((me as { id: string }).id, target.id)}
                  onDeleted={() => document.getElementById("your-slots")?.focus()}
                />
              )
            }
          />
        )}
      </section>
    </Page>
  );
}
export const MentorSlotsScreen = () => (
  <Guard role="mentor" path="/mentor/slots">
    <MentorSlots />
  </Guard>
);

import { BOOKING_LEAD_TIME_HOURS, LockMode, MentorProfile, SLOT_BLOCK_MINUTES, Slot, UniqueConstraintViolationException, type EntityManager, type ISlot } from "@devmentor/db";
import type { Clock } from "../../clock";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";

/** Slot start times sit on a grid of this many minutes (spec: Edge Cases, slot rules). */
export const SLOT_GRID_MINUTES = 15;
/** A slot can be published at most this many days ahead. */
export const SLOT_HORIZON_DAYS = 60;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** A slot as the API returns it; `bookable` is the server's single definition (open and starts >= now + 24 h). */
export type SlotDto = {
  id: string;
  startsAt: string;
  status: "open" | "booked";
  bookable: boolean;
};

export class SlotService {
  constructor(private readonly deps: { em: EntityManager; clock: Clock }) {}

  /** Publishes a slot on the caller's own profile. One mentor's slot writes are serialized by a row lock. */
  async publish(userId: string, startsAt: Date): Promise<SlotDto> {
    const now = this.deps.clock.now();
    assertPublishable(startsAt, now);

    return this.deps.em.transactional(async (em) => {
      // SELECT ... FOR UPDATE on the profile: a parallel publish waits here, so the spacing check below is race free.
      const profile = await em.findOne(MentorProfile, { user: userId }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!profile) throw new NotFoundError("Mentor profile not found");

      const spacing = SLOT_BLOCK_MINUTES * MINUTE_MS;
      const neighbours = await em.find(Slot, {
        mentor: profile,
        startsAt: { $gt: new Date(startsAt.getTime() - spacing), $lt: new Date(startsAt.getTime() + spacing) },
      });
      if (neighbours.some((slot) => slot.startsAt.getTime() === startsAt.getTime())) {
        throw new ConflictError("You already have a slot at this time", { startsAt: ["You already have a slot at this time"] });
      }
      if (neighbours.length > 0) {
        throw invalid(`Slots must start at least ${SLOT_BLOCK_MINUTES} minutes apart`);
      }

      const slot = em.create(Slot, { mentor: profile, startsAt });
      try {
        await em.flush();
      } catch (error) {
        // The unique (mentor, starts_at) constraint is the last line of defence.
        if (error instanceof UniqueConstraintViolationException) {
          throw new ConflictError("You already have a slot at this time", { startsAt: ["You already have a slot at this time"] });
        }
        throw error;
      }
      return toDto(slot, now);
    });
  }

  /** Deletes an open slot of the caller. Another mentor's slot looks like a missing one, so ids do not leak. */
  async deleteOwn(userId: string, slotId: string): Promise<void> {
    const slot = await this.deps.em.findOne(Slot, { id: slotId, mentor: { user: userId } });
    if (!slot) throw new NotFoundError("Slot not found");
    if (slot.status !== "open") throw new ConflictError("This slot is booked. Cancel the booking instead");
    await this.deps.em.remove(slot).flush();
  }

  /** Every slot of the caller, soonest first, past ones included. */
  async listForOwner(userId: string): Promise<SlotDto[]> {
    const now = this.deps.clock.now();
    const slots = await this.deps.em.find(Slot, { mentor: { user: userId } }, { orderBy: { startsAt: "asc" } });
    return slots.map((slot) => toDto(slot, now));
  }

  /** The one definition of "bookable": open, starts at least 24 h from now, within the horizon. */
  async listBookable(mentorProfileId: string): Promise<SlotDto[]> {
    const now = this.deps.clock.now();
    const slots = await this.deps.em.find(
      Slot,
      {
        mentor: mentorProfileId,
        status: "open",
        startsAt: { $gte: new Date(now.getTime() + BOOKING_LEAD_TIME_HOURS * HOUR_MS), $lte: horizon(now) },
      },
      { orderBy: { startsAt: "asc" } },
    );
    return slots.map((slot) => toDto(slot, now));
  }
}

function horizon(now: Date): Date {
  return new Date(now.getTime() + SLOT_HORIZON_DAYS * DAY_MS);
}

function invalid(message: string): ValidationError {
  return new ValidationError(message, { startsAt: [message] });
}

function assertPublishable(startsAt: Date, now: Date): void {
  if (startsAt.getTime() % (SLOT_GRID_MINUTES * MINUTE_MS) !== 0) {
    throw invalid(`Start time must be on a ${SLOT_GRID_MINUTES}-minute step (for example 10:00, 10:15)`);
  }
  if (startsAt.getTime() < now.getTime() + BOOKING_LEAD_TIME_HOURS * HOUR_MS) {
    throw invalid(`Start time must be at least ${BOOKING_LEAD_TIME_HOURS} hours from now`);
  }
  if (startsAt.getTime() > horizon(now).getTime()) {
    throw invalid(`Start time can be at most ${SLOT_HORIZON_DAYS} days ahead`);
  }
}

function toDto(slot: ISlot, now: Date): SlotDto {
  const status = slot.status ?? "open";
  return {
    id: slot.id,
    startsAt: slot.startsAt.toISOString(),
    status,
    bookable: status === "open" && slot.startsAt.getTime() >= now.getTime() + BOOKING_LEAD_TIME_HOURS * HOUR_MS,
  };
}

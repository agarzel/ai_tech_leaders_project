import { Booking, CURRENCY, Payment, Slot, type BookingStatus, type EntityManager, type IBooking, type IMentorProfile, type IPayment, type ISlot, type PaymentStatus, type SessionLength } from "@devmentor/db";
import type { Clock } from "../../clock";
import type { Page } from "../../http/crud";
import { NotFoundError } from "../../http/errors";
import type { BookingListQuery } from "../../validators/bookings/booking-query.schema";
import { toSlotDto } from "../availability/slot.service";

/** The mentor's list is read whole (then ordered and paged here); this bounds one read. */
export const MENTOR_BOOKINGS_READ_LIMIT = 500;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// The mentor never sees a booking that is not paid yet or whose payment never completed.
const MENTOR_VISIBLE_STATUSES: BookingStatus[] = ["awaiting_acceptance", "confirmed", "declined", "expired"];

/** A booking as its mentee reads it. `status` is the effective one: past `acceptBy` it already reads `expired`. */
export type BookingDto = {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  mentor: { name: string; slug: string };
  startsAt: string;
  lengthMinutes: SessionLength;
  priceAmount: number;
  currency: string;
  acceptBy: string | null;
  declineReason: string | null;
  question: string;
};

/** A booking as its mentor reads it: the mentee by name only, and no payment details (spec: C68, Q14). */
export type MentorBookingDto = Omit<BookingDto, "mentor" | "paymentStatus"> & { mentee: { name: string } };

/** The mentor's list plus what the *Pending* notice on `/mentor` needs: all awaiting bookings, not just this page's. */
export type MentorBookingsPage = Page<MentorBookingDto> & { pendingCount: number; earliestAcceptBy: string | null };

/** What `/book/[slotId]` shows before anything is paid: the slot, the mentor and both prices. */
export type BookingOfferDto = {
  slotId: string;
  startsAt: string;
  bookable: boolean;
  /** The caller owns this slot: booking it is `forbidden`. */
  ownSlot: boolean;
  mentor: { name: string; slug: string; price25: number | null; price50: number | null; currency: typeof CURRENCY };
};

/** Past `acceptBy` an unanswered booking is expired even before the sweep records it. */
export function effectiveStatus(status: BookingStatus, acceptBy: Date | null | undefined, now: Date): BookingStatus {
  return status === "awaiting_acceptance" && acceptBy && acceptBy.getTime() <= now.getTime() ? "expired" : status;
}

export class BookingQueryService {
  constructor(private readonly deps: { em: EntityManager; clock: Clock }) {}

  /** The caller's own bookings as mentee, newest first; the optional status filter follows the effective status. */
  async listForMentee(menteeUserId: string, query: BookingListQuery): Promise<Page<BookingDto>> {
    const now = this.deps.clock.now();
    const [bookings, total] = await this.deps.em.findAndCount(
      Booking,
      { mentee: menteeUserId, ...statusFilter(query.status, now) },
      { populate: ["slot", "mentor.user"], orderBy: { createdAt: "desc" }, limit: query.pageSize, offset: (query.page - 1) * query.pageSize },
    );
    const payments = await this.paymentsOf(bookings);
    return { page: query.page, pageSize: query.pageSize, total, items: bookings.map((booking) => toBookingDto(booking, payments, now)) };
  }

  /** One booking of the caller as mentee. Another person's booking looks like a missing one, so ids do not leak. */
  async getForMentee(menteeUserId: string, bookingId: string): Promise<BookingDto> {
    if (!UUID.test(bookingId)) throw new NotFoundError("Booking not found");
    const booking = await this.deps.em.findOne(Booking, { id: bookingId, mentee: menteeUserId }, { populate: ["slot", "mentor.user"] });
    if (!booking) throw new NotFoundError("Booking not found");
    return toBookingDto(booking, await this.paymentsOf([booking]), this.deps.clock.now());
  }

  /** The bookings made with the caller as mentor: awaiting a decision first (soonest deadline first), then the rest, latest session first. */
  async listForMentor(mentorUserId: string, query: Pick<BookingListQuery, "page" | "pageSize">): Promise<MentorBookingsPage> {
    const now = this.deps.clock.now();
    const bookings = await this.deps.em.find(
      Booking,
      { mentor: { user: mentorUserId }, status: { $in: MENTOR_VISIBLE_STATUSES } },
      { populate: ["slot", "mentee"], limit: MENTOR_BOOKINGS_READ_LIMIT },
    );
    const dtos = bookings.map((booking) => toMentorBookingDto(booking, now));
    const awaiting = dtos.filter(isAwaiting).sort((a, b) => (a.acceptBy as string).localeCompare(b.acceptBy as string));
    const others = dtos.filter((dto) => !isAwaiting(dto)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    const ordered = [...awaiting, ...others];
    const start = (query.page - 1) * query.pageSize;
    return {
      page: query.page,
      pageSize: query.pageSize,
      total: ordered.length,
      items: ordered.slice(start, start + query.pageSize),
      pendingCount: awaiting.length,
      earliestAcceptBy: awaiting[0]?.acceptBy ?? null,
    };
  }

  /** One booking of the caller as mentor. Another mentor's booking looks like a missing one. */
  async getForMentor(mentorUserId: string, bookingId: string): Promise<MentorBookingDto> {
    if (!UUID.test(bookingId)) throw new NotFoundError("Booking not found");
    const booking = await this.deps.em.findOne(Booking, { id: bookingId, mentor: { user: mentorUserId } }, { populate: ["slot", "mentee"] });
    if (!booking) throw new NotFoundError("Booking not found");
    return toMentorBookingDto(booking, this.deps.clock.now());
  }

  /** The slot, its mentor and both prices for the booking page. An unknown slot is `NotFoundError`. */
  async getOffer(userId: string, slotId: string): Promise<BookingOfferDto> {
    if (!UUID.test(slotId)) throw new NotFoundError("Slot not found");
    const slot = await this.deps.em.findOne(Slot, { id: slotId }, { populate: ["mentor.user"] });
    if (!slot) throw new NotFoundError("Slot not found");
    const profile = slot.mentor as unknown as IMentorProfile;
    return {
      slotId: slot.id,
      startsAt: slot.startsAt.toISOString(),
      bookable: toSlotDto(slot as ISlot, this.deps.clock.now()).bookable,
      ownSlot: profile.user.id === userId,
      mentor: { name: profile.user.name, slug: profile.shareSlug, price25: profile.price25 ?? null, price50: profile.price50 ?? null, currency: CURRENCY },
    };
  }

  private async paymentsOf(bookings: IBooking[]): Promise<Map<string, IPayment>> {
    if (bookings.length === 0) return new Map();
    const payments = await this.deps.em.find(Payment, { booking: { $in: bookings.map((booking) => booking.id) } });
    return new Map(payments.map((payment) => [payment.booking.id, payment]));
  }
}

function statusFilter(status: BookingStatus | undefined, now: Date) {
  if (!status) return {};
  if (status === "awaiting_acceptance") return { status, acceptBy: { $gt: now } };
  if (status === "expired") return { $or: [{ status }, { status: "awaiting_acceptance" as const, acceptBy: { $lte: now } }] };
  return { status };
}

function isAwaiting(dto: MentorBookingDto): boolean {
  return dto.status === "awaiting_acceptance";
}

// A booking leaves `pending_payment` only with a payment row, so a missing one can only be a status that has none yet.
function toBookingDto(booking: IBooking, payments: Map<string, IPayment>, now: Date): BookingDto {
  const profile = booking.mentor as unknown as IMentorProfile;
  return {
    id: booking.id,
    status: effectiveStatus(booking.status as BookingStatus, booking.acceptBy, now),
    paymentStatus: (payments.get(booking.id)?.status ?? "creating") as PaymentStatus,
    mentor: { name: profile.user.name, slug: profile.shareSlug },
    ...sharedFields(booking),
  };
}

function toMentorBookingDto(booking: IBooking, now: Date): MentorBookingDto {
  return {
    id: booking.id,
    status: effectiveStatus(booking.status as BookingStatus, booking.acceptBy, now),
    mentee: { name: booking.mentee.name },
    ...sharedFields(booking),
  };
}

function sharedFields(booking: IBooking) {
  return {
    startsAt: booking.slot.startsAt.toISOString(),
    lengthMinutes: booking.lengthMinutes as SessionLength,
    priceAmount: booking.priceAmount,
    currency: booking.currency as string,
    acceptBy: booking.acceptBy?.toISOString() ?? null,
    declineReason: booking.declineReason ?? null,
    question: booking.question,
  };
}

import { Booking, Message, User, type EntityManager, type IBooking } from "@devmentor/db";
import type { Clock } from "../../clock";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import { MESSAGE_MAX_LENGTH } from "../../validators/sessions/session-message.schema";
import { assertMessagingOpen, canReadThread } from "./session-rules";

export type MessageDto = { id: string; authorId: string; body: string; createdAt: string };

/** The text thread of a confirmed booking. Only the booking's mentee and mentor can see or write it. */
export class SessionThreadService {
  constructor(private readonly deps: { em: EntityManager; clock: Clock }) {}

  async post(bookingId: string, userId: string, body: string): Promise<MessageDto> {
    const booking = await this.loadBookingForParticipant(bookingId, userId);
    if (booking.status !== "confirmed") {
      throw new ConflictError("The thread opens once the booking is confirmed");
    }
    const now = this.deps.clock.now();
    assertMessagingOpen(booking.slot.startsAt, booking.lengthMinutes, now);

    const text = body.trim();
    if (text.length === 0 || text.length > MESSAGE_MAX_LENGTH) {
      throw new ValidationError("Invalid message", { body: [`Write 1 to ${MESSAGE_MAX_LENGTH} characters`] });
    }

    const { em } = this.deps;
    const message = em.create(Message, { booking, author: em.getReference(User, userId), body: text });
    await em.flush();
    return toMessageDto(message.id, userId, text, message.createdAt ?? now);
  }

  async list(bookingId: string, userId: string): Promise<MessageDto[]> {
    const booking = await this.loadBookingForParticipant(bookingId, userId);
    if (!canReadThread(booking.slot.startsAt, booking.lengthMinutes, this.deps.clock.now())) {
      throw new ConflictError("The thread is closed");
    }
    const messages = await this.deps.em.find(Message, { booking: bookingId }, { orderBy: { createdAt: "asc" } });
    return messages.map((message) => toMessageDto(message.id, message.author.id, message.body, message.createdAt));
  }

  /** Someone who is not a party to the booking gets `not_found`, so the booking's existence does not leak. */
  private async loadBookingForParticipant(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await this.deps.em.findOne(Booking, { id: bookingId }, { populate: ["slot", "mentee", "mentor.user"] });
    if (!booking || (booking.mentee.id !== userId && booking.mentor.user.id !== userId)) {
      throw new NotFoundError("Booking not found");
    }
    return booking;
  }
}

function toMessageDto(id: string, authorId: string, body: string, createdAt: Date): MessageDto {
  return { id, authorId, body, createdAt: createdAt.toISOString() };
}

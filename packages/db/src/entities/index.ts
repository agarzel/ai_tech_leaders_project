import { Slot } from "./availability/slot.entity";
import { User } from "./auth/user.entity";
import { Booking } from "./bookings/booking.entity";
import { Payment } from "./payments/payment.entity";
import { MentorInvitation } from "./mentors/mentor-invitation.entity";
import { MentorProfile } from "./mentors/mentor-profile.entity";
import { Message } from "./sessions/message.entity";
import { SessionNote } from "./sessions/session-note.entity";

export { Slot, SLOT_STATUSES, type ISlot, type SlotStatus } from "./availability/slot.entity";
export {
  Booking,
  BOOKING_ENTRY_POINTS,
  BOOKING_STATUSES,
  LIVE_BOOKING_STATUSES,
  type BookingEntryPoint,
  type BookingStatus,
  type IBooking,
} from "./bookings/booking.entity";
export {
  Payment,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  type IPayment,
  type PaymentProvider,
  type PaymentStatus,
} from "./payments/payment.entity";
export { User, type IUser } from "./auth/user.entity";
export { MentorInvitation, type IMentorInvitation } from "./mentors/mentor-invitation.entity";
export { MentorProfile, type IMentorProfile } from "./mentors/mentor-profile.entity";
export { USER_ROLES, type UserRole } from "./auth/user.constants";
export { Message, type IMessage } from "./sessions/message.entity";
export {
  SessionNote,
  SESSION_NOTE_STATUSES,
  type ISessionNote,
  type SessionNoteStatus,
} from "./sessions/session-note.entity";

// Every entity must be listed here – discovery is explicit so it works inside the Next.js bundle.
export const entities = [User, MentorInvitation, MentorProfile, Slot, Booking, Payment, Message, SessionNote];

import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { User } from "../auth/user.entity";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";
import { Booking } from "../bookings/booking.entity";

/** One line of the text thread of a booking. Append-only: messages are never edited or deleted. */
export const Message = defineSingletonEntity("Message", () =>
  defineEntity({
    name: "Message",
    tableName: "messages",
    properties: {
      ...baseProperties(),
      // Deleting a booking is refused while its thread exists (history).
      booking: () => p.manyToOne(Booking).deleteRule("restrict"),
      author: () => p.manyToOne(User).deleteRule("restrict"),
      // Up to 2,000 characters (validated in the service); never logged.
      body: p.text(),
    },
    indexes: [{ name: "messages_booking_id_created_at_index", properties: ["booking", "createdAt"] }],
  }),
);

export type IMessage = InferEntity<typeof Message>;

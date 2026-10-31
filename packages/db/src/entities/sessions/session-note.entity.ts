import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";
import { Booking } from "../bookings/booking.entity";

export const SESSION_NOTE_STATUSES = ["draft", "approved", "rejected"] as const;
export type SessionNoteStatus = (typeof SESSION_NOTE_STATUSES)[number];

/** The mentor's optional note after a session. Visible to the mentee only once approved (R02, R06). */
export const SessionNote = defineSingletonEntity("SessionNote", () =>
  defineEntity({
    name: "SessionNote",
    tableName: "session_notes",
    properties: {
      ...baseProperties(),
      // One note per booking.
      booking: () => p.manyToOne(Booking).deleteRule("restrict"),
      // Up to 1,000 characters (validated in the service); never logged.
      body: p.text(),
      status: p.string().$type<SessionNoteStatus>().default("draft"),
      decidedAt: p.datetime().nullable(),
      rejectedReplacementCount: p.integer().default(0),
      replacedAt: p.datetime().nullable(),
    },
    uniques: [{ name: "session_notes_booking_id_unique", properties: ["booking"] }],
  }),
);

export type ISessionNote = InferEntity<typeof SessionNote>;

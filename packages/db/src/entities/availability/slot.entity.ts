import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";
import { MentorProfile } from "../mentors/mentor-profile.entity";

export const SLOT_STATUSES = ["open", "booked"] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

export const Slot = defineSingletonEntity("Slot", () =>
  defineEntity({
    name: "Slot",
    tableName: "slots",
    properties: {
      ...baseProperties(),
      // Deleting the mentor profile removes its slots.
      mentor: () => p.manyToOne(MentorProfile).deleteRule("cascade"),
      // UTC instant; the grid, lead time, horizon and spacing rules are enforced by SlotService.
      startsAt: p.datetime(),
      // Booking flips open -> booked inside a transaction.
      status: p.string().$type<SlotStatus>().default("open"),
    },
    uniques: [{ name: "slots_mentor_id_starts_at_unique", properties: ["mentor", "startsAt"] }],
    indexes: [{ name: "slots_status_starts_at_index", properties: ["status", "startsAt"] }],
  }),
);

export type ISlot = InferEntity<typeof Slot>;

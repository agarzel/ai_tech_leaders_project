import { z } from "zod";

// POST /api/mentor/slots. The mentor is always the caller: no profile id here. Grid, lead time, horizon and
// spacing are business rules enforced by SlotService, not by the schema.
export const slotCreateSchema = z.object({
  startsAt: z.iso
    .datetime({ message: "Enter a valid date and time" })
    .transform((value) => new Date(value)),
});

export type SlotCreateInput = z.infer<typeof slotCreateSchema>;

// DELETE /api/mentor/slots/[id]
export const slotIdSchema = z.string("Slot id is required").min(1, "Slot id is required");

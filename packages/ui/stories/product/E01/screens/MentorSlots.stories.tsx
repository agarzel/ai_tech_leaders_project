import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { useCallback, useEffect, useRef, useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { AddSlotForm } from "../../../../src/components/availability/AddSlotForm";
import { DeleteSlotDialog } from "../../../../src/components/availability/DeleteSlotDialog";
import { SlotList, type Slot } from "../../../../src/components/availability/SlotList";
import { respondError, respondNever } from "../../../mocks/api";
import { manySlots, nav, ownerSlots, signedIn, slots, timeZone } from "../../../mocks/fixtures";

const SLOTS = "/api/mentor/slots";

/** The owner's slots, kept by the mock server so adding and deleting show their effect (reset before each story). */
const store = { slots: [] as Slot[] };
const start = (list: unknown) => () => {
  store.slots = [...(list as Slot[])];
};

const storeHandlers = [
  http.get(SLOTS, () => HttpResponse.json({ ok: true, data: store.slots })),
  http.post(SLOTS, async ({ request }) => {
    const { startsAt } = (await request.json()) as { startsAt: string };
    const slot: Slot = { id: `new-${store.slots.length}`, startsAt, status: "open", bookable: true };
    store.slots = [...store.slots, slot];
    return HttpResponse.json({ ok: true, data: slot }, { status: 201 });
  }),
  http.delete(`${SLOTS}/:id`, ({ params }) => {
    store.slots = store.slots.filter((slot) => slot.id !== params.id);
    return HttpResponse.json({ ok: true, data: null });
  }),
];

/**
 * `/mentor/slots` (spec E01, Phase 3): add a slot, then the list grouped by day in the mentor's zone,
 * each open slot with a *Delete* that asks first. The rules (24 h, 60 days, grid, spacing) are the
 * server's – the screen shows its answers (MSW). After a deletion focus moves to the list heading,
 * because the row that had it is gone.
 */
function MentorSlotsScreen() {
  const [list, setList] = useState<Slot[]>();
  const [error, setError] = useState<ApiError | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await apiCall<Slot[]>(SLOTS);
    if (!result.ok) return setError(result.error);
    setList(result.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount is the intended effect
    void load();
  }, [load]);

  return (
    <PageLayout
      header={<AppHeader nav={nav.mentor} currentHref="/mentor/slots" account={<AccountMenu user={signedIn.mentor} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Slots"
      description="Times mentees can book. Each one blocks 50 minutes, and a time can be booked only if it starts at least 24 hours from now."
    >
      <section aria-labelledby="add-slot" className="flex flex-col gap-between-groups">
        <h2 id="add-slot" className="type-section-title">
          Add a slot
        </h2>
        <AddSlotForm
          timeZone={timeZone}
          onSubmit={(startsAt) => apiCall<Slot>(SLOTS, { method: "POST", body: { startsAt } })}
          onAdded={() => void load()}
        />
      </section>
      <section aria-labelledby="your-slots" className="flex flex-col gap-between-groups">
        <h2 id="your-slots" ref={heading} tabIndex={-1} className="type-section-title outline-none">
          Your slots
        </h2>
        <SlotList
          slots={list}
          timeZone={timeZone}
          error={error}
          onRetry={() => void load()}
          emptyTitle="No slots yet"
          emptyDescription="Add the first time mentees can book you with the form above."
          rowActions={(slot) =>
            slot.status === "open" && (
              <DeleteSlotDialog
                slot={slot}
                timeZone={timeZone}
                onConfirm={(target) => apiCall(`${SLOTS}/${target.id}`, { method: "DELETE" })}
                onDeleted={() => {
                  void load().then(() => heading.current?.focus());
                }}
              />
            )
          }
        />
      </section>
    </PageLayout>
  );
}

const meta = {
  title: "Product/E01/Screens/MentorSlots",
  component: MentorSlotsScreen,
  parameters: { layout: "fullscreen", msw: { handlers: storeHandlers } },
  beforeEach: start(ownerSlots),
} satisfies Meta<typeof MentorSlotsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

async function addSlot(canvas: Canvas, date: string, time: string) {
  fireEvent.change(await canvas.findByLabelText("Date"), { target: { value: date } });
  fireEvent.change(canvas.getByLabelText("Time"), { target: { value: time } });
  await userEvent.click(canvas.getByRole("button", { name: "Add slot" }));
}

/** Slots grouped by day with their status in words: open, too soon, booked. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Not bookable – starts too soon", { exact: false })).toBeInTheDocument();
    await expect(canvas.getByText(/^Booked ·/)).toBeInTheDocument();
    await expect(canvas.getAllByRole("button", { name: /^Delete the slot on/ })).toHaveLength(4);
  },
};

/** No slots yet: the empty state says what to do. */
export const Empty: Story = {
  beforeEach: start(slots.none),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No slots yet")).toBeInTheDocument();
  },
};

/** Only times inside 24 hours: shown as not bookable, with the reason (D13). */
export const TooSoon: Story = {
  beforeEach: start(slots.tooSoon),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/Not bookable – starts too soon/)).toBeInTheDocument();
  },
};

/** Sixty slots over twenty days. */
export const Many: Story = { beforeEach: start(manySlots) };

/** The server refuses a time (24 h lead): its words at the field, the values stay. */
export const SlotRejected: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(SLOTS, () => HttpResponse.json({ ok: true, data: store.slots })),
        respondError("post", SLOTS, {
          status: 422,
          code: "validation_error",
          message: "Invalid input",
          fieldErrors: { startsAt: ["Slots must start at least 24 hours from now."] },
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await addSlot(canvas, "2026-10-20", "18:00");
    await expect(await canvas.findByRole("alert")).toHaveTextContent("at least 24 hours from now");
  },
};

/** A new slot is confirmed by the server, then appears in the list under its day. */
export const SlotAdded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await addSlot(canvas, "2026-11-04", "18:00");
    await expect(await canvas.findByText("Slot added.")).toBeInTheDocument();
    await expect(await canvas.findByRole("heading", { name: "Wednesday 4 November" })).toBeInTheDocument();
  },
};

/** *Delete* opens the confirmation; focus is on *Keep slot*. */
export const DeleteConfirm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Delete the slot on Thu 22 Oct, 18:00" }));
    const dialog = await within(document.body).findByRole("alertdialog", { name: "Delete the slot on Thu 22 Oct, 18:00?" });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Keep slot" })).toHaveFocus());
  },
};

/** Confirmed: the row leaves the list and focus moves to the list heading. */
export const Deleted: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Delete the slot on Thu 22 Oct, 18:00" }));
    await userEvent.click(await within(document.body).findByRole("button", { name: "Delete slot" }));
    await waitFor(() => expect(canvas.queryByRole("button", { name: "Delete the slot on Thu 22 Oct, 18:00" })).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByRole("heading", { name: "Your slots" })).toHaveFocus());
  },
};

/** The slot was booked while the page was open: the dialog explains and offers the way out. */
export const DeleteBooked: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(SLOTS, () => HttpResponse.json({ ok: true, data: store.slots })),
        respondError("delete", `${SLOTS}/:id`, { status: 409, code: "conflict", message: "This slot is booked. Cancel the booking instead." }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Delete the slot on Thu 22 Oct, 18:00" }));
    await userEvent.click(await within(document.body).findByRole("button", { name: "Delete slot" }));
    await expect(await within(document.body).findByRole("alert")).toHaveTextContent("Cancel the booking instead.");
  },
};

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", SLOTS)] } } };

export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", SLOTS, { status: 500, code: "internal_error", message: "Internal server error" })] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("Something went wrong on our side");
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };

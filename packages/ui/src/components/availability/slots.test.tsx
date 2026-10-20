import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ApiResult } from "../../backend/api/types";
import { AddSlotForm } from "./AddSlotForm";
import { DeleteSlotDialog } from "./DeleteSlotDialog";
import { SlotList, SlotListSkeleton } from "./SlotList";
import { SlotTimeField } from "./SlotTimeField";
import type { Slot } from "./types";

const ZONE = "Europe/Warsaw";

const slot = (overrides: Partial<Slot> = {}): Slot => ({ id: "s1", startsAt: "2026-11-04T17:00:00Z", status: "open", bookable: true, ...overrides });

function fill(date: string, time: string) {
  fireEvent.change(screen.getByLabelText("Date"), { target: { value: date } });
  fireEvent.change(screen.getByLabelText("Time"), { target: { value: time } });
}

describe("SlotTimeField", () => {
  it("names the time zone, has no preview and reports null until date and time are both set", () => {
    const onChange = vi.fn();
    render(<SlotTimeField timeZone={ZONE} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-11-04" } });

    expect(screen.getByText(/Your time zone: Europe\/Warsaw/)).toBeInTheDocument();
    expect(screen.queryByText(/^Starts/)).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("converts the local reading to UTC and previews it with the zone and offset", () => {
    const onChange = vi.fn();
    render(<SlotTimeField timeZone={ZONE} onChange={onChange} />);

    fill("2026-11-04", "18:00");

    expect(onChange).toHaveBeenLastCalledWith("2026-11-04T17:00:00.000Z");
    expect(screen.getByText("Starts Wed 4 Nov, 18:00 (Europe/Warsaw, UTC+1)")).toBeInTheDocument();
    expect(screen.queryByText(/happens twice/)).not.toBeInTheDocument();
  });

  it("refuses a time the clocks skip, in words, and reports null", () => {
    const onChange = vi.fn();
    render(<SlotTimeField timeZone={ZONE} onChange={onChange} />);

    fill("2026-03-29", "02:30");

    expect(screen.getByRole("alert")).toHaveTextContent("This time does not exist in your time zone");
    expect(screen.getByLabelText("Time")).toBeInvalid();
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByText(/^Starts/)).not.toBeInTheDocument();
  });

  it("previews a time that happens twice with the first offset and says so", () => {
    const onChange = vi.fn();
    render(<SlotTimeField timeZone={ZONE} onChange={onChange} />);

    fill("2026-10-25", "02:30");

    expect(onChange).toHaveBeenLastCalledWith("2026-10-25T00:30:00.000Z");
    expect(screen.getByText(/Starts Sun 25 Oct, 02:30 \(Europe\/Warsaw, UTC\+2\)/)).toBeInTheDocument();
    expect(screen.getByText(/this time happens twice when the clocks change; the first one is used/)).toBeInTheDocument();
  });

  it("shows a message from the form and links it to both inputs", () => {
    render(<SlotTimeField timeZone={ZONE} onChange={vi.fn()} error="Slots must start at least 24 hours from now." id="slot" />);

    expect(screen.getByRole("alert")).toHaveTextContent("at least 24 hours");
    expect(screen.getByLabelText("Date")).toHaveAttribute("id", "slot-date");
    expect(screen.getByLabelText("Date")).toHaveAccessibleDescription(/24 hours/);
    expect(screen.getByLabelText("Time")).toBeInvalid();
  });

  it("puts the field's own DST message before a message from the form", () => {
    render(<SlotTimeField timeZone={ZONE} onChange={vi.fn()} error="Choose a date and a time for the slot." />);

    fill("2026-03-29", "02:30");

    expect(screen.getByRole("alert")).toHaveTextContent("does not exist");
    expect(screen.queryByText(/Choose a date/)).not.toBeInTheDocument();
  });

  it("disables both inputs", () => {
    render(<SlotTimeField timeZone={ZONE} onChange={vi.fn()} disabled />);

    expect(screen.getByLabelText("Date")).toBeDisabled();
    expect(screen.getByLabelText("Time")).toBeDisabled();
  });
});

describe("SlotList", () => {
  it("groups slots by the viewer's local day, earliest first, with the time and zone on each row", () => {
    render(
      <SlotList
        timeZone={ZONE}
        slots={[
          slot({ id: "late", startsAt: "2026-11-04T23:30:00Z" }),
          slot({ id: "early", startsAt: "2026-11-04T22:30:00Z" }),
          slot({ id: "first", startsAt: "2026-11-04T08:00:00Z" }),
        ]}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["Wednesday 4 November", "Thursday 5 November"]);
    const wednesday = screen.getByRole("list", { name: "Wednesday 4 November" });
    expect(within(wednesday).getAllByRole("listitem").map((row) => row.textContent)).toEqual([
      "09:00Open for booking · Europe/Warsaw, UTC+1",
      "23:30Open for booking · Europe/Warsaw, UTC+1",
    ]);
    expect(within(screen.getByRole("list", { name: "Thursday 5 November" })).getByText("00:30", { selector: "time" })).toHaveAttribute("datetime", "2026-11-04T23:30:00Z");
  });

  it("says in words which slots are booked or too soon to be booked", () => {
    render(
      <SlotList
        timeZone={ZONE}
        slots={[slot({ id: "a", status: "booked", bookable: false }), slot({ id: "b", startsAt: "2026-11-04T18:00:00Z", bookable: false })]}
      />,
    );

    expect(screen.getByText(/^Booked ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Not bookable – starts too soon ·/)).toBeInTheDocument();
  });

  it("shows only the zone label without status, with the actions of each row, under the chosen heading level", () => {
    render(<SlotList timeZone={ZONE} slots={[slot()]} showStatus={false} headingLevel={2} rowActions={(row) => <button>{`Book ${row.id}`}</button>} />);

    expect(screen.getByRole("heading", { level: 2, name: "Wednesday 4 November" })).toBeInTheDocument();
    expect(screen.getByText("Europe/Warsaw, UTC+1")).toBeInTheDocument();
    expect(screen.queryByText(/Open for booking/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book s1" })).toBeInTheDocument();
  });

  it("shows a skeleton while loading and when there is no data yet", () => {
    const { rerender } = render(<SlotList timeZone={ZONE} slots={[slot()]} isLoading />);
    expect(screen.getByRole("status", { name: "Loading slots" })).toBeInTheDocument();

    rerender(<SlotList timeZone={ZONE} slots={undefined} />);
    expect(screen.getByRole("status", { name: "Loading slots" })).toBeInTheDocument();
  });

  it("explains an error and lets the person retry", async () => {
    const onRetry = vi.fn();
    render(<SlotList timeZone={ZONE} slots={[]} error={{ code: "network_error", message: "Failed to fetch" }} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No connection");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows the public empty state by default and a custom one with an action", () => {
    const { rerender } = render(<SlotList timeZone={ZONE} slots={[]} />);
    expect(screen.getByText("No times available right now")).toBeInTheDocument();

    rerender(<SlotList timeZone={ZONE} slots={[]} emptyTitle="No slots yet" emptyDescription="Add one." emptyAction={<button>Add slot</button>} />);
    expect(screen.getByText("No slots yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add slot" })).toBeInTheDocument();
  });

  it("renders the skeleton on its own", () => {
    render(<SlotListSkeleton />);

    expect(screen.getByRole("status", { name: "Loading slots" })).toBeInTheDocument();
  });
});

describe("AddSlotForm", () => {
  const created = slot({ id: "new" });
  const ok: ApiResult<Slot> = { ok: true, data: created, status: 201 };
  const add = () => userEvent.click(screen.getByRole("button", { name: "Add slot" }));

  it("asks for a date and time instead of sending an empty form, and focuses the date", async () => {
    const onSubmit = vi.fn();
    render(<AddSlotForm timeZone={ZONE} onSubmit={onSubmit} />);

    await add();

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a date and a time for the slot.");
    expect(screen.getByLabelText("Date")).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sends the UTC start, confirms in words, clears the fields and returns focus to the date", async () => {
    const onSubmit = vi.fn(async () => ok);
    const onAdded = vi.fn();
    render(<AddSlotForm timeZone={ZONE} onSubmit={onSubmit} onAdded={onAdded} />);
    fill("2026-11-04", "18:00");

    await add();

    expect(onSubmit).toHaveBeenCalledWith("2026-11-04T17:00:00.000Z");
    expect(onAdded).toHaveBeenCalledWith(created);
    expect(await screen.findByText("Slot added.")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveValue("");
    expect(screen.getByLabelText("Date")).toHaveFocus();
  });

  it("works without an onAdded callback and drops the confirmation when the person edits again", async () => {
    render(<AddSlotForm timeZone={ZONE} onSubmit={async () => ok} />);
    fill("2026-11-04", "18:00");
    await add();
    await screen.findByText("Slot added.");

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-11-05" } });

    expect(screen.queryByText("Slot added.")).not.toBeInTheDocument();
  });

  it("blocks a second submit while the first is running", async () => {
    let finish: (result: ApiResult<Slot>) => void = () => {};
    const onSubmit = vi.fn(() => new Promise<ApiResult<Slot>>((resolve) => (finish = resolve)));
    render(<AddSlotForm timeZone={ZONE} onSubmit={onSubmit} />);
    fill("2026-11-04", "18:00");

    await add();
    const button = screen.getByRole("button", { name: "Adding…" });
    fireEvent.submit(button.closest("form") as HTMLFormElement);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    finish(ok);
    await screen.findByText("Slot added.");
  });

  it("shows a server rule at the field, keeps the values and clears it when the person edits", async () => {
    const error = { code: "validation_error", message: "Invalid input", fieldErrors: { startsAt: ["Slots must start at least 24 hours from now."] } };
    render(<AddSlotForm timeZone={ZONE} onSubmit={async () => ({ ok: false, error, status: 422 })} />);
    fill("2026-11-04", "18:00");

    await add();

    expect(await screen.findByRole("alert")).toHaveTextContent("at least 24 hours from now");
    expect(screen.getByLabelText("Time")).toHaveValue("18:00");
    expect(screen.getByLabelText("Date")).toHaveFocus();

    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "19:00" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains a refusal without a field, such as a duplicate start, and keeps the values", async () => {
    const error = { code: "conflict", message: "You already have a slot at this time." };
    render(<AddSlotForm timeZone={ZONE} onSubmit={async () => ({ ok: false, error, status: 409 })} />);
    fill("2026-11-04", "18:00");

    await add();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not add the slot");
    expect(alert).toHaveTextContent("You already have a slot at this time.");
    expect(screen.getByLabelText("Date")).toHaveValue("2026-11-04");
  });
});

describe("DeleteSlotDialog", () => {
  const ok: ApiResult<unknown> = { ok: true, data: null, status: 200 };
  const open = () => userEvent.click(screen.getByRole("button", { name: "Delete the slot on Wed 4 Nov, 18:00" }));

  it("asks first, naming the object and the time, with verbs on both buttons", async () => {
    render(<DeleteSlotDialog slot={slot()} timeZone={ZONE} onConfirm={vi.fn()} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await open();

    const dialog = await screen.findByRole("alertdialog", { name: "Delete the slot on Wed 4 Nov, 18:00?" });
    expect(dialog).toHaveTextContent("Europe/Warsaw, UTC+1");
    expect(within(dialog).getByRole("button", { name: "Keep slot" })).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Keep slot" })).toHaveFocus());
  });

  it("closes without deleting on Keep slot", async () => {
    const onConfirm = vi.fn();
    render(<DeleteSlotDialog slot={slot()} timeZone={ZONE} onConfirm={onConfirm} />);
    await open();

    await userEvent.click(await screen.findByRole("button", { name: "Keep slot" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("deletes, closes and reports the deletion", async () => {
    const onConfirm = vi.fn(async () => ok);
    const onDeleted = vi.fn();
    render(<DeleteSlotDialog slot={slot()} timeZone={ZONE} onConfirm={onConfirm} onDeleted={onDeleted} />);
    await open();

    await userEvent.click(await screen.findByRole("button", { name: "Delete slot" }));

    expect(onConfirm).toHaveBeenCalledWith(slot());
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onDeleted).toHaveBeenCalledWith(slot());
  });

  it("closes after deleting when nobody listens for it", async () => {
    render(<DeleteSlotDialog slot={slot()} timeZone={ZONE} onConfirm={async () => ok} defaultOpen />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete slot" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("stays open with the server's reason when the slot is booked, and forgets it on the next opening", async () => {
    const error = { code: "conflict", message: "Cancel the booking instead." };
    render(<DeleteSlotDialog slot={slot({ status: "booked" })} timeZone={ZONE} onConfirm={async () => ({ ok: false, error, status: 409 })} onDeleted={vi.fn()} />);
    await open();

    await userEvent.click(await screen.findByRole("button", { name: "Delete slot" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cancel the booking instead.");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Keep slot" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await open();
    await screen.findByRole("alertdialog");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("cannot be dismissed while the request runs", async () => {
    let finish: (result: ApiResult<unknown>) => void = () => {};
    const onConfirm = vi.fn(() => new Promise<ApiResult<unknown>>((resolve) => (finish = resolve)));
    render(<DeleteSlotDialog slot={slot()} timeZone={ZONE} onConfirm={onConfirm} defaultOpen />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete slot" }));
    const busy = screen.getByRole("button", { name: "Deleting…" });
    await userEvent.keyboard("{Escape}");

    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Keep slot" })).toBeDisabled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    finish(ok);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });
});

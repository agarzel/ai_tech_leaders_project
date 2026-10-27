import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CancelBookingDialog } from "./CancelBookingDialog";

const ZONE = "Europe/Warsaw";
const FREE_UNTIL = "2026-11-04T05:00:00Z";

function renderDialog(overrides: Partial<Parameters<typeof CancelBookingDialog>[0]> = {}) {
  const onConfirm = vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} });
  const onCancelled = vi.fn();
  render(
    <CancelBookingDialog
      mentorName="Marek Zieliński"
      freeUntil={FREE_UNTIL}
      refundable
      timeZone={ZONE}
      onConfirm={onConfirm}
      onCancelled={onCancelled}
      {...overrides}
    />,
  );
  return { onConfirm, onCancelled };
}

describe("CancelBookingDialog", () => {
  it("names the free cancellation deadline when the booking is refundable", async () => {
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Cancel booking" }));

    expect(await screen.findByText(/Free cancellation until .* a full refund/)).toBeInTheDocument();
  });

  it("says the mentor keeps the payment after the free period", async () => {
    renderDialog({ refundable: false });

    await userEvent.click(screen.getByRole("button", { name: "Cancel booking" }));

    expect(await screen.findByText(/The free cancellation period has ended. Marek Zieliński keeps the payment/)).toBeInTheDocument();
  });

  it("cancels the booking and reports it when the server confirms", async () => {
    const { onConfirm, onCancelled } = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel booking" }));

    await waitFor(() => expect(onCancelled).toHaveBeenCalled());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("keeps the dialog open and explains a refusal in words", async () => {
    const { onCancelled } = renderDialog({
      onConfirm: vi.fn().mockResolvedValue({ ok: false, status: 409, error: { code: "conflict", message: "The session has started" } }),
    });

    await userEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel booking" }));

    expect(await screen.findByText("Could not cancel the booking")).toBeInTheDocument();
    expect(onCancelled).not.toHaveBeenCalled();
  });

  it("closes without calling the server when the mentee keeps the booking", async () => {
    const { onConfirm } = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    await userEvent.click(await screen.findByRole("button", { name: "Keep booking" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });
  it("stays open while the cancellation is being sent", async () => {
    let finish: (value: unknown) => void = () => undefined;
    renderDialog({ onConfirm: vi.fn(() => new Promise((resolve) => (finish = resolve))) as never });

    await userEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel booking" }));
    await userEvent.keyboard("{Escape}");

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    finish({ ok: true, status: 200, data: {} });
  });
});

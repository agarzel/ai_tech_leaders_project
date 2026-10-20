import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ApiResult } from "../../backend/api/types";
import { AcceptDeadline } from "./AcceptDeadline";
import { BookingQuestion, QUESTION_PREVIEW } from "./BookingQuestion";
import { BookingRow } from "./BookingRow";
import { DeclineBookingDialog, REASON_MAX } from "./DeclineBookingDialog";
import { MentorBookingRow } from "./MentorBookingRow";
import { PendingBookingsNotice } from "./PendingBookingsNotice";
import type { Booking, MentorBooking } from "./types";

const ZONE = "Europe/Warsaw";
const NOW = new Date("2026-10-26T20:00:00Z");
const ok: ApiResult<unknown> = { ok: true, data: null, status: 200 };

const mentorBooking = (overrides: Partial<MentorBooking> = {}): MentorBooking => ({
  id: "b1",
  mentee: { name: "Ola Wiśniewska" },
  startsAt: "2026-10-27T16:00:00Z",
  lengthMinutes: 25,
  priceAmount: 18000,
  currency: "PLN",
  status: "awaiting_acceptance",
  acceptBy: "2026-10-27T04:00:00Z",
  declineReason: null,
  question: "Why does my rollout hang?",
  ...overrides,
});

describe("AcceptDeadline", () => {
  it("gives the time with its zone and a relative phrase", () => {
    render(<AcceptDeadline acceptBy="2026-10-27T04:00:00Z" now={NOW} timeZone={ZONE} />);

    expect(screen.getByText("Tue 27 Oct, 05:00 (Europe/Warsaw, UTC+1)")).toHaveAttribute("datetime", "2026-10-27T04:00:00Z");
    expect(screen.getByText(/Decide by/)).toHaveTextContent("· in 8 h");
    expect(screen.queryByText("Decide soon")).not.toBeInTheDocument();
  });

  it("adds words and an icon, not only colour, under two hours", () => {
    const { container } = render(<AcceptDeadline acceptBy="2026-10-26T21:30:00Z" now={NOW} timeZone={ZONE} />);

    expect(screen.getByText("Decide soon")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container).toHaveTextContent("in 1 h");
  });

  it("says the deadline passed", () => {
    render(<AcceptDeadline acceptBy="2026-10-26T19:40:00Z" now={NOW} timeZone={ZONE} />);

    expect(screen.getByText(/Deadline passed/)).toHaveTextContent("20 min ago");
  });
});

describe("BookingQuestion collapsed", () => {
  it("shows a short question whole, without a toggle", () => {
    render(<BookingQuestion question="Short" collapsible />);

    expect(screen.getByText("Short")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the start of a long question and expands it on request", async () => {
    const long = `${"a".repeat(QUESTION_PREVIEW)}TAIL`;
    render(<BookingQuestion question={long} collapsible />);

    expect(screen.queryByText(/TAIL/)).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Show full question" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);

    expect(screen.getByText(/TAIL/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.queryByText(/TAIL/)).not.toBeInTheDocument();
  });

  it("shows a long question whole when it is not collapsible", () => {
    render(<BookingQuestion question={"a".repeat(QUESTION_PREVIEW + 10)} />);

    expect(screen.getByText("a".repeat(QUESTION_PREVIEW + 10))).toBeInTheDocument();
  });
});

describe("BookingRow", () => {
  const booking: Booking = {
    id: "b1",
    mentor: { name: "Marek Zieliński", slug: "marek" },
    startsAt: "2026-10-27T16:00:00Z",
    lengthMinutes: 50,
    priceAmount: 32000,
    currency: "PLN",
    status: "declined",
    paymentStatus: "refunded",
    acceptBy: null,
    declineReason: null,
    question: "Q",
  };

  it("is one link with the time, zone and price, and the status in words", () => {
    render(<BookingRow booking={booking} href="/bookings/b1" timeZone={ZONE} />);

    const link = screen.getByRole("link", { name: "Marek Zieliński · 50 min" });
    expect(link).toHaveAttribute("href", "/bookings/b1");
    expect(screen.getByText(/Tue 27 Oct, 17:00 \(Europe\/Warsaw, UTC\+1\)/)).toBeInTheDocument();
    expect(screen.getByText("PLN 320.00")).toBeInTheDocument();
    expect(screen.getByText("Declined · refunded")).toBeInTheDocument();
  });

  it("renders the link through renderLink", () => {
    render(<BookingRow booking={booking} href="/x" timeZone={ZONE} renderLink={({ children, ...props }) => <a {...props} data-custom="yes">{children}</a>} />);

    expect(screen.getByRole("link")).toHaveAttribute("data-custom", "yes");
  });
});

describe("DeclineBookingDialog", () => {
  const setup = (onConfirm: (values: { reason?: string }) => Promise<ApiResult<unknown>> = vi.fn(async () => ok), onDeclined?: () => void, defaultOpen = false) => {
    render(<DeclineBookingDialog menteeName="Ola Wiśniewska" startsAt="2026-10-27T16:00:00Z" timeZone={ZONE} onConfirm={onConfirm} onDeclined={onDeclined} defaultOpen={defaultOpen} />);
    return onConfirm;
  };
  const open = () => userEvent.click(screen.getByRole("button", { name: "Decline Ola Wiśniewska, Tue 27 Oct, 17:00" }));
  const confirmButton = () => screen.findByRole("button", { name: "Decline booking" });

  it("asks first, names the mentee and says the mentee is refunded", async () => {
    setup();
    await open();

    const dialog = await screen.findByRole("dialog", { name: "Decline the booking from Ola Wiśniewska?" });
    expect(dialog).toHaveTextContent("The mentee gets a full refund and the slot is released.");
    expect(within(dialog).getByLabelText(/Reason for the mentee/)).toHaveAccessibleDescription(/Up to 280 characters \(0 used\)/);
  });

  it("declines without a reason and leaves it out of the request", async () => {
    const onDeclined = vi.fn();
    const onConfirm = vi.fn(async () => ok);
    setup(onConfirm, onDeclined);
    await open();

    await userEvent.click(await confirmButton());

    expect(onConfirm).toHaveBeenCalledWith({});
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onDeclined).toHaveBeenCalled();
  });

  it("sends the trimmed reason and closes without a listener too", async () => {
    const onConfirm = vi.fn(async () => ok);
    setup(onConfirm, undefined, true);

    await userEvent.type(await screen.findByLabelText(/Reason for the mentee/), "  I am away.  ");
    await userEvent.click(await confirmButton());

    expect(onConfirm).toHaveBeenCalledWith({ reason: "I am away." });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("refuses a reason over 280 characters and says by how much", async () => {
    const onConfirm = vi.fn(async () => ok);
    setup(onConfirm, undefined, true);

    fireEvent.change(await screen.findByLabelText(/Reason for the mentee/), { target: { value: "x".repeat(REASON_MAX + 7) } });

    expect(screen.getByRole("alert")).toHaveTextContent("Shorten the reason by 7 characters.");
    expect(screen.getByRole("button", { name: "Decline booking" })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("stays open with the server's reason and forgets it on the next opening", async () => {
    const error = { code: "conflict", message: "The acceptance deadline has passed." };
    setup(vi.fn(async () => ({ ok: false as const, error, status: 409 })));
    await open();

    await userEvent.click(await confirmButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("The acceptance deadline has passed.");
    await userEvent.click(screen.getByRole("button", { name: "Keep booking" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await open();
    await screen.findByRole("dialog");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("cannot be dismissed while the request runs", async () => {
    let finish: (result: ApiResult<unknown>) => void = () => {};
    setup(vi.fn(() => new Promise<ApiResult<unknown>>((resolve) => (finish = resolve))), undefined, true);

    await userEvent.click(await confirmButton());
    const busy = screen.getByRole("button", { name: "Declining…" });
    await userEvent.keyboard("{Escape}");

    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for the mentee/)).toBeDisabled();
    finish(ok);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("MentorBookingRow", () => {
  const setup = (booking: MentorBooking, props: Partial<Parameters<typeof MentorBookingRow>[0]> = {}) => {
    const onAccept = vi.fn(async () => ok);
    const onDecline = vi.fn(async () => ok);
    const onDecided = vi.fn();
    render(<MentorBookingRow booking={booking} timeZone={ZONE} now={NOW} onAccept={onAccept} onDecline={onDecline} onDecided={onDecided} {...props} />);
    return { onAccept, onDecline, onDecided };
  };

  it("shows the mentee by name, the slot, the deadline, the question and both decisions", () => {
    setup(mentorBooking());

    expect(screen.getByText("Ola Wiśniewska")).toBeInTheDocument();
    expect(screen.getByText(/Tue 27 Oct, 17:00 \(Europe\/Warsaw, UTC\+1\) · 25 min/)).toBeInTheDocument();
    expect(screen.getByText(/Decide by/)).toBeInTheDocument();
    expect(screen.getByText("Why does my rollout hang?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept Ola Wiśniewska, Tue 27 Oct, 17:00" })).toHaveClass("border-border");
    expect(screen.getByRole("button", { name: /^Decline Ola/ })).toBeInTheDocument();
  });

  it("makes Accept the accent only for the booking with the nearest deadline", () => {
    setup(mentorBooking(), { isNext: true });

    expect(screen.getByRole("button", { name: /^Accept/ })).toHaveClass("bg-primary");
  });

  it("accepts, reports the decision and shows the busy state meanwhile", async () => {
    let finish: (result: ApiResult<unknown>) => void = () => {};
    const { onAccept, onDecided } = setup(mentorBooking(), { onAccept: vi.fn(() => new Promise<ApiResult<unknown>>((resolve) => (finish = resolve))) });

    await userEvent.click(screen.getByRole("button", { name: /^Accept/ }));
    expect(screen.getByRole("button", { name: /^Accept/ })).toBeDisabled();
    expect(screen.getByText("Accepting…")).toBeInTheDocument();
    finish(ok);

    await waitFor(() => expect(onDecided).toHaveBeenCalled());
    expect(onAccept).not.toBe(undefined);
  });

  it("accepts without an onDecided listener", async () => {
    const onAccept = vi.fn(async () => ok);
    render(<MentorBookingRow booking={mentorBooking()} timeZone={ZONE} now={NOW} onAccept={onAccept} onDecline={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /^Accept/ }));

    await waitFor(() => expect(onAccept).toHaveBeenCalled());
  });

  it("explains a refused acceptance under the row and lets the mentor try again", async () => {
    const error = { code: "conflict", message: "The acceptance deadline has passed." };
    const { onDecided } = setup(mentorBooking(), { onAccept: vi.fn(async () => ({ ok: false as const, error, status: 409 })) });

    await userEvent.click(screen.getByRole("button", { name: /^Accept/ }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not accept the booking");
    expect(alert).toHaveTextContent("The acceptance deadline has passed.");
    expect(screen.getByRole("button", { name: /^Accept/ })).toBeEnabled();
    expect(onDecided).not.toHaveBeenCalled();
  });

  it("declines through the dialog with the reason and reports the decision", async () => {
    const { onDecline, onDecided } = setup(mentorBooking());

    await userEvent.click(screen.getByRole("button", { name: /^Decline Ola/ }));
    await userEvent.type(await screen.findByLabelText(/Reason for the mentee/), "Away");
    await userEvent.click(screen.getByRole("button", { name: "Decline booking" }));

    await waitFor(() => expect(onDecided).toHaveBeenCalled());
    expect(onDecline).toHaveBeenCalledWith(expect.objectContaining({ id: "b1" }), { reason: "Away" });
  });

  it.each([
    ["confirmed", "Confirmed"],
    ["declined", "Declined"],
    ["expired", "Expired"],
    ["pending_payment", "Awaiting payment"],
    ["payment_expired", "Payment not completed"],
  ] as const)("shows the status instead of actions for a %s booking", (status, label) => {
    setup(mentorBooking({ status }));

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Accept/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Decide by/)).not.toBeInTheDocument();
  });

  it.each(["declined", "expired", "confirmed", "awaiting_acceptance"] as const)("never shows refund wording to the mentor for a %s booking", (status) => {
    const { container } = render(
      <MentorBookingRow booking={mentorBooking({ status, declineReason: "private" })} timeZone={ZONE} now={NOW} onAccept={vi.fn()} onDecline={vi.fn()} />,
    );

    expect(container.textContent).not.toMatch(/refund/i);
    expect(screen.queryByText(/private/)).not.toBeInTheDocument();
  });

  it("treats a booking without a deadline as not awaiting", () => {
    setup(mentorBooking({ acceptBy: null }));

    expect(screen.queryByRole("button", { name: /^Accept/ })).not.toBeInTheDocument();
  });
});

describe("PendingBookingsNotice", () => {
  const render_ = (props = {}) =>
    render(<PendingBookingsNotice count={2} earliestAcceptBy="2026-10-27T04:00:00Z" href="/mentor/bookings" now={NOW} timeZone={ZONE} {...props} />);

  it("renders nothing without pending bookings", () => {
    const { container } = render_({ count: 0 });

    expect(container).toBeEmptyDOMElement();
  });

  it("says the count in a sentence with the nearest deadline and a link to decide", () => {
    render_();

    expect(screen.getByText("2 bookings waiting for your decision")).toBeInTheDocument();
    expect(screen.getByText(/Decide by/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Review bookings" });
    expect(link).toHaveAttribute("href", "/mentor/bookings");
    expect(link).toHaveClass("bg-primary");
  });

  it("uses the singular for one booking and can drop the accent", () => {
    render_({ count: 1, emphasis: false });

    expect(screen.getByText("1 booking waiting for your decision")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review bookings" })).not.toHaveClass("bg-primary");
  });

  it("renders the link through renderLink", () => {
    render_({ renderLink: ({ children, ...props }: { children?: React.ReactNode }) => <a {...props} data-custom="yes">{children}</a> });

    expect(screen.getByRole("link")).toHaveAttribute("data-custom", "yes");
  });
});

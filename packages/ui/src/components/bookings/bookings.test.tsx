import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ApiResult } from "../../backend/api/types";
import { BookingForm, type BookingStarted } from "./BookingForm";
import { BookingQuestion } from "./BookingQuestion";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingStatusPanel } from "./BookingStatusPanel";
import { BookingSummary } from "./BookingSummary";
import { PaymentPending } from "./PaymentPending";
import { QuestionField, QUESTION_MAX } from "./QuestionField";
import { SlotBookActions } from "./SlotBookActions";
import { bookingStatusLabel, describeBooking } from "./bookingStatus";
import type { Booking, BookingStatus, PaymentStatus } from "./types";

const ZONE = "Europe/Warsaw";

const booking = (overrides: Partial<Booking> = {}): Booking => ({
  id: "b1",
  mentor: { name: "Marek Zieliński", slug: "marek" },
  startsAt: "2026-11-04T17:00:00Z",
  lengthMinutes: 25,
  priceAmount: 18000,
  currency: "PLN",
  status: "awaiting_acceptance",
  paymentStatus: "paid",
  acceptBy: "2026-11-04T05:00:00Z",
  declineReason: null,
  question: "Why does my rollout hang?",
  ...overrides,
});

describe("SlotBookActions", () => {
  const hrefFor = (length: number) => `/book/s1?length=${length}`;

  it("offers both lengths with their prices, named after the slot", () => {
    render(<SlotBookActions slotLabel="Thu 22 Oct, 18:00" price25={18000} price50={32000} currency="PLN" hrefFor={hrefFor} />);

    const short = screen.getByRole("link", { name: "Book 25 min · PLN\u00a0180.00, Thu 22 Oct, 18:00" });
    expect(short).toHaveAttribute("href", "/book/s1?length=25");
    expect(short).toHaveTextContent("Book 25 min · PLN 180.00");
    expect(screen.getByRole("link", { name: /^Book 50 min · PLN.320.00/ })).toHaveAttribute("href", "/book/s1?length=50");
  });

  it("does not offer a length without a price", () => {
    render(<SlotBookActions slotLabel="x" price25={null} price50={32000} currency="PLN" hrefFor={hrefFor} />);

    expect(screen.queryByRole("link", { name: /25 min/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /50 min/ })).toBeInTheDocument();
  });

  it("says so when no price is set", () => {
    render(<SlotBookActions slotLabel="x" price25={null} price50={null} currency="PLN" hrefFor={hrefFor} />);

    expect(screen.getByText("No price set")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows no action on the mentor's own slot", () => {
    render(<SlotBookActions slotLabel="x" price25={1} price50={2} currency="PLN" hrefFor={hrefFor} isOwnSlot />);

    expect(screen.getByText("Your own slot")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders links through renderLink", () => {
    render(
      <SlotBookActions slotLabel="x" price25={100000} price50={null} currency="PLN" hrefFor={hrefFor} renderLink={({ children, ...props }) => <a {...props} data-custom="yes">{children}</a>} />,
    );

    expect(screen.getByRole("link")).toHaveAttribute("data-custom", "yes");
  });
});

describe("BookingSummary", () => {
  it("lists mentor, time with its zone, length and price", () => {
    render(<BookingSummary mentorName="Marek Zieliński" startsAt="2026-11-04T17:00:00Z" lengthMinutes={50} priceAmount={32000} currency="PLN" timeZone={ZONE} />);

    expect(screen.getByText("Marek Zieliński")).toBeInTheDocument();
    expect(screen.getByText("Wed 4 Nov, 18:00 (Europe/Warsaw, UTC+1)")).toBeInTheDocument();
    expect(screen.getByText("50 minutes")).toBeInTheDocument();
    expect(screen.getByText("PLN 320.00")).toBeInTheDocument();
  });
});

describe("QuestionField", () => {
  const setup = (value: string, props = {}) => render(<QuestionField value={value} onChange={vi.fn()} {...props} />);

  it("reports typing and shows the count without announcing it far from the limit", () => {
    const onChange = vi.fn();
    render(<QuestionField value="abc" onChange={onChange} id="q" />);

    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "abcd" } });

    expect(onChange).toHaveBeenCalledWith("abcd");
    expect(screen.getByLabelText("Your question")).toHaveAccessibleDescription(/up to 2,000 characters \(3 used\)/);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces the characters left near the limit", () => {
    setup("x".repeat(QUESTION_MAX - 150));

    expect(screen.getByRole("status")).toHaveTextContent("150 characters left");
  });

  it("keeps a too long question whole, and says by how much it is over", () => {
    setup("x".repeat(QUESTION_MAX + 12));

    expect(screen.getByRole("status")).toHaveTextContent("12 characters over the limit");
    expect(screen.getByRole("alert")).toHaveTextContent("Shorten the question by 12 characters.");
    expect(screen.getByLabelText("Your question")).toBeInvalid();
    expect(screen.getByLabelText("Your question")).toHaveValue("x".repeat(QUESTION_MAX + 12));
  });

  it("shows a message from the form and can be disabled", () => {
    setup("", { error: "Write your question for the mentor.", disabled: true });

    expect(screen.getByRole("alert")).toHaveTextContent("Write your question");
    expect(screen.getByLabelText("Your question")).toBeDisabled();
  });
});

describe("BookingForm", () => {
  const summary = { mentorName: "Marek Zieliński", startsAt: "2026-11-04T17:00:00Z", lengthMinutes: 25 as const, priceAmount: 18000, currency: "PLN", timeZone: ZONE };
  const started: ApiResult<BookingStarted> = { ok: true, data: { bookingId: "b1", checkoutUrl: "https://checkout.example/s/1" }, status: 201 };
  const pay = () => userEvent.click(screen.getByRole("button", { name: /^Pay / }));

  it("shows the price on the button and what happens next before anything is typed", () => {
    render(<BookingForm summary={summary} onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Pay PLN\u00a0180.00" })).toBeInTheDocument();
    expect(screen.getByText(/Card payment/)).toBeInTheDocument();
    expect(screen.getByText(/may decline it. If they decline, or do not answer in time, you get a full refund/)).toBeInTheDocument();
    expect(screen.getByText(/35 minutes/)).toBeInTheDocument();
  });

  it("asks for a question instead of sending an empty one, and focuses it", async () => {
    const onSubmit = vi.fn();
    render(<BookingForm summary={summary} onSubmit={onSubmit} />);

    await pay();

    expect(screen.getByRole("alert")).toHaveTextContent("Write your question for the mentor.");
    expect(screen.getByLabelText("Your question")).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not send a question over the limit", async () => {
    const onSubmit = vi.fn();
    render(<BookingForm summary={summary} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "x".repeat(QUESTION_MAX + 1) } });

    await pay();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Your question")).toHaveFocus();
  });

  it("sends the trimmed question, then stays busy while the browser leaves for the payment page", async () => {
    const onSubmit = vi.fn(async () => started);
    const onStarted = vi.fn();
    render(<BookingForm summary={summary} onSubmit={onSubmit} onStarted={onStarted} />);
    await userEvent.type(screen.getByLabelText("Your question"), "  Why does it hang?  ");

    await pay();

    expect(onSubmit).toHaveBeenCalledWith({ question: "Why does it hang?" });
    expect(onStarted).toHaveBeenCalledWith(started.ok && started.data);
    const busy = screen.getByRole("button", { name: "Opening payment…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Taking you to the payment page.")).toBeInTheDocument();
  });

  it("works without an onStarted callback", async () => {
    render(<BookingForm summary={summary} onSubmit={async () => started} />);
    await userEvent.type(screen.getByLabelText("Your question"), "Q");

    await pay();

    expect(screen.getByRole("button", { name: "Opening payment…" })).toBeDisabled();
  });

  it("blocks a second submit while the first is running", async () => {
    let finish: (result: ApiResult<BookingStarted>) => void = () => {};
    const onSubmit = vi.fn(() => new Promise<ApiResult<BookingStarted>>((resolve) => (finish = resolve)));
    render(<BookingForm summary={summary} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Your question"), "Q");

    await pay();
    fireEvent.submit(screen.getByRole("button", { name: "Booking…" }).closest("form") as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    finish(started);
    await screen.findByRole("button", { name: "Opening payment…" });
  });

  it("keeps the question and explains a refusal such as a slot that was just taken", async () => {
    const error = { code: "conflict", message: "This time was just taken." };
    render(<BookingForm summary={summary} onSubmit={async () => ({ ok: false, error, status: 409 })} />);
    await userEvent.type(screen.getByLabelText("Your question"), "My question");

    await pay();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not start the payment");
    expect(alert).toHaveTextContent("This time was just taken.");
    expect(screen.getByLabelText("Your question")).toHaveValue("My question");
    expect(screen.getByRole("button", { name: "Pay PLN\u00a0180.00" })).toBeEnabled();
    expect(alert.parentElement).toHaveFocus();
  });

  it("shows a server message about the question at the field and clears it when the person edits", async () => {
    const error = { code: "validation_error", message: "Invalid input", fieldErrors: { question: ["The question is too long."] } };
    render(<BookingForm summary={summary} onSubmit={async () => ({ ok: false, error, status: 422 })} />);
    await userEvent.type(screen.getByLabelText("Your question"), "Q");

    await pay();

    expect(await screen.findByRole("alert")).toHaveTextContent("The question is too long.");
    expect(screen.getByLabelText("Your question")).toHaveFocus();
    await userEvent.type(screen.getByLabelText("Your question"), "!");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("booking status wording", () => {
  const states: [BookingStatus, PaymentStatus, string][] = [
    ["pending_payment", "open", "Awaiting payment"],
    ["awaiting_acceptance", "paid", "Awaiting mentor"],
    ["confirmed", "paid", "Confirmed"],
    ["declined", "refund_requested", "Declined · refund on its way"],
    ["declined", "refunded", "Declined · refunded"],
    ["declined", "refund_failed", "Declined · refund delayed"],
    ["expired", "refund_requested", "Expired · refund on its way"],
    ["expired", "refunded", "Expired · refunded"],
    ["expired", "refund_failed", "Expired · refund delayed"],
    ["payment_expired", "expired", "Payment not completed"],
  ];

  it.each(states)("labels %s with payment %s as “%s”", (status, payment, label) => {
    expect(bookingStatusLabel(status, payment)).toBe(label);
    const { unmount } = render(<BookingStatusBadge status={status} paymentStatus={payment} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    unmount();
  });

  it("describes a booking awaiting acceptance for the mentee and the mentor", () => {
    const mentee = describeBooking(booking(), "mentee", ZONE);
    const mentor = describeBooking(booking(), "mentor", ZONE);

    expect(mentee.title).toBe("Waiting for Marek Zieliński — they decide by Wed 4 Nov, 06:00 (Europe/Warsaw, UTC+1)");
    expect(mentee.text).toMatch(/full refund/);
    expect(mentor.title).toBe("Waiting for your decision — decide by Wed 4 Nov, 06:00 (Europe/Warsaw, UTC+1)");
  });

  it("describes confirmed, declined and expired for the mentor without refund details", () => {
    expect(describeBooking(booking({ status: "confirmed" }), "mentor", ZONE).title).toBe("Confirmed");
    expect(describeBooking(booking({ status: "declined" }), "mentor", ZONE).title).toBe("You declined this booking");
    expect(describeBooking(booking({ status: "expired" }), "mentor", ZONE).title).toBe("This booking expired");
  });

  it("describes confirmed for the mentee with the time and zone", () => {
    expect(describeBooking(booking({ status: "confirmed" }), "mentee", ZONE).text).toBe("Your session with Marek Zieliński is on Wed 4 Nov, 18:00 (Europe/Warsaw, UTC+1).");
  });

  it.each([
    ["declined", "refund_requested", "Declined — refund on its way", /declined\. The full amount goes back/],
    ["declined", "refunded", "Refunded", /declined\. The full amount went back/],
    ["declined", "refund_failed", "Refund delayed — we are on it", /declined\. The refund has not gone through/],
    ["expired", "refund_requested", "Expired — refund on its way", /did not decide in time\. The full amount goes back/],
    ["expired", "refunded", "Refunded", /did not decide in time\. The full amount went back/],
    ["expired", "refund_failed", "Refund delayed — we are on it", /did not decide in time\. The refund has not/],
  ] as const)("describes %s with payment %s for the mentee", (status, payment, title, text) => {
    const result = describeBooking(booking({ status, paymentStatus: payment }), "mentee", ZONE);

    expect(result.title).toBe(title);
    expect(result.text).toMatch(text);
  });

  it.each([
    ["expired", "Payment not completed — the time was released", /Nothing was charged/],
    ["refund_requested", "Payment arrived too late — refund on its way", /already released/],
    ["refunded", "Refunded", /arrived after the time was released/],
    ["refund_failed", "Refund delayed — we are on it", /arrived after the time was released/],
  ] as const)("describes a payment_expired booking with payment %s", (payment, title, text) => {
    const result = describeBooking(booking({ status: "payment_expired", paymentStatus: payment, acceptBy: null }), "mentee", ZONE);

    expect(result.title).toBe(title);
    expect(result.text).toMatch(text);
  });

  it("gives the mentor the shared wording for a booking that never got paid", () => {
    expect(describeBooking(booking({ status: "payment_expired", paymentStatus: "expired" }), "mentor", ZONE).title).toBe("Payment not completed — the time was released");
  });

  it("falls back to an empty decide-by for a booking without acceptBy", () => {
    expect(describeBooking(booking({ acceptBy: null }), "mentee", ZONE).title).toBe("Waiting for Marek Zieliński — they decide by ");
  });
});

describe("BookingStatusPanel", () => {
  it("shows the title, a sentence, the mentor's reason to the mentee and the next action", () => {
    render(
      <BookingStatusPanel
        booking={booking({ status: "declined", paymentStatus: "refund_requested", declineReason: "I am away that week." })}
        audience="mentee"
        timeZone={ZONE}
        actions={<a href="/mentors">Find another mentor</a>}
      />,
    );

    expect(screen.getByRole("region", { name: "Declined — refund on its way" })).toBeInTheDocument();
    expect(screen.getByText(/I am away that week\./)).toBeInTheDocument();
    expect(screen.getByText(/Reason from Marek Zieliński/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find another mentor" })).toBeInTheDocument();
  });

  it("does not show the reason to the mentor and has no actions area without actions", () => {
    render(<BookingStatusPanel booking={booking({ status: "declined", declineReason: "private note" })} audience="mentor" timeZone={ZONE} />);

    expect(screen.queryByText(/private note/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "You declined this booking" })).toBeInTheDocument();
  });

  it("shows no reason line when the mentor gave none", () => {
    render(<BookingStatusPanel booking={booking({ status: "declined", paymentStatus: "refunded" })} audience="mentee" timeZone={ZONE} />);

    expect(screen.queryByText(/Reason from/)).not.toBeInTheDocument();
  });

  it("shows the payment wait for a booking awaiting payment", () => {
    const { rerender } = render(<BookingStatusPanel booking={booking({ status: "pending_payment", paymentStatus: "open", acceptBy: null })} audience="mentee" timeZone={ZONE} />);
    expect(screen.getByRole("heading", { name: "Payment processing…" })).toBeInTheDocument();

    rerender(<BookingStatusPanel booking={booking({ status: "pending_payment", paymentStatus: "open", acceptBy: null })} audience="mentee" timeZone={ZONE} pendingPhase="slow" />);
    expect(screen.getByRole("heading", { name: "This page will update shortly" })).toBeInTheDocument();
  });
});

describe("PaymentPending", () => {
  it("checks with a spinner and says what it waits for", () => {
    render(<PaymentPending phase="checking" />);

    expect(screen.getByRole("heading", { name: "Payment processing…" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("usually takes a few seconds");
  });

  it("stops the spinner and promises an update when it takes long", () => {
    render(<PaymentPending phase="slow" />);

    expect(screen.getByRole("heading", { name: "This page will update shortly" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("You do not need to do anything");
  });
});

describe("BookingQuestion", () => {
  it("keeps line breaks and shows text as text", () => {
    render(<BookingQuestion question={"Line one\n<b>not bold</b>"} />);

    const text = screen.getByText(/Line one/);
    expect(text).toHaveClass("whitespace-pre-line");
    expect(text).toHaveTextContent("<b>not bold</b>");
  });
});

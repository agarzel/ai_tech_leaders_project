import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiCall } from "../../backend/api/apiCall";
import { SessionThread, type ThreadMessage } from "./SessionThread";

vi.mock("../../backend/api/apiCall", () => ({ apiCall: vi.fn() }));

const ZONE = "Europe/Warsaw";
const message = (overrides: Partial<ThreadMessage> = {}): ThreadMessage => ({
  id: "m1",
  authorId: "mentee",
  body: "Where do I start?",
  createdAt: "2026-06-10T10:05:00Z",
  ...overrides,
});

function renderThread(overrides: Partial<Parameters<typeof SessionThread>[0]> = {}) {
  return render(
    <SessionThread
      bookingId="b1"
      viewerId="mentee"
      counterpartName="Marek Zieliński"
      timeZone={ZONE}
      messages={[]}
      canWrite
      {...overrides}
    />,
  );
}

describe("SessionThread", () => {
  beforeEach(() => {
    vi.mocked(apiCall).mockReset();
  });

  it("shows an empty state when there are no messages", () => {
    renderThread();

    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("names the viewer's own messages 'You' and the other person by name, with the time in the zone", () => {
    renderThread({
      messages: [message(), message({ id: "m2", authorId: "mentor", body: "Start with the error." })],
    });

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Marek Zieliński")).toBeInTheDocument();
    expect(screen.getByText("Where do I start?")).toBeInTheDocument();
    expect(screen.getByText("Start with the error.")).toBeInTheDocument();
    expect(screen.getAllByText(/10 Jun 2026/)[0]).toBeInTheDocument();
  });

  it("sends a message, appends it to the thread and clears the composer", async () => {
    vi.mocked(apiCall).mockResolvedValue({ ok: true, status: 201, data: message({ id: "m9", body: "Thanks!" }) });
    renderThread();

    await userEvent.type(screen.getByLabelText("Message"), "Thanks!");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(apiCall).toHaveBeenCalledWith("/api/bookings/b1/messages", { method: "POST", body: { body: "Thanks!" } });
    expect(await screen.findByText("Thanks!")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("disables Send while the draft is empty", () => {
    renderThread();

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("shows the sending state while the request is running", async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.mocked(apiCall).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never);
    renderThread();

    await userEvent.type(screen.getByLabelText("Message"), "Hi");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    finish({ ok: true, status: 201, data: message({ id: "m3", body: "Hi" }) });
    await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument());
  });

  it("keeps the draft and explains the failure when sending fails", async () => {
    vi.mocked(apiCall).mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "conflict", message: "The session window is closed" },
    });
    renderThread();

    await userEvent.type(screen.getByLabelText("Message"), "Too late");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Could not send the message")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("Too late");
  });

  it("hides the composer and says the thread is read-only outside the session window", () => {
    renderThread({ canWrite: false });

    expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
    expect(screen.getByText(/read-only now/)).toBeInTheDocument();
  });
});

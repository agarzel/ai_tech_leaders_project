import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiCall } from "../../backend/api/apiCall";
import { SessionNoteEditor } from "./SessionNoteEditor";
import { SessionNotePanel } from "./SessionNotePanel";

vi.mock("../../backend/api/apiCall", () => ({ apiCall: vi.fn() }));

const failure = { ok: false as const, status: 409, error: { code: "conflict", message: "The note is already decided" } };

describe("SessionNotePanel", () => {
  beforeEach(() => {
    vi.mocked(apiCall).mockReset();
  });

  it("shows a draft in full with Approve and Reject", () => {
    render(<SessionNotePanel bookingId="b1" mentorName="Marek Zieliński" note={{ status: "draft", body: "Read the RFC first." }} />);

    expect(screen.getByText("Read the RFC first.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
  });

  it("approves a draft and then shows it as approved", async () => {
    vi.mocked(apiCall).mockResolvedValue({ ok: true, status: 200, data: { status: "approved", body: "Read the RFC first." } });
    render(<SessionNotePanel bookingId="b1" mentorName="Marek Zieliński" note={{ status: "draft", body: "Read the RFC first." }} />);

    await userEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(apiCall).toHaveBeenCalledWith("/api/bookings/b1/note/approve", { method: "POST", body: { decision: "approve" } });
    expect(await screen.findByText("You approved this note from Marek Zieliński.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("rejects a draft through the same call", async () => {
    vi.mocked(apiCall).mockResolvedValue({ ok: true, status: 200, data: { status: "rejected", body: "x" } });
    render(<SessionNotePanel bookingId="b1" mentorName="Marek" note={{ status: "draft", body: "x" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Reject" }));

    expect(apiCall).toHaveBeenCalledWith("/api/bookings/b1/note/approve", { method: "POST", body: { decision: "reject" } });
  });

  it("shows the sending state and keeps the draft when the decision fails", async () => {
    vi.mocked(apiCall).mockResolvedValue(failure);
    render(<SessionNotePanel bookingId="b1" mentorName="Marek" note={{ status: "draft", body: "x" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByText("Could not save your decision")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });

  it("shows an approved note without actions", () => {
    render(<SessionNotePanel bookingId="b1" mentorName="Marek" note={{ status: "approved", body: "Ship it small." }} />);

    expect(screen.getByText("Ship it small.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
});

describe("SessionNoteEditor", () => {
  beforeEach(() => {
    vi.mocked(apiCall).mockReset();
  });

  it("writes a new note after the session and saves it as a draft", async () => {
    vi.mocked(apiCall).mockResolvedValue({ ok: true, status: 200, data: { status: "draft", body: "Good questions." } });
    render(<SessionNoteEditor bookingId="b1" note={null} canWrite />);

    await userEvent.type(screen.getByLabelText("Your note"), "Good questions.");
    await userEvent.click(screen.getByRole("button", { name: "Write note" }));

    expect(apiCall).toHaveBeenCalledWith("/api/mentor/bookings/b1/note", { method: "PUT", body: { body: "Good questions." } });
    expect(await screen.findByRole("button", { name: "Save note" })).toBeInTheDocument();
  });

  it("edits an existing draft and shows the saving state", async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.mocked(apiCall).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never);
    render(<SessionNoteEditor bookingId="b1" note={{ status: "draft", body: "old" }} canWrite />);

    await userEvent.click(screen.getByRole("button", { name: "Save note" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    finish({ ok: true, status: 200, data: { status: "draft", body: "old" } });
  });

  it("shows the server's refusal and keeps the text", async () => {
    vi.mocked(apiCall).mockResolvedValue(failure);
    render(<SessionNoteEditor bookingId="b1" note={null} canWrite />);

    await userEvent.type(screen.getByLabelText("Your note"), "Too late");
    await userEvent.click(screen.getByRole("button", { name: "Write note" }));

    expect(await screen.findByText("Could not save the note")).toBeInTheDocument();
    expect(screen.getByLabelText("Your note")).toHaveValue("Too late");
  });

  it("shows an approved note read-only", () => {
    render(<SessionNoteEditor bookingId="b1" note={{ status: "approved", body: "Done." }} canWrite={false} />);

    expect(screen.getByText("The mentee approved this note.")).toBeInTheDocument();
    expect(screen.getByText("Done.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Your note")).not.toBeInTheDocument();
  });

  it("shows a rejected note read-only with the reason it is hidden", () => {
    render(<SessionNoteEditor bookingId="b1" note={{ status: "rejected", body: "Not for them." }} canWrite={false} />);

    expect(screen.getByText("The mentee rejected this note. It is not shown to them.")).toBeInTheDocument();
  });

  it("shows an unanswered draft read-only once writing is closed", () => {
    render(<SessionNoteEditor bookingId="b1" note={{ status: "draft", body: "Waiting." }} canWrite={false} />);

    expect(screen.getByText("Waiting for the mentee to approve this note.")).toBeInTheDocument();
    expect(screen.getByText("Waiting.")).toBeInTheDocument();
  });

  it("says when a note can first be written", () => {
    render(<SessionNoteEditor bookingId="b1" note={null} canWrite={false} />);

    expect(screen.getByText("You can write a note after the session ends.")).toBeInTheDocument();
  });
});

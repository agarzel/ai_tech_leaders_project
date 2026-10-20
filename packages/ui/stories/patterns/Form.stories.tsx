import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../src/backend/api/apiCall";
import { CrudForm } from "../../src/backend/forms/CrudForm";
import { registerFields, registerSchema, mentee, sessionUser } from "../mocks/fixtures";
import { respondError, respondNetworkError, respondNever, respondOk } from "../mocks/api";

const REGISTER = "/api/auth/register";

/**
 * The pattern on a real product form: mentee registration (spec E01, `/register`). The form is
 * `CrudForm`; the request goes through the real `apiCall`, answered by Mock Service Worker.
 */
function RegisterForm() {
  const [created, setCreated] = useState(false);
  if (created) {
    return (
      <p role="status" className="type-body">
        Account created. You are signed in.
      </p>
    );
  }
  return (
    <div className="flex max-w-sm flex-col gap-between-groups">
      <h1 className="type-page-title">Create your account</h1>
      <CrudForm
        schema={registerSchema}
        fields={registerFields}
        submitLabel="Create account"
        errorTitle="Could not create the account"
        onSubmit={(values) => apiCall(REGISTER, { method: "POST", body: values })}
        onSuccess={() => setCreated(true)}
      />
    </div>
  );
}

const meta = {
  title: "Patterns/Form",
  component: RegisterForm,
  parameters: { msw: { handlers: [respondOk("post", REGISTER, sessionUser, 201)] } },
} satisfies Meta<typeof RegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

async function fillValid(canvas: ReturnType<typeof within>) {
  await userEvent.type(canvas.getByLabelText("Name"), mentee.name);
  await userEvent.type(canvas.getByLabelText("Email"), mentee.email);
  await userEvent.type(canvas.getByLabelText("Password"), mentee.password);
}

/** Labels always visible above the field; hints under it; the placeholder is never the label. */
export const Default: Story = {};

/** A changed field is checked when the person leaves it; an untouched field stays quiet. */
export const ValidationOnBlur: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Name"));
    await userEvent.type(canvas.getByLabelText("Email"), "ola@");
    await userEvent.tab();

    await expect(canvas.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByLabelText("Email")).toHaveAccessibleDescription("Enter an email address, like ola@example.com.");
    await expect(canvas.queryByText("Enter your name.")).not.toBeInTheDocument();
  },
};

/** Submitting an incomplete form shows every error and moves focus to the first one. */
export const ValidationOnSubmit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));

    await expect(canvas.getByText("Enter your name.")).toBeInTheDocument();
    await expect(canvas.getByText("Use at least 12 characters.")).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByLabelText("Name")).toHaveFocus());
  },
};

let pendingRequests = 0;

/** Waiting for the server: one request only – the button says "Saving…" and further submits are ignored. */
export const Submitting: Story = {
  parameters: { msw: { handlers: [respondNever("post", REGISTER, () => (pendingRequests += 1))] } },
  play: async ({ canvasElement }) => {
    pendingRequests = 0;
    const canvas = within(canvasElement);
    await fillValid(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));

    const saving = await canvas.findByRole("button", { name: "Saving…" });
    await expect(saving).toBeDisabled();
    await expect(saving).toHaveAttribute("aria-busy", "true");
    // A second submit (double click before re-render, Cmd/Ctrl+Enter) is ignored.
    fireEvent.submit(canvasElement.querySelector("form") as HTMLFormElement);
    await waitFor(() => expect(pendingRequests).toBe(1));
  },
};

/**
 * The server rejects one field (409 `conflict` with `fieldErrors`): the message sits under that field
 * and focus moves to it. The wording does not confirm that the account exists (spec E01, API Contracts).
 */
export const FieldErrorFromServer: Story = {
  parameters: {
    msw: {
      handlers: [
        respondError("post", REGISTER, {
          status: 409,
          code: "conflict",
          message: "Check the highlighted field.",
          fieldErrors: { email: ["This email cannot be used to register. Log in, or use another email."] },
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillValid(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(canvas.getByLabelText("Email")).toHaveFocus());
    await expect(canvas.getByLabelText("Email")).toHaveAccessibleDescription(
      "This email cannot be used to register. Log in, or use another email.",
    );
    await expect(canvas.getByLabelText("Name")).toHaveValue(mentee.name);
  },
};

/** Too many attempts (429 `rate_limited`, spec E01 Edge Cases): the server's message says when to retry. */
export const RateLimited: Story = {
  parameters: {
    msw: {
      handlers: [
        respondError("post", REGISTER, {
          status: 429,
          code: "rate_limited",
          message: "Too many sign-up attempts from this network. Try again in 40 minutes.",
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillValid(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));

    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent("Could not create the account");
    await expect(alert).toHaveTextContent("Try again in 40 minutes.");
    await waitFor(() => expect(alert.parentElement).toHaveFocus());
  },
};

/** An unexpected server failure (500): explained in plain words, the typed values stay. */
export const ServerError: Story = {
  parameters: {
    msw: { handlers: [respondError("post", REGISTER, { status: 500, code: "internal_error", message: "Internal server error" })] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillValid(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));

    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent("Something went wrong on our side");
    await expect(alert).not.toHaveTextContent("Internal server error");
    await expect(canvas.getByLabelText("Email")).toHaveValue(mentee.email);
  },
};

/** No network: the request never reaches the server. */
export const NetworkError: Story = {
  parameters: { msw: { handlers: [respondNetworkError("post", REGISTER)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillValid(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));

    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent("No connection");
    await expect(canvas.getByRole("button", { name: "Create account" })).toBeEnabled();
  },
};

/** Success is shown only after the server confirms (201). */
export const Success: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillValid(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));

    await expect(await canvas.findByRole("status")).toHaveTextContent("Account created. You are signed in.");
  },
};

/** At 320 px the fields take the full width and hints wrap under them. */
export const Narrow320: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
};

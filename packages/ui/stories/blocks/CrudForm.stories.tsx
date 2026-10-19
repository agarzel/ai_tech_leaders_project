import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { z } from "zod";

import { apiCall } from "../../src/backend/api/apiCall";
import type { ApiResult } from "../../src/backend/api/types";
import { CrudForm } from "../../src/backend/forms/CrudForm";
import { invitationSchema, registerFields, registerSchema } from "../mocks/fixtures";
import { respondOk } from "../mocks/api";

const INVITATIONS = "/api/admin/invitations";

type PlaygroundArgs = {
  submitLabel: string;
  errorTitle: string;
  withCancel: boolean;
  onCancel: () => void;
};

const meta = {
  title: "Primitives/Panel blocks/CrudForm",
  args: {
    submitLabel: "Send invitation",
    errorTitle: "Could not create the invitation",
    withCancel: true,
    onCancel: fn(),
  },
  argTypes: { onCancel: { table: { disable: true } } },
  parameters: {
    msw: { handlers: [respondOk("post", INVITATIONS, { link: "https://devmentor.example/register/mentor?token=…" }, 201)] },
  },
  render: ({ submitLabel, errorTitle, withCancel, onCancel }) => (
    <div className="max-w-sm">
      <CrudForm
        schema={invitationSchema}
        fields={[{ name: "email", label: "Mentor's email", autoComplete: "off", description: "The invitation link is valid for 14 days." }]}
        submitLabel={submitLabel}
        errorTitle={errorTitle}
        onSubmit={(values) => apiCall(INVITATIONS, { method: "POST", body: values })}
        onCancel={withCancel ? onCancel : undefined}
      />
    </div>
  ),
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Admin invitation of a mentor (spec E01, `/admin/invitations`). */
export const Playground: Story = {};

const kindsSchema = z.object({
  name: z.string().min(1, "Enter a name."),
  email: z.email("Enter an email address, like ola@example.com."),
  password: z.string().min(12, "Use at least 12 characters.").meta({ input: "password" }),
  role: z.enum(["mentee", "mentor", "admin"]),
  headline: z.string().optional(),
});

/** Inputs inferred from the schema: text, email, password (`meta({ input: "password" })`), select (`z.enum`), optional text. */
export const FieldKinds: Story = {
  render: () => (
    <div className="max-w-sm">
      <CrudForm
        schema={kindsSchema}
        fields={[
          { name: "name", label: "Name" },
          { name: "email", label: "Email" },
          { name: "password", label: "Password", autoComplete: "new-password", description: "12 to 128 characters." },
          { name: "role", label: "Role" },
          { name: "headline", label: "Headline", optional: true, description: "One line under your name, up to 120 characters." },
        ]}
        onSubmit={async () => ({ ok: true, data: null, status: 200 })}
      />
    </div>
  ),
};

const pending = () => new Promise<ApiResult<unknown>>(() => undefined);
const rejected = async (): Promise<ApiResult<unknown>> => ({
  ok: false,
  status: 409,
  error: { code: "conflict", message: "This email already has a pending invitation.", fieldErrors: { email: ["Already invited – the earlier link is still valid."] } },
});

/** Default, field error (after submit), submitting and form error – the states the form moves through. */
export const States: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-section md:grid-cols-2">
      {(
        [
          ["Default", async () => ({ ok: true, data: null, status: 200 }) as ApiResult<unknown>],
          ["Submitting", pending],
          ["Rejected by the server", rejected],
        ] as const
      ).map(([name, onSubmit]) => (
        <section key={name} aria-label={name} className="flex flex-col gap-in-group">
          <h3 className="type-meta text-muted-foreground">{name}</h3>
          <CrudForm
            schema={invitationSchema}
            fields={[{ name: "email", label: "Mentor's email" }]}
            initialValues={name === "Default" ? undefined : { email: "marek.zielinski@example.com" }}
            submitLabel="Send invitation"
            onSubmit={onSubmit}
          />
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(within(canvas.getByRole("region", { name: "Submitting" })).getByRole("button", { name: "Send invitation" }));
    await userEvent.click(
      within(canvas.getByRole("region", { name: "Rejected by the server" })).getByRole("button", { name: "Send invitation" }),
    );
    await expect(await canvas.findByRole("button", { name: "Saving…" })).toBeDisabled();
    await expect(await canvas.findByText("Already invited – the earlier link is still valid.")).toBeInTheDocument();
  },
};

/** Long labels and hints wrap at 320 px; nothing is cut off. */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <CrudForm
      schema={registerSchema}
      fields={[
        { ...registerFields[0], label: "Name shown to mentors on every booking and in the session" },
        registerFields[1],
        { ...registerFields[2], description: "12 to 128 characters. A long passphrase is easier to remember than a short password with symbols." },
      ]}
      submitLabel="Create account"
      onSubmit={async () => ({ ok: true, data: null, status: 200 })}
    />
  ),
};

/** Keyboard: Cmd/Ctrl+Enter submits from any field, Escape cancels. */
export const Keyboard: Story = {
  args: { onCancel: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Mentor's email"), "marek@");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await waitFor(() => expect(canvas.getByLabelText("Mentor's email")).toHaveFocus());
    await expect(canvas.getByLabelText("Mentor's email")).toHaveAttribute("aria-invalid", "true");

    await userEvent.keyboard("{Escape}");
    await expect(args.onCancel).toHaveBeenCalled();
  },
};

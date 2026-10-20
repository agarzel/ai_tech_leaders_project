import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../src/backend/api/apiCall";
import { MentorProfileForm, type MentorProfileInput } from "../../../src/components/mentors/MentorProfileForm";
import { respondError, respondNetworkError, respondNever, respondOk } from "../../mocks/api";
import { fiveLinks, longBio, mentorProfile, newMentorProfile, tagOptions } from "../../mocks/fixtures";

const PROFILE = "/api/mentor/profile";

const toInput = (profile: typeof mentorProfile | typeof newMentorProfile): MentorProfileInput => ({
  name: profile.name,
  headline: profile.headline ?? "",
  bio: profile.bio ?? "",
  tags: profile.tags,
  links: profile.links,
  price25: profile.price25,
  price50: profile.price50,
  listed: profile.listed,
});

const meta = {
  title: "Product/E01/MentorProfileForm",
  component: MentorProfileForm,
  args: {
    initialValues: toInput(mentorProfile),
    tagOptions,
    currency: "PLN",
    onSubmit: (values) => apiCall(PROFILE, { method: "PUT", body: values }),
  },
  argTypes: { onSubmit: { table: { disable: true } }, initialValues: { control: "object" } },
  parameters: { msw: { handlers: [respondOk("put", PROFILE, mentorProfile)] } },
} satisfies Meta<typeof MentorProfileForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A complete profile (spec E01, `/mentor/profile`). */
export const Playground: Story = {};

/** The lazily created profile: name only, prices empty (partial). */
export const NewProfile: Story = { args: { initialValues: toInput(newMentorProfile) } };

/** Five links: *Add link* is replaced by a sentence that says why. Long bio. */
export const ManyLinksLongBio: Story = { args: { initialValues: { ...toInput(mentorProfile), links: fiveLinks, bio: longBio } } };

/** At 320 px every field takes the full width; price fields keep their short width. */
export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };

/** Saved only after the server confirms (`PUT` 200). */
export const Save: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));
    await expect(await canvas.findByText("Profile saved.")).toBeInTheDocument();
  },
};

/** Client checks on submit: headline missing, price out of range; focus on the first. */
export const ValidationOnSubmit: Story = {
  args: { initialValues: toInput(newMentorProfile) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("25-minute session"), "5");
    await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(canvas.getByLabelText("Headline")).toHaveFocus());
    await expect(canvas.getByLabelText("25-minute session")).toHaveAttribute("aria-invalid", "true");
  },
};

/** Waiting for the server: one request, busy button. */
export const Saving: Story = {
  parameters: { msw: { handlers: [respondNever("put", PROFILE)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));
    const busy = await canvas.findByRole("button", { name: "Saving…" });
    await expect(busy).toBeDisabled();
    fireEvent.submit(canvasElement.querySelector("form") as HTMLFormElement);
  },
};

/** The server rejects fields (400 `validation_error` with `fieldErrors`): messages under the fields, focus on the first. */
export const ServerFieldErrors: Story = {
  parameters: {
    msw: {
      handlers: [
        respondError("put", PROFILE, {
          status: 400,
          code: "validation_error",
          message: "Check the highlighted fields.",
          fieldErrors: { "links.1": ["This link could not be opened. Check the address."], price50: ["Enter an amount from PLN 10.00 to PLN 10,000.00."] },
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(canvas.getByLabelText("Link 2")).toHaveFocus());
    await expect(canvas.getByText("Enter an amount from PLN 10.00 to PLN 10,000.00.")).toBeInTheDocument();
  },
};

/** No network: explained above the form, values kept. */
export const NetworkError: Story = {
  parameters: { msw: { handlers: [respondNetworkError("put", PROFILE)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("No connection");
    await expect(canvas.getByLabelText("Headline")).toHaveValue(mentorProfile.headline);
  },
};

/** *Add link* moves focus to the new field. */
export const AddLink: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add link" }));
    await waitFor(() => expect(canvas.getByLabelText("Link 3")).toHaveFocus());
  },
};

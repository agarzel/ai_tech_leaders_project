import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Textarea } from "../../src/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldLabel } from "../../src/components/ui/field";
import { focusState, hoverState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

const question =
  "Our ingress-nginx pods restart every few hours after the upgrade to 1.28. Logs show 'too many open files'. I already raised the ulimit in the deployment. What else should I check before rolling back?";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  args: { "aria-label": "Your question", placeholder: "e.g. What you tried, what happened, what you expected" },
  argTypes: { disabled: { control: "boolean" }, "aria-invalid": { control: "boolean" } },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** One look; height grows with the content from 64 px (field-sizing-content). */
export const Default: Story = {
  render: () => (
    <Field className="max-w-prose">
      <FieldLabel htmlFor="question-default">Your question</FieldLabel>
      <Textarea id="question-default" aria-describedby="question-default-hint" defaultValue={question} />
      <FieldDescription id="question-default-hint">
        The mentor reads it before accepting and may decline it – you then get a full refund.
      </FieldDescription>
    </Field>
  ),
};

const states: PreviewState[] = [
  { name: "Default", props: {} },
  hoverState,
  focusState,
  { name: "Disabled", props: { disabled: true } },
  { name: "Invalid", props: { "aria-invalid": true } },
];

/** Hover and focus are frozen previews (data-preview-state, documentation only). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Textarea states"
      rows={["Empty", "Filled"] as const}
      states={states}
      render={(row, state) => (
        <Textarea
          aria-label={`Decline reason, ${row.toLowerCase()}, ${state.name.toLowerCase()}`}
          placeholder="e.g. Outside my experience"
          defaultValue={row === "Filled" ? "I have not worked with Helm 4 yet." : undefined}
          className="w-48"
          {...state.props}
        />
      )}
    />
  ),
};

/** Long text grows the field; at 320 px it stays full width with no horizontal scroll. */
export const LongTextNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <Field>
      <FieldLabel htmlFor="question-long">Your question</FieldLabel>
      <Textarea id="question-long" maxLength={2000} defaultValue={`${question}\n\n${question}`} />
    </Field>
  ),
};

/** Enter adds a new line (this is a form field, not the session composer); the error is announced. */
export const TypingAndLimitError: Story = {
  render: () => (
    <Field data-invalid>
      <FieldLabel htmlFor="reason" optional>
        Reason for declining
      </FieldLabel>
      <Textarea id="reason" aria-invalid aria-describedby="reason-error" maxLength={400} />
      <FieldError id="reason-error">The reason is longer than 280 characters. Shorten it – the mentee sees it.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: /Reason for declining/ });
    await expect(field).toBeInvalid();
    await expect(field).toHaveAccessibleDescription(/longer than 280 characters/);

    await userEvent.type(field, "Outside my experience.{Enter}Try someone who runs EKS.");
    await expect(field).toHaveValue("Outside my experience.\nTry someone who runs EKS.");
  },
};

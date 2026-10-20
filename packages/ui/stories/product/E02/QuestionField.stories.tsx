import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, within } from "storybook/test";

import { QUESTION_MAX, QuestionField } from "../../../src/components/bookings/QuestionField";
import { longQuestion } from "../../mocks/fixtures";

function Controlled({ initial = "", error, disabled }: { initial?: string; error?: string; disabled?: boolean }) {
  const [value, setValue] = useState(initial);
  return <QuestionField value={value} onChange={setValue} error={error} disabled={disabled} />;
}

const meta = {
  title: "Product/E02/QuestionField",
  component: Controlled,
  argTypes: { initial: { control: "text" } },
} satisfies Meta<typeof Controlled>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty: the hint says it is plain text, up to 2,000 characters. */
export const Playground: Story = {};

/** A real question with line breaks and a pasted log line. */
export const Filled: Story = { args: { initial: longQuestion.slice(0, 600) } };

/** Typing near the limit: the characters left are announced politely (sr-only status). */
export const NearLimit: Story = {
  args: { initial: "x".repeat(QUESTION_MAX - 150) },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("150 characters left");
  },
};

/** Over the limit: nothing is cut off; the field says by how much it is too long. */
export const OverLimit: Story = {
  args: { initial: "x".repeat(QUESTION_MAX + 40) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Shorten the question by 40 characters.");
    await expect(canvas.getByLabelText("Your question")).toBeInvalid();
  },
};

/** A pasted question over the limit becomes valid again after shortening – the message goes away. */
export const ShortenAfterPaste: Story = {
  args: { initial: "x".repeat(QUESTION_MAX + 5) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fireEvent.change(canvas.getByLabelText("Your question"), { target: { value: "x".repeat(QUESTION_MAX - 500) } });
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

/** A message from the form (nothing written). */
export const EmptyError: Story = { args: { error: "Write your question for the mentor." } };

export const Disabled: Story = { args: { initial: "Submitted", disabled: true } };

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { initial: longQuestion.slice(0, 400) } };

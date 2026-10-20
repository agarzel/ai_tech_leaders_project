import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookingQuestion } from "../../../src/components/bookings/BookingQuestion";
import { bookings, longQuestion } from "../../mocks/fixtures";

const meta = { title: "Product/E02/BookingQuestion", component: BookingQuestion, args: { question: bookings.waiting.question } } satisfies Meta<typeof BookingQuestion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Line breaks kept, plain text (Q5). */
export const Playground: Story = {};

/** Paragraphs, a pasted log and a very long URL: the text wraps, the page does not widen. */
export const LongQuestion: Story = { args: { question: longQuestion } };

/** Markup is shown as typed, never interpreted. */
export const MarkupIsText: Story = { args: { question: "Does <b>this</b> render? ```const x = 1```" } };

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { question: longQuestion } };

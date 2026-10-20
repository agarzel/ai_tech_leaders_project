import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, within } from "storybook/test";

import { SlotTimeField } from "../../../src/components/availability/SlotTimeField";
import { timeZone } from "../../mocks/fixtures";

const meta = {
  title: "Product/E01/SlotTimeField",
  component: SlotTimeField,
  args: { timeZone, onChange: fn() },
  argTypes: { onChange: { table: { disable: true } } },
} satisfies Meta<typeof SlotTimeField>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

function fill(canvas: Canvas, date: string, time: string) {
  fireEvent.change(canvas.getByLabelText("Date"), { target: { value: date } });
  fireEvent.change(canvas.getByLabelText("Time"), { target: { value: time } });
}

/** Empty: the zone is named up front, nothing is previewed until both fields are set. */
export const Playground: Story = {};

/** A normal evening: the preview repeats the start with the zone and its offset ("Starts Wed 4 Nov, 18:00 …"). */
export const Preview: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    fill(canvas, "2026-11-04", "18:00");
    await expect(canvas.getByText("Starts Wed 4 Nov, 18:00 (Europe/Warsaw, UTC+1)")).toBeInTheDocument();
    await expect(args.onChange).toHaveBeenLastCalledWith("2026-11-04T17:00:00.000Z");
  },
};

/** 02:30 on the last Sunday of March does not exist in Warsaw (clocks jump from 02:00 to 03:00): refused in words. */
export const NonexistentTime: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    fill(canvas, "2026-03-29", "02:30");
    await expect(canvas.getByRole("alert")).toHaveTextContent("This time does not exist in your time zone");
    await expect(canvas.getByLabelText("Time")).toBeInvalid();
    await expect(args.onChange).toHaveBeenLastCalledWith(null);
  },
};

/** 02:30 on the last Sunday of October happens twice: the first one is saved and the preview shows its offset (UTC+2). */
export const AmbiguousTime: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    fill(canvas, "2026-10-25", "02:30");
    await expect(canvas.getByText(/Starts Sun 25 Oct, 02:30 \(Europe\/Warsaw, UTC\+2\)/)).toBeInTheDocument();
    await expect(canvas.getByText(/happens twice/)).toBeInTheDocument();
    await expect(args.onChange).toHaveBeenLastCalledWith("2026-10-25T00:30:00.000Z");
  },
};

/** The same rules in another zone: 02:30 on 8 March does not exist in New York either. */
export const OtherTimeZone: Story = {
  args: { timeZone: "America/New_York" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Your time zone: America\/New_York/)).toBeInTheDocument();
    fill(canvas, "2026-03-08", "02:30");
    await expect(canvas.getByRole("alert")).toHaveTextContent("does not exist");
  },
};

/** A rule from the server (here the 24-hour lead) shown at the field, in the server's words. */
export const ServerError: Story = { args: { error: "Slots must start at least 24 hours from now." } };

export const Disabled: Story = { args: { disabled: true } };

/** At 320 px the date and time wrap onto two lines. */
export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };

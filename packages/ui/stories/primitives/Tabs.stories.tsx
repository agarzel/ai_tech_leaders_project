import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/components/ui/tabs";

/** Illustration: the specs show bookings in one list; tabs here only demonstrate the primitive. */
function BookingTabs({ defaultValue = "upcoming" }: { defaultValue?: string }) {
  return (
    <Tabs defaultValue={defaultValue} className="max-w-xl">
      <TabsList aria-label="Your bookings">
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
        <TabsTrigger value="declined">Declined and expired</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">Two sessions in the next seven days.</TabsContent>
      <TabsContent value="past">Sessions that already took place.</TabsContent>
      <TabsContent value="declined">Bookings that were refunded.</TabsContent>
    </Tabs>
  );
}

const meta = {
  title: "Primitives/Tabs",
  component: BookingTabs,
} satisfies Meta<typeof BookingTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Tab states: inactive, hover, focus (frozen previews), active, disabled. */
export const States: Story = {
  render: () => (
    <Tabs defaultValue="active">
      <TabsList aria-label="Tab states">
        <TabsTrigger value="inactive">Inactive</TabsTrigger>
        <TabsTrigger value="hover" data-preview-state="hover">
          Hover
        </TabsTrigger>
        <TabsTrigger value="focus" data-preview-state="focus-visible">
          Focus
        </TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">The active tab is underlined and in foreground text.</TabsContent>
    </Tabs>
  ),
};

/** At 320 px the list scrolls sideways instead of wrapping (WCAG 1.4.10 allows it for a toolbar-like row). */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
};

/** Arrow keys move focus between tabs; Enter or Space selects (Base UI manual activation, B59). */
export const ArrowKeys: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const upcoming = canvas.getByRole("tab", { name: "Upcoming" });
    const past = canvas.getByRole("tab", { name: "Past" });
    await expect(upcoming).toHaveAttribute("aria-selected", "true");

    await userEvent.click(upcoming);
    await userEvent.keyboard("{ArrowRight}");
    await expect(past).toHaveFocus();
    await expect(past).toHaveAttribute("aria-selected", "false");
    await userEvent.keyboard("{Enter}");
    await expect(past).toHaveAttribute("aria-selected", "true");
    // Base UI keeps the outgoing panel in the DOM, inert, during its exit transition.
    await waitFor(() => {
      const panels = canvas.getAllByRole("tabpanel", { hidden: true }).filter((panel) => !panel.hasAttribute("inert"));
      expect(panels).toHaveLength(1);
      expect(panels[0]).toHaveTextContent("Sessions that already took place.");
    });
  },
};

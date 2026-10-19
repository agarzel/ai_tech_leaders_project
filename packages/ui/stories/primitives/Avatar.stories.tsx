import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Avatar, AvatarFallback, AvatarImage } from "../../src/components/ui/avatar";

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  render: () => (
    <Avatar>
      <AvatarFallback>MK</AvatarFallback>
    </Avatar>
  ),
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The main use: the author of a message group in a session (R02.3) – avatar, bold name, time. */
export const MessageGroupAuthor: Story = {
  render: () => (
    <div className="flex max-w-prose items-start gap-in-group">
      <Avatar>
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="flex items-baseline gap-2">
          <span className="type-label">Marta Kowalczyk</span>
          <time className="type-meta text-muted-foreground" dateTime="2026-11-03T18:04">
            18:04
          </time>
        </p>
        <p>Can you paste the controller logs from the last restart?</p>
      </div>
    </div>
  ),
};

/** Fallbacks: initials, or a neutral person icon when there is no name – never a colour per person (B44). */
export const Fallbacks: Story = {
  render: () => (
    <div className="flex items-center gap-in-group">
      <Avatar>
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>J</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback />
      </Avatar>
      <Avatar>
        <AvatarImage src="/missing-photo.png" alt="" />
        <AvatarFallback>TN</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/** Avatar is static: default only (no hover, focus, selected or presence state – P9). */
export const States: Story = {
  render: () => (
    <div className="flex items-center gap-in-group">
      <Avatar>
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
      <span className="type-meta text-muted-foreground">One size, 32 px (B43)</span>
    </div>
  ),
};

/** A long name wraps next to the avatar at 320 px; the avatar never shrinks. */
export const LongNameNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <div className="flex max-w-xs items-start gap-in-group">
      <Avatar>
        <AvatarFallback>KW</AvatarFallback>
      </Avatar>
      <p className="type-label">Katarzyna Wiśniewska-Zawadzka-Brzęczyszczykiewicz</p>
    </div>
  ),
};

/** Next to a written name, the avatar adds nothing for screen readers: the initials are not announced twice. */
export const NameReadOnce: Story = {
  render: () => (
    <div className="flex items-center gap-in-group">
      <Avatar aria-hidden="true">
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
      <span>Marta Kowalczyk</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const initials = within(canvasElement).getByText("MK");
    await expect(initials.closest("[aria-hidden='true']")).not.toBeNull();
  },
};

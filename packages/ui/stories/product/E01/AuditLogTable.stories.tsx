import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { AuditLogTable } from "../../../src/components/audit/AuditLogTable";
import type { AuditEventView } from "../../../src/components/audit/describe-audit-event";

const admin = { id: "a1", name: "Marta Kowalska", email: "marta@devmentor.test" };
const ada = { id: "u1", name: "Ada Nowak", email: "ada.nowak@example.com" };

const at = (minutesAgo: number) => new Date(Date.UTC(2026, 10, 11, 10, 0) - minutesAgo * 60_000).toISOString();

/** One row per audit action, newest first (issue 119). */
const everyAction: AuditEventView[] = [
  { id: "e1", occurredAt: at(1), action: "user.role_changed", actorKind: "admin", actor: admin, target: ada, details: { from: "mentee", to: "mentor" } },
  { id: "e2", occurredAt: at(5), action: "user.deleted", actorKind: "admin", actor: admin, target: { id: "gone", deleted: true }, details: { role: "mentee" } },
  { id: "e3", occurredAt: at(9), action: "invitation.revoked", actorKind: "admin", actor: admin, target: null, details: { invitationId: "i0", replacedBy: "i1" } },
  { id: "e4", occurredAt: at(9), action: "invitation.created", actorKind: "admin", actor: admin, target: null, details: { invitationId: "i1" } },
  { id: "e5", occurredAt: at(30), action: "auth.admin_password_set", actorKind: "cli", actor: null, target: admin, details: { promoted: true, created: false } },
  { id: "e6", occurredAt: at(45), action: "auth.password_set", actorKind: "cli", actor: null, target: ada, details: {} },
  { id: "e7", occurredAt: at(60), action: "auth.login_failed", actorKind: "anonymous", actor: null, target: null, details: {} },
];

const meta = {
  title: "Product/E01/AuditLogTable",
  component: AuditLogTable,
  args: { events: everyAction, timeZone: "Europe/Warsaw" },
} satisfies Meta<typeof AuditLogTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every action in plain words; the deleted target shows "Deleted user", the CLI and failed logins show their actor kind. */
export const EveryAction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Role changed")).toBeVisible();
    await expect(canvas.getByText("Deleted user")).toBeVisible();
    await expect(canvas.getAllByText("CLI")).toHaveLength(2);
    await expect(canvas.getByText("Anonymous")).toBeVisible();
    await expect(canvasElement.textContent).not.toContain("user.role_changed");
  },
};

export const Empty: Story = { args: { events: [] } };

export const Loading: Story = { args: { events: undefined, isLoading: true } };

export const Failed: Story = { args: { events: undefined, error: "The audit log could not be loaded." } };

/** At 320 px only the table scrolls sideways, never the page. */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
};

/** Long names and e-mail addresses wrap inside their cell. */
export const LongContent: Story = {
  args: {
    events: [
      {
        ...everyAction[0]!,
        actor: { id: "a2", name: "Aleksandra Wiśniewska-Zawadzka", email: "aleksandra.wisniewska-zawadzka@devmentor-founders.example.com" },
      },
    ],
  },
};

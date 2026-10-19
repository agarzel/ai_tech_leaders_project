import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../src/components/ui/table";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";
import { Skeleton } from "../../src/components/ui/skeleton";

const users = [
  { id: "u1", name: "Marta Kowalczyk", email: "marta.kowalczyk@example.com", role: "mentor" },
  { id: "u2", name: "Jan Nowak", email: "jan.nowak@example.com", role: "mentee" },
  { id: "u3", name: "Ola Wójcik", email: "ola.wojcik@example.com", role: "admin" },
];

/** The admin users table (`/admin/users`) – a tabular list, not a dense product row (S21). */
function UsersTable({ onEdit }: { onEdit?: (id: string) => void }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{user.role}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" aria-label={`Edit ${user.name}`} onClick={() => onEdit?.(user.id)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const meta = {
  title: "Primitives/Table",
  component: UsersTable,
  args: { onEdit: fn() },
} satisfies Meta<typeof UsersTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Parts: header, rows, cells, caption; a footer summary row. */
export const Anatomy: Story = {
  render: () => (
    <div className="rounded-lg border border-border">
      <Table>
        <TableCaption>Mentors, mentees and administrators.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Marta Kowalczyk</TableCell>
            <TableCell>
              <Badge variant="secondary">mentor</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

/** Default row, hover (frozen preview), selected and the loading row (skeleton cells). */
export const States: Story = {
  render: () => (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Default row</TableCell>
            <TableCell>default@example.com</TableCell>
          </TableRow>
          <TableRow data-preview-state="hover">
            <TableCell>Hover row</TableCell>
            <TableCell>hover@example.com</TableCell>
          </TableRow>
          <TableRow data-state="selected">
            <TableCell>Selected row</TableCell>
            <TableCell>selected@example.com</TableCell>
          </TableRow>
          <TableRow aria-busy="true">
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

/** Long values scroll the table sideways instead of breaking the layout; at 320 px the whole table scrolls. */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <div className="max-w-xs rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Katarzyna Wiśniewska-Zawadzka</TableCell>
            <TableCell>katarzyna.wisniewska-zawadzka@example.com</TableCell>
            <TableCell>
              <Badge variant="secondary">admin</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

/** Tab reaches each row action in order; the action name repeats the row (unique names, WCAG 2.4.6). */
export const RowActionsAreDistinct: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const janEdit = canvas.getByRole("button", { name: "Edit Jan Nowak" });

    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Edit Marta Kowalczyk" })).toHaveFocus();
    await userEvent.tab();
    await expect(janEdit).toHaveFocus();

    await userEvent.click(janEdit);
    await expect(args.onEdit).toHaveBeenCalledWith("u2");
  },
};

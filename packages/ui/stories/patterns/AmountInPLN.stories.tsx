import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { formatPrice, parsePrice } from "../../src/lib/format";

const shown = [1000, 18000, 18050, 32000, 120000, 1000000];
const typed = ["180", "180.5", "180,50", "1 200", "180.505", "PLN 180", ""];

/** `formatPrice` and `parsePrice` on real values (pattern "Amount in PLN"). */
function AmountTable() {
  return (
    <div className="grid gap-section md:grid-cols-2">
      <table className="type-body">
        <caption className="mb-in-group text-left type-label">Stored (grosze) → shown</caption>
        <tbody>
          {shown.map((minor) => (
            <tr key={minor} className="border-b border-border">
              <td className="py-list-row pr-panel tabular-nums text-muted-foreground">{minor}</td>
              <td className="py-list-row text-right tabular-nums">{formatPrice(minor, "PLN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="type-body">
        <caption className="mb-in-group text-left type-label">Typed → stored (grosze)</caption>
        <tbody>
          {typed.map((text) => {
            const minor = parsePrice(text);
            return (
              <tr key={text} className="border-b border-border">
                <td className="py-list-row pr-panel type-code">{text === "" ? "(empty)" : text}</td>
                <td className="py-list-row text-right tabular-nums">{minor === null ? "not set" : Number.isNaN(minor) ? "refused" : minor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const meta = { title: "Patterns/Amount in PLN", component: AmountTable } satisfies Meta<typeof AmountTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Examples: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/PLN.10,000\.00/)).toBeInTheDocument();
  },
};

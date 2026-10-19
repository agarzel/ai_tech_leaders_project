// Documentation blocks for component pages (prompt rule 5: helpers live in the Storybook folder and are
// not exported from the package). They only lay out real components passed in by the stories and MDX.
import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

/** A preview state: its name in the matrix and the props that put a component into it. */
export type PreviewState = { name: string; props: Record<string, unknown> };

/** Frozen previews use data-preview-state (see .storybook/storybook.css) – documentation only. */
export const hoverState: PreviewState = { name: "Hover", props: { "data-preview-state": "hover" } };
export const focusState: PreviewState = { name: "Focus", props: { "data-preview-state": "focus-visible" } };
export const pressedState: PreviewState = { name: "Pressed", props: { "data-preview-state": "active" } };

const cell = "border-b border-border px-list-row py-list-row text-left align-middle";

/** Rows × states grid of real components. */
export function StateMatrix<Row extends string>({
  caption,
  rows,
  states,
  render,
}: {
  caption: string;
  rows: readonly Row[];
  states: readonly PreviewState[];
  render: (row: Row, state: PreviewState) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card text-card-foreground">
      <table className="w-full border-collapse type-body">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted">
          <tr>
            <th scope="col" className={`${cell} type-meta font-medium text-muted-foreground`}>
              <span className="sr-only">Variant</span>
            </th>
            {states.map((state) => (
              <th key={state.name} scope="col" className={`${cell} type-meta font-medium text-muted-foreground`}>
                {state.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th scope="row" className={`${cell} type-meta font-medium text-muted-foreground`}>
                {row}
              </th>
              {states.map((state) => (
                <td key={state.name} className={cell}>
                  {render(row, state)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A "do" and a "don't" example side by side, each with one sentence of explanation. */
export function DoDont({
  doExample,
  doText,
  dontExample,
  dontText,
}: {
  doExample: ReactNode;
  doText: string;
  dontExample: ReactNode;
  dontText: string;
}) {
  return (
    <div className="grid gap-between-groups md:grid-cols-2">
      <figure className="flex flex-col gap-in-group rounded-lg border border-border bg-card p-panel text-card-foreground">
        <figcaption className="flex items-center gap-2 type-label">
          <Check aria-hidden="true" className="size-4" /> Do
        </figcaption>
        <div className="flex flex-wrap items-start gap-in-group">{doExample}</div>
        <p className="type-body text-muted-foreground">{doText}</p>
      </figure>
      <figure className="flex flex-col gap-in-group rounded-lg border border-border bg-card p-panel text-card-foreground">
        <figcaption className="flex items-center gap-2 type-label text-destructive">
          <X aria-hidden="true" className="size-4" /> Don&apos;t
        </figcaption>
        <div className="flex flex-wrap items-start gap-in-group">{dontExample}</div>
        <p className="type-body text-muted-foreground">{dontText}</p>
      </figure>
    </div>
  );
}

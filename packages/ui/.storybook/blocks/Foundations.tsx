// Documentation blocks for the Foundations pages (prompt rule 5: helpers live in the Storybook
// folder and are not exported from the package). They render the real CSS variables.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CalendarDays, Check, CircleAlert, Clock, Copy, ExternalLink, LoaderCircle, X } from "lucide-react";

import { contrastRatio, cssColor, paint } from "./contrast";
import { colorRoles, contrastPairs, spacingLevels, typeRoles, type ContrastPair } from "./token-data";
import type { ThemeName } from "../theme";

const cell = "border-b border-border px-list-row py-list-row text-left align-top";
const head = `${cell} type-meta text-muted-foreground font-medium`;

function DocTable({ caption, columns, children }: { caption: string; columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card text-card-foreground">
      <table className="w-full border-collapse type-body">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className={head}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Colour roles of the current theme, with a swatch painted from the token. */
export function ColorRoles() {
  return (
    <DocTable caption="Colour roles" columns={["Swatch", "Token", "Class", "Use for", "Do not use for", "Source"]}>
      {colorRoles.map((role) => (
        <tr key={role.token}>
          <td className={cell}>
            <span
              aria-hidden="true"
              className="block size-8 rounded-md border border-input"
              style={{ background: `var(${role.token})` }}
            />
          </td>
          <td className={`${cell} type-code`}>{role.token}</td>
          <td className={`${cell} type-code`}>{role.className}</td>
          <td className={cell}>{role.use}</td>
          <td className={cell}>{role.avoid}</td>
          <td className={`${cell} type-meta text-muted-foreground`}>{role.source}</td>
        </tr>
      ))}
    </DocTable>
  );
}

type Measured = Record<string, number>;

function verdict(pair: ContrastPair, ratio: number | undefined): { threshold: number; label: string; proposal?: string } {
  const threshold = pair.kind === "text" ? 4.5 : 3;
  if (ratio === undefined) return { threshold, label: "Measuring…" };
  if (ratio >= threshold) return { threshold, label: "Pass" };
  if (pair.exception) return { threshold, label: `Below – accepted: ${pair.exception}` };
  return { threshold, label: "Below – fix needed", proposal: pair.proposal };
}

function Sample({ pair }: { pair: ContrastPair }) {
  const background = cssColor(pair.background);
  const foreground = cssColor(pair.foreground);
  if (pair.kind === "text") {
    return (
      <span className="inline-block whitespace-nowrap rounded-sm px-in-group type-label" style={{ background, color: foreground }}>
        Book 50 min
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-sm p-in-group" style={{ background }}>
      <span aria-hidden="true" className="block h-4 w-12 rounded-sm border-2" style={{ borderColor: foreground }} />
    </span>
  );
}

const pairsFor = (theme: ThemeName) => contrastPairs.filter((p) => !p.themes || p.themes.includes(theme));

/** Measured contrast of every text and UI pair, in one theme (scoped with the `light`/`dark` class). */
export function ContrastTable({ theme }: { theme: ThemeName }) {
  const scope = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<Measured>({});

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    const next: Measured = {};
    for (const pair of pairsFor(theme)) {
      // The foreground is painted over the background, so translucent tokens (dark --border) are composited.
      next[pair.name] = contrastRatio(paint([...pair.background, ...pair.foreground], el), paint(pair.background, el));
    }
    setMeasured(next);
  }, [theme]);

  return (
    <div ref={scope} className={`${theme} bg-background p-panel text-foreground`} data-testid={`contrast-${theme}`}>
      <DocTable
        caption={`Contrast, ${theme} theme`}
        columns={["Pair", "Sample", "Measured", "Threshold", "Result"]}
      >
        {pairsFor(theme).map((pair) => {
          const ratio = measured[pair.name];
          const v = verdict(pair, ratio);
          return (
            <tr key={pair.name} data-result={v.label.startsWith("Below – fix") ? "fix-needed" : v.label}>
              <td className={cell}>{pair.name}</td>
              <td className={cell}>
                <Sample pair={pair} />
              </td>
              <td className={`${cell} tabular-nums`}>{ratio === undefined ? "–" : `${ratio.toFixed(2)} : 1`}</td>
              <td className={`${cell} tabular-nums`}>
                {v.threshold} : 1 ({pair.kind === "text" ? "text" : "UI"})
              </td>
              <td className={cell}>
                {v.label}
                {v.proposal ? <span className="block type-meta text-muted-foreground">{v.proposal}</span> : null}
              </td>
            </tr>
          );
        })}
      </DocTable>
    </div>
  );
}

function useComputed(className: string) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [info, setInfo] = useState("");
  useEffect(() => {
    if (!ref.current) return;
    const s = getComputedStyle(ref.current);
    setInfo(`${s.fontSize} / ${s.lineHeight} · ${s.fontWeight}`);
  }, [className]);
  return { ref, info };
}

function TypeRow({ role }: { role: (typeof typeRoles)[number] }) {
  const { ref, info } = useComputed(role.className);
  return (
    <tr>
      <td className={cell}>
        <p ref={ref} className={`${role.className} max-w-prose`}>
          {role.sample}
        </p>
      </td>
      <td className={cell}>{role.role}</td>
      <td className={`${cell} type-code`}>{role.className}</td>
      <td className={`${cell} tabular-nums`}>{info}</td>
      <td className={cell}>{role.use}</td>
      <td className={`${cell} type-meta text-muted-foreground`}>{role.source}</td>
    </tr>
  );
}

/** Typography roles with the computed size, line height and weight. */
export function TypeRoles() {
  return (
    <DocTable caption="Typography roles" columns={["Sample", "Role", "Class", "Size / line · weight", "Use for", "Source"]}>
      {typeRoles.map((role) => (
        <TypeRow key={role.className} role={role} />
      ))}
    </DocTable>
  );
}

function SpacingRow({ level }: { level: (typeof spacingLevels)[number] }) {
  const bar = useRef<HTMLSpanElement>(null);
  const [px, setPx] = useState("");
  const first = level.token.split(" ")[0];
  useEffect(() => {
    if (bar.current) setPx(getComputedStyle(bar.current).width);
  }, []);
  return (
    <tr>
      <td className={cell}>{level.name}</td>
      <td className={cell}>
        <span ref={bar} aria-hidden="true" className="block h-2 bg-muted-foreground" style={{ width: `var(${first})` }} />
      </td>
      <td className={`${cell} tabular-nums`}>{px}</td>
      <td className={`${cell} type-code`}>{level.token}</td>
      <td className={`${cell} type-code`}>{level.className}</td>
      <td className={cell}>{level.relation}</td>
      <td className={`${cell} type-meta text-muted-foreground`}>{level.source}</td>
    </tr>
  );
}

/** Spacing by relation, measured from the tokens. */
export function SpacingScale() {
  return (
    <DocTable caption="Spacing" columns={["Level", "Size", "Measured", "Token", "Class", "Relation", "Source"]}>
      {spacingLevels.map((level) => (
        <SpacingRow key={level.name} level={level} />
      ))}
    </DocTable>
  );
}

const slots = [
  { title: "Tue 21 Oct, 18:00", meta: "50 min block · bookable" },
  { title: "Wed 22 Oct, 07:30", meta: "50 min block · bookable" },
  { title: "Thu 23 Oct, 20:00", meta: "Booked – waiting for your decision" },
];

/** The spacing relations on one realistic panel: a dense list of slots. */
export function SpacingExample() {
  return (
    <section className="flex max-w-xl flex-col gap-section bg-background p-panel text-foreground" aria-label="Spacing example">
      <div className="flex flex-col gap-between-groups">
        <h3 className="type-section-title">Your slots</h3>
        <ul className="rounded-lg border border-border bg-card">
          {slots.map((slot) => (
            <li key={slot.title} className="flex flex-col border-b border-border px-list-row py-list-row last:border-b-0">
              <span className="type-label tabular-nums">{slot.title}</span>
              <span className="type-meta text-muted-foreground">{slot.meta}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-in-group">
        <h3 className="type-section-title">Prices</h3>
        <p className="type-body tabular-nums">25 min · PLN 180.00</p>
        <p className="type-body tabular-nums">50 min · PLN 320.00</p>
      </div>
    </section>
  );
}

const radii = ["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl"] as const;

/** Radii from --radius, the 1 px frame and the absence of shadows. */
export function ShapeScale() {
  return (
    <div className="flex flex-col gap-between-groups bg-background p-panel text-foreground">
      <ul className="flex flex-wrap gap-between-groups" aria-label="Radii">
        {radii.map((r) => (
          <li key={r} className="flex flex-col items-center gap-in-group">
            <span aria-hidden="true" className={`block size-12 border border-input bg-card ${r}`} />
            <span className="type-code">{r}</span>
          </li>
        ))}
        <li className="flex flex-col items-center gap-in-group">
          <span aria-hidden="true" className="block size-12 rounded-full border border-input bg-muted" />
          <span className="type-code">rounded-full (avatar only)</span>
        </li>
      </ul>
    </div>
  );
}

const icons = [
  { Icon: CalendarDays, name: "CalendarDays", use: "Slot date" },
  { Icon: Clock, name: "Clock", use: "Session length, deadline" },
  { Icon: Copy, name: "Copy", use: "Copy share or invitation link (icon button needs a label)" },
  { Icon: Check, name: "Check", use: "Done item in the mentor checklist" },
  { Icon: X, name: "X", use: "Remove a filter, close a dialog" },
  { Icon: ExternalLink, name: "ExternalLink", use: "Link to public work (opens a new tab)" },
  { Icon: CircleAlert, name: "CircleAlert", use: "Error or warning, always with text" },
  { Icon: LoaderCircle, name: "LoaderCircle", use: "Inside the Spinner only" },
];

/** Lucide icons the product uses, at the two sizes. */
export function IconGallery() {
  return (
    <DocTable caption="Icons" columns={["16 px (size-4)", "20 px (size-5)", "Name", "Use for"]}>
      {icons.map(({ Icon, name, use }) => (
        <tr key={name}>
          <td className={cell}>
            <Icon aria-hidden="true" className="size-4" />
          </td>
          <td className={cell}>
            <Icon aria-hidden="true" className="size-5" />
          </td>
          <td className={`${cell} type-code`}>{name}</td>
          <td className={cell}>{use}</td>
        </tr>
      ))}
    </DocTable>
  );
}

function subscribeToRootTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  return () => observer.disconnect();
}

/** Shows which theme the document root carries – used by the theme story test. */
export function ThemeProbe() {
  const rootTheme = useSyncExternalStore(subscribeToRootTheme, () => document.documentElement.dataset.theme ?? "");
  return (
    <div className="flex max-w-md flex-col gap-in-group rounded-lg border border-border bg-card p-panel text-card-foreground">
      <p className="type-label">Theme on the document root</p>
      <p className="type-body" data-testid="root-theme">
        {rootTheme}
      </p>
      <p className="type-meta text-muted-foreground">Dialogs, menus and popovers render outside the story and still get this theme.</p>
    </div>
  );
}

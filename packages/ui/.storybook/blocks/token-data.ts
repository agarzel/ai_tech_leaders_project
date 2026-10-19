// Documentation data for the Foundations pages. Values are never repeated here – blocks read
// the real CSS variables from src/styles/tokens.css at runtime.

export type ColorRole = {
  token: string;
  className: string;
  use: string;
  avoid: string;
  source: string;
};

export const colorRoles: ColorRole[] = [
  { token: "--background", className: "bg-background", use: "Page background", avoid: "Under lists and panels (use card)", source: "R01.4/P4, T13" },
  { token: "--card", className: "bg-card", use: "Lists, panels, the session view", avoid: "A shadowed card around each single item (P3)", source: "R01.1, R01.3, T13" },
  { token: "--popover", className: "bg-popover", use: "Menus, popovers, dialogs", avoid: "Page sections", source: "T13" },
  { token: "--muted", className: "bg-muted", use: "Table header, row hover, quiet fills", avoid: "Large surfaces instead of background", source: "R01.4/P4" },
  { token: "--foreground", className: "text-foreground", use: "Main text, row titles, links in text", avoid: "–", source: "R01.1, T11" },
  { token: "--muted-foreground", className: "text-muted-foreground", use: "Metadata line, message time, secondary text", avoid: "Action labels, text needed to act", source: "R01.1, R02.3, T2" },
  { token: "--primary", className: "bg-primary / text-primary", use: "The one emphasised element per screen: main action and its status", avoid: "Links in text, status badges, icons, decoration, a second button", source: "R01.5/P5, K3, accent option A" },
  { token: "--primary-foreground", className: "text-primary-foreground", use: "Text and icons on primary", avoid: "Anywhere else", source: "accent option A" },
  { token: "--secondary", className: "bg-secondary", use: "Secondary buttons, status badges", avoid: "The main action", source: "P4, T10" },
  { token: "--accent", className: "bg-accent", use: "Neutral hover and selection in menus", avoid: "As the brand accent (that is primary)", source: "P4" },
  { token: "--destructive", className: "text-destructive / bg-destructive", use: "Errors, decline, irreversible actions", avoid: "Emphasis or decoration", source: "T6" },
  { token: "--border", className: "border-border", use: "1 px row separators, list and panel frame (decorative)", avoid: "Form control outlines (use input)", source: "R01.3, T5" },
  { token: "--input", className: "border-input", use: "Outline of inputs and selects", avoid: "Row separators", source: "WCAG 1.4.11, T3" },
  { token: "--ring", className: "ring-ring/50", use: "Focus ring", avoid: "As an accent", source: "T4" },
];

/** A colour layer: a token, optionally at an opacity, painted over the previous layer. */
export type Layer = { token: string; alpha?: number };

export type ContrastPair = {
  name: string;
  foreground: Layer[];
  background: Layer[];
  kind: "text" | "ui";
  /** Pairs that may stay below the threshold by an approved decision. */
  exception?: string;
  /** Only in these themes (the shadcn primitives use different opacities in dark). Default: both. */
  themes?: ("light" | "dark")[];
  /** Proposed fix, shown when the measured pair is below the threshold. */
  proposal?: string;
};


const surface = (token: string): Layer[] => [{ token }];
const over = (base: string, token: string, alpha: number): Layer[] => [{ token: base }, { token, alpha }];

/** Every text/background and UI pair the components use (tokeny.md, "Kontrast par kolorów"). */
export const contrastPairs: ContrastPair[] = [
  { name: "foreground / background", foreground: surface("--foreground"), background: surface("--background"), kind: "text" },
  { name: "foreground / card", foreground: surface("--foreground"), background: surface("--card"), kind: "text" },
  { name: "foreground / muted", foreground: surface("--foreground"), background: surface("--muted"), kind: "text" },
  { name: "muted-foreground / background", foreground: surface("--muted-foreground"), background: surface("--background"), kind: "text" },
  { name: "muted-foreground / card", foreground: surface("--muted-foreground"), background: surface("--card"), kind: "text" },
  { name: "muted-foreground / muted", foreground: surface("--muted-foreground"), background: surface("--muted"), kind: "text" },
  { name: "secondary-foreground / secondary", foreground: surface("--secondary-foreground"), background: surface("--secondary"), kind: "text" },
  { name: "primary-foreground / primary", foreground: surface("--primary-foreground"), background: surface("--primary"), kind: "text" },
  { name: "primary-foreground / primary 80% on card (hover)", foreground: surface("--primary-foreground"), background: over("--card", "--primary", 0.8), kind: "text" },
  { name: "primary as text / card", foreground: surface("--primary"), background: surface("--card"), kind: "text" },
  { name: "primary as text / background", foreground: surface("--primary"), background: surface("--background"), kind: "text" },
  { name: "destructive / card", foreground: surface("--destructive"), background: surface("--card"), kind: "text" },
  { name: "destructive / background", foreground: surface("--destructive"), background: surface("--background"), kind: "text" },
  { name: "destructive / destructive 10% on card (light button)", foreground: surface("--destructive"), background: over("--card", "--destructive", 0.1), kind: "text", themes: ["light"] },
  { name: "error outline (dark: destructive 50%) / card", foreground: over("--card", "--destructive", 0.5), background: surface("--card"), kind: "ui", themes: ["dark"] },
  { name: "error outline (destructive) / card", foreground: surface("--destructive"), background: surface("--card"), kind: "ui", themes: ["light"] },
  { name: "destructive / destructive 20% on card (light hover, dark button)", foreground: surface("--destructive"), background: over("--card", "--destructive", 0.2), kind: "text" },
  { name: "destructive / destructive 20% on background", foreground: surface("--destructive"), background: over("--background", "--destructive", 0.2), kind: "text" },
  { name: "destructive / destructive 30% on card (dark hover)", foreground: surface("--destructive"), background: over("--card", "--destructive", 0.3), kind: "text", themes: ["dark"] },
  { name: "destructive / destructive 30% on background (dark hover)", foreground: surface("--destructive"), background: over("--background", "--destructive", 0.3), kind: "text", themes: ["dark"] },
  { name: "input outline / card", foreground: surface("--input"), background: surface("--card"), kind: "ui" },
  { name: "input outline / background", foreground: surface("--input"), background: surface("--background"), kind: "ui" },
  { name: "focus ring 50% / card", foreground: over("--card", "--ring", 0.5), background: surface("--card"), kind: "ui" },
  { name: "focus ring 50% / background", foreground: over("--background", "--ring", 0.5), background: surface("--background"), kind: "ui" },
  { name: "border separator / card", foreground: surface("--border"), background: surface("--card"), kind: "ui", exception: "Decorative separator, below 3:1 by decision T5" },
];

export type TypeRole = { className: string; role: string; use: string; sample: string; source: string };

export const typeRoles: TypeRole[] = [
  { className: "type-page-title", role: "Page title", use: "One per page: the screen's name", sample: "Bookings", source: "P2" },
  { className: "type-section-title", role: "Section title", use: "Groups inside a page", sample: "Waiting for your decision", source: "P2" },
  { className: "type-body", role: "Body", use: "Running text, the booking question, messages", sample: "The migration to React 19 breaks our form library – which upgrade order is safest?", source: "P2" },
  { className: "type-label", role: "Label / row title", use: "Form labels, list row titles, button text", sample: "Anna Kowalska · 50 min", source: "P2, T12" },
  { className: "type-meta", role: "Metadata", use: "The single metadata line under a row title, message time", sample: "Tue 21 Oct, 18:00 (Europe/Warsaw) · decide by 06:00", source: "R01.1, R02.3, T12" },
  { className: "type-label tabular-nums", role: "Numbers", use: "Prices, times, counters – digits keep their width", sample: "PLN 250.00 · 25 min", source: "P2" },
  { className: "type-code", role: "Code", use: "Code, paths, file names, branch names, versions – never headings or numbers", sample: "ingress-nginx 1.28 · values.yaml", source: "R01.2/P2" },
];

export type SpacingLevel = { name: string; token: string; className: string; relation: string; source: string };

export const spacingLevels: SpacingLevel[] = [
  { name: "In a group", token: "--space-in-group", className: "gap-in-group", relation: "Between items of one group: a label and its input, two buttons of one action", source: "R01.1, T8" },
  { name: "Between groups", token: "--space-between-groups", className: "gap-between-groups", relation: "Between groups inside one panel", source: "K1, T8" },
  { name: "Inside a panel", token: "--space-panel", className: "p-panel", relation: "Padding inside a panel or list frame", source: "R01.3, T8" },
  { name: "Between sections", token: "--space-section", className: "gap-section", relation: "Between page sections", source: "K1, T8" },
  { name: "List row", token: "--list-row-py / --list-row-px", className: "py-list-row px-list-row", relation: "Padding of one dense list row", source: "R01.1, T9" },
  { name: "Message group", token: "--message-group-gap", className: "gap-message-group", relation: "Between messages of different authors", source: "R02.1, R02.3, T9" },
  { name: "Message", token: "--message-gap", className: "gap-message", relation: "Between consecutive messages of one author", source: "R02.3, T9" },
  { name: "Control height", token: "--control-height", className: "h-control", relation: "Buttons, inputs, selects: 32 px, 40 px on touch", source: "P4" },
];

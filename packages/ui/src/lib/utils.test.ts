import { describe, expect, it } from "vitest";

import { cn } from "./utils";

// S17: the design-system utilities (src/styles/theme.css) must merge like built-in Tailwind classes,
// so a consumer's className overrides a component default instead of both being applied.
describe("cn with design-system utilities", () => {
  it("lets a semantic spacing class replace a numeric one and vice versa", () => {
    expect(cn("gap-2", "gap-in-group")).toBe("gap-in-group");
    expect(cn("gap-between-groups", "gap-4")).toBe("gap-4");
    expect(cn("p-4", "p-panel")).toBe("p-panel");
    expect(cn("mt-8", "mt-section")).toBe("mt-section");
  });

  it("merges the list-row padding and control height like their built-in counterparts", () => {
    expect(cn("py-2", "py-list-row")).toBe("py-list-row");
    expect(cn("px-3", "px-list-row")).toBe("px-list-row");
    expect(cn("h-8", "h-control")).toBe("h-control");
    expect(cn("h-control", "h-control-sm")).toBe("h-control-sm");
    expect(cn("size-8", "size-control-sm")).toBe("size-control-sm");
  });

  it("keeps a typography role next to a colour class (roles use the type- prefix, not text-)", () => {
    expect(cn("type-meta", "text-muted-foreground")).toBe("type-meta text-muted-foreground");
    expect(cn("type-label text-foreground", "text-primary")).toBe("type-label text-primary");
  });

  it("lets a typography role replace raw size, line-height and weight classes", () => {
    expect(cn("text-sm font-medium leading-6", "type-meta")).toBe("type-meta");
    expect(cn("type-body", "type-label")).toBe("type-label");
  });
});

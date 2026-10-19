import { createCn } from "cn/config"

/** Spacing steps added by the design system (src/styles/theme.css, tokens T8, T9, P4). */
const SPACING = ["in-group", "between-groups", "panel", "section", "message-group", "message", "control", "control-sm"]
/** Typography role utilities (src/styles/theme.css, P2). */
const TYPE_ROLES = ["page-title", "section-title", "body", "label", "meta", "code"]

/**
 * Class merging that knows the design-system utilities, so `cn("gap-2", "gap-in-group")` keeps only
 * the later class, like built-in Tailwind classes (S17).
 */
export const cn = createCn({
  extend: {
    theme: { spacing: SPACING },
    classGroups: {
      "grid-cols": [{ "grid-cols": ["icon-content", "content-action"] }],
      py: [{ py: ["list-row"] }],
      px: [{ px: ["list-row"] }],
      "type-role": [{ type: TYPE_ROLES }],
    },
    conflictingClassGroups: {
      "type-role": ["font-size", "leading", "font-weight", "font-family"],
    },
  },
})

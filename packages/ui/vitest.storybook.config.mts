import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Every story runs as a test in a real browser (Chromium): render, play function, accessibility
// check (a11y test: "error"). One project per theme, so both themes are checked (P1).
// Not part of `test:coverage` – stories are documentation, not unit-tested logic (S5).
const dirname = path.dirname(fileURLToPath(import.meta.url));

const themeProject = (theme: "light" | "dark") => ({
  plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") }), tailwindcss()],
  define: { __SB_THEME__: JSON.stringify(theme) },
  // Pre-bundle what the primitives import, so Vite does not reload the browser mid-run on a cold cache.
  optimizeDeps: {
    include: ["@base-ui/react/button", "@base-ui/react/input", "@base-ui/react/separator", "@base-ui/react/checkbox", "@base-ui/react/radio", "@base-ui/react/radio-group", "@base-ui/react/switch", "@base-ui/react/avatar", "@base-ui/react/merge-props", "@base-ui/react/use-render", "@base-ui/react/dialog", "@base-ui/react/alert-dialog", "@base-ui/react/menu", "@base-ui/react/popover", "@base-ui/react/tooltip", "@base-ui/react/tabs", "class-variance-authority", "lucide-react", "msw", "msw/browser", "msw-storybook-addon/csf3", "zod"],
  },
  test: {
    name: `storybook-${theme}`,
    browser: {
      enabled: true,
      headless: true,
      // Reduced motion: overlays open and close without animation, so axe and focus checks see the
      // final state (and the motion-reduce variants are exercised).
      provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
      instances: [{ browser: "chromium" as const }],
    },
  },
});

export default defineConfig({
  test: { projects: [themeProject("light"), themeProject("dark")] },
});

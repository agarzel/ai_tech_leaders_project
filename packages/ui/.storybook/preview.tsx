import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./storybook.css";

import type { Preview } from "@storybook/react-vite";
import { mswLoader } from "msw-storybook-addon/csf3";
import { setupWorker } from "msw/browser";
import { addons } from "storybook/preview-api";

import { applyTheme, initialTheme, type ThemeName } from "./theme";

applyTheme(initialTheme);

// Docs pages render without a story decorator, so the theme also follows the toolbar via the channel.
addons.getChannel().on("globalsUpdated", ({ globals }: { globals: { theme?: ThemeName } }) => {
  if (globals.theme) applyTheme(globals.theme);
});

/**
 * Mock Service Worker simulates the DevMentor API in stories (S3, Q1, C15): stories declare responses in
 * `parameters.msw.handlers` (helpers in stories/mocks/api.ts) and components call the real `apiCall`.
 * Only /api/* requests are checked: one without a handler is reported as an error, everything else
 * (Vite modules, fonts, Storybook internals) passes through untouched.
 */
async function startMockApi() {
  const worker = setupWorker();
  await worker.start({
    quiet: true,
    // msw 3: unhandled requests are "frames"; only HTTP frames to /api/* are reported.
    onUnhandledFrame({ frame, defaults }) {
      const data = frame.data as { request?: Request };
      if (frame.protocol === "http" && data.request && new URL(data.request.url).pathname.startsWith("/api/")) defaults.error();
    },
  });
  return worker;
}

const preview: Preview = {
  loaders: [mswLoader(startMockApi)],
  globalTypes: {
    theme: {
      description: "Colour theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: initialTheme },
  decorators: [
    (Story, context) => {
      applyTheme(context.globals.theme as ThemeName);
      return <Story />;
    },
  ],
  parameters: {
    layout: "padded",
    // Accessibility violations fail the story tests (prompt, stage 1).
    a11y: { test: "error" },
    controls: { expanded: true },
    viewport: {
      options: {
        mobile320: { name: "320 px", styles: { width: "320px", height: "640px" } },
        tablet768: { name: "768 px", styles: { width: "768px", height: "1024px" } },
        desktop1440: { name: "1440 px", styles: { width: "1440px", height: "900px" } },
      },
    },
    options: {
      storySort: {
        order: [
          "Design system",
          ["Start here", "Components", "How to choose", "Usage and accessibility", "Content", "What to avoid", "What is missing", "Contributing", "Epics"],
          "Foundations", ["Color", "Typography", "Spacing and layout", "Shape and depth", "Motion", "Icons", "Themes"], "Primitives", "Product", "Patterns"],
      },
    },
  },
};

export default preview;

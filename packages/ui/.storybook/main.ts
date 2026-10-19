import tailwindcss from "@tailwindcss/vite";
import type { StorybookConfig } from "@storybook/react-vite";
import remarkGfm from "remark-gfm";

// DevMentor design system – Storybook for @devmentor/ui.
// Technical note: the primitives come from shadcn/ui (base-nova style) on Base UI; the Storybook UI
// shows only the product name (prompt rule 10, S18).
const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
  addons: [
    {
      name: "@storybook/addon-docs",
      // GitHub-flavoured Markdown, so tables in MDX render as tables (prompt rule 8).
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  async viteFinal(viteConfig) {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    return viteConfig;
  },
};

export default config;

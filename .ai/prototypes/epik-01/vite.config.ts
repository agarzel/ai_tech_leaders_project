import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Klikalny prototyp Epiku 01. Wynik budowania trafia do folderu statycznego Storybooka (nie commitować):
//   cd .ai/prototypes/epik-01 && npx vite build   →   /prototypes/epik-01/index.html w Storybooku
const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  base: "./",
  plugins: [tailwindcss()],
  oxc: { jsx: { runtime: "automatic" } },
  esbuild: { jsx: "automatic" },
  server: { port: 5174 },
  build: {
    outDir: path.resolve(here, "../../../packages/ui/.storybook/public/prototypes/epik-01"),
    // Zasoby w podfolderze "dist": lint:tokens pomija ten folder (zminifikowany Tailwind i biblioteki), index.html zostaje pod /prototypes/epik-01/.
    assetsDir: "dist",
    emptyOutDir: true,
  },
});

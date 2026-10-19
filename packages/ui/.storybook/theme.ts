export type ThemeName = "light" | "dark";

declare const __SB_THEME__: ThemeName | undefined;

/** Theme the story tests start in: `test:storybook` runs once per theme (vitest.storybook.config.mts). */
export const initialTheme: ThemeName = typeof __SB_THEME__ === "undefined" ? "light" : __SB_THEME__;

/**
 * Sets the theme on the document root (<html>), so dialogs, menus and popovers that render
 * outside the story get it too (prompt rule 9).
 */
export function applyTheme(theme: ThemeName, root: HTMLElement = document.documentElement): void {
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

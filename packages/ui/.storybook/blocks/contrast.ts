// Contrast measured in the browser from the real CSS variables (WCAG 2.2 relative luminance).
// Colours are painted on a 1×1 canvas, so the result is what the browser renders – including
// opacity layers such as `bg-primary/80` over a card.

import type { Layer } from "./token-data";

export type Rgb = [number, number, number];

/** Paints the layers (first one opaque) and reads the resulting sRGB pixel. */
export function paint(layers: Layer[], scope: Element): Rgb {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D is not available");
  const style = getComputedStyle(scope);
  for (const layer of layers) {
    ctx.globalAlpha = layer.alpha ?? 1;
    ctx.fillStyle = style.getPropertyValue(layer.token).trim();
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const luminance = ([r, g, b]: Rgb) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** CSS for the same layers, for the visual sample next to the number. */
export function cssColor(layers: Layer[]): string {
  const [base, top] = layers;
  if (!top) return `var(${base.token})`;
  return `color-mix(in srgb, var(${top.token}) ${Math.round((top.alpha ?? 1) * 100)}%, var(${base.token}))`;
}

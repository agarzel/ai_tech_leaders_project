// Przybliżony test kontrastu tekstu na bieżącym ekranie (WCAG 2.x): kolor tekstu względem pierwszego nieprzezroczystego tła przodka.
// Kolory z CSS (oklch itp.) są sprowadzane do sRGB przez canvas. To kontrola pomocnicza, nie audyt; pomija obrazy, gradienty i półprzezroczyste nakładki.
(() => {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] >= 0.99) return c; } return rgba(getComputedStyle(document.body).backgroundColor); };
  const frame = document.querySelector(".screen.is-current .frame");
  const bad = []; let n = 0;
  for (const el of frame.querySelectorAll("*")) {
    const own = [...el.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
    const fg = rgba(cs.color), bg = bgOf(el); n++;
    const mix = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
    const [a, b] = [lum(mix), lum(bg)]; const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (ratio < need && !el.disabled && el.getAttribute("aria-disabled") !== "true") bad.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 28)}" ${ratio.toFixed(2)}<${need}`);
  }
  return JSON.stringify({ checked: n, failing: bad.slice(0, 6), failCount: bad.length });
})()

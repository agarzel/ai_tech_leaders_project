import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles.css";

import "../engine/comments.js";
import "../engine/prototype.js";

import { Shell } from "./shell";

createRoot(document.getElementById("root") as HTMLElement).render(<Shell />);
// Silnik przeglądu startuje po zamontowaniu stałych sekcji ekranów (engine/README, "Podłączenie w Reakcie").
const start = () => {
  if (!(window as unknown as { __PROTOTYPE_START__: () => boolean }).__PROTOTYPE_START__()) requestAnimationFrame(start);
};
requestAnimationFrame(start);

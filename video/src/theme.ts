import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadCourier } from "@remotion/google-fonts/CourierPrime";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

// Palette: oro / nero / crema, come nel video di riferimento.
export const C = {
  gold: "#D9A42B",
  goldDark: "#B8861C",
  ink: "#141414",
  dark: "#1A1A1A",
  cream: "#EFEAE0",
  paper: "#FAF8F3",
  red: "#C0262B",
  sea: "#D6DEE0",
  muted: "#6B6459",
};

export const F = {
  // Titoli condensati
  display: loadAnton("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily,
  // Etichette "nastro" e fonti
  mono: loadCourier("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily,
  // Sottotitoli parola-per-parola
  sans: loadInter("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily,
  // Citazioni in corsivo
  serif: loadPlayfair("italic", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily,
};

export type Bg = "cream" | "dark" | "gold";

export const bgColor = (bg: Bg) =>
  bg === "dark" ? C.dark : bg === "gold" ? C.gold : C.cream;

export const fgColor = (bg: Bg) => (bg === "dark" ? C.paper : C.ink);

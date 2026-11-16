import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadLato } from "@remotion/google-fonts/Lato";

// Stessi font e colori del sito sapore-di-mare.html
const playfair = loadPlayfair("normal", { weights: ["400", "700"], subsets: ["latin"] });
const lato = loadLato("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const font = {
  titolo: playfair.fontFamily,
  testo: lato.fontFamily,
};

export const colori = {
  sfondo: "#163f4e", // teal scuro
  sfondoChiaro: "#1e5c6e", // teal
  carta: "#f9f7f4",
  oro: "#e8b84b",
  oroScuro: "#c8962a",
  corallo: "#e05a5a",
  azzurro: "#91c9d8",
  inchiostro: "#1a1a1a",
  bianco: "#ffffff",
};

export const FPS = 30;
export const LARGHEZZA = 1080;
export const ALTEZZA = 1920;

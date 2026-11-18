import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const fontFamily = "Lexend";

loadFont({
  family: fontFamily,
  url: staticFile("fonts/Lexend.woff2"),
  weight: "300 600",
});

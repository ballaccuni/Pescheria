import { Composition } from "remotion";
import { durataTotale, Video } from "./Video";
import { ALTEZZA, FPS, LARGHEZZA } from "./tema";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PesceFresco"
    component={Video}
    durationInFrames={durataTotale()}
    fps={FPS}
    width={LARGHEZZA}
    height={ALTEZZA}
  />
);

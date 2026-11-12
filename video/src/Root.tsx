import { Composition } from "remotion";
import { Explainer } from "./Explainer";
import { FPS, totalFrames } from "./script";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Explainer"
      component={Explainer}
      durationInFrames={totalFrames()}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};

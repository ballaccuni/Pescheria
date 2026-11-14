import { Composition } from "remotion";
import { LogoAnimation } from "./LogoAnimation";

export const MyComposition = () => {
  return (
    <Composition
      id="SaporeDiMare"
      component={LogoAnimation}
      durationInFrames={570}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};

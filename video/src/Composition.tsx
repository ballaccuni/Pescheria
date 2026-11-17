import { Composition } from "remotion";
import { LogoAnimation } from "./LogoAnimation";
import { RecipeVideo } from "./recipes/RecipeVideo";
import { gamberiZucchine } from "./recipes/gamberiZucchine";
import { orataForno } from "./recipes/orataForno";
import { pastaCozzePatate } from "./recipes/pastaCozzePatate";
import { videoLength } from "./recipes/types";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="SaporeDiMare"
        component={LogoAnimation}
        durationInFrames={570}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RicettaGamberiZucchine"
        component={RecipeVideo}
        durationInFrames={videoLength(gamberiZucchine)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ recipe: gamberiZucchine }}
      />
      <Composition
        id="RicettaOrataForno"
        component={RecipeVideo}
        durationInFrames={videoLength(orataForno)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ recipe: orataForno }}
      />
      <Composition
        id="RicettaPastaCozzePatate"
        component={RecipeVideo}
        durationInFrames={videoLength(pastaCozzePatate)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ recipe: pastaCozzePatate }}
      />
    </>
  );
};

import { Composition } from "remotion";
import { LogoAnimation } from "./LogoAnimation";
import { RecipeVideo } from "./recipes/RecipeVideo";
import { gamberiZucchine } from "./recipes/gamberiZucchine";
import { orataForno } from "./recipes/orataForno";
import { recipeTimeline } from "./recipes/types";

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
        durationInFrames={recipeTimeline(gamberiZucchine).total}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ recipe: gamberiZucchine }}
      />
      <Composition
        id="RicettaOrataForno"
        component={RecipeVideo}
        durationInFrames={recipeTimeline(orataForno).total}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ recipe: orataForno }}
      />
    </>
  );
};

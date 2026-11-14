import { Composition } from "remotion";
import { LogoAnimation } from "./LogoAnimation";
import { RecipeVideo, recipeTimeline } from "./recipes/RecipeVideo";
import { gamberiZucchine } from "./recipes/gamberiZucchine";

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
    </>
  );
};

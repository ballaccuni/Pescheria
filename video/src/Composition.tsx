import { Composition } from "remotion";
import { Logo3D } from "./Logo3D";
import { LogoAnimation } from "./LogoAnimation";
import { LogoThree } from "./LogoThree";
import { SaporeDiMare3D } from "./SaporeDiMare3D";
import { SaporeDiMareBolla2D } from "./SaporeDiMareBolla2D";
import { SaporeDiMareBolla3D } from "./SaporeDiMareBolla3D";
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
        durationInFrames={420}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SaporeDiMareBolla2D"
        component={SaporeDiMareBolla2D}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SaporeDiMareBolla3D"
        component={SaporeDiMareBolla3D}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SaporeDiMare3D"
        component={SaporeDiMare3D}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="Logo3DVero"
        component={LogoThree}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="Logo3D"
        component={Logo3D}
        durationInFrames={270}
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

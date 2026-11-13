import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { PortVideo } from "./Port/PortVideo";
import { DURATION, FPS } from "./Port/timeline";
import { PortoReel } from "./Reel/PortoReel";
import { F_DURATION, F_FPS, F_H, F_W, FlowReel } from "./Flow/FlowReel";
import { P_DURATION, P_FPS, P_H, P_W, PortoFoto } from "./Foto/PortoFoto";
import { D_DURATION, D_FPS, D_H, D_W, PortoDiscesa } from "./Foto/PortoDiscesa";
import { R_DURATION, R_FPS, R_H, R_W } from "./Reel/reel";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CostruzionePorto"
        component={PortVideo}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="PortoDiscesa"
        component={PortoDiscesa}
        durationInFrames={D_DURATION}
        fps={D_FPS}
        width={D_W}
        height={D_H}
      />
      <Composition
        id="PortoFoto"
        component={PortoFoto}
        durationInFrames={P_DURATION}
        fps={P_FPS}
        width={P_W}
        height={P_H}
      />
      <Composition
        id="PortoFlow"
        component={FlowReel}
        durationInFrames={F_DURATION}
        fps={F_FPS}
        width={F_W}
        height={F_H}
      />
      <Composition
        id="PortoReel"
        component={PortoReel}
        durationInFrames={R_DURATION}
        fps={R_FPS}
        width={R_W}
        height={R_H}
      />
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />

    </>
  );
};

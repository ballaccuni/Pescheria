import React from "react";
import { AbsoluteFill, Series, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Background, Camera, Source } from "./components/Common";
import { Caption } from "./components/Caption";
import { BigNumber, Document, Headline, List, Quote, Split } from "./scenes/Scenes";
import { MapScene } from "./scenes/MapScene";
import { HANDLE, MUSIC, Scene, SCENES, VOICEOVER } from "./script";
import { C, F } from "./theme";

const SceneBody: React.FC<{ s: Scene }> = ({ s }) => {
  switch (s.type) {
    case "map":
      return <MapScene {...s} />;
    case "headline":
      return <Headline {...s} />;
    case "number":
      return <BigNumber {...s} />;
    case "quote":
      return <Quote {...s} />;
    case "list":
      return <List {...s} />;
    case "document":
      return <Document {...s} />;
    case "split":
      return <Split {...s} />;
  }
};

const SceneView: React.FC<{ s: Scene }> = ({ s }) => (
  <Background bg={s.bg}>
    <Camera>
      <SceneBody s={s} />
    </Camera>
    <Caption text={s.caption} bg={s.type === "map" ? "cream" : s.bg} />
    <Source text={s.source} bg={s.bg} />
    {HANDLE ? (
      <div style={{ position: "absolute", right: 60, bottom: 90, fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: s.bg === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)" }}>
        {HANDLE}
      </div>
    ) : null}
  </Background>
);

export const Explainer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <Series>
        {SCENES.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={Math.round(s.seconds * fps)} name={`${i + 1}. ${s.type}`}>
            <SceneView s={s} />
          </Series.Sequence>
        ))}
      </Series>
      {VOICEOVER ? <Audio src={staticFile(VOICEOVER)} /> : null}
      {MUSIC ? <Audio src={staticFile(MUSIC)} volume={0.12} /> : null}
    </AbsoluteFill>
  );
};

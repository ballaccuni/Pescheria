import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { ReelScene } from "./ReelScene";
import { Annotations, Paper, ScreenFx } from "./ReelOverlay";
import { R_H, R_W } from "./reel";

/**
 * Versione verticale (9:16) nello stile del video di riferimento:
 * vista dall'alto su carta millimetrata, plastici 3D con ombra portata,
 * appunti scritti a mano e frecce tratteggiate che guidano lo sguardo.
 */
export const PortoReel: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <ThreeCanvas
        width={R_W}
        height={R_H}
        shadows
        dpr={1}
        style={{ position: "absolute", inset: 0 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <ReelScene />
      </ThreeCanvas>
      <Annotations />
      <ScreenFx />
    </AbsoluteFill>
  );
};

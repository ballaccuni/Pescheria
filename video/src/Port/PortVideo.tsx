import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Environment } from "./scene/Environment";
import { Dredging } from "./scene/Dredging";
import { Breakwater } from "./scene/Breakwater";
import { Quay } from "./scene/Quay";
import { Terminal } from "./scene/Terminal";
import { CameraRig } from "./scene/CameraRig";
import { Overlay } from "./Overlay";

export const PortVideo: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#cfdde8" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        dpr={1}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: 40, near: 1, far: 6000, position: [420, 230, 520] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <CameraRig />
        <Environment />
        <Dredging />
        <Breakwater />
        <Quay />
        <Terminal />
      </ThreeCanvas>
      <Overlay />
    </AbsoluteFill>
  );
};

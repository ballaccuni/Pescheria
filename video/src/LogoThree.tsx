import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";
import { COLORS, Waves } from "./LogoAnimation";
import shapesData from "./logo-shapes.json";

// Logo in 3D: le forme sono ricalcate dall'immagine originale (scripts/trace-logo.py)
// e hanno solo un po' di spessore, come un'insegna in rilievo.
// Da creare con --gl=swangle.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type PartName = "fish" | "pescheria" | "sapore" | "raffadali";
type Traced = { outer: number[][]; holes: number[][][] }[];
const TRACED = shapesData as unknown as Record<PartName, Traced>;

// coordinate del logo (1024x1024) -> spazio 3D, centrato sul logo
const X = (x: number) => (x - 512) / 100;
const Y = (y: number) => -(y - 490) / 100;

const toPath = (pts: number[][], path: THREE.Path) => {
  pts.forEach(([x, y], i) => (i === 0 ? path.moveTo(X(x), Y(y)) : path.lineTo(X(x), Y(y))));
  path.closePath();
  return path;
};

const PART_STYLE: Record<PartName, { color: string; side: string; depth: number }> = {
  fish: { color: "#3A96BF", side: "#2A7397", depth: 0.3 },
  pescheria: { color: "#3A96BF", side: "#2A7397", depth: 0.2 },
  sapore: { color: COLORS.slate, side: "#20333F", depth: 0.24 },
  raffadali: { color: COLORS.deepBlue, side: "#155A80", depth: 0.2 },
};

const usePart = (name: PartName) =>
  useMemo(() => {
    const shapes = TRACED[name].map((s) => {
      const shape = toPath(s.outer, new THREE.Shape()) as THREE.Shape;
      shape.holes = s.holes.map((h) => toPath(h, new THREE.Path()));
      return shape;
    });
    const geom = new THREE.ExtrudeGeometry(shapes, {
      depth: PART_STYLE[name].depth,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.012,
      bevelSegments: 3,
    });
    // la faccia davanti è a z = profondità: la porto a z = 0
    geom.translate(0, 0, -PART_STYLE[name].depth);
    geom.computeBoundingBox();
    const c = new THREE.Vector3();
    geom.boundingBox!.getCenter(c);
    return { geom, center: c };
  }, [name]);

/** Una parte del logo che entra dal fondo e si appoggia al suo posto. */
const Part: React.FC<{ name: PartName; p: number; bob?: number }> = ({ name, p, bob = 0 }) => {
  const { geom, center } = usePart(name);
  const st = PART_STYLE[name];
  if (p <= 0.001) return null;
  return (
    <group position={[center.x, center.y + bob - (1 - p) * 0.6, (1 - p) * -7]} rotation={[(1 - p) * -0.5, (1 - p) * -0.35, 0]} scale={0.7 + p * 0.3}>
      <mesh geometry={geom} position={[-center.x, -center.y, 0]}>
        {/* faccia davanti: colori del logo; fianchi: un tono più scuro */}
        <meshStandardMaterial attach="material-0" color={st.color} roughness={0.42} metalness={0.05} />
        <meshStandardMaterial attach="material-1" color={st.side} roughness={0.5} metalness={0.05} />
      </mesh>
    </group>
  );
};

export const LogoThree: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const enter = (start: number) => spring({ frame: frame - start, fps, config: { damping: 16, mass: 1.1 } });
  const pFish = enter(4);
  const pPesc = enter(34);
  const pSap = enter(48);
  const pRaf = enter(64);

  // dopo l'entrata il logo si muove appena, per far vedere lo spessore
  const sway = interpolate(frame, [100, 150], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const rotY = Math.sin((frame - 100) / 45) * 0.2 * sway;
  const rotX = Math.sin((frame - 100) / 70) * 0.06 * sway;
  const bob = Math.sin(frame / 18) * 0.05;

  // luce morbida che attraversa il logo
  const sweepX = frame < 215 ? interpolate(frame, [130, 200], [-8, 8], clamp) : interpolate(frame, [225, 295], [-8, 8], clamp);
  const sweepOn = (frame >= 130 && frame <= 200) || (frame >= 225 && frame <= 295) ? 1 : 0;

  const outro = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #FFFDF8 0%, ${COLORS.cream} 52%, #F2E8D6 100%)` }}>
      <Waves />
      {/* ombra a terra */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - 360,
          top: 900,
          width: 720,
          height: 64,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(47,72,88,0.22) 0%, rgba(47,72,88,0) 70%)",
          opacity: Math.min(1, pFish) * outro,
        }}
      />
      <AbsoluteFill style={{ opacity: outro }}>
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 20], fov: 30 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 10]} intensity={1.55} />
          <directionalLight position={[-6, -3, 6]} intensity={0.5} color="#DCEEFF" />
          <pointLight position={[sweepX, 1, 4]} intensity={45 * sweepOn} distance={12} />
          <group rotation={[rotX, rotY, 0]}>
            <Part name="fish" p={pFish} bob={bob} />
            <Part name="pescheria" p={pPesc} />
            <Part name="sapore" p={pSap} />
            <Part name="raffadali" p={pRaf} />
          </group>
        </ThreeCanvas>
      </AbsoluteFill>

      {/* suoni: mare e primo suono al minimo */}
      <Audio
        src={staticFile("sfx/ocean.wav")}
        volume={(f) => interpolate(f, [0, 30, durationInFrames - 40, durationInFrames], [0, 0.06, 0.06, 0], clamp)}
      />
      {[
        { from: 6, file: "splash-fish", volume: 0.1 },
        { from: 38, file: "pop", volume: 0.55 },
        { from: 52, file: "pop", volume: 0.65 },
        { from: 68, file: "note-a5", volume: 0.45 },
        { from: 132, file: "note-d5", volume: 0.3 },
        { from: 227, file: "note-fs5", volume: 0.3 },
      ].map((c) => (
        <Sequence key={`${c.file}${c.from}`} from={c.from} layout="none">
          <Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
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
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { COLORS, HOURS, Waves } from "./LogoAnimation";
import { Part, StudioEnvironment, X, Y } from "./LogoThree";
import lexend500 from "./fonts/lexend-500.json";
import lexend600 from "./fonts/lexend-600.json";

// Video completo in 3D, tutto sulla stessa parete:
// 1) logo 3D con le bollicine che escono dalla bocca del pesce
// 2) una bollicina cresce, vola verso di noi e scoppia
// 3) slogan e orari in rilievo.
// Da creare con --gl=swangle.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const F500 = new Font(lexend500 as never);
const F600 = new Font(lexend600 as never);

// colonne della tabella orari (stesse proporzioni della tabella 2D: 1.3 : 1 : 1)
const COL_D = -4.15; // inizio del giorno
const COL_M = 1.6; // fine della colonna "mattina"
const COL_P = 4.15; // fine della colonna "pomeriggio"
const ROW_SIZE = 0.31;

/** quando scoppia la bolla (cambio scena) */
export const POP = 172;
const GROW_FROM = 118;

const MOUTH = new THREE.Vector3(X(214), Y(306), 0.15);

// ------------------------------------------------------------- materiali

const Bubble: React.FC<{ position: THREE.Vector3 | [number, number, number]; r: number; opacity?: number }> = ({
  position,
  r,
  opacity = 1,
}) => (
  <group position={position} scale={r}>
    <mesh>
      <sphereGeometry args={[1, 40, 28]} />
      <meshPhysicalMaterial
        color="#CFEFFF"
        transparent
        opacity={0.3 * opacity}
        roughness={0.04}
        clearcoat={1}
        clearcoatRoughness={0.03}
        depthWrite={false}
      />
    </mesh>
    {/* riflesso di luce sulla bolla */}
    <mesh position={[-0.38, 0.42, 0.75]} scale={[0.22, 0.14, 0.05]}>
      <sphereGeometry args={[1, 20, 14]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85 * opacity} depthWrite={false} />
    </mesh>
    {/* bordo un po' più scuro */}
    <mesh>
      <torusGeometry args={[0.99, 0.03, 10, 48]} />
      <meshBasicMaterial color="#8CCBE6" transparent opacity={0.55 * opacity} depthWrite={false} />
    </mesh>
  </group>
);

// ------------------------------------------------------------- testo 3D

type Glyphs = Record<string, { ha: number }>;

/** Una riga di testo in rilievo (lettera per lettera, con spaziatura). */
const TextLine: React.FC<{
  text: string;
  font: Font;
  size: number;
  color: string;
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  tracking?: number;
  depth?: number;
  p?: number;
}> = ({ text, font, size, color, x, y, align = "left", tracking = 0, depth = 0.09, p = 1 }) => {
  const built = useMemo(() => {
    const data = font.data as unknown as { resolution: number; glyphs: Glyphs };
    const parts: { geom: THREE.BufferGeometry; x: number }[] = [];
    let cx = 0;
    for (const ch of text) {
      const adv = ((data.glyphs[ch]?.ha ?? data.resolution * 0.3) / data.resolution) * size;
      if (ch !== " ") {
        const geom = new TextGeometry(ch, {
          font,
          size,
          depth,
          curveSegments: 8,
          bevelEnabled: true,
          bevelThickness: size * 0.035,
          bevelSize: size * 0.018,
          bevelSegments: 2,
        });
        parts.push({ geom, x: cx });
      }
      cx += adv + tracking * size;
    }
    const width = cx - tracking * size;
    return { parts, width };
  }, [text, font, size, tracking, depth]);
  if (p <= 0.001) return null;
  const x0 = align === "left" ? x : align === "center" ? x - built.width / 2 : x - built.width;
  return (
    <group position={[x0, y - (1 - p) * 0.35, (1 - p) * 1.5]} scale={[1, 1, 1]}>
      {built.parts.map((part, i) => (
        <mesh key={i} geometry={part.geom} position={[part.x, 0, 0]} castShadow>
          <meshPhysicalMaterial color={color} roughness={0.4} clearcoat={0.5} clearcoatRoughness={0.25} />
        </mesh>
      ))}
    </group>
  );
};

/** Pannello in rilievo con gli angoli arrotondati. */
const Card: React.FC<{ w: number; h: number; x: number; y: number; p: number }> = ({ w, h, x, y, p }) => {
  const geom = useMemo(() => {
    const r = h * 0.28;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 12 });
    g.translate(0, 0, -0.27);
    return g;
  }, [w, h]);
  if (p <= 0.001) return null;
  return (
    <mesh geometry={geom} position={[x - (1 - p) * 2.5, y, (1 - p) * 1.2]} castShadow receiveShadow>
      <meshPhysicalMaterial attach="material-0" color="#E5EEF0" roughness={0.55} clearcoat={0.3} />
      <meshPhysicalMaterial attach="material-1" color="#C7D9E0" roughness={0.6} />
    </mesh>
  );
};

// ------------------------------------------------------------- telecamera

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  if (frame < POP) {
    const pull = interpolate(frame, [0, 120], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const orbit = interpolate(frame, [60, POP], [0, 1], clamp);
    camera.position.set(Math.sin(orbit * Math.PI * 0.7) * 1.4, 0.6 - pull * 0.4, 15.5 + pull * 4.5);
    camera.lookAt(0, 0.3, 0);
  } else {
    // scena degli orari: si avvicina piano e gira appena
    const t = interpolate(frame, [POP, POP + 280], [0, 1], clamp);
    camera.position.set(-0.6 + t * 1.2, 0.3, 20.3 - t * 0.6);
    camera.lookAt(0, 0.2, 0);
  }
  return null;
};

// ------------------------------------------------------------- video

export const SaporeDiMareBolla3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const enter = (start: number) => spring({ frame: frame - start, fps, config: { damping: 16, mass: 1.1 } });
  const pop = (start: number) => spring({ frame: frame - start, fps, config: { damping: 13, mass: 0.8 } });

  // --- scena 1: bollicine che salgono dalla bocca
  const smallBubbles = [0, 1, 2, 3, 4, 5].map((i) => {
    const period = 64;
    const t = (frame - 40 - i * 11) / period;
    if (t < 0) return null;
    const ph = t - Math.floor(t);
    const pos: [number, number, number] = [
      MOUTH.x - 0.25 - ph * 0.7 + Math.sin(ph * 8 + i) * 0.1,
      MOUTH.y + 0.25 + ph * 2.6,
      MOUTH.z + 0.3,
    ];
    return <Bubble key={i} position={pos} r={(0.09 + (i % 3) * 0.035) * (0.6 + ph * 0.8)} opacity={Math.sin(ph * Math.PI)} />;
  });

  // la bolla grande: esce dalla bocca, sale, poi vola verso la telecamera e riempie lo schermo
  const g1 = interpolate(frame, [GROW_FROM, GROW_FROM + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const g2 = interpolate(frame, [GROW_FROM + 26, POP], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const bigPos = new THREE.Vector3(
    MOUTH.x - 0.6 * g1 + (0 - (MOUTH.x - 0.6)) * g2,
    MOUTH.y + 1.4 * g1 + (0.6 - (MOUTH.y + 1.4)) * g2,
    0.6 + g1 * 0.6 + g2 * 17.4,
  );
  const bigR = 0.14 + g1 * 0.45 + g2 * 1.4;

  // --- scoppio
  const flash = interpolate(frame, [POP - 3, POP, POP + 12], [0, 1, 0], clamp);
  const droplets = useMemo(() => {
    const out: { dir: THREE.Vector3; r: number }[] = [];
    let s = 7;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < 34; i++) {
      const a = rnd() * Math.PI * 2;
      const b = (rnd() - 0.5) * 1.2;
      out.push({ dir: new THREE.Vector3(Math.cos(a), Math.sin(a), b).normalize(), r: 0.05 + rnd() * 0.08 });
    }
    return out;
  }, []);
  const dt = frame - POP;

  // --- scena 2: tempi
  const S = POP + 6;
  const rowsY = [-0.5, -1.85, -3.2];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #FFFDF8 0%, ${COLORS.cream} 52%, #F2E8D6 100%)` }}>
      <Waves />
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 20], fov: 30 }} shadows="variance" flat>
        <StudioEnvironment />
        <CameraRig frame={frame} />
        <ambientLight intensity={0.16} />
        <directionalLight
          position={[-4, 6, 9]}
          intensity={0.62}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
          shadow-camera-near={1}
          shadow-camera-far={30}
          shadow-radius={9}
          shadow-blurSamples={16}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[6, -2, 6]} intensity={0.14} color="#DCEEFF" />
        {/* parete */}
        <mesh position={[0, 0, frame < POP ? -0.45 : -0.31]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <shadowMaterial opacity={0.2} />
        </mesh>

        {frame < POP && (
          <group>
            <Part name="fish" p={enter(4)} />
            <Part name="pescheria" p={enter(34)} />
            <Part name="sapore" p={enter(48)} />
            <Part name="raffadali" p={enter(64)} />
            {smallBubbles}
            {frame >= GROW_FROM && <Bubble position={bigPos} r={bigR} />}
          </group>
        )}

        {frame >= POP && (
          <group>
            {/* goccioline dello scoppio */}
            {dt < 22 &&
              droplets.map((d, i) => (
                <mesh key={i} position={d.dir.clone().multiplyScalar(0.5 + dt * 0.45).add(new THREE.Vector3(0, 0.4, 2))} scale={d.r * (1 - dt / 22)}>
                  <sphereGeometry args={[1, 16, 12]} />
                  <meshPhysicalMaterial color="#BFE6F7" transparent opacity={0.8} roughness={0.05} clearcoat={1} />
                </mesh>
              ))}

            {/* slogan */}
            <TextLine text="DA TRE GENERAZIONI" font={F500} size={0.34} color={COLORS.blue} x={0} y={3.75} align="center" tracking={0.28} p={pop(S)} />
            <TextLine text="per voi, solo il pesce migliore" font={F500} size={0.6} color={COLORS.slate} x={0} y={2.85} align="center" p={pop(S + 10)} />

            {/* orari */}
            <TextLine text="ORARI" font={F600} size={0.34} color={COLORS.blue} x={0} y={1.6} align="center" tracking={0.45} p={pop(S + 30)} />
            <TextLine text="MATTINA" font={F600} size={0.21} color={COLORS.blue} x={COL_M} y={0.62} align="right" tracking={0.2} p={pop(S + 40)} />
            <TextLine text="POMERIGGIO" font={F600} size={0.21} color={COLORS.blue} x={COL_P} y={0.62} align="right" tracking={0.2} p={pop(S + 40)} />
            {HOURS.map((row, i) => {
              const p = pop(S + 52 + i * 12);
              const y = rowsY[i];
              return (
                <group key={row.day}>
                  <Card w={8.9} h={1.1} x={0} y={y + 0.17} p={p} />
                  <TextLine text={row.day} font={F600} size={ROW_SIZE} color={COLORS.slate} x={COL_D} y={y} p={p} depth={0.07} />
                  <TextLine
                    text={row.morning ?? "—"}
                    font={F500}
                    size={ROW_SIZE}
                    color={row.morning ? COLORS.deepBlue : "#9DB0BB"}
                    x={COL_M}
                    y={y}
                    align="right"
                    p={p}
                    depth={0.07}
                  />
                  <TextLine
                    text={row.afternoon ?? "—"}
                    font={F500}
                    size={ROW_SIZE}
                    color={row.afternoon ? COLORS.deepBlue : "#9DB0BB"}
                    x={COL_P}
                    y={y}
                    align="right"
                    p={p}
                    depth={0.07}
                  />
                </group>
              );
            })}
          </group>
        )}
      </ThreeCanvas>

      {/* lampo dello scoppio */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(214,238,250,0.7) 45%, rgba(214,238,250,0) 75%)",
          opacity: flash,
        }}
      />

      {/* suoni */}
      <Audio src={staticFile("sfx/ocean.wav")} volume={(f) => interpolate(f, [0, 30, 410, 450], [0, 0.06, 0.06, 0], clamp)} />
      {[
        { from: 6, file: "splash-fish", volume: 0.1 },
        { from: 38, file: "pop", volume: 0.55 },
        { from: 52, file: "pop", volume: 0.65 },
        { from: 68, file: "note-a5", volume: 0.45 },
        { from: 42, file: "bubbles", volume: 0.18 },
        { from: GROW_FROM, file: "bubbles", volume: 0.3 },
        { from: POP - 1, file: "pop", volume: 1.0 },
        { from: POP, file: "bubbles", volume: 0.45 },
        { from: S + 2, file: "note-d5", volume: 0.5 },
        { from: S + 12, file: "note-fs5", volume: 0.5 },
        { from: S + 32, file: "note-a4", volume: 0.4 },
        { from: S + 54, file: "note-d5", volume: 0.45 },
        { from: S + 66, file: "note-fs5", volume: 0.45 },
        { from: S + 78, file: "note-a5", volume: 0.45 },
      ].map((c) => (
        <Sequence key={`${c.file}${c.from}`} from={c.from} layout="none">
          <Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

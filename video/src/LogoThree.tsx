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
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { COLORS, Waves } from "./LogoAnimation";
import lexend500 from "./fonts/lexend-500.json";
import lexend600 from "./fonts/lexend-600.json";

// Logo in 3D vero (three.js): la lisca del pesce fatta di tubi lucidi che si
// disegna da sola, e le scritte in rilievo che entrano lettera per lettera.
// Da creare con --gl=swangle.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const FONT_500 = new Font(lexend500 as never);
const FONT_600 = new Font(lexend600 as never);

// coordinate del logo originale (1024x1024) -> spazio 3D
const P = (x: number, y: number) => new THREE.Vector3((x - 520) / 100, -(y - 300) / 100, 0);
const curve = (pts: [number, number][], closed = false) =>
  new THREE.CatmullRomCurve3(
    pts.map(([x, y]) => P(x, y)),
    closed,
    "centripetal",
  );

const TUBE_R = 0.085;

// la lisca: contorno della testa, spina, costole, coda
const FISH_PARTS: { c: THREE.CatmullRomCurve3; closed: boolean; start: number; dur: number }[] = [
  {
    c: curve(
      [
        [212, 305],
        [250, 255],
        [310, 214],
        [380, 192],
        [438, 190],
        [416, 250],
        [410, 300],
        [418, 360],
        [442, 434],
        [380, 418],
        [305, 390],
        [248, 352],
      ],
      true,
    ),
    closed: true,
    start: 4,
    dur: 34,
  },
  {
    c: curve([
      [410, 302],
      [500, 299],
      [600, 297],
      [700, 300],
      [735, 304],
    ]),
    closed: false,
    start: 24,
    dur: 22,
  },
  ...[
    [500, 195, 476, 410],
    [556, 205, 534, 402],
    [612, 218, 592, 390],
    [662, 240, 648, 368],
    [702, 262, 692, 346],
  ].map(([xt, yt, xm, yb], i) => ({
    c: curve([
      [xt, yt],
      [xm, (yt + 300) / 2 + 4],
      [xm - 4, 300],
      [xm, (300 + yb) / 2 - 4],
      [xt, yb],
    ]),
    closed: false,
    start: 30 + i * 4,
    dur: 16,
  })),
  {
    c: curve(
      [
        [716, 305],
        [770, 262],
        [828, 214],
        [804, 262],
        [780, 305],
        [804, 350],
        [826, 410],
        [770, 350],
      ],
      true,
    ),
    closed: true,
    start: 50,
    dur: 22,
  },
];

const blueMat = (color: string) => (
  <meshPhysicalMaterial color={color} roughness={0.28} metalness={0.05} clearcoat={1} clearcoatRoughness={0.12} />
);

/** Un tubo che si disegna lungo la sua curva. */
const Tube: React.FC<{ c: THREE.CatmullRomCurve3; closed: boolean; progress: number; color: string }> = ({
  c,
  closed,
  progress,
  color,
}) => {
  const SEG = 160;
  const RAD = 16;
  const geom = useMemo(() => new THREE.TubeGeometry(c, SEG, TUBE_R, RAD, closed), [c, closed]);
  const segs = Math.floor(SEG * progress);
  geom.setDrawRange(0, segs * RAD * 6);
  if (progress <= 0) return null;
  const head = c.getPointAt(Math.min(1, segs / SEG));
  const tail = c.getPointAt(0);
  return (
    <group>
      <mesh geometry={geom}>{blueMat(color)}</mesh>
      {!closed && (
        <>
          <mesh position={tail}>
            <sphereGeometry args={[TUBE_R, 24, 16]} />
            {blueMat(color)}
          </mesh>
          <mesh position={head}>
            <sphereGeometry args={[TUBE_R, 24, 16]} />
            {blueMat(color)}
          </mesh>
        </>
      )}
    </group>
  );
};

type Letter = { ch: string; geom: THREE.BufferGeometry; x: number; w: number };

/** Prepara una riga di testo in 3D, una lettera per volta, larga "width". */
const useLine = (
  words: { text: string; font: Font; size: number }[],
  width: number,
  tracking = 0,
  gap = 0.28,
) =>
  useMemo(() => {
    const letters: Letter[] = [];
    let x = 0;
    words.forEach((w, wi) => {
      const res = (w.font.data as unknown as { resolution: number }).resolution;
      const glyphs = (w.font.data as unknown as { glyphs: Record<string, { ha: number }> }).glyphs;
      for (const ch of w.text) {
        const adv = ((glyphs[ch]?.ha ?? res * 0.3) / res) * w.size;
        if (ch !== " ") {
          const geom = new TextGeometry(ch, {
            font: w.font,
            size: w.size,
            depth: 0.22,
            curveSegments: 10,
            bevelEnabled: true,
            bevelThickness: 0.035,
            bevelSize: 0.022,
            bevelSegments: 4,
          });
          letters.push({ ch, geom, x, w: adv });
        }
        x += adv + tracking * w.size;
      }
      if (wi < words.length - 1) x += gap * w.size;
    });
    const total = x - tracking * words[words.length - 1].size;
    const k = width / total;
    return { letters, scale: k, total };
  }, [words, width, tracking, gap]);

const Line: React.FC<{
  line: ReturnType<typeof useLine>;
  y: number;
  color: string;
  frame: number;
  fps: number;
  start: number;
  stagger: number;
}> = ({ line, y, color, frame, fps, start, stagger }) => (
  <group position={[0, y, 0]} scale={line.scale}>
    {line.letters.map((l, i) => {
      const p = spring({ frame: frame - start - i * stagger, fps, config: { damping: 11, mass: 0.6 } });
      if (p <= 0.001) return null;
      return (
        <group key={i} position={[l.x - line.total / 2, -(1 - p) * 1.4, 0]}>
          <mesh geometry={l.geom} rotation={[-(1 - p) * 1.7, 0, 0]} scale={[p, p, p]} position={[0, 0, -0.11]}>
            <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.05} clearcoat={1} clearcoatRoughness={0.15} />
          </mesh>
        </group>
      );
    })}
  </group>
);

export const LogoThree: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const pescheria = useLine(useMemo(() => [{ text: "PESCHERIA", font: FONT_600, size: 1 }], []), 4.55, 0.22);
  const sapore = useLine(
    useMemo(
      () => [
        { text: "Sapore", font: FONT_500, size: 1 },
        { text: "di", font: FONT_500, size: 0.8 },
        { text: "Mare", font: FONT_500, size: 1 },
      ],
      [],
    ),
    8.7,
    -0.01,
    0.22,
  );
  const raffadali = useLine(useMemo(() => [{ text: "Raffadali", font: FONT_500, size: 1 }], []), 4.05, 0.02);

  // il pesce entra ruotando, poi tutto il logo ondeggia
  const fishIn = spring({ frame: frame - 2, fps, config: { damping: 14, mass: 1.2 } });
  const sway = interpolate(frame, [125, 165], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const rotY = Math.sin((frame - 125) / 38) * 0.36 * sway;
  const rotX = 0.1 + Math.sin((frame - 125) / 57) * 0.08 * sway;
  const bob = Math.sin(frame / 16) * 0.07;

  // luce che passa sul logo e accende i riflessi
  const sweep = (a: number, b: number) => interpolate(frame, [a, b], [-9, 9], clamp);
  const sweepX = frame < 220 ? sweep(150, 210) : sweep(235, 295);
  const sweepOn = (frame >= 150 && frame <= 210) || (frame >= 235 && frame <= 295) ? 1 : 0;

  // bollicine lucide dalla bocca del pesce
  const bubbles = [0, 1, 2, 3, 4].map((i) => {
    const period = 70;
    const t = (frame - 60 - i * 14) / period;
    if (t < 0) return null;
    const ph = t - Math.floor(t);
    const mouth = P(212, 305);
    return (
      <mesh key={i} position={[mouth.x - 0.3 - ph * 0.5 + Math.sin(ph * 9 + i) * 0.08, mouth.y + 0.2 + ph * 1.8, 0.1]} scale={(0.07 + i * 0.012) * (0.6 + ph)}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshPhysicalMaterial color="#BFE3F5" roughness={0.05} clearcoat={1} transparent opacity={0.75 * Math.sin(ph * Math.PI)} />
      </mesh>
    );
  });

  const outro = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, #FFFDF8 0%, ${COLORS.cream} 50%, #F1E6D2 100%)` }}>
      <Waves />
      {/* ombra a terra */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - 340,
          top: 900,
          width: 680,
          height: 70,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(47,72,88,0.26) 0%, rgba(47,72,88,0) 70%)",
          transform: `scaleX(${0.82 + Math.cos(rotY) * 0.18})`,
          opacity: Math.min(1, fishIn) * outro,
        }}
      />
      <AbsoluteFill style={{ opacity: outro }}>
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 16], fov: 35 }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 6, 8]} intensity={2.4} />
          <directionalLight position={[-6, -2, 4]} intensity={0.7} color="#CFE8FF" />
          <pointLight position={[sweepX, 1.5, 3]} intensity={60 * sweepOn} distance={14} color="#FFFFFF" />
          <group position={[0, 1.75, 0]} rotation={[rotX, rotY, 0]}>
            <group
              position={[(1 - fishIn) * -9, bob, 0]}
              rotation={[0, (1 - fishIn) * -1.4, 0]}
            >
              {FISH_PARTS.map((part, i) => (
                <Tube
                  key={i}
                  c={part.c}
                  closed={part.closed}
                  color={COLORS.blue}
                  progress={interpolate(frame, [part.start, part.start + part.dur], [0, 1], {
                    ...clamp,
                    easing: Easing.inOut(Easing.quad),
                  })}
                />
              ))}
              {/* occhio */}
              <mesh position={P(330, 293)} scale={interpolate(frame, [20, 32], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })}>
                <sphereGeometry args={[0.2, 32, 24]} />
                {blueMat(COLORS.blue)}
              </mesh>
              {bubbles}
            </group>
            <Line line={pescheria} y={-2.33} color={COLORS.blue} frame={frame} fps={fps} start={64} stagger={2.5} />
            <Line line={sapore} y={-3.62} color="#3B5D71" frame={frame} fps={fps} start={78} stagger={2.5} />
            <Line line={raffadali} y={-5.1} color={COLORS.deepBlue} frame={frame} fps={fps} start={104} stagger={2.5} />
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
        { from: 66, file: "pop", volume: 0.6 },
        { from: 80, file: "pop", volume: 0.7 },
        { from: 106, file: "note-a5", volume: 0.5 },
        { from: 152, file: "note-d5", volume: 0.35 },
        { from: 237, file: "note-fs5", volume: 0.35 },
      ].map((c) => (
        <Sequence key={`${c.file}${c.from}`} from={c.from} layout="none">
          <Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

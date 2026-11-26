import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, Waves } from "./LogoAnimation";

// Logo in stile 3D: ogni parte del logo è una "lastra" con spessore,
// fatta di tanti strati della stessa immagine messi uno dietro l'altro.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// posizioni nell'immagine originale 1024x1024
const PARTS = {
  fish: { x: 195, y: 175, w: 650, h: 275, depth: 34 },
  pescheria: { x: 285, y: 478, w: 455, h: 64, depth: 18 },
  sapore: { x: 80, y: 540, w: 870, h: 155, depth: 26 },
  raffadali: { x: 315, y: 722, w: 405, h: 86, depth: 20 },
};
type PartName = keyof typeof PARTS;

const LAYERS = 20;

/** Una parte del logo con lo spessore (estrusione) e il riflesso di luce sulla faccia. */
const Slab: React.FC<{ name: PartName; transform: string; shine: number; opacity: number }> = ({
  name,
  transform,
  shine,
  opacity,
}) => {
  const p = PARTS[name];
  const src = staticFile(`logo/${name}.png`);
  const step = p.depth / LAYERS;
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        width: p.w,
        height: p.h,
        transformStyle: "preserve-3d",
        transform,
        opacity,
      }}
    >
      {/* fianchi: strati sempre più scuri verso il fondo */}
      {Array.from({ length: LAYERS }).map((_, k) => (
        <Img
          key={k}
          src={src}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            transform: `translateZ(${-(k + 1) * step}px)`,
            filter: `brightness(${0.62 - k * 0.012}) saturate(1.15)`,
          }}
        />
      ))}
      {/* faccia davanti */}
      <Img
        src={src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          filter: "brightness(1.06) saturate(1.1)",
        }}
      />
      {/* riflesso di luce che scorre, ritagliato sulla forma del logo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "translateZ(0.5px)",
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "100% 100%",
          maskImage: `url(${src})`,
          maskSize: "100% 100%",
          background: `linear-gradient(105deg, rgba(255,255,255,0) ${shine - 14}%, rgba(255,255,255,0.85) ${shine}%, rgba(255,255,255,0) ${shine + 14}%)`,
        }}
      />
      {/* luce morbida dall'alto */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "translateZ(0.6px)",
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "100% 100%",
          maskImage: `url(${src})`,
          maskSize: "100% 100%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.12) 100%)",
        }}
      />
    </div>
  );
};

export const Logo3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  // entrate
  const fishIn = spring({ frame: frame - 6, fps, config: { damping: 13, mass: 1.1 } });
  const pescIn = spring({ frame: frame - 34, fps, config: { damping: 12 } });
  const sapIn = spring({ frame: frame - 48, fps, config: { damping: 14, mass: 1.2 } });
  const rafIn = spring({ frame: frame - 70, fps, config: { damping: 12 } });

  // dopo le entrate tutto il logo ondeggia e mostra lo spessore
  const swayAmt = interpolate(frame, [92, 130], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const rotY = Math.sin((frame - 92) / 34) * 22 * swayAmt;
  const rotX = 6 + Math.sin((frame - 92) / 51) * 7 * swayAmt;
  const fishBob = Math.sin(frame / 15) * 8;

  // riflesso di luce: due passate
  const shineA = interpolate(frame, [104, 146], [-20, 120], clamp);
  const shineB = interpolate(frame, [196, 238], [-20, 120], clamp);
  const shine = frame < 170 ? shineA : shineB;

  const scale = width / 1024;
  const outro = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 42%, #FFFDF8 0%, ${COLORS.cream} 48%, #F1E6D2 100%)`,
      }}
    >
      <Waves />
      {/* ombra a terra */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - 330,
          top: 830,
          width: 660,
          height: 70,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(47,72,88,0.28) 0%, rgba(47,72,88,0) 70%)",
          transform: `scaleX(${0.85 + Math.cos((rotY * Math.PI) / 180) * 0.15})`,
          opacity: Math.min(fishIn, 1) * outro,
        }}
      />
      <div style={{ position: "absolute", inset: 0, perspective: 1700, perspectiveOrigin: "50% 45%" }}>
        <div
          style={{
            position: "absolute",
            width: 1024,
            height: 1024,
            left: 0,
            top: 10,
            transformOrigin: "0 0",
            transform: `scale(${scale})`,
            transformStyle: "preserve-3d",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transformOrigin: "512px 480px",
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              opacity: outro,
            }}
          >
            <Slab
              name="fish"
              opacity={Math.min(1, fishIn * 2)}
              shine={shine}
              transform={`translateX(${(1 - fishIn) * -700}px) translateY(${fishBob}px) translateZ(${40 + (1 - fishIn) * 300}px) rotateY(${(1 - fishIn) * -120}deg)`}
            />
            <Slab
              name="pescheria"
              opacity={Math.min(1, pescIn * 2)}
              shine={shine}
              transform={`translateZ(20px) rotateX(${(1 - pescIn) * -100}deg) translateY(${(1 - pescIn) * -80}px)`}
            />
            <Slab
              name="sapore"
              opacity={Math.min(1, sapIn * 2)}
              shine={shine}
              transform={`translateZ(${30 - (1 - sapIn) * 900}px) rotateX(${(1 - sapIn) * 70}deg)`}
            />
            <Slab
              name="raffadali"
              opacity={Math.min(1, rafIn * 2)}
              shine={shine}
              transform={`translateZ(20px) rotateY(${(1 - rafIn) * 100}deg)`}
            />
          </div>
        </div>
      </div>

      {/* suoni */}
      <Audio
        src={staticFile("sfx/ocean.wav")}
        volume={(f) => interpolate(f, [0, 30, durationInFrames - 40, durationInFrames], [0, 0.4, 0.4, 0], clamp)}
      />
      {[
        { from: 8, file: "splash-fish", volume: 0.7 },
        { from: 40, file: "pop", volume: 0.7 },
        { from: 56, file: "pop", volume: 0.8 },
        { from: 76, file: "note-a5", volume: 0.55 },
        { from: 108, file: "note-d5", volume: 0.4 },
        { from: 200, file: "note-fs5", volume: 0.4 },
      ].map((c) => (
        <Sequence key={`${c.file}${c.from}`} from={c.from} layout="none">
          <Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

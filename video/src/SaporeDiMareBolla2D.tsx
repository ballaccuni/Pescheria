import React from "react";
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
import { Bubbles, COLORS, HOURS, Part, Slot, Waves } from "./LogoAnimation";
import { fontFamily } from "./font";

// Video completo in 2D (stile del logo animato):
// 1) logo con le bollicine che escono dalla bocca del pesce
// 2) una bollicina cresce fino a riempire lo schermo e scoppia
// 3) slogan e orari.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const POP_2D = 172;
const GROW_FROM = 118;
// bocca del pesce nelle coordinate del logo (1024x1024)
const MOUTH = { x: 205, y: 300 };

/** Bolla disegnata come le bollicine del logo: contorno azzurro, interno chiaro, riflesso. */
const BigBubble: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width={1080} height={1080}>
    <circle cx={x} cy={y} r={r} fill="rgba(207,239,255,0.32)" stroke={COLORS.blue} strokeWidth={Math.max(3.5, r * 0.035)} />
    <ellipse cx={x - r * 0.38} cy={y - r * 0.42} rx={r * 0.22} ry={r * 0.12} fill="#FFFFFF" opacity={0.85} transform={`rotate(-30 ${x - r * 0.38} ${y - r * 0.42})`} />
    <circle cx={x + r * 0.42} cy={y + r * 0.36} r={r * 0.06} fill="#FFFFFF" opacity={0.6} />
  </svg>
);

export const SaporeDiMareBolla2D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // --- scena 1: il logo (come nel logo animato)
  const fishReveal = interpolate(frame, [8, 58], [0, 100], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const fishBob = Math.sin(frame / 14) * 6;
  const fishTilt = Math.sin(frame / 18) * 1.5;
  const pescheriaIn = interpolate(frame, [45, 70], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const saporeIn = spring({ frame: frame - 58, fps, config: { damping: 14 } });
  const raffIn = interpolate(frame, [78, 100], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const scale = width / 1024;
  const logoX = (x: number) => x * scale;
  const logoY = (y: number) => height / 2 - 490 * scale + y * scale;

  // --- la bolla grande: esce dalla bocca, sale, poi cresce fino a coprire lo schermo
  const g1 = interpolate(frame, [GROW_FROM, GROW_FROM + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const g2 = interpolate(frame, [GROW_FROM + 26, POP_2D], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const bx0 = logoX(MOUTH.x) - 30;
  const by0 = logoY(MOUTH.y) + fishBob;
  const bx1 = bx0 - 40;
  const by1 = by0 - 150;
  const bx = bx0 + (bx1 - bx0) * g1 + (width / 2 - bx1) * g2;
  const by = by0 + (by1 - by0) * g1 + (height / 2 - by1) * g2;
  const br = 10 + g1 * 46 + g2 * 900;

  // --- scoppio
  const dt = frame - POP_2D;
  const flash = interpolate(frame, [POP_2D - 3, POP_2D, POP_2D + 12], [0, 1, 0], clamp);
  const droplets = Array.from({ length: 34 }, (_, i) => {
    const a = (i / 34) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.2;
    const sp = 1 + (Math.sin(i * 78.233) * 0.5 + 0.5) * 0.8;
    return { a, sp, r: 5 + ((i * 7) % 9) };
  });

  // --- scena 2: il logo resta, piccolo in alto; sotto slogan e orari
  const logoBack = frame < POP_2D ? 0 : spring({ frame: frame - POP_2D - 2, fps, config: { damping: 14 } });
  const smallScale = scale * 0.5 * (0.85 + 0.15 * logoBack);
  const S = POP_2D + 12;
  const t = (d: number, len = 22) =>
    interpolate(frame, [S + d, S + d + len], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const slogan1 = t(0);
  const slogan2 = t(10, 25);
  const divider = interpolate(frame, [S + 25, S + 55], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const orariLabel = t(30, 20);
  const headersIn = t(40, 20);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, fontFamily }}>
      <Waves />

      {(frame < POP_2D || logoBack > 0) && (
        <div
          style={{
            position: "absolute",
            width: 1024,
            height: 1024,
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform:
              frame < POP_2D
                ? `translate(0px, ${height / 2 - 490 * scale}px) scale(${scale})`
                : `translate(${width / 2 - 512 * smallScale}px, ${205 - 490 * smallScale}px) scale(${smallScale})`,
            opacity: frame < POP_2D ? 1 : Math.min(1, logoBack * 1.4),
          }}
        >
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${fishBob}px) rotate(${fishTilt}deg)`, transformOrigin: "520px 312px" }}>
            <Part name="fish" clip={`inset(0 ${100 - fishReveal}% 0 0)`} style={{ transform: `translateX(${interpolate(fishReveal, [0, 100], [-40, 0])}px)` }} />
            <Bubbles start={40} />
          </div>
          <Part
            name="pescheria"
            style={{
              opacity: pescheriaIn,
              transform: `scaleX(${interpolate(pescheriaIn, [0, 1], [1.25, 1])})`,
              filter: `blur(${(1 - pescheriaIn) * 6}px)`,
            }}
          />
          <Part
            name="sapore"
            style={{
              opacity: Math.min(1, saporeIn * 1.5),
              transform: `translateY(${(1 - saporeIn) * 50}px) scale(${interpolate(saporeIn, [0, 1], [0.92, 1])})`,
            }}
          />
          <Part name="raffadali" clip={`inset(0 ${(1 - raffIn) * 100}% 0 0)`} style={{ opacity: raffIn }} />
        </div>
      )}

      {frame >= GROW_FROM && frame < POP_2D && <BigBubble x={bx} y={by} r={br} />}

      {/* goccioline dello scoppio */}
      {dt >= 0 && dt < 24 && (
        <svg style={{ position: "absolute", inset: 0 }} width={width} height={height}>
          {droplets.map((d, i) => {
            const dist = 60 + dt * 22 * d.sp;
            const op = 1 - dt / 24;
            return (
              <circle
                key={i}
                cx={width / 2 + Math.cos(d.a) * dist}
                cy={height / 2 + Math.sin(d.a) * dist}
                r={d.r * (1 - dt / 30)}
                fill="rgba(207,239,255,0.6)"
                stroke={COLORS.blue}
                strokeWidth={2.5}
                opacity={op}
              />
            );
          })}
        </svg>
      )}

      {frame >= POP_2D && (
        <>
          {/* Slogan */}
          <div style={{ position: "absolute", top: 420, width: "100%", textAlign: "center" }}>
            <div
              style={{
                color: COLORS.blue,
                fontSize: 30,
                fontWeight: 500,
                letterSpacing: 7,
                textTransform: "uppercase",
                opacity: slogan1,
                transform: `translateY(${(1 - slogan1) * 20}px)`,
              }}
            >
              Da tre generazioni
            </div>
            <div
              style={{
                color: COLORS.slate,
                fontSize: 50,
                fontWeight: 500,
                marginTop: 10,
                opacity: slogan2,
                transform: `translateY(${(1 - slogan2) * 24}px)`,
              }}
            >
              per voi, solo il pesce migliore
            </div>
          </div>

          {/* Divisore */}
          <div
            style={{
              position: "absolute",
              top: 600,
              left: width / 2 - 260 * divider,
              width: 520 * divider,
              height: 3,
              borderRadius: 2,
              backgroundColor: COLORS.blue,
              opacity: 0.6,
            }}
          />

          {/* Orari */}
          <div
            style={{
              position: "absolute",
              top: 625,
              width: "100%",
              textAlign: "center",
              color: COLORS.blue,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 8,
              opacity: orariLabel,
            }}
          >
            ORARI
          </div>
          <div
            style={{
              position: "absolute",
              top: 676,
              left: 90,
              right: 90,
              padding: "0 28px",
              display: "flex",
              color: COLORS.blue,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: headersIn,
            }}
          >
            <div style={{ flex: 1.3 }} />
            <div style={{ flex: 1, textAlign: "right" }}>Mattina</div>
            <div style={{ flex: 1, textAlign: "right" }}>Pomeriggio</div>
          </div>
          <div style={{ position: "absolute", top: 718, left: 90, right: 90, display: "flex", flexDirection: "column", gap: 18 }}>
            {HOURS.map((row, i) => {
              const p = spring({ frame: frame - S - 52 - i * 12, fps, config: { damping: 16 } });
              return (
                <div
                  key={row.day}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "14px 28px",
                    borderRadius: 18,
                    backgroundColor: "rgba(58,150,191,0.09)",
                    opacity: Math.min(1, p * 1.4),
                    transform: `translateX(${(1 - p) * -60}px)`,
                  }}
                >
                  <div style={{ flex: 1.3, color: COLORS.slate, fontSize: 32, fontWeight: 600 }}>{row.day}</div>
                  <Slot value={row.morning} />
                  <Slot value={row.afternoon} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* lampo dello scoppio */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(214,238,250,0.7) 45%, rgba(214,238,250,0) 75%)",
          opacity: flash,
        }}
      />

      {/* suoni: mare e primo suono al minimo */}
      <Audio src={staticFile("sfx/ocean.wav")} volume={(f) => interpolate(f, [0, 30, 410, 450], [0, 0.06, 0.06, 0], clamp)} />
      {[
        { from: 7, file: "splash-fish", volume: 0.1 },
        { from: 58, file: "pop", volume: 0.6 },
        { from: 78, file: "note-a5", volume: 0.45 },
        { from: 42, file: "bubbles", volume: 0.18 },
        { from: GROW_FROM, file: "bubbles", volume: 0.3 },
        { from: POP_2D - 1, file: "pop", volume: 1.0 },
        { from: POP_2D, file: "bubbles", volume: 0.45 },
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

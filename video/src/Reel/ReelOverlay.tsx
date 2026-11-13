import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import {
  CLOCK,
  CLOCK_NOTE,
  NOTES,
  OUTRO_START,
  R_DURATION,
  R_H,
  R_W,
  cameraAt,
  lerp,
  notePos,
  p01,
  phaseStart,
  tilePos,
} from "./reel";

loadFont({ family: "Caveat", url: staticFile("fonts/Caveat-latin.woff2"), weight: "400 700", format: "woff2" });
loadFont({ family: "Dancing Script", url: staticFile("fonts/DancingScript-latin.woff2"), weight: "400 700", format: "woff2" });

const INK = "#21434a";
const HAND = "'Caveat', cursive";
const SCRIPT = "'Dancing Script', cursive";

/* ------------------------------ primitive -------------------------------- */

/** Testo "scritto a mano": rivelato da sinistra a destra. */
const Write: React.FC<{
  x: number;
  z: number;
  p: number;
  size: number;
  font?: string;
  weight?: number;
  align?: "center" | "left" | "right";
  children: React.ReactNode;
}> = ({ x, z, p, size, font = HAND, weight = 500, align = "center", children }) => {
  if (p <= 0) return null;
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: z,
        transform: `translate(${tx}, -50%)`,
        whiteSpace: "pre",
        textAlign: align,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        color: INK,
        padding: `0 ${size * 0.25}px`,
        clipPath: `inset(-50% ${(1 - p) * 100}% -50% 0)`,
      }}
    >
      {children}
    </div>
  );
};

type Pt = [number, number];

/** Freccia tratteggiata che si disegna progressivamente (curva di Bézier). */
const DashedArrow: React.FC<{ id: string; from: Pt; c1: Pt; c2: Pt; to: Pt; p: number; w?: number }> = ({
  id,
  from,
  c1,
  c2,
  to,
  p,
  w = 0.55,
}) => {
  if (p <= 0) return null;
  const d = `M ${from[0]} ${from[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${to[0]} ${to[1]}`;
  const ang = Math.atan2(to[1] - c2[1], to[0] - c2[0]);
  const head = 2.6;
  const hp = Math.min(1, Math.max(0, (p - 0.92) / 0.08));
  const a1 = ang + Math.PI * 0.8;
  const a2 = ang - Math.PI * 0.8;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-5000} y={-5000} width={10000} height={10000}>
          <path d={d} stroke="white" strokeWidth={w * 6} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
        </mask>
      </defs>
      <path d={d} stroke={INK} strokeWidth={w} fill="none" strokeDasharray="2.1 1.7" strokeLinecap="round" mask={`url(#${id})`} opacity={0.85} />
      {hp > 0 ? (
        <path
          d={`M ${to[0] + Math.cos(a1) * head} ${to[1] + Math.sin(a1) * head} L ${to[0]} ${to[1]} L ${to[0] + Math.cos(a2) * head} ${to[1] + Math.sin(a2) * head}`}
          stroke={INK}
          strokeWidth={w * 1.1}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85 * hp}
        />
      ) : null}
    </svg>
  );
};

/** Cerchio a mano libera (più giri, irregolare) attorno a un valore. */
const Scribble: React.FC<{ x: number; z: number; rx: number; rz: number; p: number; seed: number }> = ({
  x,
  z,
  rx,
  rz,
  p,
  seed,
}) => {
  if (p <= 0) return null;
  const pts: string[] = [];
  const turns = 2.15;
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = -2.6 + u * turns * Math.PI * 2;
    const wob = 1 + 0.06 * Math.sin(a * 3 + seed) + 0.05 * (u - 0.5);
    const tilt = -0.06;
    const px = Math.cos(a) * rx * wob;
    const pz = Math.sin(a) * rz * wob;
    pts.push(`${(x + px * Math.cos(tilt) - pz * Math.sin(tilt)).toFixed(2)} ${(z + px * Math.sin(tilt) + pz * Math.cos(tilt)).toFixed(2)}`);
  }
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
      <path
        d={`M ${pts.join(" L ")}`}
        stroke={INK}
        strokeWidth={0.42}
        fill="none"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        opacity={0.8}
      />
    </svg>
  );
};

/* ------------------------------ contenuti -------------------------------- */

const Intro: React.FC<{ f: number }> = ({ f }) => {
  const t0 = tilePos(0);
  return (
    <>
      <Write x={0} z={-14} p={p01(f, 12, 45)} size={15}>
        Come si costruisce
      </Write>
      <Write x={0} z={14} p={p01(f, 38, 85)} size={34} font={SCRIPT} weight={700}>
        un Porto
      </Write>
      <DashedArrow id="intro-u" from={[-38, 33]} c1={[-10, 38]} c2={[18, 30]} to={[40, 34]} p={p01(f, 80, 100)} w={0.5} />
      <Write x={0} z={48} p={p01(f, 92, 112)} size={9}>
        in 6 fasi, dal mare al primo attracco
      </Write>
      <DashedArrow
        id="intro-a"
        from={[6, 58]}
        c1={[26, 80]}
        c2={[t0.x + 50, t0.z - 105]}
        to={[t0.x + 14, t0.z - 66]}
        p={p01(f, 112, 152)}
      />
    </>
  );
};

const PhaseNote: React.FC<{ f: number; i: number }> = ({ f, i }) => {
  const a = phaseStart(i);
  if (f < a + 120) return null;
  const n = notePos(i);
  const t = tilePos(i);
  const note = NOTES[i];
  const sgn = n.x > 0 ? 1 : -1;
  const title = note.title.length > 10 ? note.title.replace(" ", "\n") : note.title;
  const lines = title.split("\n").length;
  const zTitle = n.z + 12 + (lines - 1) * 6;
  const zLine = n.z + 22 + (lines - 1) * 12;
  const zVal = zLine + 15;
  const vp = p01(f, a + 182, a + 222);
  const value = lerp(0, note.value, vp);
  const next = i < 5 ? tilePos(i + 1) : { x: CLOCK.x, z: CLOCK.z };
  const nextTop = i < 5 ? next.z - 66 : next.z - 36;
  const nextX = i < 5 ? next.x + sgn * 14 : next.x + sgn * 10;
  return (
    <>
      <DashedArrow
        id={`ta${i}`}
        from={[t.x + sgn * 63, t.z + 16]}
        c1={[t.x + sgn * 78, t.z + 34]}
        c2={[n.x - sgn * 34, zVal + 22]}
        to={[n.x - sgn * 26, zVal + 7]}
        p={p01(f, a + 150, a + 182)}
      />
      <Write x={n.x} z={n.z} p={p01(f, a + 160, a + 172)} size={7}>
        {note.step}
      </Write>
      <Write x={n.x} z={zTitle} p={p01(f, a + 166, a + 196)} size={lines > 1 ? 13 : 14} font={SCRIPT} weight={700}>
        {title}
      </Write>
      <Write x={n.x} z={zLine} p={p01(f, a + 184, a + 204)} size={8}>
        {note.line}
      </Write>
      <Write x={n.x} z={zVal} p={p01(f, a + 190, a + 200)} size={12.5} weight={700}>
        {note.fmt(value)}
      </Write>
      <Scribble x={n.x} z={zVal + 0.5} rx={27} rz={8.6} p={p01(f, a + 200, a + 232)} seed={i * 1.7} />
      <DashedArrow
        id={`na${i}`}
        from={[n.x + sgn * 4, zVal + 12]}
        c1={[n.x + sgn * 30, zVal + 70]}
        c2={[nextX + sgn * 34, nextTop - 60]}
        to={[nextX, nextTop]}
        p={p01(f, a + 236, a + 274)}
      />
    </>
  );
};

const Outro: React.FC<{ f: number }> = ({ f }) => {
  const a = OUTRO_START;
  if (f < a) return null;
  const n = CLOCK_NOTE;
  const months = Math.round(lerp(0, 36, p01(f, a + 20, a + 230)));
  return (
    <>
      <Write x={n.x} z={n.z} p={p01(f, a + 40, a + 70)} size={11}>
        {"Non è solo\ncemento…"}
      </Write>
      <DashedArrow
        id="ca"
        from={[CLOCK.x + 33, CLOCK.z - 6]}
        c1={[CLOCK.x + 48, CLOCK.z - 4]}
        c2={[n.x - 30, n.z + 46]}
        to={[n.x - 24, n.z + 34]}
        p={p01(f, a + 75, a + 105)}
      />
      <Write x={n.x} z={n.z + 34} p={p01(f, a + 100, a + 112)} size={14} weight={700}>
        {`${months} mesi`}
      </Write>
      <Scribble x={n.x} z={n.z + 34.5} rx={25} rz={9.5} p={p01(f, a + 110, a + 145)} seed={9} />
      <DashedArrow
        id="cb"
        from={[n.x - 6, n.z + 46]}
        c1={[n.x - 14, n.z + 66]}
        c2={[n.x - 4, n.z + 72]}
        to={[n.x - 2, n.z + 80]}
        p={p01(f, a + 150, a + 175)}
      />
      <Write x={n.x + 2} z={n.z + 96} p={p01(f, a + 172, a + 230)} size={12.5} font={SCRIPT} weight={700}>
        {"è tutta una\nquestione\ndi tempo"}
      </Write>
    </>
  );
};

/* ------------------------------- overlay ---------------------------------- */

const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.25  0 0 0 0 0.27  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
)}")`;

export const Paper: React.FC = () => {
  const f = useCurrentFrame();
  const c = cameraAt(f);
  const ox = R_W / 2 - c.x * c.k;
  const oz = R_H / 2 - c.z * c.k;
  const cell = 10 * c.k;
  const line = "rgba(28, 82, 86, 0.17)";
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse 95% 80% at 50% 45%, #addbd6 0%, #93c9c4 60%, #74b0ac 100%)",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(to right, ${line} 1.6px, transparent 1.6px), linear-gradient(to bottom, ${line} 1.6px, transparent 1.6px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${ox}px ${oz}px`,
        }}
      />
      <AbsoluteFill style={{ backgroundImage: NOISE, backgroundPosition: `${ox}px ${oz}px`, opacity: 0.35 }} />
    </AbsoluteFill>
  );
};

export const Annotations: React.FC = () => {
  const f = useCurrentFrame();
  const c = cameraAt(f);
  const ox = R_W / 2 - c.x * c.k;
  const oz = R_H / 2 - c.z * c.k;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${ox}px, ${oz}px) scale(${c.k})`,
        }}
      >
        <Intro f={f} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <PhaseNote key={i} f={f} i={i} />
        ))}
        <Outro f={f} />
      </div>
    </AbsoluteFill>
  );
};

export const ScreenFx: React.FC = () => {
  const f = useCurrentFrame();
  const fadeIn = 1 - p01(f, 0, 14);
  const fadeOut = p01(f, R_DURATION - 18, R_DURATION - 1);
  const cap = p01(f, OUTRO_START + 330, OUTRO_START + 380);
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 90% 75% at 50% 48%, rgba(0,0,0,0) 60%, rgba(10,40,42,0.2) 100%)",
        }}
      />
      {cap > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 110,
            textAlign: "center",
            opacity: cap,
            transform: `translateY(${(1 - cap) * 30}px)`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "26px 48px 30px",
              borderRadius: 26,
              background: "rgba(214, 238, 234, 0.9)",
              boxShadow: "0 18px 40px rgba(8,40,42,0.35)",
              color: INK,
            }}
          >
            <div style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: 86, lineHeight: 1.05 }}>Come nasce un porto</div>
            <div style={{ fontFamily: HAND, fontWeight: 600, fontSize: 50, marginTop: 8 }}>6 fasi · 36 mesi · 1 porto</div>
          </div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#0f2b2e", opacity: Math.max(fadeIn, fadeOut) }} />
    </AbsoluteFill>
  );
};

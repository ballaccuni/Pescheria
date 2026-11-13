import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";

/*
 * Video verticale montato sulle immagini generate con Google Flow:
 * ogni foto è una scena; la telecamera "scorre" verso il basso da una
 * scena all'altra (come nel video di riferimento) e sopra compaiono
 * appunti scritti a mano, valori che contano, cerchi e frecce tratteggiate.
 */

loadFont({ family: "Caveat", url: staticFile("fonts/Caveat-latin.woff2"), weight: "400 700", format: "woff2" });
loadFont({ family: "Dancing Script", url: staticFile("fonts/DancingScript-latin.woff2"), weight: "400 700", format: "woff2" });

export const F_W = 1080;
export const F_H = 1920;
export const F_FPS = 30;

const IMG_H = 1935; // 768×1376 scalato a 1080 di larghezza
const SCROLL = 26; // durata dello scorrimento tra scene
const INK = "#1d3f45";
const HAND = "'Caveat', cursive";
const SCRIPT = "'Dancing Script', cursive";

export type Pt = [number, number];
export type Arrow = { from: Pt; c1: Pt; c2: Pt; to: Pt };

type Phase = {
  kind: "phase";
  img: string;
  len: number;
  focus: Pt;
  top: number; // bordo superiore del plastico (per la freccia in arrivo)
  topX: number;
  step: string;
  title: string;
  titleSize?: number;
  line: string;
  value: number;
  fmt: (v: number) => string;
  yb: number; // inizio della carta libera sotto il plastico
  arrow: Arrow;
};
type Other = { kind: "intro" | "clock" | "end"; img: string; len: number; focus: Pt; top: number; topX: number };
type Scene = Phase | Other;

const ph = (
  img: string,
  focus: Pt,
  top: number,
  step: string,
  title: string,
  line: string,
  value: number,
  fmt: (v: number) => string,
  yb: number,
  arrow: Arrow,
  titleSize?: number,
): Phase => ({ kind: "phase", img, len: 255, focus, top, topX: focus[0], step, title, line, value, fmt, yb, arrow, titleSize });

const it = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const SCENES: Scene[] = [
  { kind: "intro", img: "00-intro.jpg", len: 150, focus: [540, 965], top: 540, topX: 540 },
  ph("02-dragaggio.jpg", [540, 960], 328, "fase 1 di 7", "Dragaggio", "fondale portato a", -14, (v) => `${Math.round(v)} m`, 1630,
    { from: [935, 1290], c1: [1035, 1390], c2: [1015, 1640], to: [905, 1700] }),
  ph("03-diga.jpg", [540, 972], 512, "fase 2 di 7", "Diga foranea", "protegge il bacino", 1450, (v) => `${it(v)} m`, 1470,
    { from: [965, 1150], c1: [1050, 1250], c2: [1030, 1480], to: [905, 1541] }),
  ph("04-tetrapodi.jpg", [650, 960], 280, "fase 3 di 7", "Tetrapodi", "mantellata esterna", 25, (v) => `${Math.round(v)} t cad.`, 1665,
    { from: [210, 1180], c1: [95, 1320], c2: [70, 1560], to: [118, 1655] }),
  ph("05-cassoni.jpg", [540, 980], 576, "fase 4 di 7", "Cassoni", "in cemento armato", 12, (v) => `${Math.round(v)} posati`, 1420,
    { from: [920, 1100], c1: [1025, 1200], c2: [1015, 1430], to: [905, 1491] }),
  ph("06-piazzale.jpg", [544, 946], 396, "fase 5 di 7", "Piazzale", "colmata e asfalto", 38, (v) => `${Math.round(v)} ettari`, 1525,
    { from: [975, 1200], c1: [1050, 1300], c2: [1035, 1540], to: [905, 1596] }),
  ph("07-gru-faro.jpg", [540, 944], 552, "fase 6 di 7", "Gru e faro", "gru di banchina", 65, (v) => `4 × ${Math.round(v)} t`, 1380,
    { from: [935, 1000], c1: [1030, 1100], c2: [1015, 1390], to: [905, 1451] }),
  ph("08-attracco.jpg", [540, 974], 492, "fase 7 di 7", "Primo attracco", "capacità annua", 1.1, (v) => `${v.toFixed(1).replace(".", ",")} M TEU`, 1490,
    { from: [925, 1150], c1: [1030, 1250], c2: [1020, 1500], to: [905, 1561] }, 76),
  { kind: "clock", img: "09-orologio.jpg", len: 270, focus: [540, 980], top: 764, topX: 300 },
  { kind: "end", img: "01-carta.jpg", len: 150, focus: [540, 960], top: 600, topX: 540 },
];

export const STARTS = SCENES.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].len);
  return acc;
}, []);
export const F_DURATION = STARTS[STARTS.length - 1] + SCENES[SCENES.length - 1].len;

const io = Easing.inOut(Easing.cubic);
const p01 = (f: number, a: number, b: number, e: (t: number) => number = io) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------ primitive -------------------------------- */

export const Write: React.FC<{
  x: number;
  y: number;
  p: number;
  size: number;
  font?: string;
  weight?: number;
  align?: "center" | "left" | "right";
  children: React.ReactNode;
}> = ({ x, y, p, size, font = HAND, weight = 600, align = "left", children }) => {
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${align === "center" ? "-50%" : align === "right" ? "-100%" : "0"}, -50%)`,
        whiteSpace: "pre",
        textAlign: align,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.02,
        color: INK,
        padding: `0 ${size * 0.25}px`,
        textShadow: "0 1px 0 rgba(255,255,255,0.18)",
        clipPath: `inset(-50% ${(1 - p) * 100}% -50% 0)`,
      }}
    >
      {children}
    </div>
  );
};

export const DashedArrow: React.FC<{ id: string; a: Arrow; p: number; w?: number }> = ({ id, a, p, w = 4.2 }) => {
  if (p <= 0) return null;
  const { from, c1, c2, to } = a;
  const d = `M ${from[0]} ${from[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${to[0]} ${to[1]}`;
  const ang = Math.atan2(to[1] - c2[1], to[0] - c2[0]);
  const head = 20;
  const hp = Math.min(1, Math.max(0, (p - 0.93) / 0.07));
  const a1 = ang + Math.PI * 0.8;
  const a2 = ang - Math.PI * 0.8;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={9000} height={30000}>
          <path d={d} stroke="white" strokeWidth={w * 6} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
        </mask>
      </defs>
      <path d={d} stroke={INK} strokeWidth={w} fill="none" strokeDasharray="16 12" strokeLinecap="round" mask={`url(#${id})`} opacity={0.85} />
      {hp > 0 ? (
        <path
          d={`M ${to[0] + Math.cos(a1) * head} ${to[1] + Math.sin(a1) * head} L ${to[0]} ${to[1]} L ${to[0] + Math.cos(a2) * head} ${to[1] + Math.sin(a2) * head}`}
          stroke={INK}
          strokeWidth={w * 1.15}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85 * hp}
        />
      ) : null}
    </svg>
  );
};

export const Scribble: React.FC<{ x: number; y: number; rx: number; ry: number; p: number; seed: number }> = ({ x, y, rx, ry, p, seed }) => {
  if (p <= 0) return null;
  const pts: string[] = [];
  const N = 160;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = -2.6 + u * 2.15 * Math.PI * 2;
    const wob = 1 + 0.05 * Math.sin(a * 3 + seed) + 0.05 * (u - 0.5);
    const px = Math.cos(a) * rx * wob;
    const py = Math.sin(a) * ry * wob;
    const tilt = -0.05;
    pts.push(`${(x + px * Math.cos(tilt) - py * Math.sin(tilt)).toFixed(1)} ${(y + px * Math.sin(tilt) + py * Math.cos(tilt)).toFixed(1)}`);
  }
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
      <path
        d={`M ${pts.join(" L ")}`}
        stroke={INK}
        strokeWidth={3.4}
        fill="none"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        opacity={0.82}
      />
    </svg>
  );
};

/** Freccia che scende dal fondo della scena k fino al plastico della scena k+1. */
const downArrow = (from: Pt, k: number): Arrow => {
  const n = SCENES[k + 1];
  const to: Pt = [n.topX + 30, F_H + n.top - 22];
  const sgn = from[0] > to[0] ? -1 : 1;
  return {
    from,
    c1: [from[0] + 200 * sgn * -1, from[1] + 200],
    c2: [to[0] + 240 * sgn * -1, to[1] - 280],
    to,
  };
};

/* ------------------------------ annotazioni ------------------------------ */

const PhaseNotes: React.FC<{ s: Phase; k: number; t: number }> = ({ s, k, t }) => {
  const vx = s.title.length > 12 ? 820 : 800;
  const vy = s.yb + 128;
  const vp = p01(t, 95, 140);
  return (
    <>
      <DashedArrow id={`a${k}`} a={s.arrow} p={p01(t, 38, 72)} />
      <Write x={vx} y={s.yb + 40} p={p01(t, 52, 62)} size={40} weight={500} align="center">
        {s.step}
      </Write>
      <Write x={100} y={s.yb + 58} p={p01(t, 58, 90)} size={s.titleSize ?? 84} font={SCRIPT} weight={700}>
        {s.title}
      </Write>
      <Write x={110} y={s.yb + 150} p={p01(t, 84, 104)} size={50}>
        {s.line}
      </Write>
      <Write x={vx} y={vy} p={p01(t, 94, 104)} size={64} weight={700} align="center">
        {s.fmt(lerp(0, s.value, vp))}
      </Write>
      <Scribble x={vx} y={vy + 3} rx={150} ry={56} p={p01(t, 118, 150)} seed={k * 1.3} />
      <DashedArrow id={`d${k}`} a={downArrow([vx - 70, vy + 66], k)} p={p01(t, s.len - 66, s.len - 24)} />
    </>
  );
};

const IntroNotes: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Write x={540} y={190} p={p01(t, 8, 36)} size={80} align="center">
      Come si costruisce
    </Write>
    <Write x={540} y={355} p={p01(t, 32, 74)} size={170} font={SCRIPT} weight={700} align="center">
      un Porto
    </Write>
    <DashedArrow id="iu" a={{ from: [300, 470], c1: [460, 492], c2: [640, 470], to: [790, 480] }} p={p01(t, 70, 88)} w={3.6} />
    <Write x={540} y={1500} p={p01(t, 84, 104)} size={56} align="center">
      in 7 fasi, dal mare al primo attracco
    </Write>
    <DashedArrow id="id" a={downArrow([560, 1560], 0)} p={p01(t, 100, 126)} />
  </>
);

const ClockNotes: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  const months = Math.round(lerp(0, 36, p01(t, 110, 170)));
  return (
    <>
      <Write x={540} y={430} p={p01(t, 30, 70)} size={88} align="center">
        Non è solo cemento…
      </Write>
      <DashedArrow id="c1" a={{ from: [930, 1215], c1: [990, 1300], c2: [960, 1380], to: [880, 1405] }} p={p01(t, 80, 108)} />
      <Write x={780} y={1460} p={p01(t, 104, 114)} size={72} weight={700} align="center">
        {`${months} mesi`}
      </Write>
      <Scribble x={780} y={1463} rx={150} ry={58} p={p01(t, 128, 160)} seed={7} />
      <Write x={90} y={1640} p={p01(t, 160, 220)} size={84} font={SCRIPT} weight={700}>
        {"…è tutta una\nquestione di tempo"}
      </Write>
      <DashedArrow id={`d${k}`} a={downArrow([400, 1760], k)} p={p01(t, 222, 246)} w={3.6} />
    </>
  );
};

const EndNotes: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Write x={540} y={760} p={p01(t, 6, 40)} size={150} font={SCRIPT} weight={700} align="center">
      Come nasce
    </Write>
    <Write x={540} y={930} p={p01(t, 34, 66)} size={150} font={SCRIPT} weight={700} align="center">
      un porto
    </Write>
    <DashedArrow id="eu" a={{ from: [280, 1040], c1: [450, 1068], c2: [650, 1046], to: [810, 1052] }} p={p01(t, 64, 82)} w={3.6} />
    <Write x={540} y={1150} p={p01(t, 78, 104)} size={64} align="center">
      7 fasi · 36 mesi · 1 porto
    </Write>
  </>
);

/* -------------------------------- scena ---------------------------------- */

const SceneView: React.FC<{ s: Scene; k: number; f: number }> = ({ s, k, f }) => {
  const start = STARTS[k];
  // zoom lento centrato sul plastico (si apre per far spazio agli appunti)
  const zoom = lerp(1.09, 1, p01(f, start - SCROLL, start + s.len - 30, Easing.out(Easing.quad)));
  const feather = "linear-gradient(to bottom, transparent 0px, black 110px, black calc(100% - 90px), transparent 100%)";
  return (
    <div style={{ position: "absolute", left: 0, top: k * F_H, width: F_W, height: F_H }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          WebkitMaskImage: k === 0 ? undefined : feather,
          maskImage: k === 0 ? undefined : feather,
        }}
      >
        <Img
          src={staticFile(`flow/${s.img}`)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: F_W,
            height: IMG_H,
            transformOrigin: `${s.focus[0]}px ${s.focus[1]}px`,
            transform: `scale(${zoom})`,
          }}
        />
      </div>
    </div>
  );
};

const SceneNotes: React.FC<{ s: Scene; k: number; f: number }> = ({ s, k, f }) => {
  const t = f - STARTS[k];
  return (
    <div style={{ position: "absolute", left: 0, top: k * F_H, width: F_W, height: F_H, overflow: "visible" }}>
      {s.kind === "phase" ? <PhaseNotes s={s} k={k} t={t} /> : null}
      {s.kind === "intro" ? <IntroNotes t={t} /> : null}
      {s.kind === "clock" ? <ClockNotes t={t} k={k} /> : null}
      {s.kind === "end" ? <EndNotes t={t} /> : null}
    </div>
  );
};

export const FlowReel: React.FC = () => {
  const f = useCurrentFrame();
  let scroll = 0;
  for (let k = 1; k < SCENES.length; k++) {
    scroll += p01(f, STARTS[k] - SCROLL, STARTS[k]) * F_H;
  }
  const fadeIn = 1 - p01(f, 0, 12);
  const fadeOut = p01(f, F_DURATION - 20, F_DURATION - 1);
  return (
    <AbsoluteFill style={{ backgroundColor: "#6a9f95", overflow: "hidden" }}>
      {/* carta di fondo che si vede solo nelle giunture tra le foto */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(20,70,66,0.16) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(20,70,66,0.16) 1.5px, transparent 1.5px)",
          backgroundSize: "38px 38px",
          backgroundPosition: `0px ${-scroll}px`,
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, width: F_W, transform: `translateY(${-scroll}px)` }}>
        {SCENES.map((s, k) =>
          // monta solo le scene vicine all'inquadratura
          Math.abs(k * F_H - scroll) > F_H * 1.2 ? null : <SceneView key={k} s={s} k={k} f={f} />,
        )}
        {/* appunti sopra tutte le foto: le frecce in discesa entrano nella scena successiva */}
        {SCENES.map((s, k) =>
          Math.abs(k * F_H - scroll) > F_H * 1.2 ? null : <SceneNotes key={`n${k}`} s={s} k={k} f={f} />,
        )}
      </div>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 95% 80% at 50% 48%, rgba(0,0,0,0) 62%, rgba(8,36,34,0.22) 100%)" }}
      />
      <AbsoluteFill style={{ background: "#0e2a2b", opacity: Math.max(fadeIn, fadeOut) }} />
    </AbsoluteFill>
  );
};

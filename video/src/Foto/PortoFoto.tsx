import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Arrow, DashedArrow, Scribble, Write } from "../Flow/FlowReel";

/*
 * "Come si costruisce un porto" in qualità fotografica.
 * Le 8 foto di Flow mostrano LO STESSO plastico, modificato fase per fase.
 * Per ogni fase facciamo comparire solo ciò che cambia (maschera calcolata
 * sulle differenze), facendolo "crescere" dalla costa verso il mare
 * (ordine geodetico precalcolato in public/stages/t*.png).
 */

export const P_W = 1080;
export const P_H = 1920;
export const P_FPS = 30;

export const IW = 768; // risoluzione delle foto
export const IH = 1376;
const S = P_W / IW; // scala a schermo
const IMG_H = IH * S; // 1935

const INTRO = 150;
const PH = 255;
const N = 7;
const CLOCK_START = INTRO + N * PH; // 1935
const CLOCK_LEN = 300;
export const P_DURATION = CLOCK_START + CLOCK_LEN; // 2235 = 74,5 s
const SCROLL = 26;

const SCRIPT = "'Dancing Script', cursive";

// dati calcolati da prepare.py (centro e riquadro di ciò che cambia, in frazioni dell'immagine)
export const STEPS = [
  { cx: 0.477, cy: 0.595, y1: 0.749 },
  { cx: 0.45, cy: 0.557, y1: 0.706 },
  { cx: 0.262, cy: 0.581, y1: 0.743 },
  { cx: 0.701, cy: 0.554, y1: 0.696 },
  { cx: 0.44, cy: 0.414, y1: 0.484 },
  { cx: 0.577, cy: 0.447, y1: 0.656 },
  { cx: 0.726, cy: 0.526, y1: 0.679 },
];
const CLOCK = { cx: 0.527 * P_W, cy: 0.513 * IMG_H, r: 0.278 * P_W };

export const NOTES = [
  { title: "Dragaggio", line: "fondale portato a", value: -14, fmt: (v: number) => `${Math.round(v)} m` },
  { title: "Diga foranea", line: "protegge il bacino", value: 1450, fmt: (v: number) => `${String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} m` },
  { title: "Tetrapodi", line: "mantellata esterna", value: 25, fmt: (v: number) => `${Math.round(v)} t cad.` },
  { title: "Cassoni", line: "in cemento armato", value: 12, fmt: (v: number) => `${Math.round(v)} posati` },
  { title: "Banchina", line: "fronte di accosto", value: 400, fmt: (v: number) => `${Math.round(v)} m` },
  { title: "Gru e faro", line: "gru di banchina da", value: 65, fmt: (v: number) => `${Math.round(v)} t` },
  { title: "Primo attracco", line: "capacità annua", value: 1.1, fmt: (v: number) => `${v.toFixed(1).replace(".", ",")} M TEU` },
];

const io = Easing.inOut(Easing.cubic);
const p01 = (f: number, a: number, b: number, e: (t: number) => number = io) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const phaseStart = (k: number) => INTRO + (k - 1) * PH; // k = 1..7

/* ------------------------------ caricamento ------------------------------- */

export type Px = Uint8ClampedArray;
let cache: Promise<{ s: Px[]; t: Px[] }> | null = null;

export const loadPx = (url: string) =>
  new Promise<Px>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = IW;
      c.height = IH;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0, IW, IH);
      resolve(g.getImageData(0, 0, IW, IH).data);
    };
    img.onerror = () => reject(new Error(`Impossibile caricare ${url}`));
    img.src = url;
  });

export const loadAll = () => {
  if (!cache) {
    const urls = [
      ...new Array(8).fill(0).map((_, i) => staticFile(`stages/s${i}.jpg`)),
      ...new Array(7).fill(0).map((_, i) => staticFile(`stages/t${i + 1}.png`)),
    ];
    cache = Promise.all(urls.map(loadPx)).then((a) => ({ s: a.slice(0, 8), t: [new Uint8ClampedArray(0), ...a.slice(8)] }));
  }
  return cache;
};

export const useStageData = () => {
  const [data, setData] = useState<{ s: Px[]; t: Px[] } | null>(null);
  const [handle] = useState(() => delayRender("Caricamento foto delle fasi"));
  useEffect(() => {
    loadAll()
      .then((d) => {
        setData(d);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return data;
};

/** Quale fase è in corso: immagine di partenza, arrivo, avanzamento della crescita e dissolvenza finale. */
const stageAt = (f: number) => {
  if (f < INTRO) return { from: 0, to: 0, p: 0, g: 0 };
  const k = Math.min(N, Math.floor((f - INTRO) / PH) + 1);
  const a = phaseStart(k);
  const p = p01(f, a + 22, a + 112, (x) => x);
  const g = p01(f, a + 104, a + 130, (x) => x);
  return { from: k - 1, to: k, p, g };
};

/**
 * Fonde la fase A nella fase B: compare solo ciò che cambia (maschera T.r),
 * nell'ordine di crescita T.g, fino al fronte `p`; `g` completa la dissolvenza.
 */
export const blendStage = (o: Px, A: Px, B: Px, T: Px, p: number, g: number) => {
  const front = p * 1.25;
  for (let i = 0; i < o.length; i += 4) {
    const m = T[i] / 255;
    let a = g;
    let glow = 0;
    if (m > 0) {
      const ord = T[i + 1] / 255;
      const r = Math.min(1, Math.max(0, (front - ord) / 0.22));
      const rev = m * r * r * (3 - 2 * r);
      if (rev > a) a = rev;
      // leggera luce sul fronte di avanzamento del cantiere
      glow = m * Math.max(0, 1 - Math.abs(front - ord - 0.11) / 0.11) * 16 * (1 - g);
    }
    const b = 1 - a;
    o[i] = A[i] * b + B[i] * a + glow;
    o[i + 1] = A[i + 1] * b + B[i + 1] * a + glow;
    o[i + 2] = A[i + 2] * b + B[i + 2] * a + glow * 0.8;
    o[i + 3] = 255;
  }
};

/* --------------------------------- canvas --------------------------------- */

const StageCanvas: React.FC = () => {
  const f = useCurrentFrame();
  const data = useStageData();
  const ref = useRef<HTMLCanvasElement>(null);
  const out = useMemo(() => new ImageData(IW, IH), []);

  useLayoutEffect(() => {
    const c = ref.current;
    if (!c || !data) return;
    const g2 = c.getContext("2d")!;
    const { from, to, p, g } = stageAt(f);
    if (to === from || (p <= 0 && g <= 0)) {
      out.data.set(data.s[from]);
    } else if (g >= 1) {
      out.data.set(data.s[to]);
    } else {
      blendStage(out.data, data.s[from], data.s[to], data.t[to], p, g);
    }
    g2.putImageData(out, 0, 0);
  }, [f, data, out]);

  return <canvas ref={ref} width={IW} height={IH} style={{ width: P_W, height: IMG_H, display: "block" }} />;
};

/* --------------------------------- camera --------------------------------- */

type Key = [number, number, number, number]; // frame, cx, cy (px schermo), zoom
const DEF: [number, number, number] = [P_W / 2, IMG_H / 2, 1];

const camKeys = (): Key[] => {
  const k: Key[] = [
    [0, P_W / 2, 0.5 * IMG_H, 1.14],
    [INTRO - 6, ...DEF],
  ];
  STEPS.forEach((s, i) => {
    const a = phaseStart(i + 1);
    const Z = 1.24;
    const cx = Math.min(P_W - P_W / 2 / Z, Math.max(P_W / 2 / Z, s.cx * P_W));
    const cy = Math.min(IMG_H - P_H / 2 / Z, Math.max(P_H / 2 / Z, s.cy * IMG_H));
    k.push([a + 2, ...DEF]);
    k.push([a + 30, cx, cy, Z]);
    k.push([a + 112, cx, cy, Z * 1.04]);
    k.push([a + 148, ...DEF]);
  });
  k.push([P_DURATION, ...DEF]);
  return k;
};
const KEYS = camKeys();

const cameraAt = (f: number) => {
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
  const [f0, x0, y0, z0] = KEYS[i];
  const [f1, x1, y1, z1] = KEYS[i + 1];
  const t = io(Math.min(1, Math.max(0, (f - f0) / Math.max(1, f1 - f0))));
  return {
    x: lerp(x0, x1, t),
    y: lerp(y0, y1, t),
    z: Math.exp(lerp(Math.log(z0), Math.log(z1), t)),
  };
};

/* -------------------------------- appunti --------------------------------- */

const PhaseNotes: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const a = phaseStart(k);
  const t = f - a;
  if (t < 130) return null;
  const s = STEPS[k - 1];
  const n = NOTES[k - 1];
  const last = k === N;
  const fade = last ? 1 : 1 - p01(t, 238, 252);
  if (fade <= 0) return null;
  const elLeft = s.cx < 0.5;
  // il valore cerchiato sta dalla parte dell'elemento, il titolo dall'altra
  const vx = elLeft ? 290 : 790;
  const vy = 1660;
  const tx = elLeft ? 990 : 90;
  const align = elLeft ? "right" : "left";
  const ex = s.cx * P_W;
  const ey = Math.min(s.y1 * IMG_H, 1400) + 6;
  const arrow: Arrow = {
    from: [ex, ey],
    c1: [ex + (elLeft ? -70 : 70), ey + 90],
    c2: [vx + (elLeft ? -150 : 150), vy - 150],
    to: [vx + (elLeft ? -60 : 60), vy - 62],
  };
  const vp = p01(t, 188, 228);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <DashedArrow id={`fa${k}`} a={arrow} p={p01(t, 136, 168)} />
      <Write x={vx} y={vy - 92} p={p01(t, 148, 158)} size={40} weight={500} align="center">
        {`fase ${k} di 7`}
      </Write>
      <Write x={tx} y={1585} p={p01(t, 154, 188)} size={n.title.length > 12 ? 78 : 88} font={SCRIPT} weight={700} align={align}>
        {n.title}
      </Write>
      <Write x={tx} y={1680} p={p01(t, 180, 198)} size={52} align={align}>
        {n.line}
      </Write>
      <Write x={vx} y={vy} p={p01(t, 188, 198)} size={66} weight={700} align="center">
        {n.fmt(lerp(0, n.value, vp))}
      </Write>
      <Scribble x={vx} y={vy + 3} rx={160} ry={60} p={p01(t, 210, 240)} seed={k * 1.7} />
      {last ? (
        <DashedArrow
          id="toclock"
          a={{ from: [vx - 40, vy + 70], c1: [vx - 220, vy + 230], c2: [CLOCK.cx + 260, P_H + 300], to: [CLOCK.cx + 40, P_H + CLOCK.cy - CLOCK.r * 1.42] }}
          p={p01(t, 200, 228)}
        />
      ) : null}
    </div>
  );
};

const IntroNotes: React.FC<{ f: number }> = ({ f }) => {
  const fade = 1 - p01(f, 128, 148);
  if (fade <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Write x={540} y={215} p={p01(f, 10, 40)} size={82} align="center">
        Come si costruisce
      </Write>
      <Write x={540} y={375} p={p01(f, 34, 78)} size={176} font={SCRIPT} weight={700} align="center">
        un Porto
      </Write>
      <DashedArrow id="iu" a={{ from: [290, 492], c1: [460, 514], c2: [640, 492], to: [800, 502] }} p={p01(f, 74, 92)} w={3.6} />
      <Write x={540} y={1580} p={p01(f, 88, 112)} size={56} align="center">
        dal mare al primo attracco, in 7 fasi
      </Write>
    </div>
  );
};

/** Lancette disegnate sopra il quadrante (la foto di Flow non le ha). */
const ClockHands: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CLOCK_START;
  const spin = p01(t, 8, 215);
  const minute = spin * 360 * 36 + 55;
  const hour = spin * 360 * 3 + 305;
  const R = CLOCK.r;
  const hand = (len: number, w: number, tail: number) =>
    `M ${-w / 2} ${tail} L ${w / 2} ${tail} L ${w * 0.18} ${-len} L ${-w * 0.18} ${-len} Z`;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={P_W} height={P_H}>
      <defs>
        <filter id="hs" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id="brass" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f3dca0" />
          <stop offset="100%" stopColor="#9a7432" />
        </radialGradient>
      </defs>
      {/* ombre morbide in basso a destra, come la luce delle foto */}
      <g transform={`translate(${CLOCK.cx + 9} ${CLOCK.cy + 12})`} opacity={0.35} filter="url(#hs)">
        <path d={hand(R * 0.52, 22, 34)} transform={`rotate(${hour})`} fill="#000" />
        <path d={hand(R * 0.84, 13, 48)} transform={`rotate(${minute})`} fill="#000" />
      </g>
      <g transform={`translate(${CLOCK.cx} ${CLOCK.cy})`}>
        <path d={hand(R * 0.52, 22, 34)} transform={`rotate(${hour})`} fill="#2a1f19" />
        <path d={hand(R * 0.84, 13, 48)} transform={`rotate(${minute})`} fill="#2a1f19" />
        <circle r={15} fill="url(#brass)" />
        <circle r={5} fill="#5a4320" />
      </g>
    </svg>
  );
};

const ClockNotes: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CLOCK_START;
  if (t < 0) return null;
  const months = Math.max(1, Math.round(36 * p01(t, 8, 215)));
  return (
    <>
      <Write x={540} y={300} p={p01(t, 18, 60)} size={92} align="center">
        Non è solo cemento…
      </Write>
      <DashedArrow id="cm" a={{ from: [CLOCK.cx + 330, CLOCK.cy + 250], c1: [CLOCK.cx + 400, CLOCK.cy + 330], c2: [870, 1470], to: [840, 1520] }} p={p01(t, 64, 92)} />
      <Write x={780} y={1590} p={p01(t, 88, 98)} size={76} weight={700} align="center">
        {`${months} mesi`}
      </Write>
      <Scribble x={780} y={1593} rx={170} ry={64} p={p01(t, 110, 142)} seed={4} />
      <Write x={80} y={1760} p={p01(t, 150, 215)} size={86} font={SCRIPT} weight={700}>
        {"…è tutta una\nquestione di tempo"}
      </Write>
    </>
  );
};

/* -------------------------------- composizione ----------------------------- */

export const PortoFoto: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f);
  const scroll = p01(f, CLOCK_START - SCROLL, CLOCK_START) * P_H;
  const fadeIn = 1 - p01(f, 0, 12);
  const fadeOut = p01(f, P_DURATION - 22, P_DURATION - 1);
  const feather = "linear-gradient(to bottom, transparent 0px, black 140px)";
  return (
    <AbsoluteFill style={{ backgroundColor: "#bfe3dc", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: P_W, transform: `translateY(${-scroll}px)` }}>
        {/* scena del plastico con camera */}
        <div style={{ position: "absolute", left: 0, top: 0, width: P_W, height: P_H, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              transform: `translate(${P_W / 2 - cam.x * cam.z}px, ${P_H / 2 - cam.y * cam.z}px) scale(${cam.z})`,
            }}
          >
            <StageCanvas />
          </div>
        </div>
        {/* scena dell'orologio */}
        {f >= CLOCK_START - SCROLL - 2 ? (
          <div style={{ position: "absolute", left: 0, top: P_H, width: P_W, height: P_H, overflow: "hidden" }}>
            <Img
              src={staticFile("stages/clock.jpg")}
              style={{ width: P_W, height: IMG_H, display: "block", WebkitMaskImage: feather, maskImage: feather }}
            />
            <ClockHands f={f} />
          </div>
        ) : null}
        {/* appunti sopra le foto */}
        <IntroNotes f={f} />
        {NOTES.map((_, i) => (
          <PhaseNotes key={i} f={f} k={i + 1} />
        ))}
        <div style={{ position: "absolute", left: 0, top: P_H, width: P_W, height: P_H }}>
          <ClockNotes f={f} />
        </div>
      </div>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 95% 80% at 50% 48%, rgba(0,0,0,0) 62%, rgba(8,36,34,0.2) 100%)" }}
      />
      <AbsoluteFill style={{ background: "#0e2a2b", opacity: Math.max(fadeIn, fadeOut) }} />
    </AbsoluteFill>
  );
};

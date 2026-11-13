import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Arrow, DashedArrow, Scribble, Write } from "../Flow/FlowReel";
import { IH, IW, NOTES, Px, blendStage, useStageData } from "./PortoFoto";

/*
 * Versione "a discesa", come il video di riferimento: ogni fase è un plastico
 * posato più in basso sulla carta (a zig-zag), collegato da frecce tratteggiate;
 * la telecamera scende, il plastico precedente resta visibile in alto e quello
 * nuovo compare e si costruisce davanti a noi.
 */

export const D_W = 1080;
export const D_H = 1920;
export const D_FPS = 30;

const BS = 0.72 * (D_W / IW); // pixel schermo per pixel foto nei blocchi
const CX0 = 0.06; // ritaglio del plastico nella foto (frazioni)
const CX1 = 0.96;
const CY0 = 0.2;
const CY1 = 0.8;
const BW = (CX1 - CX0) * IW * BS; // ≈ 700
const BH = (CY1 - CY0) * IH * BS; // ≈ 836

const STEP = 880;
const Y0 = 820;
const blockX = (k: number) => (k % 2 === 0 ? 370 : 710);
const blockY = (k: number) => Y0 + k * STEP;
const noteX = (k: number) => (k % 2 === 0 ? 862 : 214);

const INTRO = 170;
const PH = 240;
const N = 7;
const CLOCK_K = 8;
const C = INTRO + N * PH; // 1850
export const D_DURATION = C + 390; // 2240 ≈ 74,7 s

const CLOCK_HALF = 0.42 * IW * BS; // metà lato del ritaglio dell'orologio
const DIAL_R = 0.278 * IW * BS;

const SCRIPT = "'Dancing Script', cursive";
const io = Easing.inOut(Easing.cubic);
const p01 = (f: number, a: number, b: number, e: (t: number) => number = io) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const phaseStart = (k: number) => INTRO + (k - 1) * PH; // k = 1..7
const appearAt = (k: number) => (k === 0 ? 4 : k === CLOCK_K ? C : phaseStart(k));

const pop = (f: number, at: number) =>
  f < at ? 0 : spring({ frame: f - at, fps: D_FPS, config: { damping: 13, stiffness: 120, mass: 0.8 } });

const FEATHER =
  "linear-gradient(to right, transparent 0px, black 140px, black calc(100% - 140px), transparent 100%), linear-gradient(to bottom, transparent 0px, black 130px, black calc(100% - 130px), transparent 100%)";
const maskStyle: React.CSSProperties = {
  WebkitMaskImage: FEATHER,
  maskImage: FEATHER,
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

/* ------------------------------- blocchi ---------------------------------- */

const StageBlock: React.FC<{ k: number; f: number; data: { s: Px[]; t: Px[] } }> = ({ k, f, data }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const out = useMemo(() => new ImageData(IW, IH), []);
  const last = useRef("");
  const a = phaseStart(k);
  const p = k === 0 ? 0 : p01(f, a + 40, a + 130, (x) => x);
  const g = k === 0 ? 0 : p01(f, a + 122, a + 146, (x) => x);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const key = `${p.toFixed(4)}|${g.toFixed(4)}`;
    if (key === last.current) return;
    last.current = key;
    if (k === 0 || (p <= 0 && g <= 0)) out.data.set(data.s[Math.max(0, k - 1)]);
    else if (g >= 1) out.data.set(data.s[k]);
    else blendStage(out.data, data.s[k - 1], data.s[k], data.t[k], p, g);
    c.getContext("2d")!.putImageData(out, 0, 0);
  }, [p, g, k, data, out]);

  const sc = pop(f, appearAt(k));
  return (
    <div
      style={{
        position: "absolute",
        left: blockX(k) - BW / 2,
        top: blockY(k) - BH / 2,
        width: BW,
        height: BH,
        overflow: "hidden",
        opacity: Math.min(1, sc * 1.4),
        transform: `scale(${0.86 + 0.14 * sc})`,
        ...maskStyle,
      }}
    >
      <canvas
        ref={ref}
        width={IW}
        height={IH}
        style={{
          position: "absolute",
          left: -CX0 * IW * BS,
          top: -CY0 * IH * BS,
          width: IW * BS,
          height: IH * BS,
        }}
      />
    </div>
  );
};

const ClockBlock: React.FC<{ f: number }> = ({ f }) => {
  const sc = pop(f, C);
  const t = f - C;
  const spin = p01(t, 20, 210);
  const minute = spin * 360 * 36 + 55;
  const hour = spin * 360 * 3 + 305;
  const R = DIAL_R;
  const hand = (len: number, w: number, tail: number) =>
    `M ${-w / 2} ${tail} L ${w / 2} ${tail} L ${w * 0.18} ${-len} L ${-w * 0.18} ${-len} Z`;
  const x = blockX(CLOCK_K);
  const y = blockY(CLOCK_K);
  // la foto dell'orologio: centro del quadrante a (0.527, 0.513)
  const imgW = IW * BS;
  const imgH = IH * BS;
  return (
    <div
      style={{
        position: "absolute",
        left: x - CLOCK_HALF,
        top: y - CLOCK_HALF,
        width: CLOCK_HALF * 2,
        height: CLOCK_HALF * 2,
        overflow: "hidden",
        opacity: Math.min(1, sc * 1.4),
        transform: `scale(${0.86 + 0.14 * sc})`,
        ...maskStyle,
      }}
    >
      <Img
        src={staticFile("stages/clock.jpg")}
        style={{
          position: "absolute",
          left: CLOCK_HALF - 0.527 * imgW,
          top: CLOCK_HALF - 0.513 * imgH,
          width: imgW,
          height: imgH,
        }}
      />
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={CLOCK_HALF * 2} height={CLOCK_HALF * 2}>
        <defs>
          <filter id="dhs" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <radialGradient id="dbrass" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#f3dca0" />
            <stop offset="100%" stopColor="#9a7432" />
          </radialGradient>
        </defs>
        <g transform={`translate(${CLOCK_HALF + 7} ${CLOCK_HALF + 9})`} opacity={0.35} filter="url(#dhs)">
          <path d={hand(R * 0.52, 16, 24)} transform={`rotate(${hour})`} fill="#000" />
          <path d={hand(R * 0.84, 10, 34)} transform={`rotate(${minute})`} fill="#000" />
        </g>
        <g transform={`translate(${CLOCK_HALF} ${CLOCK_HALF})`}>
          <path d={hand(R * 0.52, 16, 24)} transform={`rotate(${hour})`} fill="#2a1f19" />
          <path d={hand(R * 0.84, 10, 34)} transform={`rotate(${minute})`} fill="#2a1f19" />
          <circle r={11} fill="url(#dbrass)" />
          <circle r={4} fill="#5a4320" />
        </g>
      </svg>
    </div>
  );
};

/* -------------------------------- appunti --------------------------------- */

/** Freccia dall'appunto del blocco k al blocco successivo (che sta dalla stessa parte dell'appunto). */
const nextArrow = (k: number): Arrow => {
  const nx = noteX(k);
  const by = blockY(k);
  const side = nx > 540 ? 1 : -1;
  const tx = blockX(k + 1) + side * 40;
  const ty = blockY(k + 1) - (k + 1 === CLOCK_K ? CLOCK_HALF - 70 : 330);
  return {
    from: [nx, by + 150],
    c1: [nx + side * 150, by + 330],
    c2: [tx + side * 170, ty - 260],
    to: [tx, ty],
  };
};

const PhaseNote: React.FC<{ k: number; f: number }> = ({ k, f }) => {
  const a = phaseStart(k);
  const t = f - a;
  if (t < 136) return null;
  const n = NOTES[k - 1];
  const nx = noteX(k);
  const bx = blockX(k);
  const by = blockY(k);
  const side = nx > 540 ? 1 : -1; // da che parte sta l'appunto rispetto al plastico
  const title = n.title.length > 10 ? n.title.replace(" ", "\n") : n.title;
  const lines = title.split("\n").length;
  const vp = p01(t, 186, 222);
  const toNote: Arrow = {
    from: [bx + side * 280, by + 40],
    c1: [bx + side * 340, by + 150],
    c2: [nx - side * 210, by + 150],
    to: [nx - side * 158, by + 96],
  };
  return (
    <>
      <DashedArrow id={`pn${k}`} a={toNote} p={p01(t, 140, 166)} />
      <Write x={nx} y={by - 236 - (lines - 1) * 46} p={p01(t, 150, 158)} size={40} weight={500} align="center">
        {`fase ${k} di 7`}
      </Write>
      <Write x={nx} y={by - 150 - (lines - 1) * 22} p={p01(t, 154, 184)} size={lines > 1 ? 66 : 74} font={SCRIPT} weight={700} align="center">
        {title}
      </Write>
      <Write x={nx} y={by + 6} p={p01(t, 178, 194)} size={42} align="center">
        {n.line}
      </Write>
      <Write x={nx} y={by + 92} p={p01(t, 186, 194)} size={62} weight={700} align="center">
        {n.fmt(lerp(0, n.value, vp))}
      </Write>
      <Scribble x={nx} y={by + 95} rx={150} ry={56} p={p01(t, 200, 226)} seed={k * 1.9} />
      <DashedArrow id={`nn${k}`} a={nextArrow(k)} p={p01(t, 208, 240)} />
    </>
  );
};

const IntroNote: React.FC<{ f: number }> = ({ f }) => {
  const nx = noteX(0);
  const by = blockY(0);
  return (
    <>
      <Write x={540} y={150} p={p01(f, 10, 40)} size={80} align="center">
        Come si costruisce
      </Write>
      <Write x={540} y={300} p={p01(f, 34, 76)} size={170} font={SCRIPT} weight={700} align="center">
        un Porto
      </Write>
      <Write x={nx} y={by - 70} p={p01(f, 80, 104)} size={50} align="center">
        {"dal mare\nal primo\nattracco"}
      </Write>
      <Write x={nx} y={by + 90} p={p01(f, 104, 118)} size={62} weight={700} align="center">
        7 fasi
      </Write>
      <Scribble x={nx} y={by + 93} rx={120} ry={50} p={p01(f, 112, 134)} seed={2} />
      <DashedArrow id="in" a={nextArrow(0)} p={p01(f, 136, 170)} />
    </>
  );
};

const ClockNote: React.FC<{ f: number }> = ({ f }) => {
  const t = f - C;
  if (t < 30) return null;
  const nx = noteX(CLOCK_K);
  const by = blockY(CLOCK_K);
  const months = Math.max(1, Math.round(36 * p01(t, 20, 210)));
  return (
    <>
      <Write x={nx} y={by - 230} p={p01(t, 36, 76)} size={60} align="center">
        {"Non è solo\ncemento…"}
      </Write>
      <DashedArrow
        id="cn"
        a={{ from: [blockX(CLOCK_K) + 250, by - 20], c1: [blockX(CLOCK_K) + 320, by + 10], c2: [nx - 200, by + 40], to: [nx - 150, by + 10] }}
        p={p01(t, 80, 106)}
      />
      <Write x={nx} y={by + 6} p={p01(t, 100, 110)} size={70} weight={700} align="center">
        {`${months} mesi`}
      </Write>
      <Scribble x={nx} y={by + 9} rx={150} ry={58} p={p01(t, 118, 146)} seed={6} />
      <Write x={nx} y={by + 230} p={p01(t, 150, 210)} size={64} font={SCRIPT} weight={700} align="center">
        {"…è tutta una\nquestione\ndi tempo"}
      </Write>
    </>
  );
};

/* --------------------------------- camera --------------------------------- */

const REST = (k: number) => blockY(k) + 20;
const STRIP_H = blockY(CLOCK_K) + CLOCK_HALF + 160;
const FIT = D_H / (STRIP_H + 120);

type Key = [number, number, number]; // frame, centro y, zoom
const KEYS: Key[] = (() => {
  const k: Key[] = [
    [0, 700, 1.04],
    [INTRO - 4, 700, 1],
  ];
  for (let i = 1; i <= N; i++) {
    const a = phaseStart(i);
    k.push([a, REST(i - 1) + (i === 1 ? -120 : 0), 1]);
    k.push([a + 44, REST(i), 1]);
    k.push([a + 130, REST(i), 1.025]);
    k.push([a + 200, REST(i), 1]);
  }
  k.push([C, REST(N), 1]);
  k.push([C + 44, REST(CLOCK_K), 1]);
  k.push([C + 225, REST(CLOCK_K), 1.03]);
  k.push([C + 335, STRIP_H / 2, FIT]);
  k.push([D_DURATION, STRIP_H / 2, FIT * 0.98]);
  return k;
})();

const cameraAt = (f: number) => {
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
  const [f0, y0, z0] = KEYS[i];
  const [f1, y1, z1] = KEYS[i + 1];
  const t = io(Math.min(1, Math.max(0, (f - f0) / Math.max(1, f1 - f0))));
  return { y: lerp(y0, y1, t), z: Math.exp(lerp(Math.log(z0), Math.log(z1), t)) };
};

/* -------------------------------- composizione ----------------------------- */

export const PortoDiscesa: React.FC = () => {
  const f = useCurrentFrame();
  const data = useStageData();
  const cam = cameraAt(f);
  const viewTop = cam.y - D_H / 2 / cam.z;
  const viewBot = cam.y + D_H / 2 / cam.z;
  const inView = (k: number) => {
    const half = k === CLOCK_K ? CLOCK_HALF : BH / 2;
    return blockY(k) + half > viewTop - 50 && blockY(k) - half < viewBot + 50;
  };
  const cap = p01(f, C + 300, C + 345);
  const fadeIn = 1 - p01(f, 0, 12);
  const fadeOut = p01(f, D_DURATION - 22, D_DURATION - 1);
  const tile = `url(${staticFile("stages/paper_tile.jpg")})`;
  return (
    <AbsoluteFill style={{ backgroundColor: "#b6dcd8", overflow: "hidden" }}>
      <Img src={staticFile("stages/paper_tile.jpg")} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: D_W,
          height: STRIP_H,
          transformOrigin: "0 0",
          transform: `translate(${D_W / 2 - (D_W / 2) * cam.z}px, ${D_H / 2 - cam.y * cam.z}px) scale(${cam.z})`,
        }}
      >
        {/* carta continua ricavata dalle foto */}
        <div
          style={{
            position: "absolute",
            left: -2000,
            top: -2000,
            width: D_W + 4000,
            height: STRIP_H + 4000,
            backgroundImage: tile,
            backgroundSize: `${1536 * BS}px ${442 * BS}px`,
            filter: "brightness(0.96)",
          }}
        />
        {data
          ? new Array(8).fill(0).map((_, k) =>
              f >= appearAt(k) && inView(k) ? <StageBlock key={k} k={k} f={f} data={data} /> : null,
            )
          : null}
        {f >= C && inView(CLOCK_K) ? <ClockBlock f={f} /> : null}
        <IntroNote f={f} />
        {NOTES.map((_, i) => (
          <PhaseNote key={i} k={i + 1} f={f} />
        ))}
        <ClockNote f={f} />
      </div>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 95% 80% at 50% 48%, rgba(0,0,0,0) 62%, rgba(8,36,34,0.2) 100%)" }}
      />
      {cap > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            bottom: 110,
            textAlign: "center",
            opacity: cap,
            transform: `translateY(${(1 - cap) * 30}px)`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "24px 46px 30px",
              borderRadius: 26,
              background: "rgba(232, 246, 243, 0.92)",
              boxShadow: "0 18px 40px rgba(8,40,42,0.3)",
              color: "#1d3f45",
            }}
          >
            <div style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: 84, lineHeight: 1.05 }}>Come nasce un porto</div>
            <div style={{ fontFamily: "'Caveat', cursive", fontWeight: 600, fontSize: 50, marginTop: 6 }}>
              7 fasi · 36 mesi · 1 porto
            </div>
          </div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#0e2a2b", opacity: Math.max(fadeIn, fadeOut) }} />
    </AbsoluteFill>
  );
};

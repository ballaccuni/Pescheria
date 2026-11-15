import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { FOOD, ParsleyFleck, mix } from "./ingredients";
import { firstAddIn, type Timeline } from "./types";
import { STAGE, clamp, lerpPt, mulberry32, type Pt } from "./utils";

// Ciotola vista dall'alto: si prepara il condimento per la panatura.
// mixBase: pangrattato, prezzemolo tritato, aglio tritato.
// mixFinish: un cucchiaio d'olio, sale e pepe, poi si mescola.

const BOWL = { R: 250, inner: 222 };
/** tempi (fotogrammi da ciascun ingrediente) */
export const MIX = {
  crumbs: [0, 30],
  parsley: [38, 58],
  garlic: [66, 84],
  oil: [4, 34],
  salt: [40, 56],
  stir: [64, 128],
} as const;

const CRUMB_TONES = ["#EBD3A0", "#DFC283", "#F4E3BB", "#D8B670"];

type Particle = {
  kind: "crumb" | "parsley" | "garlic" | "salt" | "pepper";
  p0: Pt; // dove cade
  p1: Pt; // dove finisce dopo aver mescolato
  delay: number;
  size: number;
  tone: string;
  rot: number;
  speed: number;
};

const PARTICLES: Particle[] = (() => {
  const rnd = mulberry32(5);
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const uniform = (r: number): Pt => {
    const a = rnd() * Math.PI * 2;
    const rr = Math.sqrt(rnd()) * r;
    return { x: Math.cos(a) * rr, y: Math.sin(a) * rr };
  };
  const out: Particle[] = [];
  const add = (kind: Particle["kind"], n: number, center: Pt, spread: number, span: readonly [number, number], size: [number, number]) => {
    for (let i = 0; i < n; i++) {
      out.push({
        kind,
        p0: { x: center.x + gauss() * spread, y: center.y + gauss() * spread },
        p1: uniform(kind === "crumb" ? 175 : 160),
        delay: span[0] + rnd() * (span[1] - span[0] - 8),
        size: size[0] + rnd() * (size[1] - size[0]),
        tone: CRUMB_TONES[Math.floor(rnd() * CRUMB_TONES.length)],
        rot: rnd() * 360,
        speed: 0.7 + rnd() * 0.6,
      });
    }
  };
  add("crumb", 300, { x: -10, y: 10 }, 120, MIX.crumbs, [4, 8]);
  add("parsley", 40, { x: 85, y: -55 }, 62, MIX.parsley, [0.95, 1.2]);
  add("garlic", 34, { x: -85, y: 70 }, 50, MIX.garlic, [8, 11]);
  return out;
})();

// sale e pepe cadono dopo l'olio
const SEASONING: Particle[] = (() => {
  const rnd = mulberry32(9);
  return Array.from({ length: 60 }, (_, i) => {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 140;
    const b = rnd() * Math.PI * 2;
    const r1 = Math.sqrt(rnd()) * 170;
    return {
      kind: i % 2 ? "pepper" : "salt",
      p0: { x: Math.cos(a) * r, y: Math.sin(a) * r },
      p1: { x: Math.cos(b) * r1, y: Math.sin(b) * r1 },
      delay: MIX.salt[0] + rnd() * (MIX.salt[1] - MIX.salt[0] - 6),
      size: 2.6,
      tone: "",
      rot: 0,
      speed: 0.7 + rnd() * 0.6,
    } as Particle;
  });
})();

const OIL_DROPS = [
  { x: 6, y: -8 },
  { x: -18, y: 14 },
  { x: 24, y: 18 },
  { x: -4, y: 32 },
  { x: 18, y: -26 },
];

const Bowl: React.FC = () => (
  <g>
    <circle cx={0} cy={16} r={BOWL.R + 2} fill="rgba(47,72,88,0.16)" />
    <circle r={BOWL.R} fill={COLORS.blue} stroke={COLORS.slate} strokeWidth={5} />
    <circle r={BOWL.R - 12} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={6} />
    <circle r={BOWL.inner} fill="#F5F8FA" stroke="#D5E0E6" strokeWidth={4} />
    <circle r={BOWL.inner - 40} fill="#EEF3F6" />
    <path d="M -150 -130 A 200 200 0 0 1 -40 -192" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" fill="none" />
  </g>
);

export const MixBowlStage: React.FC<{
  tl: Timeline;
  frame: number;
  fps: number;
  offset: Pt;
  range: [number, number];
}> = ({ tl, frame, fps, offset, range }) => {
  const baseAt = firstAddIn(tl, "mixBase", range[0], range[1]);
  const finishAt = firstAddIn(tl, "mixFinish", range[0], range[1]);
  const lb = baseAt === null ? -1 : frame - baseAt;
  const lf = finishAt === null ? -1 : frame - finishAt;
  const m = interpolate(lf, MIX.stir, [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const stirring = lf >= MIX.stir[0] && lf < MIX.stir[1];

  const place = (pt: Particle, local: number) => {
    const t = local - pt.delay;
    if (t < 0) return null;
    const fall = interpolate(t, [0, 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    // mescolando: girano attorno al centro e si distribuiscono
    const pos = lerpPt(pt.p0, pt.p1, m);
    const ang = m * Math.PI * 2 * pt.speed;
    const x = pos.x * Math.cos(ang) - pos.y * Math.sin(ang);
    const y = pos.x * Math.sin(ang) + pos.y * Math.cos(ang) - (1 - fall) * 300;
    return { x, y, op: interpolate(t, [0, 3], [0, 1], clamp), rot: pt.rot + ang * 57 };
  };

  const particles = [...PARTICLES, ...(lf >= 0 ? SEASONING : [])].map((pt, i) => {
    const local = pt.kind === "salt" || pt.kind === "pepper" ? lf : lb;
    const q = place(pt, local);
    if (!q) return null;
    if (pt.kind === "crumb") {
      // l'olio scurisce un po' il pangrattato
      return <circle key={i} cx={q.x} cy={q.y} r={pt.size} fill={mix(pt.tone, "#C99A4E", m * 0.35)} opacity={q.op} />;
    }
    if (pt.kind === "parsley") {
      return (
        <g key={i} transform={`translate(${q.x} ${q.y}) rotate(${q.rot}) scale(${1.3 * pt.size})`} opacity={q.op}>
          <ParsleyFleck />
        </g>
      );
    }
    if (pt.kind === "garlic") {
      return (
        <rect
          key={i}
          x={q.x - pt.size / 2}
          y={q.y - pt.size / 2}
          width={pt.size}
          height={pt.size * 0.8}
          rx={2}
          fill="#FFFBEF"
          stroke="#BFA46A"
          strokeWidth={2}
          opacity={q.op}
          transform={`rotate(${q.rot} ${q.x} ${q.y})`}
        />
      );
    }
    return <circle key={i} cx={q.x} cy={q.y} r={pt.size} fill={pt.kind === "pepper" ? FOOD.pepper : "#FFFFFF"} opacity={q.op} />;
  });

  // cucchiaio con l'olio
  const renderOilSpoon = () => {
    if (lf < 0 || lf > MIX.oil[1] + 14) return null;
    const enter = spring({ frame: lf, fps, config: { damping: 14 } });
    const leave = interpolate(lf, [MIX.oil[1], MIX.oil[1] + 14], [0, 1], clamp);
    const tilt = interpolate(lf, [MIX.oil[0] + 6, MIX.oil[0] + 12, MIX.oil[1] - 6, MIX.oil[1]], [1, 0.55, 0.55, 1], clamp);
    const sx = 40 + (1 - enter) * 500 + leave * 500;
    const sy = -150;
    return (
      <g transform={`translate(${sx} ${sy}) rotate(-25)`}>
        <rect x={34} y={-9} width={190} height={18} rx={9} fill="#C9D6DC" stroke={COLORS.slate} strokeWidth={3.5} />
        <g transform={`scale(1 ${tilt})`}>
          <ellipse rx={46} ry={32} fill="#DCE5EA" stroke={COLORS.slate} strokeWidth={4} />
          <ellipse rx={34} ry={22} fill={FOOD.oil} opacity={0.85 * (1 - interpolate(lf, MIX.oil, [0, 1], clamp))} />
        </g>
      </g>
    );
  };

  // gocce d'olio che cadono e lasciano macchie lucide
  const renderOil = () => {
    if (lf < 0) return null;
    return OIL_DROPS.map((d, i) => {
      const t0 = MIX.oil[0] + 12 + i * 3;
      const t = lf - t0;
      if (t < 0) return null;
      const fall = interpolate(t, [0, 8], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const spread = interpolate(t, [8, 20], [0, 1], clamp);
      const fade = 1 - m;
      if (fall < 1) {
        return <circle key={i} cx={20 + (d.x - 20) * fall} cy={-140 + (d.y + 140) * fall} r={6} fill={FOOD.oil} />;
      }
      return <circle key={i} cx={d.x} cy={d.y} r={8 + spread * 14} fill={FOOD.oil} opacity={0.55 * fade} />;
    });
  };

  // cucchiaio di legno che mescola
  const renderStir = () => {
    if (lf < MIX.stir[0] - 10 || lf > MIX.stir[1] + 12) return null;
    const enter = interpolate(lf, [MIX.stir[0] - 10, MIX.stir[0]], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const leave = interpolate(lf, [MIX.stir[1], MIX.stir[1] + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    const th = stirring ? (lf - MIX.stir[0]) * 0.32 : 0;
    const hx = Math.cos(th) * 92;
    const hy = Math.sin(th) * 70;
    const out = (1 - enter + leave) * 420;
    return (
      <g transform={`translate(${hx + out} ${hy - out})`}>
        <path d="M 0 0 L 210 -210" stroke="#9C6A3A" strokeWidth={22} strokeLinecap="round" />
        <path d="M 0 0 L 210 -210" stroke="#C68B52" strokeWidth={15} strokeLinecap="round" />
        <ellipse rx={34} ry={26} transform="rotate(-45)" fill="#C68B52" stroke="#9C6A3A" strokeWidth={4} />
        <ellipse cx={-6} cy={4} rx={16} ry={10} transform="rotate(-45)" fill="#D9A06A" />
      </g>
    );
  };

  return (
    <g transform={`translate(${STAGE.cx + offset.x} ${STAGE.cy + offset.y})`}>
      <Bowl />
      {renderOil()}
      {particles}
      {renderStir()}
      {renderOilSpoon()}
    </g>
  );
};

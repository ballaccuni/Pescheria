import React from "react";
import { COLORS } from "../LogoAnimation";

// Illustrazioni piatte degli ingredienti, disegnate attorno a (0,0).
// Si usano dentro un <svg> (padella) o con <IngredientIcon> (lista ingredienti).

export const FOOD = {
  shrimpRaw: "#A9BCC0",
  shrimpRawStripe: "#C9D6D8",
  shrimpCooked: "#F07F5A",
  shrimpCookedStripe: "#F8B49A",
  zucchiniSkin: "#4F8A43",
  zucchiniFlesh: "#E4EBB4",
  zucchiniSeed: "#C7D38A",
  tomato: "#D93B2B",
  tomatoInner: "#EE6A55",
  tomatoSeed: "#F8C0A8",
  garlic: "#F6EDD5",
  garlicEdge: "#D9C9A0",
  garlicGolden: "#EAC57E",
  parsley: "#3E8E41",
  parsleyDark: "#2E6E33",
  lemonRind: "#F2C94C",
  lemonFlesh: "#FBE89A",
  oil: "#E9C046",
  pepper: "#3B3B3B",
  salt: "#FFFFFF",
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/** Gambero sgusciato a forma di "C"; cooked 0 = crudo, 1 = cotto (rosa). */
export const Shrimp: React.FC<{ cooked?: number }> = ({ cooked = 1 }) => {
  const body = mix(FOOD.shrimpRaw, FOOD.shrimpCooked, cooked);
  const stripe = mix(FOOD.shrimpRawStripe, FOOD.shrimpCookedStripe, cooked);
  const r = 24;
  const a0 = (200 * Math.PI) / 180; // testa
  const a1 = (470 * Math.PI) / 180; // coda
  const segs = 7;
  const pt = (a: number, rad = r) => [Math.cos(a) * rad, Math.sin(a) * rad];
  const parts: React.ReactNode[] = [];
  for (let i = 0; i < segs; i++) {
    const s = a0 + ((a1 - a0) * i) / segs;
    const e = a0 + ((a1 - a0) * (i + 1)) / segs;
    const [x0, y0] = pt(s);
    const [x1, y1] = pt(e);
    parts.push(
      <path
        key={`b${i}`}
        d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`}
        stroke={body}
        strokeWidth={26 - i * 2}
        strokeLinecap="round"
        fill="none"
      />,
    );
  }
  for (let i = 1; i < segs; i++) {
    const a = a0 + ((a1 - a0) * i) / segs;
    const w = 11 - i;
    const [x0, y0] = pt(a, r - w);
    const [x1, y1] = pt(a, r + w);
    parts.push(
      <line
        key={`s${i}`}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={stripe}
        strokeWidth={2.5}
        strokeLinecap="round"
      />,
    );
  }
  // coda a ventaglio
  const [tx, ty] = pt(a1);
  const tang = a1 + Math.PI / 2;
  const tailDir = [Math.cos(tang), Math.sin(tang)];
  const norm = [Math.cos(a1), Math.sin(a1)];
  const tip = [tx + tailDir[0] * 16, ty + tailDir[1] * 16];
  parts.push(
    <path
      key="tail"
      d={`M ${tx} ${ty} L ${tip[0] + norm[0] * 10} ${tip[1] + norm[1] * 10} Q ${
        tip[0] + tailDir[0] * 4
      } ${tip[1] + tailDir[1] * 4} ${tip[0] - norm[0] * 10} ${tip[1] - norm[1] * 10} Z`}
      fill={body}
      stroke={body}
      strokeWidth={3}
      strokeLinejoin="round"
    />,
  );
  return <g>{parts}</g>;
};

/** Rondella di zucchina vista dall'alto. */
export const ZucchiniSlice: React.FC = () => (
  <g>
    <circle r={25} fill={FOOD.zucchiniSkin} />
    <circle r={20.5} fill={FOOD.zucchiniFlesh} />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2;
      return (
        <ellipse
          key={i}
          cx={Math.cos(a) * 9}
          cy={Math.sin(a) * 9}
          rx={2.6}
          ry={1.6}
          transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 9} ${Math.sin(a) * 9})`}
          fill={FOOD.zucchiniSeed}
        />
      );
    })}
  </g>
);

/** Zucchina intera (icona). */
export const ZucchiniWhole: React.FC = () => (
  <g transform="rotate(-30)">
    <rect x={-42} y={-12} width={84} height={24} rx={12} fill={FOOD.zucchiniSkin} />
    <rect x={-34} y={-7} width={56} height={4} rx={2} fill="#6FA85F" />
    <rect x={40} y={-5} width={10} height={10} rx={3} fill="#7A9A4A" />
  </g>
);

/** Pomodorino ciliegino tagliato a metà. */
export const TomatoHalf: React.FC = () => (
  <g>
    <circle r={23} fill={FOOD.tomato} />
    <circle r={18} fill={FOOD.tomatoInner} />
    {[0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      return (
        <ellipse
          key={i}
          cx={Math.cos(a) * 9}
          cy={Math.sin(a) * 9}
          rx={6}
          ry={4}
          transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 9} ${Math.sin(a) * 9})`}
          fill={FOOD.tomatoSeed}
        />
      );
    })}
    <circle r={3.5} fill={FOOD.tomato} opacity={0.6} />
  </g>
);

/** Pomodorino intero con picciolo (icona). */
export const TomatoWhole: React.FC = () => (
  <g>
    <circle r={30} cy={4} fill={FOOD.tomato} />
    <ellipse cx={-10} cy={-6} rx={7} ry={4} fill="#F07A68" opacity={0.7} />
    <path
      d="M 0 -26 L -12 -32 M 0 -26 L 12 -32 M 0 -26 L -6 -18 M 0 -26 L 7 -18 M 0 -26 L 0 -38"
      stroke="#4F8A43"
      strokeWidth={5}
      strokeLinecap="round"
    />
  </g>
);

/** Fettina d'aglio; golden 0..1 = doratura. */
export const GarlicSlice: React.FC<{ golden?: number }> = ({ golden = 0 }) => (
  <g>
    <ellipse
      rx={12}
      ry={8.5}
      fill={mix(FOOD.garlic, FOOD.garlicGolden, golden)}
      stroke={FOOD.garlicEdge}
      strokeWidth={2}
    />
    <ellipse rx={4} ry={2.5} fill={mix(FOOD.garlicEdge, "#C9A060", golden)} opacity={0.6} />
  </g>
);

/** Spicchio d'aglio (icona). */
export const GarlicClove: React.FC = () => (
  <g>
    <path
      d="M 0 -34 C 22 -18 30 10 18 28 C 8 38 -8 38 -18 28 C -30 10 -22 -18 0 -34 Z"
      fill={FOOD.garlic}
      stroke={FOOD.garlicEdge}
      strokeWidth={3}
    />
    <path d="M 0 -30 C 6 -10 6 14 0 32" stroke={FOOD.garlicEdge} strokeWidth={2.5} fill="none" />
  </g>
);

/** Fogliolina di prezzemolo tritato. */
export const ParsleyFleck: React.FC = () => (
  <g>
    <circle cx={-3} cy={0} r={4} fill={FOOD.parsley} />
    <circle cx={3} cy={-2} r={3.6} fill={FOOD.parsley} />
    <circle cx={1} cy={3.5} r={3.4} fill={FOOD.parsleyDark} />
  </g>
);

/** Rametto di prezzemolo (icona). */
export const ParsleySprig: React.FC = () => (
  <g>
    <path d="M 0 36 C 0 14 -2 0 -4 -14" stroke={FOOD.parsleyDark} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M -2 6 C -12 0 -18 -6 -22 -14" stroke={FOOD.parsleyDark} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M 0 0 C 10 -6 16 -12 20 -20" stroke={FOOD.parsleyDark} strokeWidth={3} fill="none" strokeLinecap="round" />
    {[
      [-4, -22, 12],
      [-24, -20, 10],
      [-16, -30, 9],
      [22, -26, 10],
      [12, -32, 9],
      [6, -18, 8],
      [-12, -10, 8],
    ].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? FOOD.parsleyDark : FOOD.parsley} />
    ))}
  </g>
);

/** Mezzo limone visto dall'alto. */
export const LemonHalf: React.FC<{ r?: number }> = ({ r = 40 }) => (
  <g>
    <circle r={r} fill={FOOD.lemonRind} />
    <circle r={r * 0.86} fill="#FFF6D6" />
    <circle r={r * 0.78} fill={FOOD.lemonFlesh} />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <line
          key={i}
          x1={0}
          y1={0}
          x2={Math.cos(a) * r * 0.78}
          y2={Math.sin(a) * r * 0.78}
          stroke="#FFF6D6"
          strokeWidth={r * 0.06}
        />
      );
    })}
    <circle r={r * 0.12} fill="#FFF6D6" />
  </g>
);

/** Bottiglia d'olio (icona). */
export const OilBottle: React.FC = () => (
  <g>
    <rect x={-6} y={-40} width={12} height={10} rx={2} fill={COLORS.slate} />
    <path d="M -6 -30 L -6 -20 C -18 -14 -18 -6 -18 0 L -18 34 C -18 38 -14 40 -10 40 L 10 40 C 14 40 18 38 18 34 L 18 0 C 18 -6 18 -14 6 -20 L 6 -30 Z" fill="#B9C76A" />
    <path d="M -18 4 L 18 4 L 18 26 L -18 26 Z" fill={FOOD.oil} />
    <rect x={-12} y={8} width={24} height={14} rx={3} fill="#FFF9F0" />
  </g>
);

/** Sale e pepe (icona). */
export const SaltPepper: React.FC = () => (
  <g>
    <g transform="translate(-16 4)">
      <rect x={-12} y={-20} width={24} height={40} rx={8} fill="#E6EEF2" stroke={COLORS.slate} strokeWidth={3} />
      <circle cx={-4} cy={-12} r={2} fill={COLORS.slate} />
      <circle cx={4} cy={-12} r={2} fill={COLORS.slate} />
    </g>
    <g transform="translate(16 4)">
      <rect x={-12} y={-20} width={24} height={40} rx={8} fill={COLORS.slate} />
      <circle cx={-4} cy={-12} r={2} fill="#E6EEF2" />
      <circle cx={4} cy={-12} r={2} fill="#E6EEF2" />
    </g>
  </g>
);

/** Icona quadrata 100x100 per la lista ingredienti. */
export const IngredientIcon: React.FC<{ children: React.ReactNode; size?: number }> = ({
  children,
  size = 96,
}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    <circle r={48} fill="rgba(58,150,191,0.10)" />
    {children}
  </svg>
);

export const PASTA = { fill: "#F3D98B", edge: "#D4B259" };

/** Mazzetto di linguine crude (icona). */
export const LinguineBundle: React.FC = () => (
  <g transform="rotate(-35)">
    {[-12, -8, -4, 0, 4, 8, 12].map((x, i) => (
      <rect key={i} x={x - 1.6} y={-44} width={3.2} height={88} rx={1.6} fill={i % 2 ? "#E9C766" : "#F0D47E"} />
    ))}
    <rect x={-17} y={-6} width={34} height={12} rx={3} fill={COLORS.blue} />
  </g>
);

/** Linguine cotte in padella: fili ondulati generati in modo ripetibile. */
export const makeLinguine = (radius: number, count = 30, seed = 99) => {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const paths: string[] = [];
  for (let k = 0; k < count; k++) {
    const r0 = Math.sqrt(rnd()) * radius * 0.8;
    const a0 = rnd() * Math.PI * 2;
    let x = Math.cos(a0) * r0;
    let y = Math.sin(a0) * r0;
    let h = rnd() * Math.PI * 2;
    const curl = (rnd() - 0.5) * 0.25;
    const pts: [number, number][] = [[x, y]];
    const steps = 18 + Math.floor(rnd() * 14);
    for (let i = 0; i < steps; i++) {
      h += curl + Math.sin(i * 0.7 + k) * 0.18;
      x += Math.cos(h) * 16;
      y += Math.sin(h) * 16;
      const d = Math.hypot(x, y);
      if (d > radius) {
        // rientra verso il centro
        h = Math.atan2(-y, -x) + (rnd() - 0.5) * 1.2;
        x *= radius / d;
        y *= radius / d;
      }
      pts.push([x, y]);
    }
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
};

export const Linguine: React.FC<{ paths: string[] }> = ({ paths }) => (
  <g>
    {paths.map((d, i) => (
      <path key={`e${i}`} d={d} stroke={PASTA.edge} strokeWidth={11} strokeLinecap="round" fill="none" />
    ))}
    {paths.map((d, i) => (
      <path key={`f${i}`} d={d} stroke={PASTA.fill} strokeWidth={7.5} strokeLinecap="round" fill="none" />
    ))}
  </g>
);

/** Zucchina alla julienne: bastoncino sottile, con la buccia verde su un lato. */
export const ZucchiniStick: React.FC<{ len?: number; curve?: number; skin?: boolean }> = ({
  len = 56,
  curve = 0,
  skin = true,
}) => {
  const h = len / 2;
  const d = `M ${-h} 0 Q 0 ${curve} ${h} 0`;
  return (
    <g>
      <path d={d} stroke={skin ? FOOD.zucchiniSkin : "#BFCB86"} strokeWidth={11} fill="none" />
      <path
        d={d}
        stroke={FOOD.zucchiniFlesh}
        strokeWidth={skin ? 7 : 8}
        fill="none"
        transform={`translate(0 ${skin ? 2 : 0})`}
      />
    </g>
  );
};

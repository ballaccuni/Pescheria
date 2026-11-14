import React, { useMemo } from "react";
import { interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { Crust, Orata } from "./Orata";
import { Steam } from "./Steam";
import {
  LemonWedge,
  LinguineNest,
  ParsleyFleck,
  ParsleySprig,
  Shrimp,
  TomatoHalf,
  ZucchiniStick,
  makeNest,
} from "./ingredients";
import { STAGE, clamp, mulberry32, type Pt } from "./utils";

// Impiattamento: il piatto arriva dall'alto e il cibo viene sistemato sopra.

export const PLATE = { cx: STAGE.cx, cy: STAGE.cy + 10, R: 288 };

type Spot = Pt & { rot: number };

/** Punti sparsi nel cerchio, tenendo una distanza minima tra loro (e da "taken"). */
const scatter = (count: number, maxR: number, minDist: number, seed: number, taken: Pt[] = []) => {
  const rnd = mulberry32(seed);
  const pts: Spot[] = [];
  for (let i = 0; i < count; i++) {
    let best = { x: 0, y: 0 };
    let bestD = -1;
    for (let a = 0; a < 200; a++) {
      const r = Math.sqrt(rnd()) * maxR;
      const th = rnd() * Math.PI * 2;
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r;
      let dmin = Infinity;
      for (const o of [...taken, ...pts]) dmin = Math.min(dmin, Math.hypot(o.x - x, o.y - y));
      if (dmin >= minDist) {
        best = { x, y };
        break;
      }
      if (dmin > bestD) {
        bestD = dmin;
        best = { x, y };
      }
    }
    pts.push({ ...best, rot: rnd() * 360 });
  }
  return pts;
};

const SHRIMP_SPOTS = scatter(5, 112, 80, 21);
const TOMATO_SPOTS = scatter(5, 128, 62, 22, SHRIMP_SPOTS);
const STICK_SPOTS = scatter(14, 150, 34, 23).filter((s) => Math.hypot(s.x, s.y) > 55);
const PARSLEY_SPOTS = scatter(24, 152, 14, 24);
const FISH_PARSLEY = scatter(16, 1, 0, 25).map((s, i) => {
  const rnd = mulberry32(400 + i);
  const a = rnd() * Math.PI * 2;
  const rr = Math.sqrt(rnd());
  return { x: 19 + Math.cos(a) * rr * 98, y: Math.sin(a) * rr * 56, rot: s.rot };
});
const GARNISH_SPOTS = scatter(14, 190, 26, 26);

const Plate: React.FC = () => (
  <g>
    <circle cx={0} cy={16} r={PLATE.R + 2} fill="rgba(47,72,88,0.16)" />
    <circle r={PLATE.R} fill="#FFFFFF" stroke="#BFCED6" strokeWidth={4} />
    <circle r={PLATE.R - 26} fill="none" stroke={COLORS.blue} strokeWidth={7} />
    <circle r={PLATE.R - 42} fill="none" stroke={COLORS.blue} strokeWidth={2.5} opacity={0.6} />
    <circle r={206} fill="#F5F8FA" stroke="#D5E0E6" strokeWidth={4} />
    <path d="M -152 -118 A 192 192 0 0 1 -42 -187" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" fill="none" />
  </g>
);

/** Un elemento che cade al suo posto nel piatto. */
const Drop: React.FC<{
  local: number;
  start: number;
  fps: number;
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  from?: Pt;
  children: React.ReactNode;
}> = ({ local, start, fps, x, y, rot = 0, scale = 1, from = { x: 0, y: -380 }, children }) => {
  if (local < start) return null;
  const p = spring({ frame: local - start, fps, config: { damping: 12, mass: 0.6 } });
  const op = interpolate(local - start, [0, 5], [0, 1], clamp);
  return (
    <g
      opacity={op}
      transform={`translate(${x + (1 - p) * from.x} ${y + (1 - p) * from.y}) rotate(${rot}) scale(${
        scale * (1 + (1 - p) * 0.4)
      })`}
    >
      {children}
    </g>
  );
};

export const PlateStage: React.FC<{ dish: "pasta" | "fish"; frame: number; fps: number; at: number }> = ({
  dish,
  frame,
  fps,
  at,
}) => {
  const nest = useMemo(() => makeNest(158, 40), []);
  const local = frame - at;
  if (local < 14) return null;
  const enter = spring({ frame: local - 14, fps, config: { damping: 14, mass: 0.9 } });
  const steam = interpolate(local, [70, 100], [0, 0.8], clamp);

  const pasta = () => {
    const twirl = spring({ frame: local - 34, fps, config: { damping: 13, mass: 0.9 } });
    const stick = (i: number) => {
      const v = (i * 0.618) % 1;
      return <ZucchiniStick len={48 + v * 22} curve={(v - 0.5) * 16} skin={i % 4 !== 0} />;
    };
    return (
      <>
        {local >= 34 && (
          <g
            opacity={interpolate(local, [34, 40], [0, 1], clamp)}
            transform={`rotate(${(1 - twirl) * -220}) scale(${0.2 + twirl * 0.8})`}
          >
            <LinguineNest paths={nest} radius={158} />
          </g>
        )}
        {STICK_SPOTS.map((s, i) => (
          <Drop key={`st${i}`} local={local} start={50 + i * 2} fps={fps} x={s.x} y={s.y} rot={s.rot} scale={1.2}>
            {stick(i)}
          </Drop>
        ))}
        {TOMATO_SPOTS.map((s, i) => (
          <Drop key={`to${i}`} local={local} start={60 + i * 4} fps={fps} x={s.x} y={s.y} rot={s.rot} scale={1.2}>
            <TomatoHalf />
          </Drop>
        ))}
        {SHRIMP_SPOTS.map((s, i) => (
          <Drop key={`sh${i}`} local={local} start={70 + i * 5} fps={fps} x={s.x} y={s.y} rot={s.rot} scale={1.3}>
            <Shrimp cooked={1} />
          </Drop>
        ))}
        {PARSLEY_SPOTS.map((s, i) => (
          <Drop
            key={`pa${i}`}
            local={local}
            start={92 + (i % 7) * 2}
            fps={fps}
            x={s.x}
            y={s.y}
            rot={s.rot}
            scale={1.4}
            from={{ x: 0, y: -260 }}
          >
            <ParsleyFleck />
          </Drop>
        ))}
        <Drop local={local} start={104} fps={fps} x={160} y={150} rot={28} scale={1.15} from={{ x: 420, y: 60 }}>
          <LemonWedge />
        </Drop>
      </>
    );
  };

  const fish = () => (
    <>
      <Drop local={local} start={34} fps={fps} x={-6} y={-6} rot={-10} scale={0.92} from={{ x: 0, y: -620 }}>
        <Orata baked={1} id="plate" />
        <Crust local={999} baked={1} seed={101} />
        {FISH_PARSLEY.map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot}) scale(1.35)`}>
            <ParsleyFleck />
          </g>
        ))}
      </Drop>
      <Drop local={local} start={60} fps={fps} x={150} y={156} rot={24} scale={1.1} from={{ x: 420, y: 60 }}>
        <LemonWedge />
      </Drop>
      <Drop local={local} start={68} fps={fps} x={72} y={196} rot={-14} scale={1.1} from={{ x: 420, y: 120 }}>
        <LemonWedge />
      </Drop>
      <Drop local={local} start={78} fps={fps} x={-178} y={-150} rot={-35} scale={1.25} from={{ x: -380, y: -120 }}>
        <ParsleySprig />
      </Drop>
      {GARNISH_SPOTS.filter((s) => Math.abs(s.y) > 120 || Math.abs(s.x) > 170).map((s, i) => (
        <Drop
          key={`g${i}`}
          local={local}
          start={90 + (i % 5) * 2}
          fps={fps}
          x={s.x}
          y={s.y}
          rot={s.rot}
          scale={1.3}
          from={{ x: 0, y: -260 }}
        >
          <ParsleyFleck />
        </Drop>
      ))}
    </>
  );

  return (
    <g
      opacity={Math.min(1, enter * 2.5)}
      transform={`translate(${PLATE.cx} ${PLATE.cy}) scale(${0.55 + enter * 0.45})`}
    >
      <Plate />
      {dish === "pasta" ? pasta() : fish()}
      <Steam frame={frame} strength={steam} xs={[-110, -20, 80]} rise={200} />
    </g>
  );
};

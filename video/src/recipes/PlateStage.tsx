import React, { useMemo } from "react";
import { interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { Crust, FILLET_CRUST, Fillet } from "./Orata";
import { Steam } from "./Steam";
import {
  LemonWedge,
  LinguineNest,
  Mussel,
  Pacchero,
  ZestGrater,
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
  return { x: 2 + Math.cos(a) * rr * 116, y: Math.sin(a) * rr * 32, rot: s.rot };
});
const GARNISH_SPOTS = scatter(14, 190, 26, 26);
const PACCHERI_SPOTS = scatter(13, 112, 44, 27);
const MUSSEL_SPOTS = [0, 1, 2, 3].map((i) => {
  const a = -Math.PI / 2 + i * (Math.PI / 2) + 0.4;
  return { x: Math.cos(a) * 128, y: Math.sin(a) * 128, rot: (a * 180) / Math.PI + 90 };
});
const ZEST_SPOTS = scatter(34, 150, 12, 28);
/** grattugia sul piatto: inizio (dall'arrivo del piatto) e durata */
export const ZEST = { from: 110, dur: 66 };

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

export const PlateStage: React.FC<{ dish: "pasta" | "fish" | "cozze"; frame: number; fps: number; at: number }> = ({
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
      </>
    );
  };

  // grattugia con il limone che passa sopra il piatto, la scorza cade sulla pasta
  const renderGrater = () => {
    const l = local - ZEST.from;
    const enter = spring({ frame: l, fps, config: { damping: 14 } });
    const leave = interpolate(l, [ZEST.dur - 14, ZEST.dur], [0, 1], { ...clamp });
    const rub = interpolate(l, [10, ZEST.dur - 18], [0, 1], clamp);
    const lemonX = -70 + Math.sin(rub * Math.PI * 6) * 62;
    const gx = 20;
    const gy = -250 - (1 - enter) * 500 - leave * 600;
    return (
      <>
        {ZEST_SPOTS.map((p, i) => {
          const d0 = 12 + (i / ZEST_SPOTS.length) * (ZEST.dur - 34);
          const t = l - d0;
          if (t < 0) return null;
          const fall = interpolate(t, [0, 12], [0, 1], { ...clamp });
          const sx = gx - 120 + ((i * 37) % 150);
          const x = sx + (p.x - sx) * fall;
          const y = gy + 16 + (p.y - gy - 16) * fall * fall;
          const len = 12 + ((i * 7) % 9);
          const d = `M ${-len / 2} 0 Q 0 ${(i % 3) * 3 - 3} ${len / 2} 0`;
          return (
            <g key={`ze${i}`} transform={`translate(${x} ${y}) rotate(${p.rot + (1 - fall) * 160})`}>
              <path d={d} stroke="#B98A0E" strokeWidth={8} strokeLinecap="round" fill="none" />
              <path d={d} stroke={i % 3 ? "#FFD23F" : "#FFE680"} strokeWidth={4.5} strokeLinecap="round" fill="none" />
            </g>
          );
        })}
        {leave < 1 && (
          <g transform={`translate(${gx} ${gy}) rotate(-8)`} opacity={1 - leave}>
            <ZestGrater lemonX={lemonX} />
          </g>
        )}
      </>
    );
  };

  // pasta con crema di patate e cozze
  const cozze = () => {
    const pool = interpolate(local, [30, 52], [0, 168], clamp);
    return (
      <>
        {pool > 0 && (
          <g>
            <circle r={pool} fill="#EBD39C" />
            <circle r={pool} fill="none" stroke="#D9B978" strokeWidth={3} />
            <path
              d={`M ${-pool * 0.55} ${-pool * 0.5} Q ${-pool * 0.1} ${-pool * 0.68} ${pool * 0.3} ${-pool * 0.56}`}
              stroke="#FFFFFF"
              strokeWidth={9}
              opacity={0.35}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
        {PACCHERI_SPOTS.map((p, i) => (
          <Drop key={`pc${i}`} local={local} start={46 + i * 2} fps={fps} x={p.x} y={p.y} rot={p.rot} scale={1.25}>
            <Pacchero coated={1} />
          </Drop>
        ))}
        {MUSSEL_SPOTS.map((p, i) => (
          <Drop key={`mu${i}`} local={local} start={72 + i * 5} fps={fps} x={p.x} y={p.y} rot={p.rot} scale={1.2}>
            <Mussel open={1} />
          </Drop>
        ))}
        {PARSLEY_SPOTS.map((p, i) => (
          <Drop
            key={`pa${i}`}
            local={local}
            start={94 + (i % 7) * 2}
            fps={fps}
            x={p.x}
            y={p.y}
            rot={p.rot}
            scale={1.4}
            from={{ x: 0, y: -260 }}
          >
            <ParsleyFleck />
          </Drop>
        ))}
        {/* scorza di limone grattugiata sul piatto */}
        {local >= ZEST.from && renderGrater()}
      </>
    );
  };

  const fish = () => (
    <>
      {[
        { x: -10, y: -62, rot: -12, flip: 1, seed: 101, start: 34 },
        { x: 10, y: 58, rot: -6, flip: -1, seed: 202, start: 44 },
      ].map((f, i) => (
        <Drop key={i} local={local} start={f.start} fps={fps} x={f.x} y={f.y} rot={f.rot} scale={0.9} from={{ x: 0, y: -620 }}>
          <g transform={`scale(${f.flip} 1)`}>
            <Fillet baked={1} id={`plate${i}`} />
            <Crust local={999} baked={1} seed={f.seed} area={FILLET_CRUST} />
            {FISH_PARSLEY.map((s, j) => (
              <g key={j} transform={`translate(${s.x} ${s.y}) rotate(${s.rot}) scale(1.35)`}>
                <ParsleyFleck />
              </g>
            ))}
          </g>
        </Drop>
      ))}
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
      {dish === "pasta" ? pasta() : dish === "fish" ? fish() : cozze()}
      <Steam frame={frame} strength={steam} xs={[-110, -20, 80]} rise={200} />
    </g>
  );
};

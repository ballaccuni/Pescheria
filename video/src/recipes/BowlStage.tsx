import React from "react";
import { interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { Mussel, MusselMeat } from "./ingredients";
import { musselRings } from "./PanStage";
import { firstAddIn, type Timeline } from "./types";
import { STAGE, clamp, mulberry32, type Pt } from "./utils";

// Piatto di portata con le cozze aperte: qui si sgusciano.
// I frutti finiscono nella ciotolina (per il mixer), alcune cozze restano intere.

const DISH = { cx: STAGE.cx - 30, cy: STAGE.cy - 30, R: 262 };
const SMALL = { x: 250, y: 262, r: 82 }; // ciotolina, rispetto al piatto
const SPOTS = musselRings(178, 90);
// cozze che restano intere: ben distribuite nel piatto
export const KEPT_INDEX = [1, 4, 7, 11];
const SHELLED = SPOTS.map((_, i) => i).filter((i) => !KEPT_INDEX.includes(i));
const SHELL_GAP = 5;
const SHELL_FLY = 18;

/** Quando il frutto i (in ordine di sgusciatura) arriva nella ciotolina. */
export const shellLandAt = (shellAt: number, order: number) => shellAt + order * SHELL_GAP + SHELL_FLY;
export const SHELLED_COUNT = SHELLED.length;

// dove finiscono i frutti nella ciotolina
const MEAT_TARGETS = (() => {
  const rnd = mulberry32(71);
  return SHELLED.map((_, k) => {
    const a = (k / SHELLED.length) * Math.PI * 2 + rnd() * 0.4;
    const r = k < 3 ? 14 : 30 + rnd() * 16;
    return { x: SMALL.x + Math.cos(a) * r, y: SMALL.y + Math.sin(a) * r, rot: rnd() * 360 };
  });
})();

const Dish: React.FC = () => (
  <g>
    <circle cx={0} cy={14} r={DISH.R + 2} fill="rgba(47,72,88,0.16)" />
    <circle r={DISH.R} fill="#FFFFFF" stroke="#BFCED6" strokeWidth={4} />
    <circle r={DISH.R - 22} fill="none" stroke={COLORS.blue} strokeWidth={6} />
    <circle r={DISH.R - 36} fill="#F5F8FA" stroke="#D5E0E6" strokeWidth={3} />
    <path d="M -150 -150 A 212 212 0 0 1 -40 -206" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" fill="none" />
  </g>
);

const SmallBowl: React.FC = () => (
  <g transform={`translate(${SMALL.x} ${SMALL.y})`}>
    <circle cx={0} cy={8} r={SMALL.r + 2} fill="rgba(47,72,88,0.18)" />
    <circle r={SMALL.r} fill={COLORS.blue} stroke={COLORS.slate} strokeWidth={4} />
    <circle r={SMALL.r - 12} fill="#F5F8FA" stroke="#D5E0E6" strokeWidth={3} />
  </g>
);

export const BowlStage: React.FC<{
  tl: Timeline;
  frame: number;
  fps: number;
  offset: Pt;
  range: [number, number];
}> = ({ tl, frame, fps, offset, range }) => {
  const transferAt = firstAddIn(tl, "transfer", range[0], range[1]);
  const shellAt = firstAddIn(tl, "shell", range[0], range[1]);

  const mussels = SPOTS.map((p, i) => {
    if (transferAt === null) return null;
    const s = transferAt + i * 3;
    if (frame < s) return null;
    const fall = spring({ frame: frame - s, fps, config: { damping: 12, mass: 0.6 } });
    const order = SHELLED.indexOf(i);
    let shellFade = 0;
    let meat: React.ReactNode = null;
    if (order >= 0 && shellAt !== null) {
      const t0 = shellAt + order * SHELL_GAP;
      const k = interpolate(frame, [t0, t0 + SHELL_FLY], [0, 1], clamp);
      shellFade = interpolate(frame, [t0 + 4, t0 + 16], [0, 1], clamp);
      if (frame >= t0) {
        const tgt = MEAT_TARGETS[order];
        const x = p.x + (tgt.x - p.x) * k;
        const y = p.y + (tgt.y - p.y) * k - Math.sin(k * Math.PI) * 140;
        meat = (
          <g key={`m${i}`} transform={`translate(${x} ${y}) rotate(${p.rot + (tgt.rot - p.rot) * k}) scale(1.05)`}>
            <MusselMeat />
          </g>
        );
      }
    }
    return (
      <g key={i}>
        {shellFade < 1 && (
          <g
            opacity={interpolate(frame - s, [0, 5], [0, 1], clamp) * (1 - shellFade)}
            transform={`translate(${p.x} ${p.y - (1 - fall) * 480}) rotate(${p.rot}) scale(${1.05 + (1 - fall) * 0.4})`}
          >
            <Mussel open={1} meat={!(shellAt !== null && order >= 0 && frame >= shellAt + order * SHELL_GAP)} />
          </g>
        )}
        {meat}
      </g>
    );
  });

  return (
    <g transform={`translate(${DISH.cx + offset.x} ${DISH.cy + offset.y})`}>
      <Dish />
      <SmallBowl />
      {mussels}
    </g>
  );
};


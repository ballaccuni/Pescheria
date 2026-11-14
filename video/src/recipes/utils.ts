import { Easing, interpolate, spring } from "remotion";
import type { Segment, Timeline } from "./types";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Pt = { x: number; y: number };

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Generatore casuale ripetibile. */
export const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Centro della "scena": padella, teglia e piatto stanno qui. */
export const STAGE = { cx: 690, cy: 810 };

/** Movimento di una scena (padella, teglia, pentola, mixer): entra dal basso, salta, esce a destra. */
export const segmentMotion = (frame: number, fps: number, tl: Timeline, seg: Segment) => {
  const enter = spring({ frame: frame - seg.enterAt, fps, config: { damping: 15 } });
  let tossX = 0;
  let tossY = 0;
  let tossAmt = 0;
  for (const i of seg.steps) {
    const s = tl.steps[i];
    if (s.tossAt === null) continue;
    const tt = frame - s.tossAt;
    if (tt >= 0 && tt < 36) {
      const a = Math.exp(-tt / 10) * Math.sin(tt * 0.55);
      tossX += 22 * a;
      tossY += -10 * Math.abs(a);
      tossAmt += a;
    }
  }
  const exit = seg.last
    ? 0
    : interpolate(frame, [seg.end, seg.end + 24], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return {
    enter,
    exit,
    tossAmt,
    visible: frame >= seg.enterAt && exit < 1,
    offset: { x: tossX + exit * 1050, y: (1 - enter) * 1100 + tossY - exit * 140 },
  };
};

export type StageMotion = ReturnType<typeof segmentMotion>;

export const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;

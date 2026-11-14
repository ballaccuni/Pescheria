import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { Crust, Orata } from "./Orata";
import { Steam } from "./Steam";
import { FOOD, LemonHalf, ParsleyFleck, ParsleySprig } from "./ingredients";
import { addTimes, firstAdd, type Timeline } from "./types";
import { STAGE, clamp, mulberry32, roundedRect, type Pt } from "./utils";

// Teglia vista dall'alto con le orate, e il forno che le cuoce.

export const TRAY = { cx: STAGE.cx + 10, cy: STAGE.cy - 10, w: 620, h: 500, r: 46 };
const FISH_SCALE = 0.86;
const FISH = [
  { x: -36, y: -110, rot: -2, flip: 1, seed: 101 },
  { x: 36, y: 110, rot: 2, flip: -1, seed: 202 },
];

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Filo d'olio a zig-zag sulla teglia. */
const zigzag = (flip: 1 | -1) => {
  const xs = [-230, 230];
  const ys = [-185, -125, -65, -5, 55, 115, 175];
  let d = "";
  ys.forEach((y, i) => {
    const x = xs[i % 2] * flip;
    if (i === 0) {
      d = `M ${x} ${y}`;
    } else {
      const px = xs[(i - 1) % 2] * flip;
      d += ` C ${px} ${ys[i - 1] + 26} ${x} ${y - 26} ${x} ${y}`;
    }
  });
  return d;
};

const Tray: React.FC = () => (
  <g>
    {/* manici */}
    <rect x={-TRAY.w / 2 - 22} y={-70} width={44} height={140} rx={18} fill="#243B48" />
    <rect x={TRAY.w / 2 - 22} y={-70} width={44} height={140} rx={18} fill="#243B48" />
    <rect x={-TRAY.w / 2} y={-TRAY.h / 2} width={TRAY.w} height={TRAY.h} rx={TRAY.r} fill={COLORS.slate} />
    <rect
      x={-TRAY.w / 2 + 16}
      y={-TRAY.h / 2 + 16}
      width={TRAY.w - 32}
      height={TRAY.h - 32}
      rx={TRAY.r - 12}
      fill="#41606F"
    />
    {/* carta forno */}
    <path
      d="M -280 -224 L 277 -228 L 282 222 L -276 227 Z"
      fill="#F3EBD9"
      stroke="#DCCFB4"
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d="M -96 -225 L -90 225 M 124 -227 L 116 224" stroke="#E6DBC4" strokeWidth={3} />
  </g>
);

export const TrayStage: React.FC<{
  tl: Timeline;
  frame: number;
  fps: number;
  offset: Pt;
}> = ({ tl, frame, fps, offset }) => {
  const oven = tl.ovenStep;
  const bake = oven ? interpolate(frame, [oven.start + 26, oven.end - 36], [0, 1], clamp) : 0;

  const fishAt = firstAdd(tl, "fish");
  const saltAt = firstAdd(tl, "salt");
  const slicesAt = firstAdd(tl, "lemonSlices");
  const crumbsAt = firstAdd(tl, "breadcrumbs");
  const parsleyAt = firstAdd(tl, "parsley");
  const drizzles = addTimes(tl, "drizzle");

  const renderDrizzle = (i: number) => {
    const t = drizzles[i];
    if (t === undefined || frame < t) return null;
    const p = interpolate(frame, [t, t + 36], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const op = interpolate(frame, [t, t + 6, t + 50, t + 90], [0, 0.85, 0.85, 0.42], clamp) * (1 - bake * 0.6);
    return (
      <path
        key={`drizzle${i}`}
        d={zigzag(i % 2 ? -1 : 1)}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        stroke="#E9B43C"
        strokeWidth={9}
        strokeLinecap="round"
        fill="none"
        opacity={op}
      />
    );
  };

  // limone e prezzemolo che spuntano dalla pancia (disegnati sotto al pesce)
  const renderStuffing = (fishIndex: number) => {
    if (slicesAt === null) return null;
    const items = [
      { x: -34, y: 98, kind: "lemon" as const },
      { x: 4, y: 90, kind: "sprig" as const },
      { x: 40, y: 90, kind: "lemon" as const },
    ];
    return items.map((it, j) => {
      const s = slicesAt + fishIndex * 12 + j * 6;
      if (frame < s) return null;
      const p = spring({ frame: frame - s, fps, config: { damping: 13 } });
      const op = interpolate(frame - s, [0, 5], [0, 1], clamp);
      return (
        <g key={j} opacity={op} transform={`translate(${it.x} ${it.y + (1 - p) * 150})`}>
          {it.kind === "lemon" ? (
            <LemonHalf r={30} />
          ) : (
            <g transform="rotate(180) scale(0.62)">
              <ParsleySprig />
            </g>
          )}
        </g>
      );
    });
  };

  // prezzemolo tritato sopra la panatura
  const renderFishParsley = (fishIndex: number) => {
    if (parsleyAt === null || frame < parsleyAt) return null;
    const rnd = mulberry32(300 + fishIndex);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = Math.sqrt(rnd());
      const x = 19 + Math.cos(a) * rr * 98;
      const y = Math.sin(a) * rr * 56;
      const delay = rnd() * 28 + fishIndex * 6;
      const rot = rnd() * 360;
      const local = frame - parsleyAt - delay;
      if (local < 0) continue;
      const fall = interpolate(local, [0, 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      out.push(
        <g
          key={i}
          opacity={interpolate(local, [0, 3], [0, 1], clamp)}
          transform={`translate(${x} ${y - (1 - fall) * 240}) rotate(${rot}) scale(1.35)`}
        >
          <ParsleyFleck />
        </g>,
      );
    }
    return out;
  };

  const renderFish = () => {
    if (fishAt === null) return null;
    return FISH.map((f, i) => {
      const s = fishAt + i * 14;
      if (frame < s) return null;
      const fall = spring({ frame: frame - s, fps, config: { damping: 12, mass: 0.9 } });
      const op = interpolate(frame - s, [0, 5], [0, 1], clamp);
      const y = f.y - (1 - fall) * 620;
      const rot = f.rot + (1 - fall) * 14 * f.flip;
      return (
        <g
          key={i}
          opacity={op}
          transform={`translate(${f.x} ${y}) rotate(${rot}) scale(${FISH_SCALE * f.flip} ${FISH_SCALE})`}
        >
          {renderStuffing(i)}
          <Orata baked={bake} id={`tray${i}`} />
          {crumbsAt !== null && <Crust local={frame - crumbsAt - i * 8} baked={bake} seed={f.seed} />}
          {renderFishParsley(i)}
        </g>
      );
    });
  };

  const renderSalt = () => {
    if (saltAt === null || frame < saltAt) return null;
    // quando arriva il pangrattato, sale e pepe restano sotto
    const hide = crumbsAt === null ? 1 : interpolate(frame, [crumbsAt + 8, crumbsAt + 40], [1, 0], clamp);
    if (hide <= 0) return null;
    const rnd = mulberry32(41);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 80; i++) {
      const x = (rnd() - 0.5) * 500;
      const y = (rnd() - 0.5) * 400;
      const delay = rnd() * 30;
      const isPepper = i % 2 === 1;
      const local = frame - saltAt - delay;
      if (local < 0) continue;
      const fall = interpolate(local, [0, 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      out.push(
        <circle
          key={i}
          cx={x}
          cy={y - (1 - fall) * 260}
          r={isPepper ? 2.8 : 3.2}
          fill={isPepper ? FOOD.pepper : FOOD.salt}
          stroke={isPepper ? "none" : "#C9D6DC"}
          strokeWidth={1}
          opacity={interpolate(local, [0, 3], [0, 1], clamp) * hide}
        />,
      );
    }
    return out;
  };

  const renderOven = () => {
    if (!oven || !oven.oven || frame < oven.start || frame > oven.end) return null;
    const local = frame - oven.start;
    const dur = oven.end - oven.start;
    const slide =
      interpolate(local, [0, 22], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) }) +
      interpolate(local, [dur - 30, dur - 8], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    const remaining = Math.ceil(oven.oven.minutes * 60 * (1 - bake));
    const done = remaining === 0;
    const glow = 0.5 + 0.5 * Math.sin(frame / 5);
    const W = { x: -324, y: -264, w: 648, h: 528, r: 26 }; // vetro
    const D = { x: -350, y: -372, w: 700, h: 664, r: 32 }; // sportello
    return (
      <g transform={`translate(${slide * 820} 0)`}>
        {/* calore dentro al forno */}
        <rect x={W.x} y={W.y} width={W.w} height={W.h} rx={W.r} fill="url(#ovenGlow)" opacity={0.8 + glow * 0.2} />
        <g clipPath="url(#ovenWindow)">
          {[W.y + 16, W.y + W.h - 24].map((yy, i) => (
            <g key={i}>
              <rect
                x={W.x + 30}
                y={yy - 6}
                width={W.w - 60}
                height={20}
                rx={10}
                fill="#FF7A2E"
                opacity={0.45 + glow * 0.35}
                filter="url(#steamBlur)"
              />
              <rect x={W.x + 40} y={yy} width={W.w - 80} height={8} rx={4} fill="#FFB36B" opacity={0.8 + glow * 0.2} />
            </g>
          ))}
          {/* riflessi sul vetro */}
          <path d="M -270 264 L -130 -264 L -70 -264 L -210 264 Z" fill="#FFFFFF" opacity={0.07} />
          <path d="M -150 264 L -10 -264 L 10 -264 L -130 264 Z" fill="#FFFFFF" opacity={0.05} />
        </g>
        {/* sportello con il vetro al centro */}
        <path
          d={`${roundedRect(D.x, D.y, D.w, D.h, D.r)} ${roundedRect(W.x, W.y, W.w, W.h, W.r)}`}
          fillRule="evenodd"
          fill={COLORS.slate}
          stroke="#1E3038"
          strokeWidth={5}
        />
        <rect
          x={W.x - 8}
          y={W.y - 8}
          width={W.w + 16}
          height={W.h + 16}
          rx={W.r + 8}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={4}
        />
        {/* display: temperatura e timer */}
        <rect x={-140} y={D.y + 20} width={280} height={60} rx={14} fill="#16242D" stroke="#0F1A21" strokeWidth={3} />
        <text x={-70} y={D.y + 62} textAnchor="middle" fontSize={34} fontWeight={600} fill="#8FD3F4">
          {oven.oven.temp}°C
        </text>
        <text
          x={70}
          y={D.y + 62}
          textAnchor="middle"
          fontSize={34}
          fontWeight={600}
          fill={done && Math.floor(frame / 5) % 2 === 0 ? "#FFB36B" : COLORS.cream}
        >
          {pad(Math.floor(remaining / 60))}:{pad(remaining % 60)}
        </text>
        {/* manopole */}
        {[-248, 248].map((kx, i) => (
          <g key={i} transform={`translate(${kx} ${D.y + 50})`}>
            <circle r={27} fill="#41606F" stroke="#1E3038" strokeWidth={4} />
            <path
              d="M 0 -19 L 0 -5"
              stroke={COLORS.cream}
              strokeWidth={5}
              strokeLinecap="round"
              transform={`rotate(${i === 0 ? 125 : -30 + bake * 285})`}
            />
          </g>
        ))}
        {/* maniglia */}
        <rect x={-210} y={W.y + W.h + 7} width={420} height={14} rx={7} fill="#C9D6DC" stroke="#1E3038" strokeWidth={3} />
      </g>
    );
  };

  const steam = oven ? interpolate(frame, [oven.end - 24, oven.end - 4], [0, 1], clamp) : 0;

  return (
    <g transform={`translate(${offset.x} ${offset.y})`}>
      <defs>
        <radialGradient id="ovenGlow" cx="50%" cy="50%" r="68%">
          <stop offset="0%" stopColor="#FFB45A" stopOpacity={0.08} />
          <stop offset="65%" stopColor="#FF8A3D" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#E0531F" stopOpacity={0.46} />
        </radialGradient>
        <clipPath id="ovenWindow">
          <rect x={-324} y={-264} width={648} height={528} rx={26} />
        </clipPath>
      </defs>
      <g transform={`translate(${TRAY.cx} ${TRAY.cy})`}>
        <Tray />
        {renderDrizzle(0)}
        {renderFish()}
        {renderSalt()}
        {drizzles.slice(1).map((_, i) => renderDrizzle(i + 1))}
        <Steam frame={frame} strength={steam} xs={[-170, -60, 60, 170]} />
        {renderOven()}
      </g>
    </g>
  );
};

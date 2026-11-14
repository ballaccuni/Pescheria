import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, Waves } from "../LogoAnimation";
import { fontFamily } from "../font";
import { Chef } from "./Chef";
import {
  FOOD,
  GarlicClove,
  GarlicSlice,
  IngredientIcon,
  LemonHalf,
  Linguine,
  LinguineBundle,
  OilBottle,
  ParsleyFleck,
  ParsleySprig,
  SaltPepper,
  Shrimp,
  TomatoHalf,
  TomatoWhole,
  ZucchiniSlice,
  ZucchiniWhole,
  makeLinguine,
} from "./ingredients";

// ---------------------------------------------------------------- tipi

export type PanKind =
  | "oil"
  | "garlic"
  | "zucchini"
  | "tomato"
  | "shrimp"
  | "salt"
  | "pasta"
  | "parsley"
  | "lemon";

export type IconKind =
  | "linguine"
  | "shrimp"
  | "zucchiniWhole"
  | "tomatoWhole"
  | "garlicClove"
  | "oilBottle"
  | "parsleySprig"
  | "lemon"
  | "saltPepper";

export type Recipe = {
  title: string[];
  servings: string;
  ingredients: { name: string; qty: string; icon: IconKind }[];
  steps: {
    title: string;
    text: string;
    add: PanKind[];
    duration: number;
    toss?: boolean;
  }[];
  outro: string;
};

// ---------------------------------------------------------------- tempi

const ROW_GAP = 14;
const LIST_HOLD = 120;
const OUTRO_LEN = 150;
const TOSS_DELAY = 55;

export const recipeTimeline = (recipe: Recipe) => {
  const rowsStart = 60;
  const listOut = rowsStart + recipe.ingredients.length * ROW_GAP + LIST_HOLD;
  const panIn = listOut + 8;
  const stepsStart = listOut + 40;
  let t = stepsStart;
  const steps = recipe.steps.map((s) => {
    const start = t;
    t += s.duration;
    const adds = s.add.map((kind, i) => ({ kind, at: start + 8 + i * 40 }));
    return { ...s, start, end: t, adds, tossAt: s.toss ? start + TOSS_DELAY : null };
  });
  const outro = t;
  return { rowsStart, listOut, panIn, stepsStart, steps, outro, total: outro + OUTRO_LEN };
};

// ---------------------------------------------------------------- utilità

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Padella a destra, cuoco in basso a sinistra, testi a destra del cuoco
const PAN = { cx: 640, cy: 840, R: 300, inner: 276, handleAngle: 130, handleLen: 170 };
const CHEF = { x: 235, y: 1300, s: 1.0 };
const ITEM_SCALE = 1.15;
const TEXT_COL = { left: 450, right: 30, top: 1225 };

const handleEnd = (() => {
  const a = (PAN.handleAngle * Math.PI) / 180;
  const d = PAN.R + PAN.handleLen;
  return { x: PAN.cx + Math.cos(a) * d, y: PAN.cy + Math.sin(a) * d };
})();

const GROUPS: Partial<
  Record<PanKind, { count: number; minDist: number; stagger: number; seed: number }>
> = {
  garlic: { count: 6, minDist: 38, stagger: 4, seed: 3 },
  zucchini: { count: 12, minDist: 46, stagger: 3, seed: 5 },
  tomato: { count: 10, minDist: 44, stagger: 3, seed: 7 },
  shrimp: { count: 8, minDist: 50, stagger: 4, seed: 11 },
};

type Placed = { x: number; y: number; rot: number; phase: number };

const placeItems = (kinds: PanKind[]) => {
  const out: Partial<Record<PanKind, Placed[]>> = {};
  const occupied: { x: number; y: number; d: number }[] = [];
  for (const kind of kinds) {
    const g = GROUPS[kind];
    if (!g) continue;
    const rnd = mulberry32(g.seed);
    const maxR = PAN.inner - 38;
    const list: Placed[] = [];
    for (let i = 0; i < g.count; i++) {
      let best = { x: 0, y: 0 };
      let bestScore = -1;
      for (let a = 0; a < 300; a++) {
        const r = Math.sqrt(rnd()) * maxR;
        const th = rnd() * Math.PI * 2;
        const x = Math.cos(th) * r;
        const y = Math.sin(th) * r;
        const pool = kind === "garlic" ? list.map((p) => ({ ...p, d: g.minDist })) : occupied;
        let minRatio = Infinity;
        for (const o of pool) {
          minRatio = Math.min(minRatio, Math.hypot(o.x - x, o.y - y) / Math.max(o.d, g.minDist));
        }
        if (minRatio >= 1) {
          best = { x, y };
          break;
        }
        if (minRatio > bestScore) {
          bestScore = minRatio;
          best = { x, y };
        }
      }
      const p = { ...best, rot: rnd() * 360, phase: rnd() * Math.PI * 2 };
      list.push(p);
      if (kind !== "garlic") occupied.push({ x: p.x, y: p.y, d: g.minDist });
    }
    out[kind] = list;
  }
  return out;
};

const ICONS: Record<IconKind, React.ReactNode> = {
  linguine: <LinguineBundle />,
  shrimp: (
    <g transform="scale(1.25)">
      <Shrimp cooked={1} />
    </g>
  ),
  zucchiniWhole: <ZucchiniWhole />,
  tomatoWhole: <TomatoWhole />,
  garlicClove: <GarlicClove />,
  oilBottle: <OilBottle />,
  parsleySprig: <ParsleySprig />,
  lemon: <LemonHalf r={34} />,
  saltPepper: <SaltPepper />,
};

// ---------------------------------------------------------------- padella

const Pan: React.FC = () => (
  <g>
    <g transform={`rotate(${PAN.handleAngle} ${PAN.cx} ${PAN.cy})`}>
      <rect
        x={PAN.cx + PAN.R - 20}
        y={PAN.cy - 28}
        width={PAN.handleLen + 40}
        height={56}
        rx={28}
        fill="#243B48"
      />
    </g>
    <circle cx={PAN.cx} cy={PAN.cy} r={PAN.R} fill={COLORS.slate} />
    <circle cx={PAN.cx} cy={PAN.cy} r={PAN.inner} fill="#41606F" />
    <circle
      cx={PAN.cx}
      cy={PAN.cy}
      r={PAN.inner - 10}
      fill="none"
      stroke="rgba(0,0,0,0.12)"
      strokeWidth={20}
    />
    <path
      d={`M ${PAN.cx - 200} ${PAN.cy - 135} A 245 245 0 0 1 ${PAN.cx - 50} ${PAN.cy - 240}`}
      stroke="rgba(255,255,255,0.10)"
      strokeWidth={13}
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

// ---------------------------------------------------------------- video

export const RecipeVideo: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = useMemo(() => recipeTimeline(recipe), [recipe]);
  const allKinds = useMemo(() => recipe.steps.flatMap((s) => s.add), [recipe]);
  const placed = useMemo(() => placeItems(allKinds), [allKinds]);
  const pastaPaths = useMemo(() => makeLinguine(PAN.inner - 26, 30), []);
  const addAt = (kind: PanKind) => {
    for (const s of tl.steps) for (const a of s.adds) if (a.kind === kind) return a.at;
    return null;
  };
  const allAdds = tl.steps.flatMap((s) => s.adds);

  // --- scena 1: titolo e ingredienti
  const titleIn = interpolate(frame, [12, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const listOut = interpolate(frame, [tl.listOut, tl.listOut + 20], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const cardIn = interpolate(frame, [36, 58], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // --- scena 2: padella e cuoco
  const panIn = spring({ frame: frame - tl.panIn, fps, config: { damping: 15 } });
  const chefIn = spring({ frame: frame - tl.panIn - 6, fps, config: { damping: 14 } });

  let tossX = 0;
  let tossY = 0;
  let tossAmt = 0;
  for (const s of tl.steps) {
    if (s.tossAt === null) continue;
    const tt = frame - s.tossAt;
    if (tt >= 0 && tt < 36) {
      const a = Math.exp(-tt / 10) * Math.sin(tt * 0.55);
      tossX += 22 * a;
      tossY += -10 * Math.abs(a);
      tossAmt += a;
    }
  }
  const panShiftY = (1 - panIn) * 1100;
  const panX = PAN.cx + tossX;
  const panY = PAN.cy + panShiftY + tossY;

  const oilAt = addAt("oil");
  const oilR =
    oilAt === null
      ? 0
      : interpolate(frame, [oilAt + 18, oilAt + 48], [0, PAN.inner - 16], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });

  const renderGroup = (kind: PanKind) => {
    const at = addAt(kind);
    const items = placed[kind];
    const g = GROUPS[kind];
    if (at === null || !items || !g) return null;
    return items.map((p, i) => {
      const s = at + i * g.stagger;
      if (frame < s) return null;
      const fall = spring({ frame: frame - s, fps, config: { damping: 11, mass: 0.6 } });
      const opacity = interpolate(frame - s, [0, 5], [0, 1], clamp);
      const simmer = Math.sin(frame * 0.8 + p.phase) * 0.8;
      const tx = p.x + Math.cos(p.phase) * tossAmt * 14;
      const ty = p.y - (1 - fall) * 420 + Math.sin(p.phase) * tossAmt * 14 + simmer;
      const sc = (1 + (1 - fall) * 0.5) * ITEM_SCALE;
      const rot = p.rot + tossAmt * 20 * Math.cos(p.phase);
      let node: React.ReactNode = null;
      if (kind === "garlic") {
        node = <GarlicSlice golden={interpolate(frame, [s + 10, s + 140], [0, 0.85], clamp)} />;
      } else if (kind === "zucchini") {
        node = <ZucchiniSlice />;
      } else if (kind === "tomato") {
        node = <TomatoHalf />;
      } else if (kind === "shrimp") {
        node = <Shrimp cooked={interpolate(frame, [s + 15, s + 85], [0, 1], clamp)} />;
      }
      return (
        <g key={`${kind}${i}`} opacity={opacity} transform={`translate(${tx} ${ty}) rotate(${rot}) scale(${sc})`}>
          {node}
        </g>
      );
    });
  };

  // linguine: cadono sopra, poi con il salto in padella si mescolano sotto il condimento
  const pastaAt = addAt("pasta");
  const pastaMixAt = pastaAt === null ? Infinity : pastaAt - 8 + TOSS_DELAY + 6;
  const renderPasta = () => {
    if (pastaAt === null || frame < pastaAt) return null;
    const fall = spring({ frame: frame - pastaAt, fps, config: { damping: 12, mass: 0.8 } });
    const op = interpolate(frame - pastaAt, [0, 6], [0, 1], clamp);
    const rot = tossAmt * 6;
    return (
      <g
        opacity={op}
        transform={`translate(${tossAmt * 10} ${-(1 - fall) * 480}) scale(${1 + (1 - fall) * 0.3}) rotate(${rot})`}
      >
        <Linguine paths={pastaPaths} />
      </g>
    );
  };

  const renderSprinkle = (kind: "salt" | "parsley") => {
    const at = addAt(kind);
    if (at === null || frame < at) return null;
    const rnd = mulberry32(kind === "salt" ? 41 : 43);
    const n = kind === "salt" ? 70 : 60;
    const out: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(rnd()) * (PAN.inner - 30);
      const th = rnd() * Math.PI * 2;
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r;
      const delay = rnd() * 30;
      const rot = rnd() * 360;
      const isPepper = kind === "salt" && i % 2 === 1;
      const local = frame - at - delay;
      if (local < 0) continue;
      const fall = interpolate(local, [0, 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const yy = y - (1 - fall) * 260;
      const op = interpolate(local, [0, 3], [0, 1], clamp);
      out.push(
        <g key={`${kind}${i}`} opacity={op} transform={`translate(${x + tossAmt * 6} ${yy}) rotate(${rot})`}>
          {kind === "parsley" ? (
            <g transform="scale(1.3)">
              <ParsleyFleck />
            </g>
          ) : (
            <circle r={isPepper ? 2.6 : 3} fill={isPepper ? FOOD.pepper : FOOD.salt} />
          )}
        </g>,
      );
    }
    return out;
  };

  const lemonAt = addAt("lemon");
  const renderLemon = () => {
    if (lemonAt === null || frame < lemonAt) return null;
    const local = frame - lemonAt;
    const enter = spring({ frame: local, fps, config: { damping: 14 } });
    const leave = interpolate(local, [70, 85], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    const squeeze = interpolate(local, [24, 32, 44], [1, 0.72, 1], clamp);
    const lx = 110;
    const ly = -220 - (1 - enter) * 500 - leave * 600;
    const rnd = mulberry32(61);
    const drops: React.ReactNode[] = [];
    for (let i = 0; i < 9; i++) {
      const tx = (rnd() - 0.5) * 340;
      const ty = 10 + rnd() * 150;
      const d0 = 28 + i * 2.5;
      if (local < d0) continue;
      const p = interpolate(local, [d0, d0 + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const x = lx + (tx - lx) * p;
      const y = -180 + (ty + 180) * p;
      const landed = local - (d0 + 14);
      if (landed < 0) {
        drops.push(<circle key={`d${i}`} cx={x} cy={y} r={6} fill={FOOD.lemonFlesh} />);
      } else if (landed < 14) {
        drops.push(
          <circle
            key={`d${i}`}
            cx={tx}
            cy={ty}
            r={6 + landed * 1.4}
            fill="none"
            stroke={FOOD.lemonFlesh}
            strokeWidth={3}
            opacity={1 - landed / 14}
          />,
        );
      }
    }
    return (
      <>
        {drops}
        <g
          transform={`translate(${lx} ${ly}) rotate(-15) scale(${1.1 * (2 - squeeze)} ${1.1 * squeeze})`}
          opacity={1 - leave}
        >
          <LemonHalf r={58} />
        </g>
      </>
    );
  };

  const renderOilBubbles = () => {
    if (oilAt === null || frame < oilAt + 30) return null;
    const rnd = mulberry32(77);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 34; i++) {
      const r = Math.sqrt(rnd()) * (oilR - 20);
      const th = rnd() * Math.PI * 2;
      const period = 16 + rnd() * 24;
      const off = rnd() * period;
      const size = 3 + rnd() * 4;
      const ph = ((frame + off) % period) / period;
      out.push(
        <circle
          key={i}
          cx={Math.cos(th) * r}
          cy={Math.sin(th) * r}
          r={size * (0.4 + ph)}
          fill="none"
          stroke="#FBE7A1"
          strokeWidth={1.8}
          opacity={Math.sin(ph * Math.PI) * 0.8}
        />,
      );
    }
    return out;
  };

  const steamFrom = addAt("zucchini") ?? Infinity;
  const renderSteam = () => {
    if (frame < steamFrom) return null;
    const strength = interpolate(frame, [steamFrom, steamFrom + 60], [0, 1], clamp);
    return [-140, -40, 70, 165].map((x0, i) => {
      const period = 70;
      const ph = ((frame + i * 19) % period) / period;
      const y0 = -40 - ph * 240;
      const op = Math.sin(ph * Math.PI) * 0.22 * strength;
      const wob = (k: number) => Math.sin(ph * 6 + i + k) * 18;
      return (
        <path
          key={i}
          d={`M ${x0} ${y0 + 120} C ${x0 + wob(0)} ${y0 + 80}, ${x0 - wob(1)} ${y0 + 40}, ${x0 + wob(2)} ${y0}`}
          stroke="#FFFFFF"
          strokeWidth={26}
          strokeLinecap="round"
          fill="none"
          opacity={op}
          filter="url(#steamBlur)"
        />
      );
    });
  };

  const renderPour = () => {
    if (oilAt === null) return null;
    const local = frame - oilAt;
    if (local < 0 || local > 40) return null;
    const top = interpolate(local, [0, 30, 40], [-700, -700, -60], clamp);
    const bottom = interpolate(local, [0, 14], [-700, 0], clamp);
    const w = interpolate(local, [0, 6, 30, 40], [0, 9, 9, 0], clamp);
    return <rect x={-w / 2} y={top} width={w} height={Math.max(0, bottom - top)} rx={w / 2} fill={FOOD.oil} />;
  };

  // --- cuoco
  const toLocal = (gx: number, gy: number) => ({ x: (gx - CHEF.x) / CHEF.s, y: (gy - CHEF.y) / CHEF.s });
  const handGlobal = {
    x: handleEnd.x + tossX - 6,
    y: handleEnd.y + panShiftY + tossY - 4,
  };
  const rightHand = toLocal(handGlobal.x, handGlobal.y);
  // mano libera: lancia gli ingredienti, poi saluta nel finale
  const restHand = { x: -96, y: 236 }; // mano appoggiata sulla pancia
  const upHand = { x: -140, y: -50 };
  let gesture = 0;
  for (const a of allAdds) {
    const tt = frame - a.at + 6;
    if (tt >= 0 && tt < 24) gesture = Math.max(gesture, Math.sin((tt / 24) * Math.PI));
  }
  const waveAmt = interpolate(frame, [tl.outro + 10, tl.outro + 25], [0, 1], clamp);
  gesture = Math.max(gesture, waveAmt);
  const thumbsUp = frame >= tl.outro + 62;
  const waveX = thumbsUp ? 0 : waveAmt * Math.sin((frame - tl.outro) * 0.35) * 26;
  const leftHand = {
    x: restHand.x + (upHand.x - restHand.x) * gesture + waveX,
    y: restHand.y + (upHand.y - restHand.y) * gesture,
  };
  const blinkPhase = frame % 96;
  const blink = blinkPhase < 6 ? Math.sin((blinkPhase / 6) * Math.PI) : 0;
  const wow = Math.abs(tossAmt) > 0.15 ? 1 : 0;
  const happy = frame >= tl.outro + 10 ? 1 : 0;
  const bob = Math.sin(frame / 12) * 4;
  const chefSlide = (1 - chefIn) * 500;

  // --- didascalia
  const current = tl.steps.findIndex((s) => frame >= s.start && frame < s.end);
  const step = current >= 0 ? tl.steps[current] : null;
  const capIn = step
    ? interpolate(frame - step.start, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
    : 0;
  const capOut =
    step && current < tl.steps.length - 1
      ? interpolate(frame, [step.end - 8, step.end], [1, 0], clamp)
      : interpolate(frame, [tl.outro, tl.outro + 12], [1, 0], clamp);

  const outroText = (d: number) =>
    interpolate(frame, [tl.outro + d, tl.outro + d + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pill = spring({ frame: frame - tl.outro - 45, fps, config: { damping: 13 } });

  const pastaBelow = frame >= pastaMixAt;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, fontFamily }}>
      <Waves />

      {/* Logo in alto */}
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          opacity: interpolate(frame, [0, 18], [0, 1], clamp),
        }}
      >
        <Img src={staticFile("logo/fish.png")} style={{ width: 280 }} />
        <Img src={staticFile("logo/sapore.png")} style={{ width: 360 }} />
      </div>

      {/* Scena 1: titolo + ingredienti */}
      <AbsoluteFill style={{ opacity: 1 - listOut, transform: `translateY(${-listOut * 60}px)` }}>
        <div
          style={{
            position: "absolute",
            top: 312,
            width: "100%",
            textAlign: "center",
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 30}px)`,
          }}
        >
          <div style={{ color: COLORS.blue, fontSize: 30, fontWeight: 600, letterSpacing: 9 }}>LA RICETTA</div>
          {recipe.title.map((l) => (
            <div key={l} style={{ color: COLORS.slate, fontSize: 70, fontWeight: 600, lineHeight: 1.12 }}>
              {l}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            top: 560,
            left: 60,
            right: 60,
            padding: "30px 44px 22px",
            borderRadius: 40,
            backgroundColor: "rgba(58,150,191,0.08)",
            opacity: cardIn,
            transform: `translateY(${(1 - cardIn) * 40}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ color: COLORS.blue, fontSize: 32, fontWeight: 600, letterSpacing: 6 }}>INGREDIENTI</div>
            <div style={{ color: COLORS.slate, fontSize: 30, opacity: 0.75 }}>{recipe.servings}</div>
          </div>
          {recipe.ingredients.map((ing, i) => {
            const p = spring({ frame: frame - tl.rowsStart - i * ROW_GAP, fps, config: { damping: 15 } });
            return (
              <div
                key={ing.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 106,
                  gap: 26,
                  opacity: Math.min(1, p * 1.4),
                  transform: `translateX(${(1 - p) * -70}px)`,
                  borderTop: i ? "2px solid rgba(58,150,191,0.15)" : undefined,
                }}
              >
                <IngredientIcon size={84}>{ICONS[ing.icon]}</IngredientIcon>
                <div style={{ flex: 1, color: COLORS.slate, fontSize: 40, fontWeight: 500 }}>{ing.name}</div>
                <div style={{ color: COLORS.deepBlue, fontSize: 40, fontWeight: 600 }}>{ing.qty}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* Scena 2: titolo piccolo */}
      <div
        style={{
          position: "absolute",
          top: 312,
          width: "100%",
          textAlign: "center",
          color: COLORS.deepBlue,
          fontSize: 34,
          fontWeight: 500,
          opacity: interpolate(frame, [tl.listOut + 15, tl.listOut + 35], [0, 1], clamp),
        }}
      >
        {recipe.title.join(" ")}
      </div>

      {/* Padella e cuoco */}
      {frame >= tl.panIn && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="oilGrad">
              <stop offset="0%" stopColor="#F3C54E" stopOpacity={0.62} />
              <stop offset="75%" stopColor="#E9B43C" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#E2A935" stopOpacity={0.3} />
            </radialGradient>
            <filter id="steamBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={9} />
            </filter>
          </defs>

          <g transform={`translate(${tossX} ${panShiftY + tossY})`}>
            <Pan />
            <g transform={`translate(${PAN.cx} ${PAN.cy})`}>
              <circle r={oilR} fill="url(#oilGrad)" />
              {oilR > 40 && (
                <ellipse
                  cx={-oilR * 0.35}
                  cy={-oilR * 0.4}
                  rx={oilR * 0.22}
                  ry={oilR * 0.08}
                  fill="#FFFFFF"
                  opacity={0.18}
                  transform={`rotate(-30 ${-oilR * 0.35} ${-oilR * 0.4})`}
                />
              )}
              {renderOilBubbles()}
              {pastaBelow && renderPasta()}
              {renderGroup("garlic")}
              {renderGroup("zucchini")}
              {renderGroup("tomato")}
              {renderGroup("shrimp")}
              {renderSprinkle("salt")}
              {!pastaBelow && renderPasta()}
              {renderSprinkle("parsley")}
              {renderSteam()}
            </g>
          </g>
          <g transform={`translate(${panX} ${panY})`}>
            {renderPour()}
            {renderLemon()}
          </g>

          <g
            transform={`translate(${CHEF.x - chefSlide} ${CHEF.y}) scale(${CHEF.s})`}
            opacity={Math.min(1, chefIn * 1.5)}
          >
            <Chef
              rightHand={{ x: rightHand.x + chefSlide / CHEF.s, y: rightHand.y }}
              leftHand={leftHand}
              blink={blink}
              happy={happy}
              wow={wow}
              thumbsUp={thumbsUp}
              bob={bob / CHEF.s}
              tilt={tossAmt * 5 + (happy ? Math.sin((frame - tl.outro) / 9) * 3 : 0)}
            />
          </g>
        </svg>
      )}

      {/* Didascalia del passo, a destra del cuoco */}
      {step && (
        <div
          style={{
            position: "absolute",
            top: TEXT_COL.top,
            left: TEXT_COL.left,
            right: TEXT_COL.right,
            opacity: capIn * capOut,
            transform: `translateY(${(1 - capIn) * 30}px)`,
          }}
        >
          <div style={{ color: COLORS.blue, fontSize: 26, fontWeight: 600, letterSpacing: 5 }}>
            PASSO {current + 1} DI {tl.steps.length}
          </div>
          <div style={{ color: COLORS.slate, fontSize: 60, fontWeight: 600, marginTop: 6, lineHeight: 1.1 }}>
            {step.title}
          </div>
          <div style={{ color: COLORS.slate, fontSize: 36, opacity: 0.85, marginTop: 12, lineHeight: 1.3 }}>
            {step.text}
          </div>
        </div>
      )}
      {frame >= tl.stepsStart && frame < tl.outro + 12 && (
        <div
          style={{
            position: "absolute",
            top: 1620,
            left: TEXT_COL.left,
            display: "flex",
            gap: 12,
            opacity: interpolate(frame, [tl.outro, tl.outro + 12], [1, 0], clamp),
          }}
        >
          {tl.steps.map((s, i) => (
            <div
              key={i}
              style={{
                width: i === current ? 36 : 13,
                height: 13,
                borderRadius: 7,
                backgroundColor: i <= current ? COLORS.blue : "rgba(58,150,191,0.25)",
              }}
            />
          ))}
        </div>
      )}

      {/* Finale */}
      {frame >= tl.outro && (
        <div style={{ position: "absolute", top: TEXT_COL.top, left: TEXT_COL.left, right: TEXT_COL.right }}>
          <div
            style={{
              color: COLORS.slate,
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.05,
              opacity: outroText(14),
              transform: `translateY(${(1 - outroText(14)) * 30}px)`,
            }}
          >
            Buon appetito!
          </div>
          <div style={{ color: COLORS.blue, fontSize: 36, fontWeight: 500, marginTop: 16, opacity: outroText(30) }}>
            {recipe.outro}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 36,
              padding: "22px 40px",
              borderRadius: 999,
              backgroundColor: COLORS.blue,
              color: COLORS.cream,
              fontSize: 36,
              fontWeight: 600,
              opacity: Math.min(1, pill * 1.5),
              transform: `scale(${pill})`,
              transformOrigin: "left center",
              boxShadow: "0 12px 30px rgba(31,120,168,0.25)",
            }}
          >
            saporedimareraffadali.it
          </div>
        </div>
      )}

      <RecipeSounds recipe={recipe} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- suoni

const MASTER = 1.5;
const NOTES = ["note-d5", "note-fs5", "note-a5", "note-d5", "note-fs5", "note-a5", "note-b5", "note-d6", "note-b5"];

const RecipeSounds: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const tl = recipeTimeline(recipe);
  const cues: { from: number; file: string; volume: number }[] = [];
  cues.push({ from: 14, file: "pop", volume: 0.45 });
  recipe.ingredients.forEach((_, i) =>
    cues.push({ from: tl.rowsStart + i * ROW_GAP + 2, file: NOTES[i % NOTES.length], volume: 0.28 }),
  );
  cues.push({ from: tl.panIn + 10, file: "plop", volume: 0.6 });

  let sizzleFrom: number | null = null;
  for (const s of tl.steps) {
    for (const a of s.adds) {
      const g = GROUPS[a.kind];
      if (a.kind === "oil") {
        sizzleFrom = a.at + 22;
        cues.push({ from: a.at + 20, file: "sizzle-burst", volume: 0.45 });
      } else if (g) {
        for (let i = 0; i < g.count; i += 3) {
          cues.push({ from: a.at + i * g.stagger + 6, file: "plop", volume: 0.3 });
        }
        cues.push({ from: a.at + 6, file: "sizzle-burst", volume: 0.55 });
      } else if (a.kind === "pasta") {
        cues.push({ from: a.at + 7, file: "plop", volume: 0.45 });
        cues.push({ from: a.at + 9, file: "sizzle-burst", volume: 0.5 });
      } else if (a.kind === "salt" || a.kind === "parsley") {
        cues.push({ from: a.at, file: "sprinkle", volume: 0.55 });
      } else if (a.kind === "lemon") {
        cues.push({ from: a.at + 22, file: "squeeze", volume: 0.6 });
        cues.push({ from: a.at + 42, file: "sizzle-burst", volume: 0.3 });
      }
    }
    if (s.tossAt !== null) {
      cues.push({ from: s.tossAt, file: "sizzle-burst", volume: 0.5 });
      cues.push({ from: s.tossAt + 2, file: "plop", volume: 0.25 });
    }
  }
  cues.push({ from: tl.outro + 14, file: "note-b5", volume: 0.35 });
  cues.push({ from: tl.outro + 45, file: "pop", volume: 0.5 });

  return (
    <>
      {sizzleFrom !== null && (
        <Sequence from={sizzleFrom} name="SFX sizzle (padella)">
          <Audio
            src={staticFile("sfx/sizzle.wav")}
            loop
            volume={(f) =>
              interpolate(
                f + sizzleFrom!,
                [sizzleFrom!, sizzleFrom! + 20, tl.outro + 20, tl.outro + 70],
                [0, 0.35 * MASTER, 0.35 * MASTER, 0],
                clamp,
              )
            }
          />
        </Sequence>
      )}
      {cues.map((c, i) => (
        <Sequence key={i} from={c.from} name={`SFX ${c.file}`} layout="none">
          <Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume * MASTER} />
        </Sequence>
      ))}
    </>
  );
};

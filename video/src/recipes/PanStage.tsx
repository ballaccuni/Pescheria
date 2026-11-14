import React, { useMemo } from "react";
import { Easing, interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { Steam } from "./Steam";
import {
  FOOD,
  GarlicSlice,
  LemonHalf,
  Linguine,
  Mussel,
  MusselMeat,
  Pacchero,
  ParsleyFleck,
  Shrimp,
  TomatoHalf,
  ZucchiniSlice,
  ZucchiniStick,
  ZestGrater,
  makeLinguine,
} from "./ingredients";
import { firstAddIn, type AddKind, type Recipe, type Timeline } from "./types";
import { STAGE, clamp, mulberry32, type Pt } from "./utils";

// Padella vista dall'alto, con tutto quello che ci finisce dentro.

export const PAN = { cx: STAGE.cx, cy: STAGE.cy, R: 300, inner: 276, handleAngle: 130, handleLen: 150 };
const ITEM_SCALE = 1.15;

/** Punto del manico dove il cuoco tiene la padella. */
export const panHandleEnd = (() => {
  const a = (PAN.handleAngle * Math.PI) / 180;
  const d = PAN.R + PAN.handleLen;
  return { x: PAN.cx + Math.cos(a) * d, y: PAN.cy + Math.sin(a) * d };
})();

// bed: ingredienti che fanno da "letto" (non tolgono spazio a quelli sopra)
export const GROUPS: Partial<
  Record<AddKind, { count: number; minDist: number; stagger: number; seed: number; bed?: boolean }>
> = {
  garlic: { count: 6, minDist: 38, stagger: 4, seed: 3, bed: true },
  zucchini: { count: 12, minDist: 46, stagger: 3, seed: 5 },
  zucchiniSticks: { count: 36, minDist: 26, stagger: 1.3, seed: 5, bed: true },
  tomato: { count: 10, minDist: 44, stagger: 3, seed: 7 },
  shrimp: { count: 8, minDist: 50, stagger: 4, seed: 11 },
  mussels: { count: 14, minDist: 62, stagger: 3, seed: 13 },
  paccheri: { count: 20, minDist: 46, stagger: 1.5, seed: 17 },
};

/** Cozze che restano intere (le altre vengono sgusciate). */
export const MUSSELS_KEPT = 4;
const MUSSEL_OPEN_DELAY = 42;

/** Quando si apre la cozza i (per i suoni). */
export const musselOpenAt = (addAt: number, i: number) => addAt + i * 3 + MUSSEL_OPEN_DELAY + i * 2;
const CREAM = "#EBD39C";

type Placed = { x: number; y: number; rot: number; phase: number };

const placeItems = (kinds: AddKind[]) => {
  const out: Partial<Record<AddKind, Placed[]>> = {};
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
        const pool = g.bed ? list.map((p) => ({ ...p, d: g.minDist })) : occupied;
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
      if (!g.bed) occupied.push({ x: p.x, y: p.y, d: g.minDist });
    }
    out[kind] = list;
  }
  return out;
};

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
    <circle cx={PAN.cx} cy={PAN.cy} r={PAN.inner - 10} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={20} />
    <path
      d={`M ${PAN.cx - 200} ${PAN.cy - 135} A 245 245 0 0 1 ${PAN.cx - 50} ${PAN.cy - 240}`}
      stroke="rgba(255,255,255,0.10)"
      strokeWidth={13}
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

export const PanStage: React.FC<{
  recipe: Recipe;
  tl: Timeline;
  frame: number;
  fps: number;
  offset: Pt;
  tossAmt: number;
  /** intervallo di tempo di questa scena: entrano solo gli ingredienti aggiunti qui */
  range: [number, number];
}> = ({ recipe, tl, frame, fps, offset, tossAmt, range }) => {
  const allKinds = useMemo(() => recipe.steps.flatMap((s) => s.add ?? []), [recipe]);
  const placed = useMemo(() => placeItems(allKinds), [allKinds]);
  const pastaPaths = useMemo(() => makeLinguine(PAN.inner - 26, 30), []);
  const addAt = (kind: AddKind) => firstAddIn(tl, kind, range[0], range[1]);
  const shellAt = addAt("shell");

  const oilAt = addAt("oil");
  const oilR =
    oilAt === null
      ? 0
      : interpolate(frame, [oilAt + 18, oilAt + 48], [0, PAN.inner - 16], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });

  const renderGroup = (kind: AddKind) => {
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
      } else if (kind === "zucchiniSticks") {
        // ogni bastoncino è un po' diverso: lunghezza, curva, con o senza buccia
        const r = (k: number) => {
          const v = p.phase * k;
          return v - Math.floor(v);
        };
        node = <ZucchiniStick len={46 + r(1.7) * 24} curve={(r(3.1) - 0.5) * 16} skin={r(5.3) > 0.25} />;
      } else if (kind === "tomato") {
        node = <TomatoHalf />;
      } else if (kind === "shrimp") {
        node = <Shrimp cooked={interpolate(frame, [s + 15, s + 85], [0, 1], clamp)} />;
      } else if (kind === "paccheri") {
        node = <Pacchero coated={interpolate(frame, [s + 30, s + 90], [0, 1], clamp)} />;
      } else if (kind === "mussels") {
        // le cozze si aprono con il calore, una dopo l'altra
        const openAt = musselOpenAt(at, i);
        const open = frame < openAt ? 0 : spring({ frame: frame - openAt, fps, config: { damping: 9, mass: 0.5 } });
        const shelled = shellAt !== null && i < g.count - MUSSELS_KEPT;
        const sp = shelled ? interpolate(frame, [shellAt + i * 4, shellAt + i * 4 + 16], [0, 1], clamp) : 0;
        if (sp >= 1) return null;
        return (
          <g key={`${kind}${i}`} transform={`translate(${tx} ${ty}) rotate(${rot}) scale(${sc})`}>
            <g opacity={opacity * (1 - sp)}>
              <Mussel open={open} meat={sp === 0} />
            </g>
            {sp > 0 && (
              <g transform={`translate(0 ${-sp * 420}) scale(${1 + sp * 0.3})`} opacity={1 - sp * 0.6}>
                <MusselMeat />
              </g>
            )}
          </g>
        );
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
  const pastaTossAt = tl.steps.find((st) => st.adds.some((a) => a.kind === "pasta" && a.at === pastaAt))?.tossAt;
  const pastaMixAt = pastaAt === null || pastaTossAt == null ? Infinity : pastaTossAt + 6;
  const pastaBelow = frame >= pastaMixAt;
  const renderPasta = () => {
    if (pastaAt === null || frame < pastaAt) return null;
    const fall = spring({ frame: frame - pastaAt, fps, config: { damping: 12, mass: 0.8 } });
    const op = interpolate(frame - pastaAt, [0, 6], [0, 1], clamp);
    return (
      <g
        opacity={op}
        transform={`translate(${tossAmt * 10} ${-(1 - fall) * 480}) scale(${1 + (1 - fall) * 0.3}) rotate(${tossAmt * 6})`}
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

  // scorza di limone grattugiata sopra la pasta
  const zestAt = addAt("lemonZest");
  const renderZest = () => {
    if (zestAt === null || frame < zestAt) return null;
    const local = frame - zestAt;
    const enter = spring({ frame: local, fps, config: { damping: 14 } });
    const leave = interpolate(local, [68, 82], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    // il limone va avanti e indietro sulla grattugia
    const rub = interpolate(local, [16, 62], [0, 1], clamp);
    const lemonX = -70 + Math.sin(rub * Math.PI * 5) * 62;
    const gx = 30;
    const gy = -250 - (1 - enter) * 500 - leave * 600;
    const rnd = mulberry32(91);
    const shreds: React.ReactNode[] = [];
    for (let i = 0; i < 70; i++) {
      const tx = (rnd() - 0.5) * 420;
      const ty = (rnd() - 0.5) * 330;
      const startX = gx - 120 + rnd() * 160;
      const d0 = 18 + rnd() * 46;
      const len = 12 + rnd() * 10;
      const rot = rnd() * 360;
      const curl = (rnd() - 0.5) * 10;
      const color = rnd() > 0.4 ? "#FFD23F" : "#FFE680";
      const l = local - d0;
      if (l < 0) continue;
      const p = interpolate(l, [0, 14], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const x = startX + (tx - startX) * p;
      const y = gy + 16 + (ty - gy - 16) * p;
      const d = `M ${-len / 2} 0 Q 0 ${curl} ${len / 2} 0`;
      shreds.push(
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot + (1 - p) * 180})`}>
          <path d={d} stroke="#B98A0E" strokeWidth={8} strokeLinecap="round" fill="none" />
          <path d={d} stroke={color} strokeWidth={4.5} strokeLinecap="round" fill="none" />
        </g>,
      );
    }
    return (
      <>
        {shreds}
        <g transform={`translate(${gx} ${gy}) rotate(-8)`} opacity={1 - leave}>
          <ZestGrater lemonX={lemonX} />
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

  const renderPour = () => {
    if (oilAt === null) return null;
    const local = frame - oilAt;
    if (local < 0 || local > 40) return null;
    const top = interpolate(local, [0, 30, 40], [-700, -700, -60], clamp);
    const bottom = interpolate(local, [0, 14], [-700, 0], clamp);
    const w = interpolate(local, [0, 6, 30, 40], [0, 9, 9, 0], clamp);
    return <rect x={-w / 2} y={top} width={w} height={Math.max(0, bottom - top)} rx={w / 2} fill={FOOD.oil} />;
  };

  // crema di patate e cozze versata in padella
  const creamAt = addAt("cream");
  const creamR =
    creamAt === null
      ? 0
      : interpolate(frame, [creamAt + 14, creamAt + 44], [0, PAN.inner - 22], { ...clamp, easing: Easing.out(Easing.cubic) });
  const renderCreamPour = () => {
    if (creamAt === null) return null;
    const local = frame - creamAt;
    if (local < 0 || local > 42) return null;
    const top = interpolate(local, [0, 30, 42], [-700, -700, -40], clamp);
    const bottom = interpolate(local, [0, 12], [-700, 0], clamp);
    const w = interpolate(local, [0, 6, 30, 42], [0, 26, 26, 0], clamp);
    return <rect x={-w / 2} y={top} width={w} height={Math.max(0, bottom - top)} rx={w / 2} fill={CREAM} stroke="#D9B978" strokeWidth={2} />;
  };

  const steamFrom = range[0] + 100;
  const steam = interpolate(frame, [steamFrom, steamFrom + 60], [0, 1], clamp);

  return (
    <g transform={`translate(${offset.x} ${offset.y})`}>
      <defs>
        <radialGradient id="oilGrad">
          <stop offset="0%" stopColor="#F3C54E" stopOpacity={0.62} />
          <stop offset="75%" stopColor="#E9B43C" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#E2A935" stopOpacity={0.3} />
        </radialGradient>
      </defs>
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
        {creamR > 0 && (
          <g>
            <circle r={creamR} fill={CREAM} />
            <circle r={creamR} fill="none" stroke="#D9B978" strokeWidth={3} opacity={0.7} />
            <path
              d={`M ${-creamR * 0.5} ${-creamR * 0.45} Q ${-creamR * 0.1} ${-creamR * 0.62} ${creamR * 0.3} ${-creamR * 0.5}`}
              stroke="#FFFFFF"
              strokeWidth={10}
              opacity={0.3}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
        {pastaBelow && renderPasta()}
        {renderGroup("garlic")}
        {renderGroup("zucchini")}
        {renderGroup("zucchiniSticks")}
        {renderGroup("tomato")}
        {renderGroup("shrimp")}
        {renderGroup("mussels")}
        {renderGroup("paccheri")}
        {renderSprinkle("salt")}
        {!pastaBelow && renderPasta()}
        {renderSprinkle("parsley")}
        <Steam frame={frame} strength={steam} />
        {renderPour()}
        {renderCreamPour()}
        {renderLemon()}
        {renderZest()}
      </g>
    </g>
  );
};

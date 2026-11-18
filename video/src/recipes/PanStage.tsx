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
import { Squid } from "./squid";
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
  garlic: { count: 8, minDist: 38, stagger: 4, seed: 3, bed: true },
  zucchini: { count: 12, minDist: 46, stagger: 3, seed: 5 },
  zucchiniSticks: { count: 36, minDist: 26, stagger: 1.3, seed: 5, bed: true },
  tomato: { count: 9, minDist: 44, stagger: 3, seed: 7 },
  shrimp: { count: 8, minDist: 50, stagger: 4, seed: 11 },
  mussels: { count: 14, minDist: 62, stagger: 3, seed: 13 },
  paccheri: { count: 35, minDist: 46, stagger: 1, seed: 17 },
  squid: { count: 4, minDist: 0, stagger: 7, seed: 31 },
  tomatoSauce: { count: 8, minDist: 0, stagger: 3, seed: 33 },
};

/** Cozze che restano intere (le altre vengono sgusciate). */
export const MUSSELS_KEPT = 4;
const MUSSEL_OPEN_DELAY = 42;

/** Quando si apre la cozza i (per i suoni). */
export const musselOpenAt = (addAt: number, i: number) => addAt + i * 3 + MUSSEL_OPEN_DELAY + i;
const CREAM = "#EBD39C";

type Placed = { x: number; y: number; rot: number; phase: number };

/** Cozze in due cerchi: la cerniera verso il centro, così aperte non si toccano. */
export const musselRings = (outerR: number, innerR: number, outerN = 9, innerN = 5) => {
  const pts: Placed[] = [];
  const ring = (n: number, r: number, off: number) => {
    for (let k = 0; k < n; k++) {
      const a = off + (k / n) * Math.PI * 2;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, rot: (a * 180) / Math.PI, phase: k * 1.7 + r });
    }
  };
  ring(outerN, outerR, -Math.PI / 2);
  ring(innerN, innerR, -Math.PI / 2 + Math.PI / innerN);
  return pts;
};

const placeItems = (kinds: AddKind[]) => {
  const out: Partial<Record<AddKind, Placed[]>> = {};
  const occupied: { x: number; y: number; d: number }[] = [];
  for (const kind of kinds) {
    const g = GROUPS[kind];
    if (!g) continue;
    if (kind === "mussels") {
      out[kind] = musselRings(196, 92);
      continue;
    }
    if (kind === "zucchiniSticks") {
      // julienne in 6 mazzetti ordinati intorno al centro
      const pts: Placed[] = [];
      for (let b = 0; b < 6; b++) {
        const a = ((b * 60 + 30) * Math.PI) / 180;
        for (let j = 0; j < 6; j++) {
          const off = -22.5 + j * 9;
          pts.push({
            x: Math.cos(a) * (95 + off),
            y: Math.sin(a) * (95 + off),
            rot: (a * 180) / Math.PI + 90 + (j % 2 ? 3 : -3),
            phase: b * 6 + j + 0.37,
          });
        }
      }
      out[kind] = pts.slice(0, g.count);
      continue;
    }
    if (kind === "shrimp" || kind === "tomato") {
      // sul bordo un giro alternato: gamberetto, pomodorino, gamberetto...
      const isShrimp = kind === "shrimp";
      const pts: Placed[] = [];
      for (let k = 0; k < 8; k++) {
        const a = ((k * 45 + (isShrimp ? 0 : 22.5)) * Math.PI) / 180;
        pts.push({ x: Math.cos(a) * 212, y: Math.sin(a) * 212, rot: (a * 180) / Math.PI + (isShrimp ? 0 : 30), phase: k * 1.9 });
      }
      if (!isShrimp) pts.push({ x: 0, y: 0, rot: 10, phase: 3.3 }); // un pomodorino al centro
      out[kind] = pts.slice(0, g.count);
      continue;
    }
    if (kind === "garlic") {
      // fettine d'aglio in cerchio, tra le cozze
      out[kind] = Array.from({ length: g.count }, (_, k) => {
        const a = (k / g.count) * Math.PI * 2 + Math.PI / g.count;
        return { x: Math.cos(a) * 152, y: Math.sin(a) * 152, rot: (a * 180) / Math.PI + 90, phase: k * 1.3 };
      });
      continue;
    }
    if (kind === "squid") {
      // 4 calamari ripieni in fila, alternati
      out[kind] = [-168, -56, 56, 168].map((y, k) => ({ x: 0, y, rot: k % 2 ? 180 : 0, phase: k * 2.1 }));
      continue;
    }
    if (kind === "tomatoSauce") {
      // pomodorini ai lati dei calamari
      out[kind] = [-112, -37, 37, 112].flatMap((y, k) => [
        { x: -196, y, rot: k * 40, phase: k },
        { x: 196, y, rot: k * 40 + 90, phase: k + 4 },
      ]);
      continue;
    }
    if (kind === "paccheri") {
      // paccheri in cerchi ordinati sulla crema: nessuno sopra l'altro
      const pts: Placed[] = [{ x: 0, y: 0, rot: 20, phase: 0 }];
      [
        [6, 70],
        [12, 140],
        [16, 206],
      ].forEach(([n, r], ri) => {
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + ri * 0.3;
          pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, rot: (a * 180) / Math.PI + 90, phase: k + ri * 7 });
        }
      });
      out[kind] = pts;
      continue;
    }
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
        const golden = interpolate(frame, [s + 10, s + 120], [0, 0.85], clamp);
        const fizz = ((frame + i * 7) % 18) / 18;
        node = (
          <g transform="scale(1.35)">
            {frame > s + 10 && (
              <ellipse rx={22 + fizz * 6} ry={17 + fizz * 5} fill="none" stroke="#FBE7A1" strokeWidth={2} opacity={(1 - fizz) * 0.8} />
            )}
            <GarlicSlice golden={golden} />
          </g>
        );
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
      } else if (kind === "squid") {
        const cooked = interpolate(frame, [s + 20, s + 260], [0, 1], clamp);
        const sauced = sauceAt === null ? 0 : interpolate(frame, [sauceAt + 20, sauceAt + 140], [0, 1], clamp);
        node = <Squid stuffed={1} closed cooked={cooked} sauce={sauced} />;
      } else if (kind === "tomatoSauce") {
        node = <TomatoHalf />;
      } else if (kind === "paccheri") {
        node = <Pacchero coated={interpolate(frame, [s + 30, s + 90], [0, 1], clamp)} shadow />;
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

  // sugo di pomodorini, vino bianco e coperchio (calamari ripieni)
  const sauceAt = addAt("tomatoSauce");
  const sauceR =
    sauceAt === null
      ? 0
      : interpolate(frame, [sauceAt + 10, sauceAt + 60], [0, PAN.inner - 24], { ...clamp, easing: Easing.out(Easing.cubic) });
  const wineAt = addAt("wine");
  const renderWine = () => {
    if (wineAt === null) return null;
    const local = frame - wineAt;
    if (local < 0) return null;
    const top = interpolate(local, [0, 26, 36], [-700, -700, -60], clamp);
    const bottom = interpolate(local, [0, 12], [-700, 0], clamp);
    const w = interpolate(local, [0, 6, 26, 36], [0, 12, 12, 0], clamp);
    const sheen = interpolate(local, [10, 40, 90], [0, 0.45, 0], clamp);
    return (
      <>
        <circle r={interpolate(local, [10, 40], [0, PAN.inner - 20], clamp)} fill="#F3E3A0" opacity={sheen} />
        {local <= 36 && <rect x={-w / 2} y={top} width={w} height={Math.max(0, bottom - top)} rx={w / 2} fill="#F3E3A0" stroke="#E2C770" strokeWidth={1.5} />}
      </>
    );
  };
  const lidAt = addAt("lid");
  const lidStep = lidAt === null ? null : tl.steps.find((st) => st.adds.some((a) => a.kind === "lid" && a.at === lidAt)) ?? null;
  const renderLid = () => {
    if (lidAt === null || !lidStep || frame < lidAt) return null;
    const on = spring({ frame: frame - lidAt, fps, config: { damping: 15 } });
    const off = interpolate(frame, [lidStep.end - 26, lidStep.end - 8], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    if (off >= 1) return null;
    const y = -(1 - on) * 700 - off * 700;
    const drops = [
      [-120, -90],
      [-60, 130],
      [90, -140],
      [150, 60],
      [20, 40],
      [-170, 30],
      [110, 150],
    ];
    return (
      <g transform={`translate(0 ${y})`}>
        <circle r={PAN.R - 4} fill="rgba(220,236,243,0.42)" stroke={COLORS.slate} strokeWidth={10} />
        <circle r={PAN.R - 22} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={4} />
        {/* condensa sul vetro */}
        {drops.map(([x, yy], i) => (
          <circle key={i} cx={x} cy={yy} r={5 + (i % 3) * 2} fill="rgba(255,255,255,0.55)" opacity={interpolate(frame, [lidAt + 20 + i * 4, lidAt + 40 + i * 4], [0, 1], clamp)} />
        ))}
        <path d={`M ${-PAN.R * 0.55} ${-PAN.R * 0.5} A ${PAN.R * 0.75} ${PAN.R * 0.75} 0 0 1 ${-PAN.R * 0.05} ${-PAN.R * 0.74}`} stroke="#FFFFFF" strokeWidth={12} opacity={0.5} strokeLinecap="round" fill="none" />
        <circle r={34} fill={COLORS.slate} stroke="#1E3038" strokeWidth={4} />
        <circle r={14} fill="#41606F" />
      </g>
    );
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
        {sauceR > 0 && (
          <g>
            <circle r={sauceR} fill="#C8432F" opacity={0.92} />
            <circle r={sauceR} fill="none" stroke="#A9321F" strokeWidth={4} opacity={0.7} />
            <path
              d={`M ${-sauceR * 0.55} ${-sauceR * 0.45} Q ${-sauceR * 0.1} ${-sauceR * 0.64} ${sauceR * 0.32} ${-sauceR * 0.52}`}
              stroke="#FFFFFF"
              strokeWidth={9}
              opacity={0.22}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
        {renderWine()}
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
        {renderGroup("squid")}
        {renderGroup("tomatoSauce")}
        {renderSprinkle("salt")}
        {!pastaBelow && renderPasta()}
        {renderSprinkle("parsley")}
        <Steam frame={frame} strength={steam} />
        {renderPour()}
        {renderCreamPour()}
        {renderLid()}
        {renderLemon()}
        {renderZest()}
      </g>
    </g>
  );
};

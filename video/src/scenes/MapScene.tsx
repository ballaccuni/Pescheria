import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { easeOut, Tape } from "../components/Common";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Contorno semplificato della Sicilia [lon, lat].
const SICILY: [number, number][] = [
  [15.65, 38.27], [15.24, 38.22], [14.95, 38.17], [14.75, 38.16], [14.4, 38.03],
  [14.02, 38.04], [13.7, 37.98], [13.5, 38.08], [13.36, 38.13], [13.3, 38.22],
  [13.05, 38.1], [12.9, 38.04], [12.73, 38.18], [12.6, 38.06], [12.5, 38.02],
  [12.43, 37.8], [12.59, 37.65], [12.85, 37.58], [13.08, 37.5], [13.3, 37.39],
  [13.52, 37.29], [13.75, 37.18], [13.93, 37.1], [14.25, 37.06], [14.5, 36.9],
  [14.85, 36.72], [15.13, 36.69], [15.1, 36.85], [15.29, 37.07], [15.22, 37.23],
  [15.09, 37.5], [15.21, 37.73], [15.29, 37.85], [15.4, 38.0], [15.55, 38.19],
];

const LON0 = 12.2;
const LAT0 = 38.45;
const K = 330; // pixel per grado
const COS = Math.cos((37.6 * Math.PI) / 180);
const proj = (lon: number, lat: number): [number, number] => [(lon - LON0) * K * COS, (LAT0 - lat) * K];

export type MapProps = {
  pin: { label: string; lon: number; lat: number };
  tape?: string;
  /** Tratteggio animato verso un secondo punto (facoltativo). */
  route?: { label: string; lon: number; lat: number };
};

export const MapScene: React.FC<MapProps> = ({ pin, tape, route }) => {
  const frame = useCurrentFrame();
  const d = SICILY.map(([lo, la], i) => {
    const [x, y] = proj(lo, la);
    return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";
  const [px, py] = proj(pin.lon, pin.lat);
  const zoom = interpolate(frame, [0, 60], [0.92, 1.08], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pinIn = interpolate(frame, [8, 16], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.5)) });
  const pulse = (frame % 30) / 30;
  const routeP = interpolate(frame, [20, 50], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const r = route ? proj(route.lon, route.lat) : null;
  const labelIn = interpolate(frame, [14, 22], [0, 1], { ...clamp, easing: easeOut });

  return (
    <div style={{ position: "absolute", inset: 0, background: C.sea }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.4), rgba(0,0,0,0.12))" }} />
      {tape ? (
        <div style={{ position: "absolute", top: 230, width: "100%", textAlign: "center", zIndex: 2 }}>
          <Tape text={tape} dark />
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, scale: zoom, transformOrigin: `${px + 60}px ${py + 560}px` }}>
      <svg
        width={1080}
        height={1920}
        viewBox="-60 -560 1080 1920"
        style={{ position: "absolute", inset: 0 }}
      >
        <path d={d} fill={C.gold} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        {r ? (
          <path
            d={`M${px},${py} Q${(px + r[0]) / 2 + 60},${(py + r[1]) / 2 - 80} ${r[0]},${r[1]}`}
            fill="none"
            stroke={C.ink}
            strokeWidth={6}
            strokeDasharray="14 12"
            pathLength={1000}
            strokeDashoffset={0}
            style={{ clipPath: "none", opacity: routeP > 0 ? 1 : 0 }}
            mask="url(#routeMask)"
          />
        ) : null}
        {r ? (
          <defs>
            <mask id="routeMask">
              <path
                d={`M${px},${py} Q${(px + r[0]) / 2 + 60},${(py + r[1]) / 2 - 80} ${r[0]},${r[1]}`}
                fill="none"
                stroke="white"
                strokeWidth={14}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - routeP}
              />
            </mask>
          </defs>
        ) : null}
        <circle cx={px} cy={py} r={18 + pulse * 50} fill="none" stroke={C.ink} strokeWidth={4} opacity={(1 - pulse) * pinIn} />
        <circle cx={px} cy={py} r={18 * pinIn} fill={C.ink} />
        <circle cx={px} cy={py} r={7 * pinIn} fill={C.paper} />
        {r ? <circle cx={r[0]} cy={r[1]} r={12 * routeP} fill={C.red} /> : null}
      </svg>
      {/* Etichette (in HTML, posizionate sulle coordinate proiettate) */}
      <PinLabel x={px} y={py} text={pin.label} t={labelIn} />
      {r && route ? <PinLabel x={r[0]} y={r[1]} text={route.label} t={routeP} below /> : null}
      </div>
    </div>
  );
};

const PinLabel: React.FC<{ x: number; y: number; text: string; t: number; below?: boolean }> = ({ x, y, text, t, below }) => {
  const left = x + 60;
  const top = y + 560;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: below ? top + 40 : top - 110,
        translate: "-50% 0",
        background: C.ink,
        color: C.paper,
        fontFamily: F.display,
        fontSize: 52,
        padding: "4px 22px",
        textTransform: "uppercase",
        opacity: t,
        scale: interpolate(t, [0, 1], [1.3, 1]),
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

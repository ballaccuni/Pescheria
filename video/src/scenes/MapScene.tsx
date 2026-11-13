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
  [13.527, 37.287], [13.75, 37.18], [13.93, 37.1], [14.25, 37.06], [14.5, 36.9],
  [14.85, 36.72], [15.13, 36.69], [15.1, 36.85], [15.29, 37.07], [15.22, 37.23],
  [15.09, 37.5], [15.21, 37.73], [15.29, 37.85], [15.4, 38.0], [15.55, 38.19],
];

// Proiezione "mondo" (pixel a zoom 1).
const K = 330;
const COS = Math.cos((37.6 * Math.PI) / 180);
const world = (lon: number, lat: number): [number, number] => [lon * K * COS, -lat * K];

// Centro dello schermo su cui si inquadra la camera.
const SCREEN_CX = 540;
const SCREEN_CY = 830;

type Place = { label: string; lon: number; lat: number };

export type MapProps = {
  /** Punto di arrivo (sempre visibile). */
  pin: Place;
  tape?: string;
  /** Punto di partenza: se presente, la camera zooma e un furgone percorre la tratta. */
  route?: Place & { via?: [number, number][] };
};

/** Curva morbida (Catmull-Rom) campionata in tanti punti. */
const smooth = (pts: [number, number][], steps = 16): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

/** Punto e direzione a una certa frazione della lunghezza della polilinea. */
const along = (pts: [number, number][], p: number) => {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const target = p * lens[lens.length - 1];
  let i = 1;
  while (i < pts.length - 1 && lens[i] < target) i++;
  const seg = lens[i] - lens[i - 1] || 1;
  const k = Math.min(1, Math.max(0, (target - lens[i - 1]) / seg));
  const a = pts[i - 1];
  const b = pts[i];
  const pos: [number, number] = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return { pos, angle, done: [...pts.slice(0, i), pos] as [number, number][] };
};

const toD = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export const MapScene: React.FC<MapProps> = ({ pin, tape, route }) => {
  const frame = useCurrentFrame();

  // --- Camera: dall'isola intera fino alla tratta -------------------------
  const islandCenter = world(14.05, 37.5);
  const roadLonLat: [number, number][] = route
    ? [[route.lon, route.lat], ...(route.via ?? []), [pin.lon, pin.lat]]
    : [[pin.lon, pin.lat]];
  const roadWorld = smooth(roadLonLat.map(([lo, la]) => world(lo, la)));
  const xs = roadWorld.map((p) => p[0]);
  const ys = roadWorld.map((p) => p[1]);
  const routeCenter: [number, number] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const routeH = Math.max(...ys) - Math.min(...ys);
  const zoomMax = route ? Math.min(16, 520 / Math.max(routeH, 1)) : 1.15;

  const zp = interpolate(frame, [22, 62], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const Z = Math.exp(interpolate(zp, [0, 1], [0, Math.log(zoomMax)]));
  // La camera segue il punto fisso dello zoom: interpolando il focus in modo
  // coerente con lo zoom esponenziale si ottiene un "volo" fluido.
  const w = Z === 1 ? 0 : (1 - 1 / Z) / (1 - 1 / zoomMax);
  const focus: [number, number] = [
    islandCenter[0] + (routeCenter[0] - islandCenter[0]) * w,
    islandCenter[1] + (routeCenter[1] - islandCenter[1]) * w,
  ];
  const scr = ([x, y]: [number, number]): [number, number] => [SCREEN_CX + (x - focus[0]) * Z, SCREEN_CY + (y - focus[1]) * Z];

  // --- Elementi ----------------------------------------------------------
  const island = toD(SICILY.map(([lo, la]) => scr(world(lo, la)))) + " Z";
  const roadScreen = roadWorld.map(scr);
  const dest = scr(world(pin.lon, pin.lat));
  const origin = route ? scr(world(route.lon, route.lat)) : null;

  const destIn = interpolate(frame, [6, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.5)) });
  const originIn = interpolate(frame, [56, 64], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.5)) });
  const roadIn = interpolate(frame, [58, 70], [0, 1], clamp);
  const drive = interpolate(frame, [70, 170], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const car = along(roadScreen, drive);
  const arrived = interpolate(frame, [168, 176], [0, 1], { ...clamp, easing: Easing.out(Easing.back(3)) });
  const pulse = (frame % 30) / 30;
  const seaIn = interpolate(frame, [62, 74], [0, 1], clamp);

  return (
    <div style={{ position: "absolute", inset: 0, background: C.sea, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.4), rgba(0,0,0,0.12))" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={island} fill={C.gold} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

        {route && origin ? (
          <>
            {/* strada (tratta completa, chiara) */}
            <path d={toD(roadScreen)} fill="none" stroke="rgba(20,20,20,0.25)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={roadIn} />
            {/* tratta percorsa, segnata dietro al furgone */}
            {drive > 0 ? (
              <path d={toD(car.done)} fill="none" stroke={C.ink} strokeWidth={9} strokeDasharray="22 14" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            {/* partenza */}
            <circle cx={origin[0]} cy={origin[1]} r={20 * originIn} fill={C.red} stroke={C.paper} strokeWidth={5} />
          </>
        ) : null}

        {/* arrivo */}
        <circle cx={dest[0]} cy={dest[1]} r={18 + pulse * 50} fill="none" stroke={C.ink} strokeWidth={4} opacity={(1 - pulse) * destIn} />
        <circle cx={dest[0]} cy={dest[1]} r={(18 + arrived * 6) * destIn} fill={C.ink} />
        <circle cx={dest[0]} cy={dest[1]} r={7 * destIn} fill={C.paper} />

        {/* furgone del pesce */}
        {route && frame >= 62 ? (
          <g transform={`translate(${car.pos[0]} ${car.pos[1]}) rotate(${car.angle}) scale(${interpolate(frame, [62, 70], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})`}>
            <Van />
          </g>
        ) : null}
      </svg>

      {/* Etichette in HTML, in coordinate schermo */}
      {route && origin ? (
        <>
          <Label x={origin[0]} y={origin[1]} text={route.label} t={originIn} below dark={false} />
          <div
            style={{
              position: "absolute",
              left: Math.max(330, origin[0] - 60),
              top: origin[1] + 460,
              translate: "-50% -50%",
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "0.3em",
              color: "rgba(20,20,20,0.45)",
              opacity: seaIn,
              whiteSpace: "nowrap",
            }}
          >
            MAR MEDITERRANEO
          </div>
        </>
      ) : null}
      <Label x={dest[0]} y={dest[1]} text={pin.label} t={interpolate(frame, [12, 20], [0, 1], { ...clamp, easing: easeOut })} />

      {tape ? (
        <div style={{ position: "absolute", top: 230, width: "100%", textAlign: "center" }}>
          <Tape text={tape} dark />
        </div>
      ) : null}
    </div>
  );
};

/** Furgone frigo visto dall'alto, orientato verso destra (asse x). */
const Van: React.FC = () => (
  <g>
    <ellipse cx={4} cy={6} rx={50} ry={26} fill="rgba(0,0,0,0.22)" />
    {/* cassone frigo */}
    <rect x={-50} y={-24} width={70} height={48} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    {/* pesce disegnato sul tetto */}
    <path d="M-38,0 C-30,-12 -10,-12 0,0 C-10,12 -30,12 -38,0 Z M0,0 L10,-9 L10,9 Z" fill={C.gold} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <circle cx={-30} cy={-2} r={2.5} fill={C.ink} />
    {/* cabina */}
    <rect x={22} y={-21} width={30} height={42} rx={9} fill={C.red} stroke={C.ink} strokeWidth={4} />
    {/* parabrezza */}
    <rect x={38} y={-15} width={9} height={30} rx={3} fill="#9CC7D6" stroke={C.ink} strokeWidth={2} />
  </g>
);

const Label: React.FC<{ x: number; y: number; text: string; t: number; below?: boolean; dark?: boolean }> = ({
  x,
  y,
  text,
  t,
  below,
  dark = true,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: below ? y + 44 : y - 116,
      translate: "-50% 0",
      background: dark ? C.ink : C.paper,
      color: dark ? C.paper : C.ink,
      border: dark ? "none" : `4px solid ${C.ink}`,
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

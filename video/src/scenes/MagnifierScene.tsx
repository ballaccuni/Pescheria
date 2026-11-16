import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../theme";
import { easeOut, Tape } from "../components/Common";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type MagnifierStop = {
  /** Punto del pesce su cui si ferma la lente (coordinate del disegno, 0–1080). */
  x: number;
  y: number;
  title: string;
  text: string;
};

export type MagnifierProps = {
  tape?: string;
  stops: MagnifierStop[];
  /** Quanto ingrandisce la lente (default 2.4). */
  zoom?: number;
};

const LENS_R = 165;
const SVG_TOP = 180; // posizione verticale del disegno sullo schermo

// Contorno del corpo, riusato per ritaglio delle squame.
const BODY =
  "M170,560 C260,380 520,330 700,420 C790,465 840,520 862,560 C840,600 790,655 700,700 C520,790 260,740 170,560 Z";

/** Orata stilizzata, in tinta con la palette del video. */
const Fish: React.FC<{ id: string }> = ({ id }) => {
  const scales: string[] = [];
  for (let x = 400; x <= 830; x += 44) {
    for (let y = 440; y <= 700; y += 38) {
      const ox = ((y - 440) / 38) % 2 ? 22 : 0;
      scales.push(`M${x + ox - 16},${y} A18,18 0 0 0 ${x + ox + 16},${y}`);
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7F939A" />
          <stop offset="0.45" stopColor="#C4CED1" />
          <stop offset="1" stopColor="#F2F4F3" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      {/* coda e pinne (dietro al corpo) */}
      <path d="M845,560 L975,440 C955,515 955,605 975,680 Z" fill="#8FA2A8" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M370,400 C440,300 610,315 705,425 Z" fill="#8FA2A8" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M440,738 C480,805 560,805 575,742 Z" fill="#8FA2A8" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      {/* corpo */}
      <path d={BODY} fill={`url(#${id}-body)`} stroke={C.ink} strokeWidth={7} />
      <g clipPath={`url(#${id}-clip)`}>
        {scales.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(20,20,20,0.18)" strokeWidth={3} />
        ))}
        {/* riflesso lucido */}
        <path d="M300,470 C430,420 600,420 760,470" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={14} strokeLinecap="round" />
      </g>
      {/* linea laterale */}
      <path d="M345,520 C500,480 660,500 840,555" fill="none" stroke="rgba(20,20,20,0.35)" strokeWidth={4} strokeDasharray="10 9" />
      {/* branchie: fessura rossa + opercolo */}
      <path d="M335,462 C362,530 362,600 330,668" fill="none" stroke={C.red} strokeWidth={16} strokeLinecap="round" />
      <path d="M350,440 C388,520 388,610 345,692" fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      {/* pinna pettorale */}
      <path d="M392,600 C440,612 480,640 492,682 C440,672 405,650 392,600 Z" fill="#9FB0B5" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      {/* sopracciglio dorato tipico dell'orata */}
      <path d="M222,486 C255,462 300,460 330,476" fill="none" stroke={C.gold} strokeWidth={15} strokeLinecap="round" />
      {/* occhio */}
      <circle cx={268} cy={528} r={32} fill="#FFFFFF" stroke={C.ink} strokeWidth={6} />
      <circle cx={272} cy={530} r={18} fill={C.ink} />
      <circle cx={264} cy={522} r={6} fill="#FFFFFF" />
      {/* bocca */}
      <path d="M172,566 C185,574 196,576 210,573" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

export const MagnifierScene: React.FC<MagnifierProps> = ({ tape, stops, zoom = 2.4 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // --- Percorso della lente: entra da destra, poi sosta su ogni punto ---
  const enter = 22;
  const move = 16;
  const slot = (durationInFrames - enter) / stops.length;
  const start = { x: 1250, y: 900 };
  let lx = start.x;
  let ly = start.y;
  let activeIdx = -1;
  let activeT = 0;
  stops.forEach((s, i) => {
    const t0 = i === 0 ? 0 : enter + i * slot - move;
    const t1 = i === 0 ? enter : enter + i * slot;
    const prev = i === 0 ? start : stops[i - 1];
    const p = interpolate(frame, [t0, t1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    if (frame >= t0) {
      lx = prev.x + (s.x - prev.x) * p;
      ly = prev.y + (s.y - prev.y) * p;
    }
    if (frame >= t1 - 4) {
      activeIdx = i;
      activeT = frame - (t1 - 4);
    }
  });
  // leggero tremolio "a mano"
  lx += Math.sin(frame / 9) * 5;
  ly += Math.cos(frame / 11) * 4;

  const fishIn = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: easeOut });
  const lensTilt = interpolate(frame, [0, enter], [-18, 0], { ...clamp, easing: easeOut });
  const active = activeIdx >= 0 ? stops[activeIdx] : null;
  const labelT = interpolate(activeT, [0, 8], [0, 1], { ...clamp, easing: easeOut });
  const ring = interpolate(activeT, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {tape ? (
        <div style={{ position: "absolute", top: 230, width: "100%", textAlign: "center", zIndex: 2 }}>
          <Tape text={tape} dark />
        </div>
      ) : null}

      <svg width={1080} height={1100} viewBox="0 0 1080 1100" style={{ position: "absolute", top: SVG_TOP, left: 0, overflow: "visible" }}>
        <defs>
          <clipPath id="lens-clip">
            <circle cx={lx} cy={ly} r={LENS_R} />
          </clipPath>
        </defs>

        {/* pesce a grandezza normale */}
        <g style={{ opacity: fishIn, scale: interpolate(fishIn, [0, 1], [0.9, 1]), transformOrigin: "540px 560px" }}>
          <Fish id="fish-base" />
        </g>

        {/* interno della lente: stesso pesce, ingrandito attorno al centro della lente */}
        <g clipPath="url(#lens-clip)">
          <circle cx={lx} cy={ly} r={LENS_R} fill="#F6F2EA" />
          <g transform={`translate(${lx} ${ly}) scale(${zoom}) translate(${-lx} ${-ly})`}>
            <Fish id="fish-zoom" />
          </g>
          {/* riflesso del vetro */}
          <path
            d={`M${lx - LENS_R * 0.62},${ly - LENS_R * 0.2} A${LENS_R * 0.66},${LENS_R * 0.66} 0 0 1 ${lx - LENS_R * 0.1},${ly - LENS_R * 0.64}`}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={14}
            strokeLinecap="round"
          />
        </g>

        {/* anello che "conferma" il punto controllato */}
        {active ? (
          <circle cx={lx} cy={ly} r={LENS_R + 14 + ring * 40} fill="none" stroke={C.gold} strokeWidth={8} opacity={1 - ring} />
        ) : null}

        {/* montatura + manico */}
        <g transform={`translate(${lx} ${ly}) rotate(${lensTilt})`}>
          <g transform="rotate(45)">
            <rect x={LENS_R + 4} y={-16} width={44} height={32} rx={6} fill={C.ink} />
            <rect x={LENS_R + 44} y={-24} width={170} height={48} rx={20} fill={C.gold} stroke={C.ink} strokeWidth={7} />
          </g>
          <circle cx={0} cy={0} r={LENS_R} fill="none" stroke={C.ink} strokeWidth={18} />
          <circle cx={0} cy={0} r={LENS_R - 9} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        </g>
      </svg>

      {/* nome del punto controllato */}
      {active ? (
        <div
          key={activeIdx}
          style={{
            position: "absolute",
            top: 1040,
            left: 80,
            right: 80,
            textAlign: "center",
            opacity: labelT,
            translate: `0px ${interpolate(labelT, [0, 1], [24, 0])}px`,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontFamily: F.display,
              fontSize: 96,
              lineHeight: 1,
              textTransform: "uppercase",
              background: C.ink,
              color: C.gold,
              padding: "6px 26px",
              rotate: "-2deg",
            }}
          >
            {activeIdx + 1}. {active.title}
          </span>
          <div
            style={{
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: C.ink,
              marginTop: 18,
            }}
          >
            {active.text}
          </div>
        </div>
      ) : null}
    </div>
  );
};

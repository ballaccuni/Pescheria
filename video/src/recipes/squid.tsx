import React from "react";
import { COLORS } from "../LogoAnimation";
import { mix } from "./ingredients";

// Calamari e ingredienti dei calamari ripieni, in stile piatto con i colori del logo.

export const SQUID = {
  raw: "#F6E9E4",
  cooked: "#F1DCCB",
  sauce: "#E8A98F",
  fin: "#EBD5CF",
  speck: "#A86A84",
  line: "#C9A69C",
  stuffing: "#D9B36C",
};

// macchioline del calamaro (sempre uguali)
const SPECKS: [number, number, number][] = (() => {
  let s = 11;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: 46 }, () => {
    const x = -84 + rnd() * 160;
    const half = 30 - Math.abs(x + 10) * 0.12;
    return [x, (rnd() - 0.5) * 2 * half * 0.85, 1.2 + rnd() * 2.4] as [number, number, number];
  });
})();

const MANTLE = "M -96 -27 C -60 -37 38 -35 80 -18 L 102 0 L 80 18 C 38 35 -60 37 -96 27 Q -103 0 -96 -27 Z";

/**
 * Calamaro visto dall'alto: punta con le pinne a destra, apertura a sinistra.
 * stuffed: quanto è pieno (0..1). closed: stuzzicadenti. cooked: 0..1. sauce: colore del sugo 0..1.
 */
export const Squid: React.FC<{ stuffed?: number; closed?: boolean; cooked?: number; sauce?: number }> = ({
  stuffed = 0,
  closed = false,
  cooked = 0,
  sauce = 0,
}) => {
  const body = mix(mix(SQUID.raw, SQUID.cooked, cooked), SQUID.sauce, sauce * 0.55);
  const fin = mix(mix(SQUID.fin, "#E6C8B4", cooked), SQUID.sauce, sauce * 0.5);
  const swell = 1 + stuffed * 0.14;
  return (
    <g>
      {/* pinne */}
      <path d="M 34 -26 L 104 -48 Q 116 0 104 48 L 34 26 Z" fill={fin} stroke={SQUID.line} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 50 -24 L 98 -38 M 50 24 L 98 38" stroke={mix(SQUID.line, "#D7B5A8", 0.4)} strokeWidth={2} opacity={0.7} />
      <g transform={`scale(1 ${swell})`}>
        <path d={MANTLE} fill={body} stroke={SQUID.line} strokeWidth={2.5} strokeLinejoin="round" />
        {SPECKS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={SQUID.speck} opacity={0.55 - cooked * 0.25} />
        ))}
        <path d="M -80 -12 C -40 -20 20 -19 60 -8" stroke="#FFFFFF" strokeWidth={6} opacity={0.35 - cooked * 0.15} strokeLinecap="round" fill="none" />
        {/* apertura: si vede il ripieno */}
        {stuffed > 0.05 && (
          <g>
            <ellipse cx={-96} cy={0} rx={6} ry={23} fill={SQUID.stuffing} />
            <circle cx={-96} cy={-8} r={2.4} fill="#3E8E41" />
            <circle cx={-95} cy={7} r={2.4} fill="#3E8E41" />
          </g>
        )}
      </g>
      {/* stuzzicadenti che chiude l'apertura */}
      {closed && <path d="M -106 -34 L -84 34" stroke="#D9BE8E" strokeWidth={5} strokeLinecap="round" />}
      {closed && <path d="M -106 -34 L -84 34" stroke="#F0DDB6" strokeWidth={2} strokeLinecap="round" />}
    </g>
  );
};

/** Fetta di calamaro ripieno (sezione): anello bianco con il ripieno dentro. */
export const SquidSlice: React.FC<{ sauce?: number }> = ({ sauce = 0.4 }) => (
  <g>
    <ellipse rx={34} ry={27} fill={mix(SQUID.cooked, SQUID.sauce, sauce * 0.6)} stroke={SQUID.line} strokeWidth={2.5} />
    <ellipse rx={27} ry={20} fill={SQUID.stuffing} />
    {[
      [-12, -6, "#3E8E41"],
      [6, -10, "#C99A4E"],
      [12, 6, "#3E8E41"],
      [-4, 9, "#F3E6B0"],
      [-16, 6, "#C99A4E"],
      [16, -4, "#E9B8C5"],
      [0, 0, "#F3E6B0"],
    ].map(([x, y, c], i) => (
      <circle key={i} cx={x as number} cy={y as number} r={3} fill={c as string} />
    ))}
  </g>
);

/** Pezzetto di tentacolo tritato. */
export const TentacleBit: React.FC = () => (
  <g>
    <path d="M -7 2 Q 0 -8 7 2" stroke="#B9768E" strokeWidth={6.5} strokeLinecap="round" fill="none" />
    <path d="M -7 2 Q 0 -8 7 2" stroke="#E2A6B6" strokeWidth={3.5} strokeLinecap="round" fill="none" />
  </g>
);

/** Calamaro (icona). */
export const SquidIcon: React.FC = () => (
  <g transform="rotate(-25) scale(0.38)">
    <Squid />
  </g>
);

/** Pecorino grattugiato (icona). */
export const PecorinoIcon: React.FC = () => (
  <g>
    <path d="M -34 14 L 0 -30 L 34 14 Z" fill="#F3E6B0" stroke={COLORS.slate} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M -34 14 L 34 14 L 30 26 L -30 26 Z" fill="#E2CF8E" stroke={COLORS.slate} strokeWidth={2.5} strokeLinejoin="round" />
    {[
      [-8, 0],
      [8, -8],
      [4, 8],
      [-14, 10],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={2.6} fill="#E2CF8E" />
    ))}
  </g>
);

/** Uovo (icona). */
export const EggIcon: React.FC = () => (
  <g>
    <ellipse cx={0} cy={2} rx={26} ry={32} fill="#FBF6EC" stroke={COLORS.slate} strokeWidth={2.5} />
    <ellipse cx={-8} cy={-10} rx={7} ry={10} fill="#FFFFFF" opacity={0.8} />
  </g>
);

/** Bicchiere di vino bianco (icona). */
export const WineIcon: React.FC = () => (
  <g>
    <path d="M -20 -34 L 20 -34 Q 22 0 0 8 Q -22 0 -20 -34 Z" fill="rgba(214,236,246,0.6)" stroke={COLORS.slate} strokeWidth={2.5} />
    <path d="M -18 -14 L 18 -14 Q 16 4 0 7 Q -16 4 -18 -14 Z" fill="#F3E3A0" />
    <path d="M 0 8 L 0 30 M -14 32 L 14 32" stroke={COLORS.slate} strokeWidth={3} strokeLinecap="round" />
  </g>
);

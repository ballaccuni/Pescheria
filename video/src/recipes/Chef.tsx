import React from "react";
import { staticFile } from "remotion";
import { COLORS } from "../LogoAnimation";

// Cuoco in stile illustrazione piatta, con i colori del logo.
// Coordinate locali: (0,0) = base del collo. Da usare dentro un <svg>.

const SKIN = "#F6CDA8";
const SKIN_SHADE = "#E9B58F";
const HAIR = "#4B3326";
const HAIR_LIGHT = "#6E4B37";
const OUTLINE = COLORS.slate;
const WHITE = "#FFFFFF";
const CLOTH_SHADE = "#E6EEF2";
const LINE = 4;

type Pt = { x: number; y: number };

const sub = (a: Pt, b: Pt) => ({ x: a.x - b.x, y: a.y - b.y });
const len = (a: Pt) => Math.hypot(a.x, a.y) || 1;

/** Cinematica inversa a due segmenti: trova il gomito. */
const elbowFor = (s: Pt, h: Pt, l1: number, l2: number, side: 1 | -1): Pt => {
  const v = sub(h, s);
  const d = Math.min(len(v), l1 + l2 - 1);
  const ux = v.x / len(v);
  const uy = v.y / len(v);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return { x: s.x + ux * a - uy * hh * side, y: s.y + uy * a + ux * hh * side };
};

const Hand: React.FC<{ at: Pt; dir: Pt; thumbsUp?: boolean; mirror?: boolean }> = ({
  at,
  dir,
  thumbsUp,
  mirror,
}) => {
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  if (thumbsUp) {
    return (
      <g transform={`translate(${at.x} ${at.y})`}>
        <rect x={-22} y={-14} width={44} height={40} rx={14} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
        <path d="M -18 -2 L 14 -2 M -18 10 L 14 10" stroke={SKIN_SHADE} strokeWidth={3} strokeLinecap="round" />
        <rect x={-8} y={-46} width={18} height={40} rx={9} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
      </g>
    );
  }
  const m = mirror ? -1 : 1;
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${ang})`}>
      <ellipse cx={4} cy={0} rx={25} ry={21} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
      <path d={`M 14 ${-12 * m} Q 24 ${-2 * m} 14 ${10 * m}`} stroke={SKIN_SHADE} strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse
        cx={-2}
        cy={-18 * m}
        rx={13}
        ry={8}
        transform={`rotate(${-35 * m} -2 ${-18 * m})`}
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth={LINE}
      />
    </g>
  );
};

const Arm: React.FC<{ shoulder: Pt; hand: Pt; outward: 1 | -1; thumbsUp?: boolean }> = ({
  shoulder,
  hand,
  outward,
  thumbsUp,
}) => {
  const L1 = 102;
  const L2 = 102;
  // il gomito va sempre verso l'esterno del corpo
  const e1 = elbowFor(shoulder, hand, L1, L2, 1);
  const e2 = elbowFor(shoulder, hand, L1, L2, -1);
  const e = (e1.x - e2.x) * outward >= 0 ? e1 : e2;
  const side: 1 | -1 = e === e1 ? 1 : -1;
  const f = sub(hand, e);
  const fl = len(f);
  const u = { x: f.x / fl, y: f.y / fl };
  const wrist = { x: hand.x - u.x * 22, y: hand.y - u.y * 22 };
  const cuffA = { x: hand.x - u.x * 58, y: hand.y - u.y * 58 };
  const sleeve = `M ${shoulder.x} ${shoulder.y} L ${e.x} ${e.y} L ${cuffA.x} ${cuffA.y}`;
  return (
    <g>
      {/* avambraccio scoperto (manica arrotolata) */}
      <path d={`M ${cuffA.x} ${cuffA.y} L ${wrist.x} ${wrist.y}`} stroke={OUTLINE} strokeWidth={34} strokeLinecap="round" />
      <path d={`M ${cuffA.x} ${cuffA.y} L ${wrist.x} ${wrist.y}`} stroke={SKIN} strokeWidth={26} strokeLinecap="round" />
      {/* manica */}
      <path d={sleeve} stroke={OUTLINE} strokeWidth={54} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={sleeve} stroke={WHITE} strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path
        d={`M ${e.x} ${e.y} L ${cuffA.x} ${cuffA.y}`}
        stroke={CLOTH_SHADE}
        strokeWidth={14}
        strokeLinecap="round"
        transform={`translate(${-u.y * 12 * side} ${u.x * 12 * side})`}
      />
      {/* risvolto */}
      <path
        d={`M ${cuffA.x - u.x * 6} ${cuffA.y - u.y * 6} L ${cuffA.x + u.x * 8} ${cuffA.y + u.y * 8}`}
        stroke={OUTLINE}
        strokeWidth={58}
        strokeLinecap="round"
      />
      <path
        d={`M ${cuffA.x - u.x * 6} ${cuffA.y - u.y * 6} L ${cuffA.x + u.x * 8} ${cuffA.y + u.y * 8}`}
        stroke={COLORS.blue}
        strokeWidth={50}
        strokeLinecap="round"
      />
      <Hand at={hand} dir={u} thumbsUp={thumbsUp} mirror={outward === -1} />
    </g>
  );
};

const Eye: React.FC<{ x: number; blink: number; happy: number; look: Pt }> = ({ x, blink, happy, look }) => {
  const y = -112;
  if (happy > 0.5) {
    return (
      <path d={`M ${x - 12} ${y + 3} Q ${x} ${y - 13} ${x + 12} ${y + 3}`} stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" fill="none" />
    );
  }
  if (blink > 0.5) {
    return <path d={`M ${x - 11} ${y} Q ${x} ${y + 6} ${x + 11} ${y}`} stroke={OUTLINE} strokeWidth={4.5} strokeLinecap="round" fill="none" />;
  }
  return (
    <g>
      <ellipse cx={x} cy={y} rx={11.5} ry={13.5} fill={WHITE} stroke={OUTLINE} strokeWidth={3.5} />
      <circle cx={x + look.x} cy={y + 2 + look.y} r={7} fill="#3A2A20" />
      <circle cx={x + look.x + 2.5} cy={y - 1.5 + look.y} r={2.4} fill={WHITE} />
    </g>
  );
};

export const Chef: React.FC<{
  rightHand: Pt;
  leftHand: Pt;
  blink: number;
  happy: number;
  wow: number;
  thumbsUp?: boolean;
  /** inclinazione della testa in gradi */
  tilt?: number;
}> = ({ rightHand, leftHand, blink, happy, wow, thumbsUp, tilt = 0 }) => {
  const look = { x: 3, y: -2 };
  const browLift = wow * 7;
  return (
    <g>
      <defs>
        <clipPath id="chefTorso">
          <path d="M -122 36 C -168 46 -188 96 -192 170 L -200 640 L 200 640 L 192 170 C 188 96 168 46 122 36 Z" />
        </clipPath>
        <filter id="chefWhite">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
        </filter>
      </defs>

      {/* giacca */}
      <path
        d="M -122 36 C -168 46 -188 96 -192 170 L -200 640 L 200 640 L 192 170 C 188 96 168 46 122 36 Z"
        fill={WHITE}
        stroke={OUTLINE}
        strokeWidth={LINE + 1}
      />
      <g clipPath="url(#chefTorso)">
        <rect x={110} y={0} width={120} height={700} fill={CLOTH_SHADE} />
        {/* lembo del doppio petto */}
        <path d="M -40 40 C 10 60 60 70 72 120 L 72 330" stroke={OUTLINE} strokeWidth={3.5} fill="none" />
        {/* grembiule */}
        <path d="M -200 330 L 200 330 L 200 640 L -200 640 Z" fill={COLORS.blue} />
        <path d="M -200 330 L 200 330" stroke={OUTLINE} strokeWidth={LINE} />
        <rect x={-200} y={322} width={400} height={16} fill={COLORS.deepBlue} />
        <path d="M -150 380 L -150 640 M 150 380 L 150 640" stroke="rgba(255,255,255,0.18)" strokeWidth={4} />
        <image
          href={staticFile("logo/fish.png")}
          x={-62}
          y={410}
          width={124}
          height={52}
          filter="url(#chefWhite)"
        />
      </g>
      {/* bottoni */}
      {[110, 175, 240, 300].map((y) => (
        <g key={y}>
          <circle cx={-14} cy={y} r={8.5} fill={COLORS.deepBlue} stroke={OUTLINE} strokeWidth={2} />
          <circle cx={100} cy={y} r={8.5} fill={COLORS.deepBlue} stroke={OUTLINE} strokeWidth={2} />
        </g>
      ))}

      {/* collo */}
      <rect x={-26} y={-34} width={52} height={50} rx={12} fill={SKIN_SHADE} stroke={OUTLINE} strokeWidth={LINE} />
      {/* colletto */}
      <path d="M -62 30 Q 0 60 62 30 L 56 4 Q 0 30 -56 4 Z" fill={WHITE} stroke={OUTLINE} strokeWidth={LINE} />
      {/* foulard */}
      <path d="M -40 20 L 40 20 L 6 74 L -6 74 Z" fill={COLORS.blue} stroke={OUTLINE} strokeWidth={3} />
      <ellipse cx={0} cy={22} rx={20} ry={14} fill={COLORS.deepBlue} stroke={OUTLINE} strokeWidth={3} />

      <g transform={`rotate(${tilt} 0 -40)`}>
        {/* orecchie */}
        {[-1, 1].map((sx) => (
          <g key={sx}>
            <ellipse cx={sx * 70} cy={-100} rx={14} ry={19} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
            <path d={`M ${sx * 72} ${-110} Q ${sx * 64} ${-100} ${sx * 72} ${-90}`} stroke={SKIN_SHADE} strokeWidth={3.5} fill="none" />
          </g>
        ))}
        {/* viso */}
        <path
          d="M -68 -150 C -72 -95 -66 -50 -38 -28 C -20 -14 20 -14 38 -28 C 66 -50 72 -95 68 -150 Z"
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth={LINE}
        />
        <path d="M 40 -32 C 62 -52 68 -90 66 -140 L 68 -150 C 72 -95 66 -50 38 -28 Z" fill={SKIN_SHADE} opacity={0.6} />
        {/* basette */}
        <path d="M -66 -152 L -54 -152 L -56 -108 Q -62 -112 -66 -120 Z" fill={HAIR} />
        <path d="M 66 -152 L 54 -152 L 56 -108 Q 62 -112 66 -120 Z" fill={HAIR} />
        {/* guance */}
        <ellipse cx={-42} cy={-76} rx={13} ry={9} fill="#F19A86" opacity={0.45} />
        <ellipse cx={42} cy={-76} rx={13} ry={9} fill="#F19A86" opacity={0.45} />

        <Eye x={-26} blink={blink} happy={happy} look={look} />
        <Eye x={26} blink={blink} happy={happy} look={look} />
        {/* sopracciglia */}
        <path d={`M -40 ${-134 - browLift} Q -26 ${-144 - browLift} -12 ${-136 - browLift}`} stroke={HAIR} strokeWidth={7} strokeLinecap="round" fill="none" />
        <path d={`M 12 ${-136 - browLift} Q 26 ${-144 - browLift} 40 ${-134 - browLift}`} stroke={HAIR} strokeWidth={7} strokeLinecap="round" fill="none" />

        {/* naso */}
        <path d="M -5 -104 Q -8 -92 -12 -84" stroke={SKIN_SHADE} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <ellipse cx={0} cy={-80} rx={14} ry={11} fill="#F2B995" stroke={OUTLINE} strokeWidth={3.5} />
        <ellipse cx={-4} cy={-84} rx={4.5} ry={3} fill={WHITE} opacity={0.6} />

        {/* bocca */}
        {wow > 0.5 ? (
          <ellipse cx={0} cy={-44} rx={10} ry={12} fill="#8E3B32" stroke={OUTLINE} strokeWidth={3} />
        ) : happy > 0.5 ? (
          <g>
            <path d="M -24 -54 Q 0 -18 24 -54 Z" fill="#8E3B32" stroke={OUTLINE} strokeWidth={3.5} strokeLinejoin="round" />
            <path d="M -10 -34 Q 0 -28 10 -34 Q 6 -40 0 -40 Q -6 -40 -10 -34 Z" fill="#E7837A" />
          </g>
        ) : (
          <path d="M -18 -50 Q 0 -36 18 -50" stroke={OUTLINE} strokeWidth={4.5} strokeLinecap="round" fill="none" />
        )}

        {/* baffi a manubrio */}
        {[-1, 1].map((sx) => (
          <g key={`m${sx}`} transform={`scale(${sx} 1)`}>
            <path
              d="M 0 -68 C 14 -78 32 -78 46 -66 C 54 -58 64 -58 66 -70 C 74 -56 64 -44 48 -48 C 32 -52 14 -52 0 -58 Z"
              fill={HAIR}
              stroke={OUTLINE}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            <path d="M 10 -64 C 22 -70 34 -68 42 -62" stroke={HAIR_LIGHT} strokeWidth={3} fill="none" strokeLinecap="round" />
          </g>
        ))}

        {/* cappello da cuoco */}
        <path
          d="M -76 -186 C -128 -192 -134 -262 -82 -276 C -76 -326 -6 -342 18 -304 C 58 -334 126 -306 108 -252 C 140 -236 120 -186 76 -186 Z"
          fill={WHITE}
          stroke={OUTLINE}
          strokeWidth={LINE + 1}
          strokeLinejoin="round"
        />
        <path d="M 60 -190 C 112 -196 128 -236 104 -254 C 118 -300 70 -318 40 -306 C 80 -290 96 -250 60 -190 Z" fill={CLOTH_SHADE} />
        {[-44, -14, 16, 46].map((x, i) => (
          <path key={i} d={`M ${x} -196 Q ${x + (i - 1.5) * 6} -240 ${x + (i - 1.5) * 10} -276`} stroke="#D3DEE4" strokeWidth={4} fill="none" strokeLinecap="round" />
        ))}
        <rect x={-78} y={-206} width={156} height={50} rx={12} fill={WHITE} stroke={OUTLINE} strokeWidth={LINE + 1} />
        <rect x={40} y={-203} width={36} height={44} rx={8} fill={CLOTH_SHADE} />
        <path d="M -70 -170 L 70 -170" stroke="#D3DEE4" strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* braccia */}
      <Arm shoulder={{ x: -132, y: 76 }} hand={leftHand} outward={-1} thumbsUp={thumbsUp} />
      <Arm shoulder={{ x: 132, y: 76 }} hand={rightHand} outward={1} />
    </g>
  );
};

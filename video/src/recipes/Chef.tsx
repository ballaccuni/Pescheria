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
const HEAD_SCALE = 1.22;
const WAIST = 330;

export type ChefMood = "neutral" | "smile" | "wow" | "happy" | "wink";
export type HandPose = "open" | "grip" | "thumb";
type Pt = { x: number; y: number };

const TORSO =
  "M -104 34 C -138 44 -146 120 -145 204 C -144 266 -132 314 -108 332 Q 0 348 108 332 C 132 314 144 266 145 204 C 146 120 138 44 104 34 Z";

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

const Hand: React.FC<{ at: Pt; dir: Pt; pose: HandPose; mirror: boolean }> = ({ at, dir, pose, mirror }) => {
  const m = mirror ? -1 : 1;
  if (pose === "thumb") {
    return (
      <g transform={`translate(${at.x} ${at.y})`}>
        <rect x={-9} y={-56} width={21} height={50} rx={10.5} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
        <rect x={-26} y={-20} width={52} height={46} rx={17} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
        <path d="M -15 -5 L 15 -5 M -15 8 L 15 8" stroke={SKIN_SHADE} strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  }
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  if (pose === "grip") {
    return (
      <g transform={`translate(${at.x} ${at.y}) rotate(${ang})`}>
        <rect x={-24} y={-27} width={54} height={54} rx={23} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
        <path d="M 6 -12 L 22 -12 M 8 0 L 24 0 M 6 12 L 22 12" stroke={SKIN_SHADE} strokeWidth={3} strokeLinecap="round" />
        <ellipse
          cx={-2}
          cy={-21 * m}
          rx={16}
          ry={9.5}
          transform={`rotate(${-18 * m} -2 ${-21 * m})`}
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth={LINE}
        />
      </g>
    );
  }
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${ang})`}>
      <ellipse
        cx={-4}
        cy={-20 * m}
        rx={15}
        ry={9.5}
        transform={`rotate(${-35 * m} -4 ${-20 * m})`}
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth={LINE}
      />
      <ellipse cx={6} cy={0} rx={28} ry={24} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
      <path
        d={`M 20 ${-9 * m} Q 30 ${-7 * m} 32 ${-2 * m} M 22 ${5 * m} Q 31 ${6 * m} 32 ${10 * m}`}
        stroke={SKIN_SHADE}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
};

/** Braccio "di gomma": si allunga un po' per tenere il gomito sempre morbido. */
const Arm: React.FC<{ shoulder: Pt; hand: Pt; outward: 1 | -1; pose: HandPose }> = ({
  shoulder,
  hand,
  outward,
  pose,
}) => {
  const d = Math.hypot(hand.x - shoulder.x, hand.y - shoulder.y) || 1;
  const L = Math.min(135, Math.max(74, d * 0.56));
  const e1 = elbowFor(shoulder, hand, L, L, 1);
  const e2 = elbowFor(shoulder, hand, L, L, -1);
  const e = (e1.x - e2.x) * outward >= 0 ? e1 : e2;
  const f = sub(hand, e);
  const fl = len(f);
  const u = { x: f.x / fl, y: f.y / fl };
  const ang = (Math.atan2(u.y, u.x) * 180) / Math.PI;
  const cuffDist = Math.min(54, fl * 0.62);
  const cuff = { x: hand.x - u.x * cuffDist, y: hand.y - u.y * cuffDist };
  const wrist = { x: hand.x - u.x * 14, y: hand.y - u.y * 14 };
  const sleeve = `M ${shoulder.x} ${shoulder.y} L ${e.x} ${e.y} L ${cuff.x} ${cuff.y}`;
  const fore = `M ${cuff.x} ${cuff.y} L ${wrist.x} ${wrist.y}`;
  return (
    <g>
      {/* avambraccio scoperto */}
      <path d={fore} stroke={OUTLINE} strokeWidth={44} strokeLinecap="round" />
      <path d={fore} stroke={SKIN} strokeWidth={36} strokeLinecap="round" />
      {/* manica */}
      <path d={sleeve} stroke={OUTLINE} strokeWidth={66} strokeLinejoin="round" fill="none" />
      <circle cx={shoulder.x} cy={shoulder.y} r={33} fill={OUTLINE} />
      <path d={sleeve} stroke={WHITE} strokeWidth={58} strokeLinejoin="round" fill="none" />
      <circle cx={shoulder.x} cy={shoulder.y} r={29} fill={WHITE} />
      {/* risvolto azzurro */}
      <g transform={`translate(${cuff.x} ${cuff.y}) rotate(${ang})`}>
        <rect x={-11} y={-35} width={23} height={70} rx={8} fill={COLORS.blue} stroke={OUTLINE} strokeWidth={LINE} />
        <path d="M 6 -26 L 6 26" stroke="rgba(255,255,255,0.3)" strokeWidth={3} strokeLinecap="round" />
      </g>
      <Hand at={hand} dir={u} pose={pose} mirror={outward === -1} />
    </g>
  );
};

const Eye: React.FC<{ x: number; mode: "open" | "closed" | "happy"; look: Pt }> = ({ x, mode, look }) => {
  const y = -112;
  if (mode === "happy") {
    return (
      <path
        d={`M ${x - 13} ${y + 4} Q ${x} ${y - 14} ${x + 13} ${y + 4}`}
        stroke={OUTLINE}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  if (mode === "closed") {
    return (
      <path
        d={`M ${x - 12} ${y} Q ${x} ${y + 7} ${x + 12} ${y}`}
        stroke={OUTLINE}
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  const px = x + look.x * 4.5;
  const py = y + 1.5 + look.y * 5;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={13} ry={16} fill={WHITE} stroke={OUTLINE} strokeWidth={3.5} />
      <circle cx={px} cy={py} r={8} fill="#3A2A20" />
      <circle cx={px + 2.8} cy={py - 3} r={2.8} fill={WHITE} />
      <path
        d={`M ${x - 14} ${y - 7} Q ${x} ${y - 21} ${x + 14} ${y - 7}`}
        stroke={OUTLINE}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
};

const Mouth: React.FC<{ mood: ChefMood }> = ({ mood }) => {
  if (mood === "wow") {
    return <ellipse cx={0} cy={-42} rx={10} ry={12} fill="#8E3B32" stroke={OUTLINE} strokeWidth={3} />;
  }
  if (mood === "happy") {
    return (
      <g>
        <path d="M -26 -54 Q 0 -14 26 -54 Z" fill="#8E3B32" stroke={OUTLINE} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M -11 -32 Q 0 -25 11 -32 Q 6 -39 0 -39 Q -6 -39 -11 -32 Z" fill="#E7837A" />
      </g>
    );
  }
  if (mood === "smile") {
    return <path d="M -20 -52 Q 0 -27 20 -52 Z" fill="#8E3B32" stroke={OUTLINE} strokeWidth={3.5} strokeLinejoin="round" />;
  }
  if (mood === "wink") {
    return <path d="M -20 -50 Q 2 -30 24 -53" stroke={OUTLINE} strokeWidth={4.5} strokeLinecap="round" fill="none" />;
  }
  return <path d="M -18 -50 Q 0 -36 18 -50" stroke={OUTLINE} strokeWidth={4.5} strokeLinecap="round" fill="none" />;
};

export const Chef: React.FC<{
  /** mano destra (lato padella), in coordinate locali */
  rightHand: Pt;
  /** mano sinistra, in coordinate locali */
  leftHand: Pt;
  leftPose?: HandPose;
  rightPose?: HandPose;
  /** true = la mano destra è ferma su un oggetto (il manico) e non segue il respiro */
  rightAnchored?: boolean;
  mood?: ChefMood;
  /** 0 = occhi aperti, 1 = chiusi */
  blink?: number;
  /** direzione dello sguardo, da -1 a 1 */
  look?: Pt;
  /** quanto alza le sopracciglia */
  brow?: number;
  /** inclinazione della testa in gradi */
  tilt?: number;
  /** respiro: sposta solo busto, testa e braccia (i piedi restano a terra) */
  bob?: number;
  /** schiacciamento del busto durante il salto in padella */
  squash?: number;
  /** il cappello si solleva */
  hatDy?: number;
  /** i baffi si muovono (gradi) */
  wiggle?: number;
}> = ({
  rightHand,
  leftHand,
  leftPose = "open",
  rightPose = "grip",
  rightAnchored = true,
  mood = "neutral",
  blink = 0,
  look = { x: 0, y: 0 },
  brow = 0,
  tilt = 0,
  bob = 0,
  squash = 0,
  hatDy = 0,
  wiggle = 0,
}) => {
  const blinking = blink > 0.5;
  const leftEye = mood === "happy" ? "happy" : blinking && mood !== "wink" ? "closed" : "open";
  const rightEye = mood === "happy" || mood === "wink" ? "happy" : blinking ? "closed" : "open";
  // la mano sulla padella resta ferma mentre il busto respira
  const right = rightAnchored
    ? { x: rightHand.x, y: (rightHand.y - WAIST) / (1 - squash) + WAIST - bob }
    : rightHand;

  return (
    <g>
      <defs>
        <clipPath id="chefTorso">
          <path d={TORSO} />
        </clipPath>
        <filter id="chefWhite">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
        </filter>
        <pattern id="chefCheck" width={16} height={16} patternUnits="userSpaceOnUse">
          <rect width={16} height={16} fill={COLORS.slate} />
          <rect width={8} height={8} fill="#4A6575" />
          <rect x={8} y={8} width={8} height={8} fill="#4A6575" />
        </pattern>
      </defs>

      {/* ombra a terra */}
      <ellipse cx={0} cy={494} rx={142} ry={14} fill="rgba(47,72,88,0.16)" />

      {/* gambe: pantaloni a quadretti da cuoco */}
      <path d="M -80 300 L -20 300 L -24 470 L -76 470 Z" fill="url(#chefCheck)" stroke={OUTLINE} strokeWidth={LINE} strokeLinejoin="round" />
      <path d="M 80 300 L 20 300 L 24 470 L 76 470 Z" fill="url(#chefCheck)" stroke={OUTLINE} strokeWidth={LINE} strokeLinejoin="round" />
      {/* scarpe */}
      {[-1, 1].map((sx) => (
        <g key={`shoe${sx}`} transform={`scale(${sx} 1)`}>
          <path
            d="M 18 456 Q 14 492 38 492 L 106 492 Q 124 492 120 476 Q 114 454 82 454 Z"
            fill="#22323C"
            stroke={OUTLINE}
            strokeWidth={LINE}
            strokeLinejoin="round"
          />
          <ellipse cx={92} cy={466} rx={14} ry={5} fill={WHITE} opacity={0.25} />
        </g>
      ))}

      <g transform={`translate(0 ${WAIST}) scale(1 ${1 - squash}) translate(0 ${-WAIST + bob})`}>
        {/* giacca con la pancia tonda */}
        <path d={TORSO} fill={WHITE} stroke={OUTLINE} strokeWidth={LINE + 1} />
        <g clipPath="url(#chefTorso)">
          <rect x={92} y={0} width={120} height={400} fill={CLOTH_SHADE} />
          <path d="M -124 120 C -134 170 -134 240 -122 290" stroke={CLOTH_SHADE} strokeWidth={12} fill="none" strokeLinecap="round" />
          {/* lembo del doppio petto */}
          <path d="M -40 40 C 2 58 42 66 50 112 L 50 200" stroke={OUTLINE} strokeWidth={3.5} fill="none" />
        </g>
        {/* bottoni */}
        {[84, 130, 174].map((y) => (
          <g key={y}>
            <circle cx={-22} cy={y} r={8.5} fill={COLORS.deepBlue} stroke={OUTLINE} strokeWidth={2} />
            <circle cx={70} cy={y} r={8.5} fill={COLORS.deepBlue} stroke={OUTLINE} strokeWidth={2} />
          </g>
        ))}

        {/* grembiule che segue la pancia, legato in vita */}
        <path
          d="M -132 214 C -140 270 -130 330 -112 366 Q -104 380 -90 380 L 90 380 Q 104 380 112 366 C 130 330 140 270 132 214 Q 0 244 -132 214 Z"
          fill={COLORS.blue}
          stroke={OUTLINE}
          strokeWidth={LINE}
          strokeLinejoin="round"
        />
        <path d="M 114 236 C 122 280 114 330 98 360" stroke="rgba(255,255,255,0.16)" strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M -98 366 Q 0 372 98 366" stroke="rgba(255,255,255,0.25)" strokeWidth={3} fill="none" />
        <path
          d="M -139 200 Q 0 232 139 200 L 137 222 Q 0 254 -137 222 Z"
          fill={COLORS.deepBlue}
          stroke={OUTLINE}
          strokeWidth={LINE}
          strokeLinejoin="round"
        />
        <image href={staticFile("logo/fish.png")} x={-52} y={270} width={104} height={44} filter="url(#chefWhite)" />
        {/* fiocco */}
        <g transform="translate(90 213)">
          <path d="M -4 6 L -16 44 M 4 6 L 14 42" stroke={COLORS.deepBlue} strokeWidth={9} strokeLinecap="round" />
          <ellipse cx={-17} cy={-4} rx={17} ry={10} transform="rotate(-20 -17 -4)" fill={COLORS.deepBlue} stroke={OUTLINE} strokeWidth={3} />
          <ellipse cx={17} cy={-4} rx={17} ry={10} transform="rotate(20 17 -4)" fill={COLORS.deepBlue} stroke={OUTLINE} strokeWidth={3} />
          <circle r={8} fill={COLORS.deepBlue} stroke={OUTLINE} strokeWidth={3} />
        </g>

        {/* collo */}
        <rect x={-28} y={-30} width={56} height={46} rx={12} fill={SKIN_SHADE} stroke={OUTLINE} strokeWidth={LINE} />
        {/* colletto */}
        <path d="M -64 30 Q 0 60 64 30 L 58 4 Q 0 30 -58 4 Z" fill={WHITE} stroke={OUTLINE} strokeWidth={LINE} strokeLinejoin="round" />
        <path d="M 0 31 L 0 45" stroke={OUTLINE} strokeWidth={3.5} strokeLinecap="round" />

        {/* testa */}
        <g transform={`rotate(${tilt} 0 -20) translate(0 -10) scale(${HEAD_SCALE}) translate(0 10)`}>
          {/* capelli ai lati */}
          {[-1, 1].map((sx) => (
            <path
              key={`hair${sx}`}
              transform={`scale(${sx} 1)`}
              d="M 60 -158 C 86 -152 94 -120 80 -98 L 58 -104 Z"
              fill={HAIR}
              stroke={OUTLINE}
              strokeWidth={3}
              strokeLinejoin="round"
            />
          ))}
          {/* orecchie */}
          {[-1, 1].map((sx) => (
            <g key={`ear${sx}`}>
              <ellipse cx={sx * 71} cy={-100} rx={14} ry={19} fill={SKIN} stroke={OUTLINE} strokeWidth={LINE} />
              <path
                d={`M ${sx * 73} ${-110} Q ${sx * 65} ${-100} ${sx * 73} ${-90}`}
                stroke={SKIN_SHADE}
                strokeWidth={3.5}
                fill="none"
                strokeLinecap="round"
              />
            </g>
          ))}
          {/* viso */}
          <path
            d="M -66 -154 C -78 -104 -72 -54 -42 -30 C -22 -12 22 -12 42 -30 C 72 -54 78 -104 66 -154 Z"
            fill={SKIN}
            stroke={OUTLINE}
            strokeWidth={LINE}
            strokeLinejoin="round"
          />
          <path d="M 44 -34 C 66 -56 73 -100 65 -150 C 76 -104 70 -55 42 -31 Z" fill={SKIN_SHADE} opacity={0.55} />
          <path d="M -64 -152 L 64 -152 L 64 -146 Q 0 -138 -64 -146 Z" fill={SKIN_SHADE} opacity={0.5} />
          {/* basette */}
          <path d="M -66 -154 L -52 -154 L -54 -112 Q -62 -114 -68 -124 Z" fill={HAIR} />
          <path d="M 66 -154 L 52 -154 L 54 -112 Q 62 -114 68 -124 Z" fill={HAIR} />
          {/* guance */}
          <ellipse cx={-44} cy={-76} rx={14} ry={9.5} fill="#F19A86" opacity={0.45} />
          <ellipse cx={44} cy={-76} rx={14} ry={9.5} fill="#F19A86" opacity={0.45} />

          <Eye x={-26} mode={leftEye} look={look} />
          <Eye x={26} mode={rightEye} look={look} />
          {/* sopracciglia */}
          <path
            d={`M -42 ${-136 - brow} Q -27 ${-148 - brow} -12 ${-139 - brow}`}
            stroke={HAIR}
            strokeWidth={7.5}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M 12 ${-139 - brow} Q 27 ${-148 - brow} 42 ${-136 - brow}`}
            stroke={HAIR}
            strokeWidth={7.5}
            strokeLinecap="round"
            fill="none"
          />

          {/* naso */}
          <path d="M -5 -104 Q -8 -92 -12 -84" stroke={SKIN_SHADE} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <ellipse cx={0} cy={-80} rx={14.5} ry={11.5} fill="#F2B995" stroke={OUTLINE} strokeWidth={3.5} />
          <ellipse cx={-4} cy={-84} rx={4.5} ry={3} fill={WHITE} opacity={0.6} />

          <Mouth mood={mood} />
          <path d="M -9 -22 Q 0 -18 9 -22" stroke={SKIN_SHADE} strokeWidth={3} fill="none" strokeLinecap="round" />

          {/* baffi a manubrio */}
          {[-1, 1].map((sx) => (
            <g key={`m${sx}`} transform={`scale(${sx * 1.08} 1.08) translate(0 4.5) rotate(${wiggle} 0 -62)`}>
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
          <g transform={`translate(0 ${hatDy})`}>
            <path
              d="M -76 -186 C -128 -192 -134 -262 -82 -276 C -76 -326 -6 -342 18 -304 C 58 -334 126 -306 108 -252 C 140 -236 120 -186 76 -186 Z"
              fill={WHITE}
              stroke={OUTLINE}
              strokeWidth={LINE}
              strokeLinejoin="round"
            />
            <path d="M 60 -190 C 112 -196 128 -236 104 -254 C 118 -300 70 -318 40 -306 C 80 -290 96 -250 60 -190 Z" fill={CLOTH_SHADE} />
            {[-44, -14, 16, 46].map((x, i) => (
              <path
                key={i}
                d={`M ${x} -196 Q ${x + (i - 1.5) * 6} -240 ${x + (i - 1.5) * 10} -276`}
                stroke="#D3DEE4"
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
              />
            ))}
            <rect x={-78} y={-206} width={156} height={50} rx={12} fill={WHITE} stroke={OUTLINE} strokeWidth={LINE} />
            <rect x={40} y={-203} width={36} height={44} rx={8} fill={CLOTH_SHADE} />
            <path d="M -70 -170 L 70 -170" stroke="#D3DEE4" strokeWidth={4} strokeLinecap="round" />
          </g>
        </g>

        {/* braccia */}
        <Arm shoulder={{ x: -116, y: 66 }} hand={leftHand} outward={-1} pose={leftPose} />
        <Arm shoulder={{ x: 116, y: 66 }} hand={right} outward={1} pose={rightPose} />
      </g>
    </g>
  );
};

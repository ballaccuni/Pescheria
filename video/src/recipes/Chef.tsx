import React from "react";
import { COLORS } from "../LogoAnimation";

// Cuoco disegnato in stile piatto, con i colori del logo.
// Coordinate locali: (0,0) = base del collo. Da usare dentro un <svg>.

const SKIN = "#F4C9A3";
const SKIN_DARK = "#E3AE86";
const MUSTACHE = "#5A3B2A";
const OUTLINE = COLORS.slate;

type Pt = { x: number; y: number };

const Arm: React.FC<{ from: Pt; to: Pt; bend: number }> = ({ from, to, bend }) => {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ex = mx + (-dy / len) * bend;
  const ey = my + (dx / len) * bend;
  const d = `M ${from.x} ${from.y} Q ${ex} ${ey} ${to.x} ${to.y}`;
  return (
    <g>
      <path d={d} stroke={OUTLINE} strokeWidth={52} strokeLinecap="round" fill="none" />
      <path d={d} stroke="#FFFFFF" strokeWidth={43} strokeLinecap="round" fill="none" />
      <circle cx={to.x} cy={to.y} r={23} fill={SKIN} stroke={OUTLINE} strokeWidth={4} />
    </g>
  );
};

export const Chef: React.FC<{
  /** mano destra (lato padella), in coordinate locali */
  rightHand: Pt;
  /** mano sinistra, in coordinate locali */
  leftHand: Pt;
  /** 0 = occhi aperti, 1 = chiusi */
  blink: number;
  /** espressione felice (occhi ad arco, bocca aperta) */
  happy: number;
  /** bocca a "O" (stupore durante il salto in padella) */
  wow: number;
}> = ({ rightHand, leftHand, blink, happy, wow }) => {
  const eyeRy = 9 * (1 - blink);
  const puffs: [number, number, number][] = [
    [-52, -232, 46],
    [0, -262, 58],
    [52, -232, 46],
  ];
  return (
    <g>
      {/* busto: giacca da cuoco */}
      <path
        d="M -118 30 C -150 40 -170 80 -175 140 L -185 620 L 185 620 L 175 140 C 170 80 150 40 118 30 Z"
        fill="#FFFFFF"
        stroke={OUTLINE}
        strokeWidth={5}
      />
      <path d="M 0 40 L 0 620" stroke="rgba(47,72,88,0.15)" strokeWidth={4} />
      {[90, 160, 230, 300].map((y) => (
        <g key={y}>
          <circle cx={-38} cy={y} r={8.5} fill={COLORS.blue} />
          <circle cx={38} cy={y} r={8.5} fill={COLORS.blue} />
        </g>
      ))}

      {/* foulard */}
      <path d="M -50 -6 L 50 -6 L 0 58 Z" fill={COLORS.blue} />
      <circle cx={0} cy={2} r={15} fill={COLORS.deepBlue} />

      {/* testa */}
      <circle cx={-77} cy={-92} r={16} fill={SKIN} stroke={OUTLINE} strokeWidth={4} />
      <circle cx={77} cy={-92} r={16} fill={SKIN} stroke={OUTLINE} strokeWidth={4} />
      <circle cx={0} cy={-95} r={78} fill={SKIN} stroke={OUTLINE} strokeWidth={4} />
      <circle cx={-46} cy={-70} r={13} fill="#F09A84" opacity={0.45} />
      <circle cx={46} cy={-70} r={13} fill="#F09A84" opacity={0.45} />

      {/* occhi */}
      {[-28, 28].map((x) =>
        happy > 0.5 ? (
          <path
            key={x}
            d={`M ${x - 10} -100 Q ${x} -114 ${x + 10} -100`}
            stroke={OUTLINE}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <ellipse key={x} cx={x} cy={-104} rx={7} ry={Math.max(1.2, eyeRy)} fill={OUTLINE} />
        ),
      )}
      {/* sopracciglia */}
      {[-28, 28].map((x) => (
        <path
          key={`b${x}`}
          d={`M ${x - 13} ${-128 - wow * 6} Q ${x} ${-136 - wow * 8} ${x + 13} ${-128 - wow * 6}`}
          stroke={MUSTACHE}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      ))}
      {/* naso */}
      <ellipse cx={0} cy={-80} rx={12} ry={10} fill={SKIN_DARK} />

      {/* bocca */}
      {wow > 0.5 ? (
        <ellipse cx={0} cy={-38} rx={11} ry={14} fill="#8E3B32" />
      ) : happy > 0.5 ? (
        <path d="M -24 -48 Q 0 -14 24 -48 Z" fill="#8E3B32" stroke={OUTLINE} strokeWidth={3} />
      ) : (
        <path
          d="M -20 -46 Q 0 -28 20 -46"
          stroke={OUTLINE}
          strokeWidth={4.5}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {/* baffi */}
      <g fill={MUSTACHE}>
        <ellipse cx={-22} cy={-60} rx={25} ry={10} transform="rotate(12 -22 -60)" />
        <ellipse cx={22} cy={-60} rx={25} ry={10} transform="rotate(-12 22 -60)" />
        <circle cx={-46} cy={-66} r={7} />
        <circle cx={46} cy={-66} r={7} />
      </g>

      {/* cappello */}
      {puffs.map(([x, y, r], i) => (
        <circle key={`o${i}`} cx={x} cy={y} r={r} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={5} />
      ))}
      {puffs.map(([x, y, r], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={r - 2.5} fill="#FFFFFF" />
      ))}
      <rect x={-72} y={-198} width={144} height={42} rx={8} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={5} />

      {/* braccia */}
      <Arm from={{ x: -112, y: 70 }} to={leftHand} bend={-30} />
      <Arm from={{ x: 112, y: 70 }} to={rightHand} bend={34} />
    </g>
  );
};

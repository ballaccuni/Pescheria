import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { MusselMeat, PotatoCube } from "./ingredients";
import { firstAddIn, type Timeline } from "./types";
import { STAGE, clamp, mulberry32, type Pt } from "./utils";

// Frullatore visto di lato: patate e cozze sgusciate diventano una crema.

const CREAM = "#EBD39C";
const CREAM_LIGHT = "#F6E7C3";
const JAR = "M -150 -262 L 150 -262 L 112 150 L -112 150 Z";
const JAR_INNER = "M -140 -254 L 140 -254 L 104 142 L -104 142 Z";
// tempi del frullatore (fotogrammi da quando inizia il passo)
export const BLEND = { dropFrom: 6, lidAt: 46, start: 60, end: 120 };

export const MixerStage: React.FC<{
  tl: Timeline;
  frame: number;
  fps: number;
  offset: Pt;
  range: [number, number];
}> = ({ tl, frame, fps, offset, range }) => {
  const at = firstAddIn(tl, "blend", range[0], range[1]);
  const local = at === null ? -1 : frame - at;
  const b = interpolate(local, [BLEND.start, BLEND.end], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const running = local >= BLEND.start && local < BLEND.end + 4;
  const shake = running ? Math.sin(local * 2.3) * 4 : 0;
  const level = 142 - b * 250; // la crema sale nel bicchiere

  // patate e cozze che cadono nel bicchiere
  const rnd = mulberry32(31);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < 22; i++) {
    const isMeat = i % 2 === 1;
    const tx = (rnd() - 0.5) * 170;
    const ty = 30 + rnd() * 100;
    const rot = rnd() * 360;
    const s = BLEND.dropFrom + i * 1.6;
    if (local < s) continue;
    const fall = spring({ frame: local - s, fps, config: { damping: 12, mass: 0.6 } });
    // durante il frullato girano in tondo e si sciolgono nella crema
    const swirl = b * 7 + i;
    const rad = (1 - b) * Math.hypot(tx, ty - 90);
    const x = b > 0 ? Math.cos(swirl) * rad * 0.9 : tx;
    const y = b > 0 ? 90 + Math.sin(swirl) * rad * 0.4 : ty - (1 - fall) * 520;
    items.push(
      <g
        key={i}
        transform={`translate(${x} ${y}) rotate(${rot + b * 400}) scale(${(1 - b) * 1.15})`}
        opacity={interpolate(local - s, [0, 4], [0, 1], clamp) * (1 - b)}
      >
        {isMeat ? <MusselMeat /> : <PotatoCube cooked={1} size={36} />}
      </g>,
    );
  }

  const lid = local < BLEND.lidAt ? null : spring({ frame: local - BLEND.lidAt, fps, config: { damping: 13 } });
  const bladeAngle = running ? local * 47 : 0;

  return (
    <g transform={`translate(${STAGE.cx + offset.x + shake} ${STAGE.cy - 30 + offset.y})`}>
      <defs>
        <clipPath id="mixerJar">
          <path d={JAR_INNER} />
        </clipPath>
      </defs>

      {/* base del frullatore */}
      <path d="M -132 150 L 132 150 L 150 300 Q 150 318 132 318 L -132 318 Q -150 318 -150 300 Z" fill={COLORS.slate} stroke="#1E3038" strokeWidth={5} strokeLinejoin="round" />
      <rect x={-96} y={196} width={192} height={80} rx={18} fill="#41606F" />
      <g transform="translate(-40 236)">
        <circle r={26} fill="#C9D6DC" stroke="#1E3038" strokeWidth={4} />
        <path d="M 0 -18 L 0 -6" stroke={COLORS.slate} strokeWidth={5} strokeLinecap="round" transform={`rotate(${running ? 120 : -40})`} />
      </g>
      <circle cx={40} cy={236} r={10} fill={running ? "#7CE07C" : "#56707D"} stroke="#1E3038" strokeWidth={3} />

      {/* bicchiere di vetro */}
      <path d={JAR} fill="rgba(214,236,246,0.55)" />
      <g clipPath="url(#mixerJar)">
        {/* crema che sale */}
        {b > 0 && (
          <g>
            <path
              d={`M -160 ${level} Q -80 ${level - 10 * Math.sin(local * 0.5)} 0 ${level} T 160 ${level} L 160 160 L -160 160 Z`}
              fill={CREAM}
            />
            {running &&
              [0, 1, 2].map((k) => (
                <ellipse
                  key={k}
                  cx={0}
                  cy={level + 60 + k * 50}
                  rx={90 - k * 16}
                  ry={14}
                  fill="none"
                  stroke={CREAM_LIGHT}
                  strokeWidth={6}
                  strokeDasharray="60 40"
                  strokeDashoffset={local * 14 * (k % 2 ? -1 : 1)}
                  opacity={0.8}
                />
              ))}
          </g>
        )}
        {items}
        {/* lame */}
        <g transform="translate(0 128)">
          <ellipse rx={58} ry={9} fill="#9FB1BB" stroke={COLORS.slate} strokeWidth={3} transform={`scale(${Math.cos((bladeAngle * Math.PI) / 180)} 1)`} />
          <rect x={-8} y={-4} width={16} height={20} rx={4} fill={COLORS.slate} />
        </g>
      </g>
      {/* riflessi e tacche del vetro */}
      <path d="M -118 -230 L -92 110" stroke="#FFFFFF" strokeWidth={12} opacity={0.4} strokeLinecap="round" />
      {[-180, -120, -60, 0, 60].map((y, i) => (
        <path key={i} d={`M 96 ${y} L ${116 - i * 4} ${y}`} stroke={COLORS.slate} strokeWidth={3} opacity={0.5} />
      ))}
      <path d={JAR} fill="none" stroke={COLORS.slate} strokeWidth={5} strokeLinejoin="round" />
      {/* manico del bicchiere */}
      <path d="M 140 -190 L 196 -176 Q 210 -172 206 -156 L 176 40 Q 172 56 156 54 L 124 50" fill="none" stroke={COLORS.slate} strokeWidth={20} strokeLinejoin="round" strokeLinecap="round" />

      {/* coperchio */}
      {lid !== null && (
        <g transform={`translate(0 ${-(1 - lid) * 400})`} opacity={Math.min(1, lid * 3)}>
          <rect x={-162} y={-292} width={324} height={36} rx={12} fill={COLORS.slate} stroke="#1E3038" strokeWidth={4} />
          <rect x={-30} y={-318} width={60} height={30} rx={10} fill="#41606F" stroke="#1E3038" strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

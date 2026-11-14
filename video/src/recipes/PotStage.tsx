import React from "react";
import { interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { Steam } from "./Steam";
import { PotatoCube } from "./ingredients";
import { firstAddIn, type Timeline } from "./types";
import { STAGE, clamp, mulberry32, type Pt } from "./utils";

// Pentola vista dall'alto con l'acqua che bolle e i cubetti di patate.

const POT = { cx: STAGE.cx, cy: STAGE.cy, R: 290, inner: 262 };
const STEEL = "#B8C7CF";

const Pot: React.FC = () => (
  <g>
    {/* manici */}
    {[-1, 1].map((sx) => (
      <rect
        key={sx}
        x={sx > 0 ? POT.R - 18 : -POT.R - 54}
        y={-30}
        width={72}
        height={60}
        rx={22}
        fill={COLORS.slate}
        stroke="#1E3038"
        strokeWidth={4}
      />
    ))}
    <circle r={POT.R} fill={STEEL} stroke={COLORS.slate} strokeWidth={6} />
    <circle r={POT.R - 12} fill="none" stroke="#DCE5EA" strokeWidth={8} />
    <circle r={POT.inner} fill="#8FA4AF" />
    <path
      d={`M ${-POT.R * 0.66} ${-POT.R * 0.62} A ${POT.R * 0.9} ${POT.R * 0.9} 0 0 1 ${-POT.R * 0.1} ${-POT.R * 0.9}`}
      stroke="#FFFFFF"
      strokeWidth={10}
      opacity={0.5}
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

export const PotStage: React.FC<{
  tl: Timeline;
  frame: number;
  fps: number;
  offset: Pt;
  range: [number, number];
}> = ({ tl, frame, fps, offset, range }) => {
  const potatoAt = firstAddIn(tl, "potatoes", range[0], range[1]);
  // l'acqua bolle sempre più forte
  const boil = interpolate(frame, [range[0], range[0] + 50], [0.35, 1], clamp);

  const rnd = mulberry32(7);
  const bubbles: React.ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const r = Math.sqrt(rnd()) * (POT.inner - 26);
    const th = rnd() * Math.PI * 2;
    const period = 14 + rnd() * 20;
    const off = rnd() * period;
    const size = 5 + rnd() * 9;
    if (rnd() > boil) continue;
    const ph = ((frame + off) % period) / period;
    bubbles.push(
      <circle
        key={i}
        cx={Math.cos(th) * r}
        cy={Math.sin(th) * r}
        r={size * (0.3 + ph)}
        fill="rgba(255,255,255,0.18)"
        stroke="#FFFFFF"
        strokeWidth={2}
        opacity={Math.sin(ph * Math.PI) * 0.85}
      />,
    );
  }

  const cubes: React.ReactNode[] = [];
  if (potatoAt !== null) {
    const pr = mulberry32(19);
    for (let i = 0; i < 16; i++) {
      const r = Math.sqrt(pr()) * (POT.inner - 50);
      const th = pr() * Math.PI * 2;
      const rot = pr() * 90;
      const phase = pr() * Math.PI * 2;
      const s = potatoAt + i * 2.5;
      if (frame < s) continue;
      const fall = spring({ frame: frame - s, fps, config: { damping: 11, mass: 0.6 } });
      // cubetti che ballano nell'acqua che bolle
      const bobX = Math.sin(frame * 0.18 + phase) * 6 * boil;
      const bobY = Math.cos(frame * 0.22 + phase) * 5 * boil;
      const x = Math.cos(th) * r + bobX;
      const y = Math.sin(th) * r + bobY - (1 - fall) * 460;
      const splash = frame - s - 8;
      cubes.push(
        <g key={i}>
          {splash >= 0 && splash < 16 && (
            <circle
              cx={Math.cos(th) * r}
              cy={Math.sin(th) * r}
              r={14 + splash * 2.4}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={3}
              opacity={1 - splash / 16}
            />
          )}
          <g
            transform={`translate(${x} ${y}) rotate(${rot + frame * 0.6 * boil}) scale(${1.25 + (1 - fall) * 0.4})`}
            opacity={interpolate(frame - s, [0, 5], [0, 1], clamp)}
          >
            <PotatoCube cooked={interpolate(frame, [s + 20, s + 90], [0, 1], clamp)} />
          </g>
        </g>,
      );
    }
  }

  return (
    <g transform={`translate(${POT.cx + offset.x} ${POT.cy + offset.y})`}>
      <Pot />
      {/* acqua */}
      <circle r={POT.inner - 4} fill="#A9D3E6" opacity={0.92} />
      <circle r={POT.inner - 4} fill="none" stroke="#7FB7D0" strokeWidth={6} opacity={0.7} />
      {bubbles}
      {cubes}
      <Steam frame={frame} strength={boil} xs={[-150, -50, 60, 160]} />
    </g>
  );
};

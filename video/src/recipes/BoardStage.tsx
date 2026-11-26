import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { COLORS } from "../LogoAnimation";
import { Squid } from "./squid";
import { firstAddIn, type Timeline } from "./types";
import { STAGE, clamp, type Pt } from "./utils";

// Tagliere: i calamari vengono riempiti con il cucchiaio e chiusi con lo stuzzicadenti.

const BOARD = { w: 640, h: 520, r: 40 };
const BOWL = { x: 250, y: -250, r: 70 }; // ciotolina con il ripieno, rispetto al tagliere
// i 4 calamari sul tagliere, in fila
export const BOARD_SQUID = [-180, -62, 56, 174].map((y, i) => ({ x: 20 + (i % 2) * 10, y, flip: 1 }));
/** fotogrammi per riempire un calamaro, e per chiuderlo */
export const STUFF_EACH = 22;
export const CLOSE_EACH = 9;

const Board: React.FC = () => (
  <g>
    <rect x={-BOARD.w / 2} y={-BOARD.h / 2 + 12} width={BOARD.w} height={BOARD.h} rx={BOARD.r} fill="rgba(47,72,88,0.18)" />
    <rect x={-BOARD.w / 2} y={-BOARD.h / 2} width={BOARD.w} height={BOARD.h} rx={BOARD.r} fill="#D9AE7A" stroke="#A97A47" strokeWidth={5} />
    {[-180, -110, -40, 30, 100, 170].map((y, i) => (
      <path
        key={i}
        d={`M ${-BOARD.w / 2 + 30} ${y} C -120 ${y - 8} 80 ${y + 10} ${BOARD.w / 2 - 30} ${y - 4}`}
        stroke="#C79762"
        strokeWidth={3}
        fill="none"
        opacity={0.7}
      />
    ))}
    <circle cx={BOARD.w / 2 - 44} cy={0} r={14} fill="#B9874F" stroke="#A97A47" strokeWidth={3} />
  </g>
);

export const BoardStage: React.FC<{
  tl: Timeline;
  frame: number;
  fps: number;
  offset: Pt;
  range: [number, number];
}> = ({ tl, frame, fps, offset, range }) => {
  const inAt = firstAddIn(tl, "squidBoard", range[0], range[1]);
  const stuffAt = firstAddIn(tl, "stuff", range[0], range[1]);
  const closeAt = firstAddIn(tl, "close", range[0], range[1]);

  const squids = BOARD_SQUID.map((sq, i) => {
    if (inAt === null || frame < inAt + i * 4) return null;
    const p = spring({ frame: frame - inAt - i * 4, fps, config: { damping: 14 } });
    const t0 = stuffAt === null ? Infinity : stuffAt + i * STUFF_EACH;
    const stuffed = interpolate(frame, [t0 + 10, t0 + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const c0 = closeAt === null ? Infinity : closeAt + i * CLOSE_EACH;
    const closeP = interpolate(frame, [c0, c0 + 8], [0, 1], clamp);
    return (
      <g key={i} transform={`translate(${sq.x - (1 - p) * 700} ${sq.y}) scale(1.25)`}>
        <Squid stuffed={stuffed} closed={closeP >= 1} />
        {closeP > 0 && closeP < 1 && (
          // lo stuzzicadenti arriva dall'alto e infilza l'apertura
          <path
            d={`M ${-106 + (1 - closeP) * -30} ${-34 - (1 - closeP) * 80} L ${-84 + (1 - closeP) * -30} ${34 - (1 - closeP) * 80}`}
            stroke="#D9BE8E"
            strokeWidth={5}
            strokeLinecap="round"
          />
        )}
      </g>
    );
  });

  // cucchiaio: dalla ciotolina all'apertura di ogni calamaro
  const renderSpoon = () => {
    if (stuffAt === null) return null;
    const local = frame - stuffAt;
    const total = BOARD_SQUID.length * STUFF_EACH;
    if (local < -6 || local > total + 10) return null;
    const i = Math.min(BOARD_SQUID.length - 1, Math.max(0, Math.floor(local / STUFF_EACH)));
    const k = (local - i * STUFF_EACH) / STUFF_EACH; // 0..1 nel giro di questo calamaro
    const sq = BOARD_SQUID[i];
    const target = { x: sq.x - 96 * 1.25 - 10, y: sq.y };
    const go = interpolate(k, [0, 0.45], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
    const back = interpolate(k, [0.55, 1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
    const pos = {
      x: BOWL.x + (target.x - BOWL.x) * (go - back),
      y: BOWL.y + (target.y - BOWL.y) * (go - back) - Math.sin(go * Math.PI) * 40,
    };
    const full = k < 0.5;
    const leave = interpolate(local, [total, total + 10], [0, 1], clamp);
    return (
      <g transform={`translate(${pos.x + leave * 400} ${pos.y - leave * 300}) rotate(-35)`}>
        <rect x={20} y={-7} width={170} height={14} rx={7} fill="#C9D6DC" stroke={COLORS.slate} strokeWidth={3} />
        <ellipse rx={30} ry={20} fill="#DCE5EA" stroke={COLORS.slate} strokeWidth={3.5} />
        {full && <ellipse rx={22} ry={13} fill="#D9B36C" />}
        {full && <circle cx={-6} cy={-3} r={2.5} fill="#3E8E41" />}
      </g>
    );
  };

  const bowlIn = inAt === null ? 0 : spring({ frame: frame - inAt - 10, fps, config: { damping: 14 } });

  return (
    <g transform={`translate(${STAGE.cx + offset.x} ${STAGE.cy + offset.y})`}>
      <Board />
      {/* ciotolina con il ripieno */}
      {bowlIn > 0.01 && (
        <g transform={`translate(${BOWL.x + (1 - bowlIn) * 400} ${BOWL.y})`}>
          <circle r={BOWL.r + 2} cy={8} fill="rgba(47,72,88,0.2)" />
          <circle r={BOWL.r} fill={COLORS.blue} stroke={COLORS.slate} strokeWidth={4} />
          <circle r={BOWL.r - 10} fill="#D9B36C" />
          {[
            [-20, -10],
            [10, -24],
            [22, 8],
            [-8, 18],
            [0, -2],
          ].map(([x, y], j) => (
            <circle key={j} cx={x} cy={y} r={4} fill={j % 2 ? "#3E8E41" : "#E2A6B6"} />
          ))}
        </g>
      )}
      {squids}
      {renderSpoon()}
    </g>
  );
};

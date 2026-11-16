import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colori } from "../tema";

// Sfondo scuro con pezzetti di carta e stelline, come un collage.
const pezzi = [
  { x: -40, y: 1500, w: 260, h: 220, r: -8, c: colori.sfondoChiaro },
  { x: 820, y: 1620, w: 300, h: 260, r: 6, c: colori.sfondoChiaro },
  { x: 700, y: -60, w: 320, h: 240, r: 10, c: colori.sfondoChiaro },
  { x: 40, y: 1700, w: 180, h: 170, r: 4, c: colori.carta },
  { x: -60, y: 120, w: 220, h: 180, r: -12, c: colori.sfondoChiaro },
];

const stelle = [
  { x: 90, y: 560, s: 26 },
  { x: 960, y: 900, s: 20 },
  { x: 150, y: 1180, s: 18 },
  { x: 920, y: 420, s: 24 },
  { x: 540, y: 1560, s: 16 },
];

export const Sfondo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: colori.sfondo, overflow: "hidden" }}>
      {pezzi.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y + Math.sin((frame + i * 20) / 40) * 6,
            width: p.w,
            height: p.h,
            background: p.c,
            opacity: p.c === colori.carta ? 0.85 : 0.55,
            transform: `rotate(${p.r}deg)`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        />
      ))}
      {stelle.map((s, i) => {
        const o = interpolate(Math.sin((frame + i * 13) / 12), [-1, 1], [0.3, 1]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              fontSize: s.s * 2,
              color: colori.bianco,
              opacity: o,
              lineHeight: 1,
            }}
          >
            ✦
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

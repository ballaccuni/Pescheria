import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colori, font } from "../tema";

// Scritta che "cade" come un timbro sull'immagine.
export const Timbro: React.FC<{ testo: string; ritardo: number }> = ({ testo, ritardo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - ritardo, fps, config: { damping: 9, stiffness: 180 } });
  if (frame < ritardo) return null;
  return (
    <div
      style={{
        background: colori.corallo,
        color: colori.bianco,
        fontFamily: font.testo,
        fontWeight: 900,
        fontSize: 72,
        textTransform: "uppercase",
        padding: "14px 36px",
        border: `5px solid ${colori.bianco}`,
        transform: `scale(${3 - 2 * s}) rotate(-8deg)`,
        opacity: Math.min(1, s * 1.5),
        boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
      }}
    >
      {testo}
    </div>
  );
};

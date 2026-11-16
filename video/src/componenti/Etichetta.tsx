import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colori, font } from "../tema";

// Targhetta gialla in maiuscoletto (tipo "TI RICORDI").
export const Etichetta: React.FC<{ testo: string }> = ({ testo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        display: "inline-block",
        background: colori.oro,
        color: colori.inchiostro,
        fontFamily: font.testo,
        fontWeight: 900,
        fontSize: 34,
        letterSpacing: 4,
        textTransform: "uppercase",
        padding: "10px 22px",
        transform: `scale(${s}) rotate(${interpolate(s, [0, 1], [-6, -1.5])}deg)`,
      }}
    >
      {testo}
    </div>
  );
};

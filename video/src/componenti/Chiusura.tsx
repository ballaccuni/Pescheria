import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colori, font } from "../tema";

export const Chiusura: React.FC<{ nome: string; sottotitolo: string; invito: string }> = ({
  nome,
  sottotitolo,
  invito,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  const o2 = interpolate(frame, [18, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colori.carta, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: colori.oro,
          opacity: 0.35,
          transform: `scale(${s})`,
        }}
      />
      <div style={{ transform: `scale(${s})`, textAlign: "center" }}>
        <div style={{ fontFamily: font.titolo, fontSize: 130, fontWeight: 700, color: colori.sfondo, lineHeight: 1 }}>
          {nome}
        </div>
        <div
          style={{
            fontFamily: font.testo,
            fontSize: 44,
            letterSpacing: 14,
            textTransform: "uppercase",
            color: colori.oroScuro,
            marginTop: 20,
          }}
        >
          {sottotitolo}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 360,
          opacity: o2,
          fontFamily: font.titolo,
          fontStyle: "italic",
          fontSize: 64,
          color: colori.inchiostro,
          borderBottom: `5px solid ${colori.corallo}`,
          paddingBottom: 6,
        }}
      >
        {invito}
      </div>
    </AbsoluteFill>
  );
};

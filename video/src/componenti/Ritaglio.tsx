import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colori, font } from "../tema";

// Immagine ritagliata (PNG trasparente) sopra un cerchio colorato, che entra
// con un rimbalzo e poi "respira". Senza immagine mostra un segnaposto.
export const Ritaglio: React.FC<{
  immagine?: string;
  segnaposto?: string;
  coloreCerchio: string;
  ritardo?: number;
}> = ({ immagine, segnaposto, coloreCerchio, ritardo = 6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sCerchio = spring({ frame: frame - ritardo, fps, config: { damping: 12 } });
  const sImg = spring({ frame: frame - ritardo - 5, fps, config: { damping: 10, mass: 0.8 } });
  const respiro = 1 + Math.sin(frame / 14) * 0.015;
  const rot = interpolate(sImg, [0, 1], [-12, 0]) + Math.sin(frame / 20) * 1.5;

  return (
    <div style={{ position: "relative", width: 760, height: 760 }}>
      <div
        style={{
          position: "absolute",
          inset: 90,
          borderRadius: "50%",
          background: coloreCerchio,
          transform: `scale(${sCerchio})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${sImg * respiro}) rotate(${rot}deg)`,
        }}
      >
        {immagine ? (
          <Img
            src={staticFile(`immagini/${immagine}`)}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.35))",
            }}
          />
        ) : (
          <div
            style={{
              width: 440,
              height: 340,
              background: colori.carta,
              border: `6px dashed ${colori.oroScuro}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: font.testo,
              color: colori.inchiostro,
              textAlign: "center",
              padding: 24,
              boxShadow: "0 18px 24px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ fontSize: 26, letterSpacing: 3, fontWeight: 900, color: colori.oroScuro }}>
              IMMAGINE
            </div>
            <div style={{ fontSize: 44, fontWeight: 700, marginTop: 10 }}>{segnaposto ?? "da Flow"}</div>
          </div>
        )}
      </div>
    </div>
  );
};

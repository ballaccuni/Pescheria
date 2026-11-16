import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colori } from "../tema";

const RAGGIO = 125;
const ZOOM = 1.9;

// Lente d'ingrandimento che entra da destra, esplora l'immagine e si ferma
// sul centro. Dentro il vetro mostra una copia ingrandita del contenuto.
export const Lente: React.FC<{ contenuto: React.ReactNode; lato: number; inizio: number }> = ({
  contenuto,
  lato,
  inizio,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - inizio;
  if (f < 0) return null;

  const entrata = spring({ frame: f, fps, config: { damping: 15 } });
  const t = f / fps;
  // Percorso: entra dal basso a destra, gira un po' sull'immagine, si posa al centro.
  const cx = interpolate(entrata, [0, 1], [lato + 200, lato * 0.6]) + Math.sin(t * 2.2) * 90 * Math.min(1, t);
  const cy = interpolate(entrata, [0, 1], [lato + 150, lato * 0.48]) + Math.cos(t * 1.7) * 60 * Math.min(1, t);
  const inclinazione = Math.sin(t * 2) * 6;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - RAGGIO,
        top: cy - RAGGIO,
        width: RAGGIO * 2,
        height: RAGGIO * 2,
        transform: `rotate(${inclinazione}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      {/* Manico */}
      <div
        style={{
          position: "absolute",
          left: RAGGIO * 2 - 30,
          top: RAGGIO * 2 - 30,
          width: 46,
          height: 190,
          borderRadius: 18,
          background: `linear-gradient(90deg, ${colori.inchiostro}, #3a3a3a 45%, ${colori.inchiostro})`,
          transform: "rotate(-45deg)",
          transformOrigin: "50% 0",
          boxShadow: "0 14px 22px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ height: 38, background: colori.oroScuro, borderRadius: "10px 10px 0 0" }} />
      </div>
      {/* Vetro con il contenuto ingrandito */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          background: colori.sfondo,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: lato,
            height: lato,
            transformOrigin: "0 0",
            transform: `translate(${RAGGIO - cx * ZOOM}px, ${RAGGIO - cy * ZOOM}px) scale(${ZOOM})`,
          }}
        >
          {contenuto}
        </div>
        {/* Riflesso */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0.12) 22%, rgba(255,255,255,0) 45%)",
          }}
        />
      </div>
      {/* Cornice */}
      <div
        style={{
          position: "absolute",
          inset: -14,
          borderRadius: "50%",
          border: `16px solid ${colori.inchiostro}`,
          boxShadow: `inset 0 0 0 4px ${colori.oroScuro}, 0 16px 28px rgba(0,0,0,0.45)`,
        }}
      />
    </div>
  );
};

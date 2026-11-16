import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scena } from "../copione";
import { colori, font } from "../tema";
import { Etichetta } from "./Etichetta";
import { Ritaglio } from "./Ritaglio";
import { TestoParole } from "./TestoParole";
import { Timbro } from "./Timbro";

const coloriCerchio = [colori.oro, colori.corallo, colori.azzurro];

export const ScenaVideo: React.FC<{ scena: Scena; indice: number }> = ({ scena, indice }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const nParole = scena.titolo.split(" ").length;
  const fineTitolo = 8 + nParole * 4;

  // Uscita rapida verso l'alto negli ultimi frame della scena
  const uscita = interpolate(frame, [durationInFrames - 6, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opSotto = interpolate(frame, [fineTitolo, fineTitolo + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        padding: "200px 80px 0",
        opacity: 1 - uscita,
        transform: `translateY(${-60 * uscita}px)`,
      }}
    >
      {scena.etichetta && <Etichetta testo={scena.etichetta} />}
      <div style={{ marginTop: 36, minHeight: 330, display: "flex", alignItems: "center" }}>
        <TestoParole testo={scena.titolo} inizio={6} />
      </div>
      <div style={{ position: "relative", marginTop: 20 }}>
        <Ritaglio
          immagine={scena.immagine}
          segnaposto={scena.segnaposto}
          coloreCerchio={coloriCerchio[indice % coloriCerchio.length]}
          lente={scena.lente}
        />
        {scena.timbro && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, display: "flex", justifyContent: "center" }}>
            <Timbro testo={scena.timbro} ritardo={fineTitolo + 10} />
          </div>
        )}
      </div>
      {scena.sottotitolo && (
        <div
          style={{
            marginTop: 30,
            fontFamily: font.testo,
            fontSize: 50,
            color: colori.bianco,
            opacity: opSotto,
            textAlign: "center",
          }}
        >
          {scena.sottotitolo}
        </div>
      )}
    </AbsoluteFill>
  );
};

import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Chiusura } from "./componenti/Chiusura";
import { ScenaVideo } from "./componenti/ScenaVideo";
import { Sfondo } from "./componenti/Sfondo";
import { chiusura, copione, musica } from "./copione";
import { FPS } from "./tema";

export const durataTotale = () =>
  Math.round((copione.reduce((t, s) => t + s.secondi, 0) + chiusura.secondi) * FPS);

export const Video: React.FC = () => {
  let inizio = 0;
  return (
    <AbsoluteFill>
      <Sfondo />
      {copione.map((scena, i) => {
        const durata = Math.round(scena.secondi * FPS);
        const seq = (
          <Sequence key={i} from={inizio} durationInFrames={durata}>
            <ScenaVideo scena={scena} indice={i} />
          </Sequence>
        );
        inizio += durata;
        return seq;
      })}
      <Sequence from={inizio} durationInFrames={Math.round(chiusura.secondi * FPS)}>
        <Chiusura {...chiusura} />
      </Sequence>
      {musica && <Audio src={staticFile(`audio/${musica}`)} volume={0.6} />}
    </AbsoluteFill>
  );
};

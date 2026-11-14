import React from "react";
import { Audio, Sequence, interpolate, staticFile } from "remotion";

// Ogni effetto parte nel fotogramma dell'animazione a cui è legato (30 fps).
// I file sono generati da scripts/make-sfx.py.
const MASTER = 1.5; // volume generale
const CUES: { from: number; file: string; volume: number }[] = [
  { from: 7, file: "splash-fish", volume: 0.5 }, // il pesce salta fuori dall'acqua
  { from: 45, file: "shimmer", volume: 0.35 }, // PESCHERIA
  { from: 58, file: "pop", volume: 0.6 }, // Sapore di Mare
  { from: 62, file: "bubbles", volume: 0.3 }, // bollicine
  { from: 78, file: "note-a5", volume: 0.4 }, // Raffadali
  { from: 168, file: "note-d5", volume: 0.4 }, // Da tre generazioni
  { from: 180, file: "note-fs5", volume: 0.4 }, // per voi solo il pesce migliore
  { from: 205, file: "swipe", volume: 0.3 }, // linea divisoria
  { from: 215, file: "note-a4", volume: 0.3 }, // ORARI
  { from: 235, file: "note-d5", volume: 0.35 }, // Lunedì
  { from: 247, file: "note-fs5", volume: 0.35 }, // Martedì – Venerdì
  { from: 259, file: "note-a5", volume: 0.35 }, // Sabato
  { from: 410, file: "note-b5", volume: 0.35 }, // Visita il nostro sito
  { from: 418, file: "pop", volume: 0.5 }, // pulsante del sito
  { from: 436, file: "swipe", volume: 0.12 }, // il cursore si muove
  { from: 472, file: "click", volume: 0.8 }, // click
  { from: 474, file: "success", volume: 0.45 }, // pulsante attivato
  { from: 486, file: "note-d6", volume: 0.3 }, // Ti aspettiamo!
];

export const SoundEffects: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  return (
    <>
      <Audio
        src={staticFile("sfx/ocean.wav")}
        volume={(f) =>
          interpolate(
            f,
            [0, 30, durationInFrames - 45, durationInFrames],
            [0, 0.35 * MASTER, 0.35 * MASTER, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      {CUES.map((cue, i) => (
        <Sequence
          key={i}
          from={cue.from}
          name={`SFX ${cue.file}`}
          layout="none"
        >
          <Audio src={staticFile(`sfx/${cue.file}.wav`)} volume={cue.volume * MASTER} />
        </Sequence>
      ))}
    </>
  );
};

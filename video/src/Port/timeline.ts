import { Easing, interpolate } from "remotion";

export const FPS = 30;
export const DURATION = 75 * FPS; // 2250 frame = 75 s

// Fasi del cantiere (in frame)
export const T = {
  intro: [0, 180],
  dredge: [180, 480],
  breakwater: [480, 900],
  caissons: [900, 1260],
  yard: [1260, 1530],
  cranes: [1530, 1830],
  ops: [1830, 2100],
  outro: [2100, DURATION],
} as const;

export const PHASES = [
  {
    key: "dredge",
    n: "01",
    title: "Rilievi e dragaggio",
    text: "Rilievo batimetrico multibeam e approfondimento del bacino portuale con draga aspirante.",
    stats: [
      ["Fondale di progetto", "-14,0 m"],
      ["Volume dragato", "1,2 Mm³"],
    ],
  },
  {
    key: "breakwater",
    n: "02",
    title: "Diga foranea",
    text: "Nucleo in tout-venant, mantellata in massi e protezione esterna con tetrapodi in calcestruzzo.",
    stats: [
      ["Sviluppo diga", "1.450 m"],
      ["Tetrapodi", "25 t cad."],
    ],
  },
  {
    key: "caissons",
    n: "03",
    title: "Cassoni cellulari",
    text: "Cassoni in c.a. prefabbricati, trainati in galleggiamento e affondati per zavorramento.",
    stats: [
      ["Cassoni posati", "12"],
      ["Dimensioni", "32 × 20 × 17 m"],
    ],
  },
  {
    key: "yard",
    n: "04",
    title: "Colmata e piazzale",
    text: "Riempimento a tergo della banchina, consolidamento e pavimentazione del terminal.",
    stats: [
      ["Superficie piazzale", "38 ha"],
      ["Portata", "60 kN/m²"],
    ],
  },
  {
    key: "cranes",
    n: "05",
    title: "Gru e infrastrutture",
    text: "Montaggio delle gru di banchina STS, magazzini, faro di segnalamento e viabilità interna.",
    stats: [
      ["Gru STS", "4 × 65 t"],
      ["Sbraccio", "60 m"],
    ],
  },
  {
    key: "ops",
    n: "06",
    title: "Operatività",
    text: "Primo attracco: la nave portacontainer viene ormeggiata e inizia lo sbarco delle merci.",
    stats: [
      ["Capacità", "1,1 M TEU/anno"],
      ["Accosto", "400 m"],
    ],
  },
] as const;

export const ease = Easing.bezier(0.45, 0, 0.2, 1);

/** Progresso 0..1 tra due frame, con easing e clamp. */
export const prog = (
  f: number,
  a: number,
  b: number,
  e: (t: number) => number = ease,
) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

export const lin = (f: number, a: number, b: number) =>
  prog(f, a, b, (t) => t);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

import { Easing, interpolate } from "remotion";

// Formato verticale 9:16, come il video di riferimento
export const R_W = 1080;
export const R_H = 1920;
export const R_FPS = 30;

export const INTRO = 150;
export const PHASE_LEN = 270;
export const OUTRO_START = INTRO + 6 * PHASE_LEN; // 1770
export const R_DURATION = 2250; // 75 s

export const FOV = 30;
export const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);

export const TILE = 120;
export const TILE_DZ = 215;
export const TILE_X = 34;
export const NOTE_X = 63;

export const phaseStart = (i: number) => INTRO + i * PHASE_LEN;

export const tilePos = (i: number) => ({
  x: i % 2 === 0 ? -TILE_X : TILE_X,
  z: 150 + i * TILE_DZ,
});

/** Appunto scritto a mano dal lato opposto al plastico. */
export const notePos = (i: number) => {
  const t = tilePos(i);
  return { x: t.x < 0 ? NOTE_X : -NOTE_X, z: t.z - 42 };
};

export const CLOCK = { x: -TILE_X, z: 150 + 6 * TILE_DZ };
export const CLOCK_NOTE = { x: NOTE_X - 4, z: CLOCK.z - 46 };

export const NOTES = [
  { step: "fase 1 di 6", title: "Dragaggio", line: "fondale portato a", value: -14, fmt: (v: number) => `${v.toFixed(0)} m` },
  { step: "fase 2 di 6", title: "Diga foranea", line: "protegge il bacino", value: 1450, fmt: (v: number) => `${Math.round(v).toLocaleString("it-IT")} m` },
  { step: "fase 3 di 6", title: "Cassoni", line: "in cemento armato", value: 12, fmt: (v: number) => `${Math.round(v)} posati` },
  { step: "fase 4 di 6", title: "Piazzale", line: "colmata e asfalto", value: 38, fmt: (v: number) => `${Math.round(v)} ettari` },
  { step: "fase 5 di 6", title: "Gru e faro", line: "gru di banchina", value: 65, fmt: (v: number) => `4 × ${Math.round(v)} t` },
  { step: "fase 6 di 6", title: "Primo attracco", line: "capacità annua", value: 1.1, fmt: (v: number) => `${v.toFixed(1).replace(".", ",")} M TEU` },
] as const;

const io = Easing.inOut(Easing.cubic);

export const p01 = (f: number, a: number, b: number, e: (t: number) => number = io) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------ camera ------------------------------------ */
// [frame, centro x, centro z, altezza visibile in unità mondo]
type Key = [number, number, number, number];

const buildKeys = (): Key[] => {
  const k: Key[] = [
    [0, 0, 18, 300],
    [105, 0, 22, 300],
  ];
  for (let i = 0; i < 6; i++) {
    const a = phaseStart(i);
    const t = tilePos(i);
    k.push([a + 32, t.x * 0.55, t.z - 4, 300]);
    k.push([a + 140, t.x * 0.75, t.z, 262]);
    k.push([a + 185, 0, t.z - 4, 345]);
    k.push([a + 235, 0, t.z + 8, 345]);
  }
  const a = OUTRO_START;
  k.push([a + 32, CLOCK.x * 0.5, CLOCK.z - 8, 310]);
  k.push([a + 120, 0, CLOCK.z - 6, 345]);
  k.push([a + 285, 0, CLOCK.z, 352]);
  k.push([a + 420, 0, CLOCK.z - 520, 1130]);
  k.push([R_DURATION, 0, CLOCK.z - 525, 1160]);
  return k;
};

export const CAM_KEYS = buildKeys();

export const cameraAt = (frame: number) => {
  const K = CAM_KEYS;
  let i = 0;
  while (i < K.length - 2 && frame > K[i + 1][0]) i++;
  const [f0, x0, z0, v0] = K[i];
  const [f1, x1, z1, v1] = K[i + 1];
  const t = io(Math.min(1, Math.max(0, (frame - f0) / (f1 - f0))));
  // l'altezza visibile si interpola in log per uno zoom uniforme
  const vis = Math.exp(lerp(Math.log(v0), Math.log(v1), t));
  const x = lerp(x0, x1, t);
  const z = lerp(z0, z1, t);
  const h = vis / (2 * TAN);
  const k = R_H / vis; // pixel per unità sul piano carta (y = 0)
  return { x, z, h, vis, k };
};

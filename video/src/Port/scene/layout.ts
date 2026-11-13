// Planimetria del porto (unità ≈ metri in scala ridotta)

export type P2 = [number, number]; // [x, z]

export const MAIN_BREAKWATER: P2[] = [
  [-130, -40],
  [-130, 50],
  [60, 50],
];
export const SECOND_BREAKWATER: P2[] = [
  [130, -40],
  [130, 5],
];

export const QUAY_Z = -10; // filo banchina
export const CAISSON = { w: 16, d: 8, h: 17.5, count: 12 };
export const QUAY_X0 = -(CAISSON.w * CAISSON.count) / 2; // -96
export const QUAY_X1 = -QUAY_X0;
export const YARD_TOP = 3.2;

export const BERTH: [number, number, number] = [10, 0, -1.5];

/** Punti campionati lungo una polilinea, ogni `step` unità. */
export const samplePath = (pts: P2[], step: number) => {
  const out: { x: number; z: number; dx: number; dz: number; s: number }[] = [];
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const dx = (x1 - x0) / len;
    const dz = (z1 - z0) / len;
    const n = Math.ceil(len / step);
    for (let k = 0; k < n; k++) {
      const d = (k + 0.5) * (len / n);
      out.push({ x: x0 + dx * d, z: z0 + dz * d, dx, dz, s: acc + d });
    }
    acc += len;
  }
  return { points: out, length: acc };
};

/** Posizione e direzione a una distanza s lungo la polilinea. */
export const pointAt = (pts: P2[], s: number) => {
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0);
    if (s <= acc + len || i === pts.length - 2) {
      const d = Math.max(0, Math.min(len, s - acc));
      const dx = (x1 - x0) / len;
      const dz = (z1 - z0) / len;
      return { x: x0 + dx * d, z: z0 + dz * d, dx, dz };
    }
    acc += len;
  }
  return { x: pts[0][0], z: pts[0][1], dx: 1, dz: 0 };
};

/** Heading (rotazione Y) che allinea l'asse +X locale alla direzione (dx, dz). */
export const headingOf = (dx: number, dz: number) => Math.atan2(-dz, dx);

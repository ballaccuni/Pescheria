import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { CraneBarge, Dredger, SurveyBoat, Tug, useHullGeometry } from "../Port/scene/Boats";
import { tetrapodGeometry, trapezoid } from "../Port/scene/Breakwater";
import { P2, headingOf, pointAt, samplePath } from "../Port/scene/layout";

/*
 * Plastico del porto (120 × 120 unità), appoggiato sulla carta (y = 0).
 * `stage` va da 0 a 6: parte intera = fasi completate, parte decimale = avanzamento.
 */

const HALF = 60;
const SEABED = 2;
const WATER = 9;
const LAND_TOP = 10.5;
const SHORE_Z = -26;
const YT = 11; // quota piazzale
const QUAY_Z = -12;

const MAIN: P2[] = [
  [-52, SHORE_Z],
  [-52, 44],
  [18, 44],
];
const SECOND: P2[] = [
  [52, SHORE_Z],
  [52, 8],
];

const BOX_COLORS = ["#1f5fa8", "#c0392b", "#2e8b57", "#e67e22", "#7f8c8d", "#ecf0f1", "#8e44ad", "#16a085", "#d35400", "#2c3e50"];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** avanzamento (0..1) di un sotto-intervallo [a, b] della fase `ph` */
const sub = (s: number, ph: number, a: number, b: number) => smooth(clamp01((s - ph - a) / (b - a)));
const SCALE0 = new THREE.Vector3(0.0001, 0.0001, 0.0001);

/* --------------------------- base del plastico --------------------------- */

const Base: React.FC = () => {
  const trees = useMemo(
    () =>
      new Array(26).fill(0).map((_, i) => {
        const left = i < 13;
        return {
          x: (left ? -57 : 46) + random(`trx${i}`) * 10,
          z: -58 + random(`trz${i}`) * 28,
          r: 1.6 + random(`trr${i}`) * 1.4,
        };
      }),
    [],
  );
  return (
    <group>
      {/* fondale */}
      <mesh position={[0, SEABED / 2, (SHORE_Z + HALF) / 2]} castShadow receiveShadow>
        <boxGeometry args={[TILE_W, SEABED, HALF - SHORE_Z]} />
        <meshStandardMaterial color="#d2bc8c" roughness={1} />
      </mesh>
      {/* acqua (vetro colorato) */}
      <mesh position={[0, (SEABED + WATER) / 2, (SHORE_Z + HALF) / 2]} renderOrder={2} castShadow>
        <boxGeometry args={[TILE_W - 0.02, WATER - SEABED, HALF - SHORE_Z - 0.02]} />
        <meshStandardMaterial
          color="#1e90c8"
          transparent
          opacity={0.5}
          roughness={0.15}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>
      {/* terraferma */}
      <mesh position={[0, LAND_TOP / 2, (-HALF + SHORE_Z) / 2]} castShadow receiveShadow>
        <boxGeometry args={[TILE_W, LAND_TOP, SHORE_Z + HALF]} />
        <meshStandardMaterial color="#93a86b" roughness={1} />
      </mesh>
      <mesh position={[0, LAND_TOP - 0.6, SHORE_Z - 1.2]} receiveShadow>
        <boxGeometry args={[TILE_W, 1.4, 2.6]} />
        <meshStandardMaterial color="#e2d1a4" roughness={1} />
      </mesh>
      {/* strada costiera */}
      <mesh position={[0, LAND_TOP + 0.03, -58.6]} receiveShadow>
        <boxGeometry args={[TILE_W, 0.1, 2.4]} />
        <meshStandardMaterial color="#55585c" />
      </mesh>
      {trees.map((t, i) => (
        <mesh key={i} position={[t.x, LAND_TOP + t.r * 0.8, t.z]} castShadow>
          <sphereGeometry args={[t.r, 10, 8]} />
          <meshStandardMaterial color={i % 3 ? "#4f7a3a" : "#5e8a44"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

const TILE_W = HALF * 2;
const PLINTH = 4;

/* ------------------------------ 1. dragaggio ------------------------------ */

const SX0 = -44;
const SX1 = 44;
const SZ0 = -10;
const SZ1 = 36;
const COLS = 16;
const ROWS = 3;

const sand = new THREE.Color("#d2bc8c");
const cShallow = new THREE.Color("#ff9f1c");
const cMid = new THREE.Color("#2ec4b6");
const cDeep = new THREE.Color("#3a6fd0");

const Sediment: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = COLS * ROWS;
  const tw = (SX1 - SX0) / COLS;
  const td = (SZ1 - SZ0) / ROWS;
  const init = useMemo(
    () => new Array(n).fill(0).map((_, i) => 6.6 - Math.floor(i / COLS) * 0.6 - random(`sd${i}`) * 1.3),
    [n],
  );
  const survey = sub(s, 0, 0.02, 0.32);
  const heat = s < 1 ? sub(s, 0, 0.1, 0.3) : 0;
  const sweep = lerp(SX0, SX1, clamp01((s - 0.02) / 0.3));

  const dredge = (r: number) => {
    const p = clamp01((s - 0.3 - r * 0.05) / 0.55);
    const dir = r % 2 === 0 ? 1 : -1;
    const x = dir > 0 ? lerp(SX0 - 12, SX1 + 12, p) : lerp(SX1 + 12, SX0 - 12, p);
    return { x, dir, p };
  };

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const col = i % COLS;
      const r = Math.floor(i / COLS);
      const x = SX0 + (col + 0.5) * tw;
      const z = SZ0 + (r + 0.5) * td;
      const d = dredge(r);
      const passed = s >= 1 ? 1 : clamp01(d.dir > 0 ? (d.x - 6 - x) / 5 : (x - d.x - 6) / 5);
      const top = lerp(init[i], SEABED + 0.03, passed);
      const h = top - SEABED + 0.05;
      mat.makeScale(tw * 1.002, h, td * 1.002);
      mat.setPosition(x, SEABED - 0.05 + h / 2, z);
      m.setMatrixAt(i, mat);
      const k = clamp01((6.6 - top) / 4.5);
      const hc = k < 0.5 ? c.copy(cShallow).lerp(cMid, k * 2) : c.copy(cMid).lerp(cDeep, (k - 0.5) * 2);
      const shown = x < sweep ? heat * 0.75 : 0;
      m.setColorAt(i, new THREE.Color().copy(sand).lerp(hc, shown));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  if (s >= 1.02) return null;
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, n]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      {s < 1 && survey > 0 && survey < 1 ? (
        <>
          <mesh position={[sweep, WATER - 1.5, (SZ0 + SZ1) / 2]}>
            <boxGeometry args={[0.35, 0.15, SZ1 - SZ0]} />
            <meshBasicMaterial color="#5ef6ff" />
          </mesh>
          <group scale={0.5}>
            <SurveyBoat position={[sweep * 2, WATER * 2 + 0.4, 26]} sonar={1} depth={9} bob={Math.sin(t * 3)} />
          </group>
        </>
      ) : null}
      {s < 1
        ? [0, 1, 2].map((r) => {
            const d = dredge(r);
            if (d.p <= 0 || d.p >= 1) return null;
            return (
              <group key={r} scale={0.3}>
                <Dredger
                  position={[d.x / 0.3, WATER / 0.3 + 0.5, (SZ0 + (r + 0.5) * td) / 0.3]}
                  heading={d.dir > 0 ? 0 : Math.PI}
                  bob={Math.sin(t * 2 + r)}
                />
              </group>
            );
          })
        : null}
    </group>
  );
};

/* ---------------------------- 2. diga foranea ----------------------------- */

const STEP = 2.5;
const CREST = 10.2;

const BreakwaterMini: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const armorRef = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const a = samplePath(MAIN, STEP);
    const b = samplePath(SECOND, STEP);
    const offset = a.length * 0.55;
    const pts = [...a.points.map((p) => ({ ...p, side: 0 })), ...b.points.map((p) => ({ ...p, s: p.s + offset, side: 1 }))];
    const total = Math.max(a.length, b.length + offset);
    const tet: { x: number; y: number; z: number; r: THREE.Euler; sc: number; order: number }[] = [];
    pts.forEach((p, i) => {
      const nx = p.side === 0 ? -p.dz : p.dz;
      const nz = p.side === 0 ? p.dx : -p.dx;
      [
        { off: 3.2, y: CREST - 0.9 },
        { off: 5.2, y: CREST - 2.2 },
      ].forEach((row, ri) => {
        for (let k = 0; k < 2; k++) {
          const al = (k - 0.5) * 1.2;
          tet.push({
            x: p.x + p.dx * al + nx * row.off,
            y: row.y + random(`ty${i}${ri}${k}`) * 0.4,
            z: p.z + p.dz * al + nz * row.off,
            r: new THREE.Euler(random(`a${i}${ri}${k}`) * 6, random(`b${i}${ri}${k}`) * 6, random(`c${i}${ri}${k}`) * 6),
            sc: 0.62 + random(`s${i}${ri}${k}`) * 0.18,
            order: p.s / total + ri * 0.03 + random(`o${i}${ri}${k}`) * 0.04,
          });
        }
      });
    });
    return { pts, total, aLen: a.length, bLen: b.length, offset, tet };
  }, []);

  const coreGeo = useMemo(() => trapezoid(12, 4.6, SEABED, CREST - 0.6, STEP * 1.05), []);
  const crownGeo = useMemo(() => trapezoid(1.8, 1.4, CREST - 0.6, CREST + 1.6, STEP * 1.03), []);
  const tetGeo = useMemo(tetrapodGeometry, []);

  const front = sub(s, 1, 0, 0.62) * data.total;
  const armor = sub(s, 1, 0.3, 0.95);
  const crown = sub(s, 1, 0.55, 1) * data.total;

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const one = new THREE.Vector3(1, 1, 1);
    const core = coreRef.current;
    const cr = crownRef.current;
    const ar = armorRef.current;
    if (!core || !cr || !ar) return;
    data.pts.forEach((p, i) => {
      const k = s >= 2 ? 1 : clamp01((front - p.s) / 8);
      q.setFromEuler(new THREE.Euler(0, headingOf(p.dx, p.dz), 0));
      v.set(p.x, lerp(-(CREST - SEABED) - 1, 0, 1 - (1 - k) * (1 - k)), p.z);
      m.compose(v, q, k > 0 ? one : SCALE0);
      core.setMatrixAt(i, m);
      const kc = s >= 2 ? 1 : clamp01((crown - p.s) / 6);
      v.set(p.x, lerp(-6, 0, kc), p.z);
      m.compose(v, q, kc > 0 ? one : SCALE0);
      cr.setMatrixAt(i, m);
    });
    data.tet.forEach((tt, i) => {
      const k = s >= 2 ? 1 : clamp01((armor * 1.1 - tt.order) / 0.06);
      q.setFromEuler(tt.r);
      v.set(tt.x, tt.y + (1 - k) * 10, tt.z);
      m.compose(v, q, k > 0 ? new THREE.Vector3(tt.sc, tt.sc, tt.sc) : SCALE0);
      ar.setMatrixAt(i, m);
    });
    core.instanceMatrix.needsUpdate = true;
    cr.instanceMatrix.needsUpdate = true;
    ar.instanceMatrix.needsUpdate = true;
  });

  if (s < 1) return null;
  const working = s < 2;
  const barge = (pts: P2[], d: number, key: string) => {
    const p = pointAt(pts, Math.max(3, d - 4));
    const nx = -p.dz;
    const nz = p.dx;
    const sgn = key === "s" ? -1 : 1;
    const off = 11 * sgn;
    return (
      <group key={key} scale={0.4} position={[(p.x + nx * off) * 1, 0, (p.z + nz * off) * 1]}>
        <CraneBarge
          position={[0, WATER / 0.4 + 0.6, 0]}
          heading={headingOf(p.dx, p.dz)}
          boomYaw={(Math.PI / 2) * sgn + Math.sin(t * 1.6) * 0.25}
          boomPitch={0.6 + Math.sin(t * 2.1) * 0.08}
          hookDrop={6 + Math.sin(t * 2.6) * 2}
          bob={Math.sin(t * 1.8)}
        />
      </group>
    );
  };
  const fm = Math.min(front, data.aLen);
  const fs = clamp01((front - data.offset) / data.bLen) * data.bLen;

  return (
    <group>
      <instancedMesh ref={coreRef} args={[coreGeo, undefined, data.pts.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#8a8378" roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[crownGeo, undefined, data.pts.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#d9d4c8" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={armorRef} args={[tetGeo, undefined, data.tet.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#c4beb1" roughness={0.95} />
      </instancedMesh>
      {working && fm > 0 && fm < data.aLen + 2 ? barge(MAIN, fm, "m") : null}
      {working && fs > 0 && fs < data.bLen ? barge(SECOND, fs, "s") : null}
    </group>
  );
};

/* ------------------------------- 3. cassoni ------------------------------- */

const CW = 8;
const CD = 4;
const CH = 9;
const CN = 10;
const CX0 = -(CW * CN) / 2;
const CZ = QUAY_Z - CD / 2;

const Caissons: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  if (s < 2) return null;
  return (
    <group>
      {new Array(CN).fill(0).map((_, i) => {
        const st = 0.02 + i * 0.075;
        const tr = s >= 3 ? 1 : clamp01((s - 2 - st) / 0.2);
        const sk = s >= 3 ? 1 : smooth(clamp01((s - 2 - st - 0.2) / 0.08));
        if (s < 2 + st) return null;
        const xi = CX0 + CW * (i + 0.5);
        const e = 1 - Math.pow(1 - tr, 2);
        const P0 = [46, 36];
        const P1 = [lerp(30, xi, 0.4), 6];
        const P2v = [xi, CZ];
        const bz = (a: number, b: number, c: number, u: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
        const x = bz(P0[0], P1[0], P2v[0], e);
        const z = bz(P0[1], P1[1], P2v[1], e);
        const e2 = Math.min(1, e + 0.03);
        const hd = headingOf(bz(P0[0], P1[0], P2v[0], e2) - x || -1, bz(P0[1], P1[1], P2v[1], e2) - z);
        const bottom = lerp(SEABED + 3.6, SEABED, sk);
        const pop = clamp01((s - 2 - st) / 0.025);
        const bob = sk < 0.01 ? Math.sin(t * 1.5 + i) * 0.12 : 0;
        return (
          <group key={i}>
            <group position={[x, bottom + CH / 2 + bob, z]} scale={pop}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[CW - 0.15, CH, CD]} />
                <meshStandardMaterial color="#c9c4b8" roughness={0.85} />
              </mesh>
              {[-2.6, 0, 2.6].map((cx) => (
                <mesh key={cx} position={[cx, CH / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[2, 2.6]} />
                  <meshStandardMaterial color="#3b3a37" />
                </mesh>
              ))}
            </group>
            {tr < 1 ? (
              <group scale={0.36}>
                <Tug
                  position={[(x + Math.cos(hd) * 8) / 0.36, WATER / 0.36 + 0.6, (z - Math.sin(hd) * 8) / 0.36]}
                  heading={hd}
                  bob={Math.sin(t * 2 + i)}
                />
              </group>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

/* --------------------------- 4. colmata e piazzale ------------------------ */

const YARD_Z0 = -46;
const YARD_Z1 = QUAY_Z - CD;
const YX0 = CX0;
const YX1 = -CX0;

const Yard: React.FC<{ s: number }> = ({ s }) => {
  if (s < 3) return null;
  const fill = sub(s, 3, 0, 0.45);
  const cap = sub(s, 3, 0.2, 0.5);
  const pave = sub(s, 3, 0.4, 0.75);
  const furn = sub(s, 3, 0.7, 1);
  const fillTop = lerp(SEABED + 0.1, YT - 0.4, fill);
  return (
    <group>
      <mesh position={[0, (SEABED + fillTop) / 2, (SHORE_Z + YARD_Z1) / 2]} receiveShadow castShadow>
        <boxGeometry args={[YX1 - YX0 - 0.1, fillTop - SEABED, YARD_Z1 - SHORE_Z]} />
        <meshStandardMaterial color="#bfa577" roughness={1} />
      </mesh>
      {[YX0 - 1.5, YX1 + 1.5].map((x) => (
        <mesh key={x} position={[x, (SEABED + fillTop) / 2, (SHORE_Z + YARD_Z1) / 2]} castShadow>
          <boxGeometry args={[3, fillTop - SEABED + 0.3, YARD_Z1 - SHORE_Z]} />
          <meshStandardMaterial color="#7d786f" roughness={1} flatShading />
        </mesh>
      ))}
      {cap > 0 ? (
        <mesh position={[YX0 + ((YX1 - YX0) * cap) / 2, YT + 0.35, CZ]} castShadow receiveShadow>
          <boxGeometry args={[(YX1 - YX0) * cap, 0.7, CD + 0.3]} />
          <meshStandardMaterial color="#e0dcd2" roughness={0.8} />
        </mesh>
      ) : null}
      {pave > 0 ? (
        <mesh
          position={[YX0 - 4 + ((YX1 - YX0 + 8) * pave) / 2, YT + 0.05, (YARD_Z0 + YARD_Z1) / 2]}
          receiveShadow
        >
          <boxGeometry args={[(YX1 - YX0 + 8) * pave, 0.3, YARD_Z1 - YARD_Z0]} />
          <meshStandardMaterial color="#62666b" roughness={0.9} />
        </mesh>
      ) : null}
      {/* binari gru e segnaletica */}
      {[QUAY_Z - 1.5, QUAY_Z - 10].map((z) => (
        <mesh key={z} position={[0, YT + 0.25, z]} scale={[Math.max(0.0001, furn), 1, 1]}>
          <boxGeometry args={[YX1 - YX0, 0.1, 0.3]} />
          <meshStandardMaterial color="#9a9a9a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {[-24, -38].map((z) => (
        <mesh key={z} position={[0, YT + 0.22, z]} scale={[Math.max(0.0001, furn), 1, 1]}>
          <boxGeometry args={[YX1 - YX0 - 2, 0.05, 0.22]} />
          <meshStandardMaterial color="#f5f5f0" />
        </mesh>
      ))}
      {new Array(10).fill(0).map((_, k) => {
        const p = clamp01(furn * 12 - k);
        return (
          <mesh key={k} position={[YX0 + 4 + k * 8, YT + 0.7, QUAY_Z - 0.6]} scale={[1, Math.max(0.0001, p), 1]} castShadow>
            <cylinderGeometry args={[0.35, 0.42, 0.9, 8]} />
            <meshStandardMaterial color="#1e1e1e" />
          </mesh>
        );
      })}
      {s < 4
        ? [0, 1].map((k) => {
            const tt = ((s - 3) * 3 + k * 0.5) % 1;
            return (
              <group key={k} position={[lerp(YX0 + 6, YX1 - 6, tt), fillTop + 0.2, -20 - k * 3]} visible={fill > 0.2 && fill < 1}>
                <mesh position={[0, 0.9, 0]} castShadow>
                  <boxGeometry args={[3.4, 1.4, 1.8]} />
                  <meshStandardMaterial color="#f2b705" />
                </mesh>
              </group>
            );
          })
        : null}
    </group>
  );
};

/* ----------------------- 5. gru, edifici e faro --------------------------- */

const RAIL_SEA = QUAY_Z - 1.5;
const RAIL_LAND = QUAY_Z - 10;
const ORANGE = "#e8742c";

const CraneMini: React.FC<{ x: number; b: number; ops: number; t: number; idx: number }> = ({ x, b, ops, t, idx }) => {
  const legs = smooth(clamp01(b / 0.4));
  const top = smooth(clamp01((b - 0.3) / 0.3));
  const boom = smooth(clamp01((b - 0.6) / 0.4));
  if (legs <= 0) return null;
  const legH = 14 * legs;
  const angle = (1 - boom) * 1.35;
  const cyc = (t * 0.3 + idx * 0.31) % 1;
  const tri = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2;
  const tz = lerp(RAIL_LAND + 3, -7.5, smooth(tri) * ops);
  const drop = 3 + ops * (0.5 + 0.5 * Math.cos(cyc * Math.PI * 4)) * 9;
  const carrying = ops > 0.5 && cyc > 0.25 && cyc < 0.75;
  const leg = (dx: number, z: number) => (
    <mesh key={`${dx}${z}`} position={[dx, YT + legH / 2, z]} castShadow>
      <boxGeometry args={[0.7, legH, 0.7]} />
      <meshStandardMaterial color={ORANGE} roughness={0.55} />
    </mesh>
  );
  return (
    <group position={[x, 0, 0]}>
      {leg(-3.4, RAIL_SEA)}
      {leg(3.4, RAIL_SEA)}
      {leg(-3.4, RAIL_LAND)}
      {leg(3.4, RAIL_LAND)}
      {[RAIL_SEA, RAIL_LAND].map((z) => (
        <mesh key={z} position={[0, YT + 9 * legs, z]} castShadow>
          <boxGeometry args={[7.4, 0.6, 0.6]} />
          <meshStandardMaterial color={ORANGE} />
        </mesh>
      ))}
      <group position={[0, YT + 14, 0]} scale={[1, Math.max(0.0001, top), 1]}>
        {[-3.4, 3.4].map((dx) => (
          <group key={dx}>
            <mesh position={[dx, 0, (RAIL_SEA + RAIL_LAND) / 2]} castShadow>
              <boxGeometry args={[0.6, 0.7, RAIL_SEA - RAIL_LAND + 0.7]} />
              <meshStandardMaterial color={ORANGE} />
            </mesh>
            <mesh position={[dx * 0.6, 3.6, RAIL_SEA - 1]} rotation={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.5, 7.6, 0.5]} />
              <meshStandardMaterial color={ORANGE} />
            </mesh>
            <mesh position={[dx * 0.55, 3, RAIL_LAND - 3]} castShadow>
              <boxGeometry args={[0.55, 0.9, 16]} />
              <meshStandardMaterial color={ORANGE} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 4.1, RAIL_LAND - 8]} castShadow>
          <boxGeometry args={[4.4, 1.8, 3.8]} />
          <meshStandardMaterial color="#f4f4f0" />
        </mesh>
      </group>
      <group position={[0, YT + 17, RAIL_SEA + 0.6]} rotation={[-angle, 0, 0]} visible={top > 0.6}>
        {[-1.9, 1.9].map((dx) => (
          <mesh key={dx} position={[dx, 0, 9]} castShadow>
            <boxGeometry args={[0.6, 1, 18]} />
            <meshStandardMaterial color={ORANGE} />
          </mesh>
        ))}
        {[3, 9, 15].map((z) => (
          <mesh key={z} position={[0, 0.3, z]}>
            <boxGeometry args={[4.4, 0.3, 0.3]} />
            <meshStandardMaterial color={ORANGE} />
          </mesh>
        ))}
      </group>
      {boom > 0.98 ? (
        <group position={[0, YT + 16.3, tz]}>
          <mesh castShadow>
            <boxGeometry args={[3, 1, 2.2]} />
            <meshStandardMaterial color="#f4f4f0" />
          </mesh>
          <mesh position={[0, -drop / 2, 0]}>
            <boxGeometry args={[0.08, drop, 0.08]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, -drop - 0.2, 0]} castShadow>
            <boxGeometry args={[4.2, 0.35, 1.2]} />
            <meshStandardMaterial color="#f2c230" />
          </mesh>
          {carrying ? (
            <mesh position={[0, -drop - 0.95, 0]} castShadow>
              <boxGeometry args={[4, 1.15, 1.1]} />
              <meshStandardMaterial color={BOX_COLORS[idx * 3]} />
            </mesh>
          ) : null}
        </group>
      ) : null}
    </group>
  );
};

const Warehouse: React.FC<{ x: number; z: number; w: number; d: number; h: number; p: number; color: string }> = ({
  x,
  z,
  w,
  d,
  h,
  p,
  color,
}) => {
  const roof = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-d / 2, 0);
    sh.lineTo(d / 2, 0);
    sh.lineTo(0, 1.8);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false });
    g.translate(0, 0, -w / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [w, d]);
  if (p <= 0) return null;
  return (
    <group position={[x, LAND_TOP, z]} scale={[1, p, 1]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh geometry={roof} position={[0, h, 0]} castShadow>
        <meshStandardMaterial color="#8d99a6" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
};

const Lighthouse: React.FC<{ p: number; glow: number }> = ({ p, glow }) => {
  if (p <= 0) return null;
  return (
    <group position={[18, CREST + 1.6, 44]} scale={[1, p, 1]}>
      {[0, 1, 2, 3].map((b) => (
        <mesh key={b} position={[0, b * 1.6 + 0.8, 0]} castShadow>
          <cylinderGeometry args={[1.25 - (b + 1) * 0.1, 1.25 - b * 0.1, 1.6, 16]} />
          <meshStandardMaterial color={b % 2 ? "#f4f4f1" : "#c62828"} />
        </mesh>
      ))}
      <mesh position={[0, 7.1, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1, 12]} />
        <meshStandardMaterial color="#fff6c2" emissive="#ffd54a" emissiveIntensity={0.5 + glow * 3} />
      </mesh>
      <mesh position={[0, 8, 0]} castShadow>
        <coneGeometry args={[0.9, 0.9, 12]} />
        <meshStandardMaterial color="#c62828" />
      </mesh>
    </group>
  );
};

/* ------------------------------ 6. operatività ---------------------------- */

const YardBoxes: React.FC<{ pre: number; ops: number }> = ({ pre, ops }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const slots = useMemo(() => {
    const out: { x: number; y: number; z: number; c: string; o: number; pre: boolean }[] = [];
    [-26.5, -28, -29.5, -33, -34.5, -36].forEach((z, r) => {
      for (let c = 0; c < 17; c++) {
        if (c === 8) continue;
        const hgt = 1 + Math.floor(random(`h${r}-${c}`) * 3);
        for (let k = 0; k < hgt; k++)
          out.push({
            x: YX0 + 3 + c * 4.6,
            z,
            y: YT + 0.75 + k * 1.18,
            c: BOX_COLORS[Math.floor(random(`c${r}-${c}-${k}`) * BOX_COLORS.length)],
            o: random(`o${r}-${c}`) * 0.85 + k * 0.05,
            pre: random(`p${r}-${c}`) < 0.4,
          });
      }
    });
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    const col = new THREE.Color();
    slots.forEach((sl, i) => {
      const p = sl.pre ? pre : ops;
      const k = clamp01((p * 1.05 - sl.o) / 0.08);
      const sc = k > 0 ? 1 : 0.0001;
      mat.makeScale(4 * sc, 1.12 * sc, 1.1 * sc);
      mat.setPosition(sl.x, sl.y + (1 - k) * 5, sl.z);
      m.setMatrixAt(i, mat);
      m.setColorAt(i, col.set(sl.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, slots.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
};

const ShipMini: React.FC<{ arrive: number; unload: number; t: number }> = ({ arrive, unload, t }) => {
  const hull = useHullGeometry(40, 7, 5);
  const ref = useRef<THREE.InstancedMesh>(null);
  const boxes = useMemo(() => {
    const l: { x: number; y: number; z: number; c: string; o: number }[] = [];
    for (let b = 0; b < 7; b++)
      for (let r = 0; r < 3; r++) {
        const tiers = 2 + Math.floor(random(`t${b}${r}`) * 2);
        for (let k = 0; k < tiers; k++)
          l.push({
            x: -10 + b * 4.3,
            z: -2.3 + r * 2.3,
            y: 3.3 + k * 1.16,
            c: BOX_COLORS[Math.floor(random(`sc${b}${r}${k}`) * BOX_COLORS.length)],
            o: (tiers - k) * 0.25 + random(`so${b}${r}`) * 0.25,
          });
      }
    return l;
  }, []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    const col = new THREE.Color();
    boxes.forEach((b, i) => {
      const gone = unload * 0.55 > b.o - 0.25 && b.o < 0.55;
      const sc = gone ? 0.0001 : 1;
      mat.makeScale(4 * sc, 1.12 * sc, 2.1 * sc);
      mat.setPosition(b.x, b.y, b.z);
      m.setMatrixAt(i, mat);
      m.setColorAt(i, col.set(b.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  const e = 1 - Math.pow(1 - arrive, 2.2);
  const bz = (a: number, b: number, c: number, u: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
  const P0 = [36, 30];
  const P1 = [26, QUAY_Z + 4.4];
  const P2v = [2, QUAY_Z + 4.4];
  const x = bz(P0[0], P1[0], P2v[0], e);
  const z = bz(P0[1], P1[1], P2v[1], e);
  const e2 = Math.min(1, e + 0.02);
  const dx = bz(P0[0], P1[0], P2v[0], e2) - x;
  const dz = bz(P0[1], P1[1], P2v[1], e2) - z;
  const hd = arrive >= 0.999 ? Math.PI : headingOf(dx || -1, dz);
  const pop = clamp01(arrive / 0.06);
  return (
    <group position={[x, WATER + 0.2 + Math.sin(t) * 0.06, z]} rotation={[0, hd, 0]} scale={pop}>
      <mesh geometry={hull} castShadow receiveShadow>
        <meshStandardMaterial color="#1c2d3f" roughness={0.55} />
      </mesh>
      <mesh position={[-16, 4.6, 0]} castShadow>
        <boxGeometry args={[4, 4.6, 6.4]} />
        <meshStandardMaterial color="#f2f2ee" />
      </mesh>
      <mesh position={[-15.3, 7.2, 0]} castShadow>
        <boxGeometry args={[2, 0.8, 8]} />
        <meshStandardMaterial color="#26313b" />
      </mesh>
      <mesh position={[-18, 7.4, 0]} castShadow>
        <boxGeometry args={[1.3, 2.6, 1.6]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, boxes.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </group>
  );
};

const Trucks: React.FC<{ on: number; t: number }> = ({ on, t }) => {
  if (on <= 0) return null;
  return (
    <group>
      {[0, 1, 2, 3].map((k) => {
        const dir = k % 2 ? -1 : 1;
        const p = (t * 0.08 + k / 4) % 1;
        const x = dir > 0 ? lerp(YX0 - 4, YX1 + 4, p) : lerp(YX1 + 4, YX0 - 4, p);
        return (
          <group key={k} position={[x, YT + 0.2, dir > 0 ? -23.4 : -24.8]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]} scale={on}>
            <mesh position={[2.3, 0.75, 0]} castShadow>
              <boxGeometry args={[1, 1.2, 1.1]} />
              <meshStandardMaterial color="#f0f0ea" />
            </mesh>
            <mesh position={[-0.4, 0.85, 0]} castShadow>
              <boxGeometry args={[4, 1.12, 1.08]} />
              <meshStandardMaterial color={BOX_COLORS[(k * 3 + 1) % BOX_COLORS.length]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/* --------------------------------- plastico -------------------------------- */

export const Diorama: React.FC<{ stage: number; t: number }> = ({ stage: s, t }) => {
  const cranes = [-24, 0, 24];
  const wh = (k: number) => sub(s, 4, 0.25 + k * 0.08, 0.55 + k * 0.08);
  const lh = sub(s, 4, 0.55, 0.85);
  const ops = sub(s, 5, 0.42, 0.55);
  return (
    <group>
      {/* basamento del plastico */}
      <mesh position={[0, PLINTH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[TILE_W + 3, PLINTH, TILE_W + 3]} />
        <meshStandardMaterial color="#efe6d2" roughness={0.75} />
      </mesh>
      <group position={[0, PLINTH, 0]}>
      <Base />
      <Sediment s={s} t={t} />
      <BreakwaterMini s={s} t={t} />
      <Caissons s={s} t={t} />
      <Yard s={s} />
      {s >= 4
        ? cranes.map((x, i) => (
            <CraneMini key={i} x={x} idx={i} b={s >= 5 ? 1 : clamp01((s - 4 - i * 0.08) / 0.55)} ops={ops} t={t} />
          ))
        : null}
      {s >= 4 ? (
        <>
          <Warehouse x={-27} z={-52} w={28} d={9} h={4.5} p={wh(0)} color="#ddd6c6" />
          <Warehouse x={6} z={-52} w={28} d={9} h={4.5} p={wh(1)} color="#d3dadf" />
          <group position={[37, LAND_TOP, -51]} scale={[1, Math.max(0.0001, wh(2)), 1]}>
            <mesh position={[0, 3, 0]} castShadow>
              <boxGeometry args={[9, 6, 7]} />
              <meshStandardMaterial color="#eef1f3" />
            </mesh>
            <mesh position={[2.5, 8, 0]} castShadow>
              <cylinderGeometry args={[1, 1.2, 6, 12]} />
              <meshStandardMaterial color="#eef1f3" />
            </mesh>
            <mesh position={[2.5, 11.6, 0]} castShadow>
              <cylinderGeometry args={[2, 1.5, 1.4, 12]} />
              <meshStandardMaterial color="#2f4f6f" metalness={0.5} roughness={0.25} />
            </mesh>
          </group>
          <Lighthouse p={lh} glow={s >= 5 ? 0.5 + 0.5 * Math.sin(t * 5) : 0} />
          <YardBoxes pre={sub(s, 4, 0.7, 1)} ops={sub(s, 5, 0.5, 1)} />
        </>
      ) : null}
      {s >= 5 ? (
        <>
          <ShipMini arrive={sub(s, 5, 0, 0.42)} unload={sub(s, 5, 0.5, 1)} t={t} />
          <Trucks on={sub(s, 5, 0.15, 0.25)} t={t} />
        </>
      ) : null}
      </group>
    </group>
  );
};

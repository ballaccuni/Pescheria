import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { random, useCurrentFrame } from "remotion";
import { FPS, T, lerp, prog } from "../timeline";
import { CraneBarge } from "./Boats";
import { SEABED_Y } from "./Environment";
import {
  MAIN_BREAKWATER,
  SECOND_BREAKWATER,
  P2,
  headingOf,
  pointAt,
  samplePath,
} from "./layout";

const CREST = 4.2;
const STEP = 3;

// Tempi: nucleo, mantellata in tetrapodi, muro paraonde
const CORE: [number, number] = [T.breakwater[0] + 10, T.breakwater[0] + 290];
const ARMOR: [number, number] = [T.breakwater[0] + 150, T.breakwater[1] - 10];
const CROWN: [number, number] = [T.breakwater[0] + 300, T.breakwater[1] + 30];

export const trapezoid = (bottomW: number, topW: number, y0: number, y1: number, len: number) => {
  const s = new THREE.Shape();
  s.moveTo(-bottomW / 2, y0);
  s.lineTo(bottomW / 2, y0);
  s.lineTo(topW / 2, y1);
  s.lineTo(-topW / 2, y1);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.translate(0, 0, -len / 2);
  g.rotateY(Math.PI / 2); // estrusione lungo X, sezione nel piano YZ
  return g;
};

export const tetrapodGeometry = () => {
  const legs: THREE.BufferGeometry[] = [];
  const dirs = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.943, -0.333, 0),
    new THREE.Vector3(-0.471, -0.333, 0.816),
    new THREE.Vector3(-0.471, -0.333, -0.816),
  ];
  for (const d of dirs) {
    const c = new THREE.CylinderGeometry(0.28, 0.62, 1.5, 7);
    c.translate(0, 0.75, 0);
    c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d));
    legs.push(c.toNonIndexed());
  }
  const g = mergeGeometries(legs)!;
  g.computeVertexNormals();
  return g;
};

type Seg = { x: number; z: number; dx: number; dz: number; s: number; side: number };

const buildPaths = () => {
  const a = samplePath(MAIN_BREAKWATER, STEP);
  const b = samplePath(SECOND_BREAKWATER, STEP);
  // il molo di sottoflutto parte dopo: lo trasliamo in "s"
  const offset = a.length * 0.62;
  const core: Seg[] = [
    ...a.points.map((p) => ({ ...p, side: 0 })),
    ...b.points.map((p) => ({ ...p, s: p.s + offset, side: 1 })),
  ];
  const total = Math.max(a.length, b.length + offset);
  return { core, total, aLen: a.length, bLen: b.length, offset };
};

export const Breakwater: React.FC = () => {
  const frame = useCurrentFrame();
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const armorRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);

  const paths = useMemo(buildPaths, []);
  const coreGeo = useMemo(() => trapezoid(26, 9, SEABED_Y, CREST - 1.2, STEP * 1.04), []);
  const crownGeo = useMemo(() => trapezoid(3.2, 2.4, CREST - 1.2, CREST + 3.2, STEP * 1.02), []);
  const tetraGeo = useMemo(tetrapodGeometry, []);

  // Tetrapodi: sul lato esterno (mare aperto) della diga
  const tetras = useMemo(() => {
    const list: { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; order: number }[] = [];
    paths.core.forEach((p, i) => {
      // normale verso mare: per la diga principale, a sinistra/fuori del bacino
      const nx = p.side === 0 ? -p.dz : p.dz;
      const nz = p.side === 0 ? p.dx : -p.dx;
      const outward = 1;
      const rows = [
        { off: 5.2, y: CREST - 1.2 },
        { off: 8.4, y: CREST - 3.6 },
        { off: 11.4, y: CREST - 6.2 },
      ];
      rows.forEach((row, ri) => {
        for (let k = 0; k < 2; k++) {
          const along = (k - 0.5) * 1.5 + (random(`ta${i}${ri}${k}`) - 0.5);
          list.push({
            x: p.x + p.dx * along + nx * row.off * outward,
            y: row.y + random(`ty${i}${ri}${k}`) * 0.8,
            z: p.z + p.dz * along + nz * row.off * outward,
            rx: random(`rx${i}${ri}${k}`) * 6,
            ry: random(`ry${i}${ri}${k}`) * 6,
            rz: random(`rz${i}${ri}${k}`) * 6,
            s: 1.1 + random(`ts${i}${ri}${k}`) * 0.35,
            order: p.s / paths.total + ri * 0.02 + random(`to${i}${ri}${k}`) * 0.03,
          });
        }
      });
    });
    return list;
  }, [paths]);

  const coreFront = prog(frame, CORE[0], CORE[1], (t) => t) * paths.total;
  const armorP = prog(frame, ARMOR[0], ARMOR[1], (t) => t);
  const crownFront = prog(frame, CROWN[0], CROWN[1], (t) => t) * paths.total;

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3(1, 1, 1);
    const core = coreRef.current;
    const crown = crownRef.current;
    if (core && crown) {
      paths.core.forEach((p, i) => {
        // ogni tratto "emerge" dal fondale quando il fronte lo raggiunge
        const k = THREE.MathUtils.clamp((coreFront - p.s) / 14, 0, 1);
        const rise = (1 - (1 - k) * (1 - k)) ;
        const y = lerp(-(CREST - SEABED_Y) - 2, 0, rise);
        e.set(0, headingOf(p.dx, p.dz), 0);
        q.setFromEuler(e);
        v.set(p.x, y, p.z);
        m.compose(v, q, sc);
        core.setMatrixAt(i, m);
        const kc = THREE.MathUtils.clamp((crownFront - p.s) / 10, 0, 1);
        v.set(p.x, lerp(-12, 0, kc), p.z);
        m.compose(v, q, kc > 0 ? sc : new THREE.Vector3(0.0001, 0.0001, 0.0001));
        crown.setMatrixAt(i, m);
      });
      core.instanceMatrix.needsUpdate = true;
      crown.instanceMatrix.needsUpdate = true;
    }
    const armor = armorRef.current;
    if (armor) {
      tetras.forEach((tt, i) => {
        const k = THREE.MathUtils.clamp((armorP * 1.08 - tt.order) / 0.05, 0, 1);
        const drop = (1 - k) * 18;
        e.set(tt.rx, tt.ry, tt.rz);
        q.setFromEuler(e);
        v.set(tt.x, tt.y + drop, tt.z);
        const s = k > 0 ? tt.s : 0.0001;
        m.compose(v, q, new THREE.Vector3(s, s, s));
        armor.setMatrixAt(i, m);
      });
      armor.instanceMatrix.needsUpdate = true;
    }
  }, [frame, paths, tetras, coreFront, armorP, crownFront]);

  // Pontoni gru al fronte di avanzamento
  const t = frame / FPS;
  const showBarges = frame > CORE[0] - 20 && frame < ARMOR[1] + 15;
  const frontMain = Math.min(coreFront, paths.aLen);
  const frontSecond = THREE.MathUtils.clamp(coreFront - paths.offset, 0, paths.bLen);
  const bargeAt = (pts: P2[], s: number, side: number, key: string) => {
    const p = pointAt(pts, s);
    const nx = -p.dz;
    const nz = p.dx;
    const off = side * 22;
    return (
      <CraneBarge
        key={key}
        position={[p.x + nx * off, 0.4, p.z + nz * off]}
        heading={headingOf(p.dx, p.dz)}
        boomYaw={(Math.PI / 2) * side + Math.sin(t * 1.6) * 0.25}
        boomPitch={0.6 + Math.sin(t * 2.1) * 0.08}
        hookDrop={6 + Math.sin(t * 2.6) * 2}
        bob={Math.sin(t * 1.8)}
      />
    );
  };

  return (
    <group>
      <instancedMesh
        ref={coreRef}
        args={[coreGeo, undefined, paths.core.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#8a8378" roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh
        ref={crownRef}
        args={[crownGeo, undefined, paths.core.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#c9c4b8" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={armorRef} args={[tetraGeo, undefined, tetras.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#b9b3a6" roughness={0.95} />
      </instancedMesh>
      {showBarges ? (
        <>
          {bargeAt(MAIN_BREAKWATER, Math.max(4, frontMain - 6), 1, "m")}
          {frontSecond > 0 ? bargeAt(SECOND_BREAKWATER, Math.max(4, frontSecond - 6), 1, "s") : null}
        </>
      ) : null}
    </group>
  );
};

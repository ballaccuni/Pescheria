import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { random, useCurrentFrame } from "remotion";
import { FPS, T, lerp, lin, prog } from "../timeline";
import { Dredger, SurveyBoat } from "./Boats";
import { SEABED_Y } from "./Environment";

const X0 = -120;
const X1 = 120;
const Z0 = -8;
const Z1 = 44;
const COLS = 30;
const ROWS = 3;
const TW = (X1 - X0) / COLS;
const TD = (Z1 - Z0) / ROWS;
const BOTTOM = SEABED_Y - 0.6;
const FINAL_TOP = SEABED_Y + 0.08;

const SURVEY: [number, number] = [T.dredge[0] + 10, T.dredge[0] + 120];
const DREDGE_START = T.dredge[0] + 95;
const DREDGE_LEN = 185;
const ROW_DELAY = 22;

const sand = new THREE.Color("#a8936a");
const shallow = new THREE.Color("#ff9f1c");
const mid = new THREE.Color("#2ec4b6");
const deep = new THREE.Color("#1d4ed8");
const tmp = new THREE.Color();

const depthColor = (top: number) => {
  // -5 (basso fondale) -> arancio, -14 (progetto) -> blu
  const t = THREE.MathUtils.clamp((-5 - top) / 9, 0, 1);
  if (t < 0.5) return tmp.copy(shallow).lerp(mid, t * 2);
  return tmp.copy(mid).lerp(deep, (t - 0.5) * 2);
};

/** Posizione X della draga sulla riga r al frame f. */
const dredgerX = (r: number, f: number) => {
  const p = lin(f, DREDGE_START + r * ROW_DELAY, DREDGE_START + r * ROW_DELAY + DREDGE_LEN);
  const dir = r % 2 === 0 ? 1 : -1;
  const from = dir === 1 ? X0 - 30 : X1 + 30;
  const to = dir === 1 ? X1 + 30 : X0 - 30;
  return { x: lerp(from, to, p), dir, p };
};

export const Dredging: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = ROWS * COLS;

  const initialTop = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => {
        const c = i % COLS;
        const r = Math.floor(i / COLS);
        // fondale naturale: più basso verso costa e con piccole irregolarità
        return (
          -5.2 -
          r * 1.1 -
          Math.sin(c * 0.5) * 0.6 -
          random(`sed${i}`) * 1.2
        );
      }),
    [count],
  );

  const heat = prog(frame, SURVEY[0] + 20, SURVEY[1]) * (1 - prog(frame, T.breakwater[0] + 60, T.breakwater[0] + 200));
  const sweepX = lerp(X0, X1, lin(frame, SURVEY[0], SURVEY[1]));

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const c = i % COLS;
      const r = Math.floor(i / COLS);
      const x = X0 + (c + 0.5) * TW;
      const z = Z0 + (r + 0.5) * TD;
      const d = dredgerX(r, frame);
      // la cella è dragata quando la draga la supera (con breve transizione)
      const passed = d.dir === 1 ? (d.x - 18 - x) / 14 : (x - (d.x + 18)) / 14;
      const k = THREE.MathUtils.clamp(passed, 0, 1);
      const top = lerp(initialTop[i], FINAL_TOP, k);
      const h = top - BOTTOM;
      m.makeScale(TW * 1.001, h, TD * 1.001);
      m.setPosition(x, BOTTOM + h / 2, z);
      mesh.setMatrixAt(i, m);
      // colore: mappa batimetrica dove il rilievo è già passato
      const revealed = x < sweepX ? 1 : 0;
      const col = new THREE.Color().copy(sand);
      col.lerp(depthColor(top), heat * revealed);
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [frame, count, initialTop, heat, sweepX]);

  const visible = frame < T.caissons[0];
  const t = frame / FPS;
  const surveyOn = frame >= SURVEY[0] - 30 && frame <= SURVEY[1] + 40;
  const sp = lin(frame, SURVEY[0] - 30, SURVEY[1] + 40);
  const sonar = prog(frame, SURVEY[0], SURVEY[0] + 10) * (1 - prog(frame, SURVEY[1], SURVEY[1] + 15));

  return (
    <group visible={visible}>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>

      {/* linea di scansione multibeam */}
      {heat > 0.01 && frame < SURVEY[1] + 10 ? (
        <mesh position={[sweepX, -4.5, (Z0 + Z1) / 2]}>
          <boxGeometry args={[0.6, 0.2, Z1 - Z0]} />
          <meshBasicMaterial color="#5ef6ff" transparent opacity={0.9} />
        </mesh>
      ) : null}

      {surveyOn ? (
        <SurveyBoat
          position={[lerp(-70, 90, sp), 0.3, 20]}
          heading={0}
          bob={Math.sin(t * 3)}
          sonar={sonar}
          depth={8}
        />
      ) : null}

      {[0, 1, 2].map((r) => {
        const d = dredgerX(r, frame);
        const active = frame > DREDGE_START + r * ROW_DELAY - 5 && d.p < 1;
        if (!active) return null;
        return (
          <Dredger
            key={r}
            position={[d.x, 0.2, Z0 + (r + 0.5) * TD]}
            heading={d.dir === 1 ? 0 : Math.PI}
            bob={Math.sin(t * 2 + r)}
          />
        );
      })}
    </group>
  );
};

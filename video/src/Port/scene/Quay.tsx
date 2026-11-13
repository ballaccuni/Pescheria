import React from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { FPS, T, lerp, lin, prog } from "../timeline";
import { Tug } from "./Boats";
import { SEABED_Y } from "./Environment";
import { CAISSON, QUAY_X0, QUAY_X1, QUAY_Z, YARD_TOP, headingOf } from "./layout";

const CZ = QUAY_Z - CAISSON.d / 2; // asse cassoni
const DRAFT = 8;
const TRAVEL = 105;
const SINK = 45;
const STAGGER = 17;

const YARD_Z0 = -78; // retro piazzale (su terraferma)
const YARD_Z1 = QUAY_Z - CAISSON.d; // dietro i cassoni

const bez = (a: number, b: number, c: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

/** Stato di un cassone al frame f. */
const caissonState = (i: number, f: number) => {
  const xi = QUAY_X0 + CAISSON.w * (i + 0.5);
  const start = T.caissons[0] + 8 + i * STAGGER;
  const tt = lin(f, start, start + TRAVEL);
  const e = tt < 1 ? 1 - Math.pow(1 - tt, 2.2) : 1;
  const P0 = [175, 75];
  const P1 = [lerp(105, xi, 0.35), 18];
  const P2 = [xi, CZ];
  const x = bez(P0[0], P1[0], P2[0], e);
  const z = bez(P0[1], P1[1], P2[1], e);
  // tangente per orientare il rimorchiatore
  const e2 = Math.min(1, e + 0.02);
  const dx = bez(P0[0], P1[0], P2[0], e2) - x;
  const dz = bez(P0[1], P1[1], P2[1], e2) - z;
  const sink = prog(f, start + TRAVEL, start + TRAVEL + SINK);
  const bottom = lerp(-DRAFT, SEABED_Y, sink);
  return { x, z, bottom, visible: f >= start - 1, moving: tt < 1, heading: headingOf(dx || -1, dz), tt, sink };
};

const Caisson: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const s = caissonState(i, frame);
  if (!s.visible) return null;
  const t = frame / FPS;
  const bob = s.sink < 0.01 ? Math.sin(t * 1.5 + i) * 0.25 : 0;
  const y = s.bottom + CAISSON.h / 2 + bob;
  const cells: [number, number][] = [];
  for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) cells.push([a, b]);
  return (
    <group>
      <group position={[s.x, y, s.z]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[CAISSON.w - 0.25, CAISSON.h, CAISSON.d]} />
          <meshStandardMaterial color="#bdb8ad" roughness={0.85} />
        </mesh>
        {/* celle aperte in sommità */}
        {cells.map(([a, b]) => (
          <mesh
            key={`${a}-${b}`}
            position={[-CAISSON.w / 2 + 2.1 + a * 3.85, CAISSON.h / 2 + 0.01, -CAISSON.d / 2 + 2.05 + b * 3.9]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[3.1, 3.1]} />
            <meshStandardMaterial color="#3b3a37" roughness={1} />
          </mesh>
        ))}
        {/* linea di galleggiamento */}
        <mesh position={[0, -CAISSON.h / 2 + DRAFT, 0]}>
          <boxGeometry args={[CAISSON.w - 0.2, 0.25, CAISSON.d + 0.06]} />
          <meshStandardMaterial color="#b23a2e" />
        </mesh>
      </group>
      {s.moving ? (
        <Tug
          position={[s.x + Math.cos(s.heading) * 20, 0.4, s.z - Math.sin(s.heading) * 20]}
          heading={s.heading}
          bob={Math.sin(t * 2 + i)}
        />
      ) : null}
    </group>
  );
};

const DumpTruck: React.FC<{ x: number; z: number; y: number; heading: number }> = ({ x, z, y, heading }) => (
  <group position={[x, y, z]} rotation={[0, heading, 0]}>
    <mesh position={[0, 1.6, 0]} castShadow>
      <boxGeometry args={[6, 2.2, 3.2]} />
      <meshStandardMaterial color="#f2b705" roughness={0.6} />
    </mesh>
    <mesh position={[3.8, 1.8, 0]} castShadow>
      <boxGeometry args={[1.8, 2.4, 3]} />
      <meshStandardMaterial color="#f2b705" />
    </mesh>
    <mesh position={[0.2, 0.55, 0]}>
      <boxGeometry args={[7.4, 1.1, 3.4]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  </group>
);

export const Quay: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // Colmata e pavimentazione
  const fill = prog(frame, T.yard[0], T.yard[0] + 130);
  const fillTop = lerp(SEABED_Y + 0.2, YARD_TOP - 0.3, fill);
  const pave = prog(frame, T.yard[0] + 110, T.yard[0] + 200);
  const paveW = (QUAY_X1 - QUAY_X0 + 60) * pave;
  const cap = prog(frame, T.yard[0] + 60, T.yard[0] + 140);
  const furniture = prog(frame, T.yard[0] + 190, T.yard[1]);
  const yardLen = YARD_Z1 - YARD_Z0;

  const bollards = [];
  for (let k = 0; k < 16; k++) {
    const x = QUAY_X0 + 6 + k * 12;
    const p = THREE.MathUtils.clamp(furniture * 18 - k, 0, 1);
    bollards.push(
      <group key={k} position={[x, YARD_TOP + 0.9, QUAY_Z - 1.2]} scale={[1, p, 1]} visible={p > 0}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.6, 1.2, 10]} />
          <meshStandardMaterial color="#222" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 0.2, 10]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>,
    );
  }

  const fenders = [];
  for (let k = 0; k < 16; k++) {
    const x = QUAY_X0 + 6 + k * 12;
    fenders.push(
      <mesh key={k} position={[x, YARD_TOP - 1.6, QUAY_Z + 0.6]} visible={furniture > k / 16}>
        <boxGeometry args={[2.2, 3, 1.2]} />
        <meshStandardMaterial color="#111" roughness={1} />
      </mesh>,
    );
  }

  // linee di segnaletica sul piazzale
  const lanes = [-34, -22, -46].map((z, k) => (
    <mesh
      key={k}
      position={[0, YARD_TOP + 0.03, z]}
      scale={[THREE.MathUtils.clamp(furniture * 1.4 - k * 0.15, 0, 1), 1, 1]}
    >
      <boxGeometry args={[QUAY_X1 - QUAY_X0 - 4, 0.02, 0.35]} />
      <meshStandardMaterial color="#f3f3f3" />
    </mesh>
  ));

  // binari gru (lato mare e lato terra)
  const rails = [QUAY_Z - 2.5, QUAY_Z - 20.5].map((z, k) => (
    <mesh key={k} position={[0, YARD_TOP + 0.08, z]} scale={[furniture, 1, 1]}>
      <boxGeometry args={[QUAY_X1 - QUAY_X0, 0.15, 0.5]} />
      <meshStandardMaterial color="#5a5a5a" metalness={0.8} roughness={0.35} />
    </mesh>
  ));

  const trucksOn = frame > T.yard[0] + 20 && frame < T.yard[0] + 150;

  return (
    <group>
      {new Array(CAISSON.count).fill(0).map((_, i) => (
        <Caisson key={i} i={i} frame={frame} />
      ))}

      {/* trave di coronamento in c.a. */}
      {cap > 0 ? (
        <mesh
          position={[QUAY_X0 + ((QUAY_X1 - QUAY_X0) * cap) / 2, YARD_TOP - 0.2, CZ]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[(QUAY_X1 - QUAY_X0) * cap, 1.6, CAISSON.d + 0.4]} />
          <meshStandardMaterial color="#d5d1c7" roughness={0.8} />
        </mesh>
      ) : null}

      {/* colmata */}
      {fill > 0 ? (
        <mesh
          position={[0, (SEABED_Y + fillTop) / 2, (YARD_Z0 + YARD_Z1) / 2]}
          receiveShadow
        >
          <boxGeometry args={[QUAY_X1 - QUAY_X0 - 0.2, fillTop - SEABED_Y, yardLen]} />
          <meshStandardMaterial color="#b49a6c" roughness={1} />
        </mesh>
      ) : null}
      {/* scogliere laterali di contenimento */}
      {[QUAY_X0 - 3, QUAY_X1 + 3].map((x, k) => (
        <mesh key={k} position={[x, (SEABED_Y + fillTop) / 2, (-42 + YARD_Z1) / 2]} visible={fill > 0}>
          <boxGeometry args={[6, fillTop - SEABED_Y + 0.4, YARD_Z1 + 42]} />
          <meshStandardMaterial color="#77736b" roughness={1} flatShading />
        </mesh>
      ))}

      {/* pavimentazione */}
      {pave > 0 ? (
        <mesh position={[QUAY_X0 - 30 + paveW / 2, YARD_TOP - 0.1, (YARD_Z0 + YARD_Z1) / 2]} receiveShadow>
          <boxGeometry args={[paveW, 0.3, yardLen]} />
          <meshStandardMaterial color="#5c5f63" roughness={0.92} />
        </mesh>
      ) : null}

      {lanes}
      {rails}
      {bollards}
      {fenders}

      {trucksOn
        ? [0, 1, 2].map((k) => {
            const p = (t * 0.22 + k / 3) % 1;
            const x = lerp(QUAY_X0 + 10, QUAY_X1 - 10, p);
            return (
              <DumpTruck key={k} x={x} z={-30 - k * 12} y={fillTop + 0.1} heading={0} />
            );
          })
        : null}
    </group>
  );
};

export { YARD_Z0, YARD_Z1 };

import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { random, useCurrentFrame } from "remotion";
import { FPS, T, lerp, prog } from "../timeline";
import { Tug, useHullGeometry } from "./Boats";
import { BERTH, QUAY_X0, QUAY_X1, QUAY_Z, YARD_TOP, headingOf } from "./layout";

const BOX_COLORS = ["#1f5fa8", "#c0392b", "#2e8b57", "#e67e22", "#7f8c8d", "#ecf0f1", "#8e44ad", "#16a085", "#d35400", "#2c3e50"];

const RAIL_SEA = QUAY_Z - 2.5;
const RAIL_LAND = QUAY_Z - 20.5;
const CRANE_X = [-60, -20, 20, 60];
const BOOM_Y = 40;

/* ---------------------------------- GRU STS --------------------------------- */

const StsCrane: React.FC<{ x: number; idx: number; frame: number }> = ({ x, idx, frame }) => {
  const s0 = T.cranes[0] + 10 + idx * 26;
  const legs = prog(frame, s0, s0 + 55);
  const top = prog(frame, s0 + 45, s0 + 95);
  const boom = prog(frame, s0 + 100, s0 + 165);
  if (legs <= 0) return null;

  const t = frame / FPS;
  const ops = prog(frame, T.ops[0] + 150, T.ops[0] + 175);
  // ciclo trolley: piazzale <-> nave
  const cyc = (t * 0.32 + idx * 0.27) % 1;
  const tri = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2;
  const smooth = tri * tri * (3 - 2 * tri);
  const trolleyZ = lerp(-4, 14 + idx * 1.5, smooth * ops) + (1 - ops) * 0;
  const drop = ops * (0.5 + 0.5 * Math.cos(cyc * Math.PI * 4)) * 22 + 6;
  const carrying = ops > 0.5 && cyc > 0.25 && cyc < 0.75;

  const legH = 32 * legs;
  const gauge = RAIL_SEA - RAIL_LAND;
  const orange = "#e8742c";
  const boomAngle = (1 - boom) * 1.38; // da quasi verticale a orizzontale

  const leg = (dx: number, z: number, key: string) => (
    <mesh key={key} position={[dx, YARD_TOP + legH / 2, z]} castShadow>
      <boxGeometry args={[1.6, legH, 1.6]} />
      <meshStandardMaterial color={orange} roughness={0.55} />
    </mesh>
  );

  return (
    <group position={[x, 0, 0]}>
      {leg(-8, RAIL_SEA, "a")}
      {leg(8, RAIL_SEA, "b")}
      {leg(-8, RAIL_LAND, "c")}
      {leg(8, RAIL_LAND, "d")}
      {/* carrelli di traslazione */}
      {[RAIL_SEA, RAIL_LAND].map((z, k) => (
        <mesh key={k} position={[0, YARD_TOP + 1, z]} castShadow>
          <boxGeometry args={[19, 2, 2.4]} />
          <meshStandardMaterial color="#3d3d3d" />
        </mesh>
      ))}
      {/* traversi del portale */}
      {[RAIL_SEA, RAIL_LAND].map((z, k) => (
        <mesh key={k} position={[0, YARD_TOP + 22 * legs, z]} scale={[1, legs, 1]} castShadow>
          <boxGeometry args={[17.6, 1.6, 1.4]} />
          <meshStandardMaterial color={orange} />
        </mesh>
      ))}
      <group scale={[1, top, 1]} position={[0, YARD_TOP + 32, 0]}>
        {[-8, 8].map((dx) => (
          <group key={dx}>
            {/* traversa longitudinale */}
            <mesh position={[dx, 0, (RAIL_SEA + RAIL_LAND) / 2]} castShadow>
              <boxGeometry args={[1.5, 1.6, gauge + 1.6]} />
              <meshStandardMaterial color={orange} />
            </mesh>
            {/* cavalletto (A-frame) */}
            <mesh position={[dx, 9, RAIL_SEA - 2]} rotation={[0.25, 0, 0]} castShadow>
              <boxGeometry args={[1.2, 19, 1.2]} />
              <meshStandardMaterial color={orange} />
            </mesh>
            <mesh position={[dx, 9, RAIL_LAND + 3]} rotation={[-0.35, 0, 0]} castShadow>
              <boxGeometry args={[1.2, 19.5, 1.2]} />
              <meshStandardMaterial color={orange} />
            </mesh>
            {/* trave di retro-sbraccio */}
            <mesh position={[dx * 0.55, BOOM_Y - 32, RAIL_LAND - 4]} castShadow>
              <boxGeometry args={[1.4, 2.2, 38]} />
              <meshStandardMaterial color={orange} />
            </mesh>
          </group>
        ))}
        {/* sala macchine */}
        <mesh position={[0, BOOM_Y - 32 + 2.6, RAIL_LAND - 16]} castShadow>
          <boxGeometry args={[10, 4.4, 9]} />
          <meshStandardMaterial color="#f1f1ee" roughness={0.7} />
        </mesh>
      </group>
      {/* braccio a mare incernierato al cavalletto */}
      <group position={[0, YARD_TOP + BOOM_Y, RAIL_SEA + 2]} rotation={[-boomAngle, 0, 0]} visible={top > 0.6}>
        {[-4.4, 4.4].map((dx) => (
          <mesh key={dx} position={[dx, 0, 24]} castShadow>
            <boxGeometry args={[1.4, 2.4, 48]} />
            <meshStandardMaterial color={orange} />
          </mesh>
        ))}
        {[6, 18, 30, 42].map((z) => (
          <mesh key={z} position={[0, 0.8, z]}>
            <boxGeometry args={[9.6, 0.6, 0.6]} />
            <meshStandardMaterial color={orange} />
          </mesh>
        ))}
      </group>
      {/* carrello, cavi e spreader */}
      {boom > 0.98 ? (
        <group position={[0, YARD_TOP + BOOM_Y - 1.6, trolleyZ]}>
          <mesh castShadow>
            <boxGeometry args={[7, 2.2, 5]} />
            <meshStandardMaterial color="#f1f1ee" />
          </mesh>
          <mesh position={[0, -drop / 2, 0]}>
            <boxGeometry args={[0.15, drop, 0.15]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, -drop - 0.4, 0]} castShadow>
            <boxGeometry args={[6.4, 0.8, 2.6]} />
            <meshStandardMaterial color="#f2c230" />
          </mesh>
          {carrying ? (
            <mesh position={[0, -drop - 2.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[2.5, 2.6, 6.1]} />
              <meshStandardMaterial color={BOX_COLORS[(idx * 3) % BOX_COLORS.length]} />
            </mesh>
          ) : null}
        </group>
      ) : null}
    </group>
  );
};

/* --------------------------------- EDIFICI ---------------------------------- */

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
    const s = new THREE.Shape();
    s.moveTo(-d / 2, 0);
    s.lineTo(d / 2, 0);
    s.lineTo(0, 3.2);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
    g.translate(0, 0, -w / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [w, d]);
  if (p <= 0) return null;
  return (
    <group position={[x, YARD_TOP, z]} scale={[1, p, 1]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh geometry={roof} position={[0, h, 0]} castShadow>
        <meshStandardMaterial color="#8d99a6" roughness={0.5} metalness={0.4} />
      </mesh>
      {[-0.3, 0, 0.3].map((k) => (
        <mesh key={k} position={[k * w, 3.2, d / 2 + 0.05]}>
          <boxGeometry args={[6, 6.4, 0.2]} />
          <meshStandardMaterial color="#52606d" />
        </mesh>
      ))}
    </group>
  );
};

const Lighthouse: React.FC<{ p: number; glow: number }> = ({ p, glow }) => {
  if (p <= 0) return null;
  const bands = [0, 1, 2, 3, 4];
  return (
    <group position={[60, 7.4, 50]} scale={[1, p, 1]}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[4, 4.4, 2, 20]} />
        <meshStandardMaterial color="#d9d4c8" />
      </mesh>
      {bands.map((b) => (
        <mesh key={b} position={[0, 2 + b * 3.2 + 1.6, 0]} castShadow>
          <cylinderGeometry args={[2.3 - (b + 1) * 0.17, 2.3 - b * 0.17, 3.2, 20]} />
          <meshStandardMaterial color={b % 2 ? "#f4f4f1" : "#c62828"} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 19, 0]} castShadow>
        <cylinderGeometry args={[1.9, 1.9, 0.5, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 20.4, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 2.2, 16]} />
        <meshStandardMaterial color="#fff6c2" emissive="#ffd54a" emissiveIntensity={0.4 + glow * 4} />
      </mesh>
      <mesh position={[0, 22.1, 0]} castShadow>
        <coneGeometry args={[1.6, 1.4, 16]} />
        <meshStandardMaterial color="#c62828" />
      </mesh>
    </group>
  );
};

/* ------------------------------- CONTAINER ---------------------------------- */

const useYardSlots = () =>
  useMemo(() => {
    const slots: { x: number; y: number; z: number; c: string; order: number; pre: boolean }[] = [];
    const rowsZ = [-37.5, -40.3, -43.1, -49.5, -52.3, -55.1];
    rowsZ.forEach((z, r) => {
      for (let c = 0; c < 26; c++) {
        const x = QUAY_X0 + 8 + c * 6.9;
        if (c === 13) continue; // corsia trasversale
        const hgt = 1 + Math.floor(random(`yh${r}-${c}`) * 4);
        for (let k = 0; k < hgt; k++) {
          slots.push({
            x,
            z,
            y: YARD_TOP + 1.3 + k * 2.62,
            c: BOX_COLORS[Math.floor(random(`yc${r}-${c}-${k}`) * BOX_COLORS.length)],
            order: random(`yo${r}-${c}`) * 0.85 + k * 0.05,
            pre: random(`yp${r}-${c}`) < 0.4,
          });
        }
      }
    });
    return slots;
  }, []);

const YardContainers: React.FC<{ frame: number }> = ({ frame }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const slots = useYardSlots();
  const pre = prog(frame, T.cranes[0] + 160, T.cranes[1], (t) => t);
  const ops = prog(frame, T.ops[0] + 150, T.outro[0] + 60, (t) => t);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const col = new THREE.Color();
    slots.forEach((s, i) => {
      const p = s.pre ? pre : ops;
      const k = THREE.MathUtils.clamp((p * 1.05 - s.order) / 0.08, 0, 1);
      const sc = k > 0 ? 1 : 0.0001;
      m.makeScale(6.05 * sc, 2.55 * sc, 2.44 * sc);
      m.setPosition(s.x, s.y + (1 - k) * 10, s.z);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col.set(s.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [slots, pre, ops]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, slots.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.7} metalness={0.15} />
    </instancedMesh>
  );
};

const Truck: React.FC<{ x: number; z: number; dir: number; color: string }> = ({ x, z, dir, color }) => (
  <group position={[x, YARD_TOP, z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
    <mesh position={[4.6, 1.7, 0]} castShadow>
      <boxGeometry args={[2.4, 2.8, 2.5]} />
      <meshStandardMaterial color="#e9e9e4" />
    </mesh>
    <mesh position={[-0.6, 0.7, 0]}>
      <boxGeometry args={[11, 0.6, 2.4]} />
      <meshStandardMaterial color="#2a2a2a" />
    </mesh>
    <mesh position={[-0.8, 2.3, 0]} castShadow>
      <boxGeometry args={[6.1, 2.55, 2.44]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  </group>
);

/* ---------------------------------- NAVE ------------------------------------ */

const SHIP_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(470, 0, 150),
    new THREE.Vector3(260, 0, 70),
    new THREE.Vector3(150, 0, 25),
    new THREE.Vector3(70, 0, 2),
    new THREE.Vector3(BERTH[0], 0, BERTH[2]),
  ],
  false,
  "centripetal",
);

const Ship: React.FC<{ frame: number }> = ({ frame }) => {
  const hull = useHullGeometry(96, 15, 10.5);
  const ref = useRef<THREE.InstancedMesh>(null);
  const t = frame / FPS;
  const arrive = prog(frame, T.ops[0] - 10, T.ops[0] + 160, (x) => 1 - Math.pow(1 - x, 2.4));
  const pos = SHIP_PATH.getPointAt(arrive);
  const tan = SHIP_PATH.getTangentAt(Math.min(arrive, 0.999));
  const heading = headingOf(tan.x, tan.z) ;
  const unload = prog(frame, T.ops[0] + 165, T.outro[0] + 90, (x) => x);

  const boxes = useMemo(() => {
    const list: { x: number; y: number; z: number; c: string; order: number }[] = [];
    for (let b = 0; b < 11; b++)
      for (let r = 0; r < 5; r++) {
        const tiers = 3 + Math.floor(random(`st${b}-${r}`) * 2);
        for (let k = 0; k < tiers; k++)
          list.push({
            x: -24 + b * 6.6,
            z: -5.3 + r * 2.65,
            y: 5.3 + k * 2.6 + 1.3,
            c: BOX_COLORS[Math.floor(random(`sc${b}-${r}-${k}`) * BOX_COLORS.length)],
            order: (tiers - k) * 0.25 + random(`so${b}-${r}`) * 0.25,
          });
      }
    return list;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const col = new THREE.Color();
    boxes.forEach((b, i) => {
      const gone = unload * 0.55 > b.order - 0.25 && b.order < 0.55;
      const s = gone ? 0.0001 : 1;
      m.makeScale(6.05 * s, 2.55 * s, 2.44 * s);
      m.setPosition(b.x, b.y, b.z);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col.set(b.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [boxes, unload, frame]);

  if (frame < T.ops[0] - 12) return null;
  const bob = Math.sin(t * 0.9) * (1 - arrive * 0.7);
  // scia
  const wake = 1 - prog(frame, T.ops[0] + 110, T.ops[0] + 160);

  return (
    <group>
      <group position={[pos.x, 0.2 + bob * 0.15, pos.z]} rotation={[bob * 0.01, heading, bob * 0.012]}>
        <mesh geometry={hull} castShadow receiveShadow>
          <meshStandardMaterial color="#1c2d3f" roughness={0.55} metalness={0.2} />
        </mesh>
        {/* linea di bordo bianca */}
        <mesh position={[-2, 4.95, 0]}>
          <boxGeometry args={[86, 0.3, 15.3]} />
          <meshStandardMaterial color="#e8e8e2" />
        </mesh>
        {/* castello di poppa */}
        <mesh position={[-38, 11, 0]} castShadow>
          <boxGeometry args={[9, 12, 13]} />
          <meshStandardMaterial color="#f2f2ee" roughness={0.6} />
        </mesh>
        <mesh position={[-36.5, 16.6, 0]} castShadow>
          <boxGeometry args={[4.5, 2.2, 17]} />
          <meshStandardMaterial color="#26313b" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[-42, 17, 0]} castShadow>
          <boxGeometry args={[3, 6, 4]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
        <instancedMesh ref={ref} args={[undefined, undefined, boxes.length]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.7} metalness={0.15} />
        </instancedMesh>
      </group>
      {wake > 0.01 ? (
        <mesh position={[pos.x + Math.cos(heading) * -60, 0.45, pos.z - Math.sin(heading) * -60]} rotation={[-Math.PI / 2, 0, heading]}>
          <planeGeometry args={[70, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.25 * wake} depthWrite={false} />
        </mesh>
      ) : null}
      {arrive < 0.995 ? (
        <>
          <Tug position={[pos.x + Math.cos(heading) * 58, 0.4, pos.z - Math.sin(heading) * 58]} heading={heading} bob={Math.sin(t * 2)} />
          <Tug
            position={[pos.x - Math.cos(heading) * 52 + Math.sin(heading) * 10, 0.4, pos.z + Math.sin(heading) * 52 + Math.cos(heading) * 10]}
            heading={heading + 0.4}
            hull="#1f6fb2"
            bob={Math.sin(t * 2.3)}
          />
        </>
      ) : null}
    </group>
  );
};

/* ------------------------------- TERMINAL ----------------------------------- */

export const Terminal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const wh = (k: number) => prog(frame, T.cranes[0] + 40 + k * 18, T.cranes[0] + 120 + k * 18);
  const lighthouse = prog(frame, T.cranes[0] + 120, T.cranes[0] + 200);
  const glow = prog(frame, T.ops[0] + 200, T.outro[0] + 40) * (0.6 + 0.4 * Math.sin(t * 6));
  const trucksOn = prog(frame, T.ops[0] + 40, T.ops[0] + 80);

  const trucks = [0, 1, 2, 3, 4, 5].map((k) => {
    const dir = k % 2 === 0 ? 1 : -1;
    const p = (t * 0.07 + k / 6) % 1;
    const x = dir > 0 ? lerp(QUAY_X0 - 10, QUAY_X1 + 10, p) : lerp(QUAY_X1 + 10, QUAY_X0 - 10, p);
    return (
      <group key={k} visible={trucksOn > 0} scale={trucksOn}>
        <Truck x={x} z={dir > 0 ? -32.6 : -35.4} dir={dir} color={BOX_COLORS[(k * 4) % BOX_COLORS.length]} />
      </group>
    );
  });

  return (
    <group>
      {CRANE_X.map((x, i) => (
        <StsCrane key={i} x={x} idx={i} frame={frame} />
      ))}
      <Warehouse x={-62} z={-68} w={52} d={18} h={11} p={wh(0)} color="#d8d2c4" />
      <Warehouse x={2} z={-68} w={52} d={18} h={11} p={wh(1)} color="#cfd6db" />
      <Warehouse x={64} z={-68} w={44} d={18} h={11} p={wh(2)} color="#d8d2c4" />
      {/* palazzina direzione e torre di controllo */}
      <group position={[118, YARD_TOP, -60]} scale={[1, wh(3), 1]} visible={wh(3) > 0}>
        <mesh position={[0, 7, 0]} castShadow>
          <boxGeometry args={[18, 14, 14]} />
          <meshStandardMaterial color="#eef1f3" roughness={0.5} />
        </mesh>
        {[3, 7, 11].map((y) => (
          <mesh key={y} position={[0, y, 7.05]}>
            <boxGeometry args={[16, 1.6, 0.1]} />
            <meshStandardMaterial color="#2f4f6f" metalness={0.6} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[6, 20, 0]} castShadow>
          <cylinderGeometry args={[2, 2.4, 12, 16]} />
          <meshStandardMaterial color="#eef1f3" />
        </mesh>
        <mesh position={[6, 27, 0]} castShadow>
          <cylinderGeometry args={[4, 3, 3, 16]} />
          <meshStandardMaterial color="#2f4f6f" metalness={0.6} roughness={0.2} />
        </mesh>
      </group>
      <Lighthouse p={lighthouse} glow={glow} />
      <YardContainers frame={frame} />
      {trucks}
      <Ship frame={frame} />
    </group>
  );
};


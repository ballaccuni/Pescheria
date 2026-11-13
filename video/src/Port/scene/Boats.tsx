import React, { useMemo } from "react";
import * as THREE from "three";

/** Scafo estruso con prua appuntita (asse lungo = X, prua verso +X). */
export const useHullGeometry = (length: number, beam: number, depth: number) =>
  useMemo(() => {
    const s = new THREE.Shape();
    const L = length / 2;
    const B = beam / 2;
    s.moveTo(-L, -B);
    s.lineTo(L * 0.62, -B);
    s.quadraticCurveTo(L * 0.95, -B * 0.85, L, 0);
    s.quadraticCurveTo(L * 0.95, B * 0.85, L * 0.62, B);
    s.lineTo(-L, B);
    s.quadraticCurveTo(-L * 1.04, 0, -L, -B);
    const g = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelSize: Math.min(beam * 0.06, 0.6),
      bevelThickness: Math.min(beam * 0.06, 0.6),
      bevelSegments: 2,
      curveSegments: 10,
    });
    // estrusione lungo +Z -> la portiamo lungo +Y (altezza)
    g.rotateX(-Math.PI / 2);
    g.translate(0, -depth * 0.55, 0);
    return g;
  }, [length, beam, depth]);

type BoatProps = {
  position: [number, number, number];
  heading?: number; // radianti, 0 = verso +X
  hull?: string;
  scale?: number;
  bob?: number;
};

/** Rimorchiatore. */
export const Tug: React.FC<BoatProps> = ({
  position,
  heading = 0,
  hull = "#c0392b",
  scale = 1,
  bob = 0,
}) => {
  const g = useHullGeometry(14, 5.5, 3);
  return (
    <group position={position} rotation={[bob * 0.02, heading, bob * 0.03]} scale={scale}>
      <mesh geometry={g} castShadow>
        <meshStandardMaterial color={hull} roughness={0.6} />
      </mesh>
      <mesh position={[1.5, 2.6, 0]} castShadow>
        <boxGeometry args={[5, 2.6, 4]} />
        <meshStandardMaterial color="#f4f4f0" roughness={0.7} />
      </mesh>
      <mesh position={[2.2, 4.4, 0]} castShadow>
        <boxGeometry args={[3, 1.2, 3.6]} />
        <meshStandardMaterial color="#2a3440" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 5.4, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 2.4, 10]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* parabordi */}
      <mesh position={[7.2, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.5, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1b1b1b" roughness={1} />
      </mesh>
    </group>
  );
};

/** Pontone con gru tralicciata (per la posa massi). */
export const CraneBarge: React.FC<
  BoatProps & { boomYaw?: number; boomPitch?: number; hookDrop?: number }
> = ({ position, heading = 0, boomYaw = 0, boomPitch = 0.75, hookDrop = 8, bob = 0 }) => {
  const boomLen = 30;
  return (
    <group position={position} rotation={[bob * 0.01, heading, bob * 0.015]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 3.4, 14]} />
        <meshStandardMaterial color="#d9a21b" roughness={0.7} />
      </mesh>
      {/* cumulo di massi sul ponte */}
      <mesh position={[-7, 2.8, 0]} castShadow>
        <dodecahedronGeometry args={[4, 0]} />
        <meshStandardMaterial color="#6f6a62" roughness={1} flatShading />
      </mesh>
      <group position={[6, 2.1, 0]} rotation={[0, boomYaw, 0]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[7, 4, 6]} />
          <meshStandardMaterial color="#e8b931" roughness={0.6} />
        </mesh>
        <mesh position={[-1, 4.9, 0]} castShadow>
          <boxGeometry args={[3, 2, 4]} />
          <meshStandardMaterial color="#2a3440" />
        </mesh>
        <group position={[2.5, 3.5, 0]} rotation={[0, 0, boomPitch]}>
          <mesh position={[boomLen / 2, 0, 0]} castShadow>
            <boxGeometry args={[boomLen, 1.1, 1.4]} />
            <meshStandardMaterial color="#e8b931" roughness={0.6} wireframe={false} />
          </mesh>
          {/* cavo e benna */}
          <group position={[boomLen, 0, 0]} rotation={[0, 0, -boomPitch]}>
            <mesh position={[0, -hookDrop / 2, 0]}>
              <cylinderGeometry args={[0.08, 0.08, hookDrop, 4]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, -hookDrop - 1, 0]} castShadow>
              <boxGeometry args={[2.4, 2, 2.4]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

/** Draga aspirante semovente (TSHD). */
export const Dredger: React.FC<BoatProps & { dragArm?: number }> = ({
  position,
  heading = 0,
  bob = 0,
  dragArm = 1,
}) => {
  const g = useHullGeometry(46, 11, 5);
  return (
    <group position={position} rotation={[bob * 0.01, heading, bob * 0.015]}>
      <mesh geometry={g} castShadow>
        <meshStandardMaterial color="#c4372d" roughness={0.55} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[40, 0.5, 9.6]} />
        <meshStandardMaterial color="#5f6b73" roughness={0.8} />
      </mesh>
      {/* pozzo di carico */}
      <mesh position={[2, 2.45, 0]}>
        <boxGeometry args={[22, 0.3, 7]} />
        <meshStandardMaterial color="#6b5a3e" roughness={1} />
      </mesh>
      {/* sovrastruttura poppiera */}
      <mesh position={[-17, 5.5, 0]} castShadow>
        <boxGeometry args={[7, 7, 9.5]} />
        <meshStandardMaterial color="#f2f2ee" roughness={0.7} />
      </mesh>
      <mesh position={[-16, 9.8, 0]} castShadow>
        <boxGeometry args={[5, 1.8, 10.5]} />
        <meshStandardMaterial color="#26313b" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[18, 4, 0]} castShadow>
        <boxGeometry args={[4, 3, 8]} />
        <meshStandardMaterial color="#f2f2ee" />
      </mesh>
      {/* tubo dragante sul fianco */}
      <group position={[4, 1.5, 5.8]} rotation={[0, 0, -0.35 * dragArm]}>
        <mesh position={[-8, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.7, 0.7, 18, 10]} />
          <meshStandardMaterial color="#2b2b2b" metalness={0.3} />
        </mesh>
        <mesh position={[-17.5, 0, 0]}>
          <boxGeometry args={[2.5, 1.6, 2.2]} />
          <meshStandardMaterial color="#e3b21e" />
        </mesh>
      </group>
    </group>
  );
};

/** Battello idrografico con ventaglio sonar multibeam. */
export const SurveyBoat: React.FC<BoatProps & { sonar?: number; depth?: number }> = ({
  position,
  heading = 0,
  bob = 0,
  sonar = 0,
  depth = 8,
}) => {
  const g = useHullGeometry(10, 3.6, 2);
  const fan = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const spread = depth * 1.6;
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [0, 0, 0, 0, -depth, -spread, 0, -depth, spread],
        3,
      ),
    );
    geo.computeVertexNormals();
    return geo;
  }, [depth]);
  return (
    <group position={position} rotation={[bob * 0.03, heading, bob * 0.04]}>
      <mesh geometry={g} castShadow>
        <meshStandardMaterial color="#f5f5f2" roughness={0.6} />
      </mesh>
      <mesh position={[0.5, 1.6, 0]} castShadow>
        <boxGeometry args={[3.5, 1.8, 2.8]} />
        <meshStandardMaterial color="#1f5f99" />
      </mesh>
      <mesh position={[0.2, 3.3, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 6]} />
        <meshStandardMaterial color="#ddd" />
      </mesh>
      <mesh geometry={fan} position={[0, -0.6, 0]}>
        <meshBasicMaterial
          color="#38f2ff"
          transparent
          opacity={0.35 * sonar}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

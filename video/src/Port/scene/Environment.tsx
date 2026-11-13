import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { random, useCurrentFrame } from "remotion";
import { FPS } from "../timeline";

export const SEABED_Y = -14;
export const LAND_Z = -40; // linea di costa originaria
export const LAND_TOP = 3;

const SkyDome: React.FC = () => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color("#2f6fb0") },
          mid: { value: new THREE.Color("#8fb8dc") },
          horizon: { value: new THREE.Color("#e9eef0") },
        },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vP;
          void main(){ float h = clamp(vP.y,0.0,1.0);
            vec3 c = mix(horizon, mid, smoothstep(0.0,0.18,h));
            c = mix(c, top, smoothstep(0.18,0.75,h));
            if (vP.y < 0.0) c = horizon;
            gl_FragColor = vec4(c,1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[2400, 32, 16]} />
    </mesh>
  );
};

/** Superficie del mare con onde guidate dal frame. */
const Water: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2600, 2600, 180, 180);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const base = useMemo(
    () => Float32Array.from(geo.attributes.position.array as Float32Array),
    [geo],
  );

  useLayoutEffect(() => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      // onde più calme all'interno del bacino portuale
      const inBasin = x > -140 && x < 140 && z > -40 && z < 55 ? 0.35 : 1;
      const y =
        inBasin *
        (0.35 * Math.sin(x * 0.045 + t * 1.3) +
          0.25 * Math.sin(z * 0.06 - t * 1.7 + x * 0.01) +
          0.12 * Math.sin((x + z) * 0.13 + t * 2.4));
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }, [t, geo, base]);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial
        color="#1f6b8f"
        roughness={0.12}
        metalness={0.15}
        transparent
        opacity={0.72}
        depthWrite={false}
      />
    </mesh>
  );
};

/** Colline, entroterra e piccolo centro abitato sulla costa. */
const Land: React.FC = () => {
  const town = useMemo(() => {
    const items: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
    const palette = ["#e8dcc6", "#d9c6a5", "#f0e6d2", "#c9a27e", "#e3d3b8"];
    for (let i = 0; i < 140; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (180 + random(`tx${i}`) * 230);
      const z = -70 - random(`tz${i}`) * 170;
      const w = 8 + random(`tw${i}`) * 10;
      const h = 5 + random(`th${i}`) * 14;
      items.push({
        p: [x, LAND_TOP + h / 2, z],
        s: [w, h, 8 + random(`td${i}`) * 9],
        c: palette[Math.floor(random(`tc${i}`) * palette.length)],
      });
    }
    return items;
  }, []);

  const hills = useMemo(
    () =>
      new Array(9).fill(0).map((_, i) => ({
        x: -800 + i * 200 + random(`hx${i}`) * 80,
        z: -520 - random(`hz${i}`) * 200,
        r: 160 + random(`hr${i}`) * 120,
        h: 0.35 + random(`hh${i}`) * 0.25,
      })),
    [],
  );

  return (
    <group>
      {/* entroterra */}
      <mesh position={[0, (LAND_TOP + SEABED_Y - 6) / 2, LAND_Z - 400]} receiveShadow>
        <boxGeometry args={[2600, LAND_TOP - SEABED_Y + 6, 800]} />
        <meshStandardMaterial color="#7f8a5c" roughness={1} />
      </mesh>
      {/* spiaggia */}
      <mesh position={[0, LAND_TOP - 1.2, LAND_Z + 4]} rotation={[-0.25, 0, 0]} receiveShadow>
        <boxGeometry args={[2600, 3, 14]} />
        <meshStandardMaterial color="#d8c79c" roughness={1} />
      </mesh>
      {/* strada costiera */}
      <mesh position={[0, LAND_TOP + 0.05, LAND_Z - 52]} receiveShadow>
        <boxGeometry args={[2600, 0.2, 9]} />
        <meshStandardMaterial color="#4a4a4c" roughness={0.9} />
      </mesh>
      {town.map((b, i) => (
        <mesh key={i} position={b.p} castShadow receiveShadow>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={b.c} roughness={0.85} />
        </mesh>
      ))}
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, 0, h.z]} scale={[1, h.h, 0.7]}>
          <sphereGeometry args={[h.r, 24, 12]} />
          <meshStandardMaterial color={i % 2 ? "#5f7046" : "#6b7a4e"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

export const Environment: React.FC = () => {
  const sun = useRef<THREE.DirectionalLight>(null);
  return (
    <>
      <SkyDome />
      <fog attach="fog" args={["#dfe7ec", 450, 2100]} />
      <hemisphereLight args={["#d6e9ff", "#6d5f48", 0.9]} />
      <directionalLight
        ref={sun}
        position={[260, 320, 180]}
        intensity={2.6}
        color="#fff4e2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
        shadow-camera-near={10}
        shadow-camera-far={900}
        shadow-bias={-0.0004}
      />
      {/* fondale */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEABED_Y, 0]} receiveShadow>
        <planeGeometry args={[2600, 2600]} />
        <meshStandardMaterial color="#8b7f62" roughness={1} />
      </mesh>
      <Water />
      <Land />
    </>
  );
};

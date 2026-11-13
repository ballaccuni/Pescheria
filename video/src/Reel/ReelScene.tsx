import React, { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { spring, useCurrentFrame } from "remotion";
import { Diorama } from "./Diorama";
import {
  CLOCK,
  FOV,
  OUTRO_START,
  R_FPS,
  cameraAt,
  p01,
  phaseStart,
  tilePos,
} from "./reel";

const TopDownCamera: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const c = cameraAt(frame);
    camera.fov = FOV;
    camera.near = 1;
    camera.far = c.h + 400;
    camera.up.set(0, 0, -1); // alto dello schermo = -Z
    camera.position.set(c.x, c.h, c.z);
    camera.lookAt(c.x, 0, c.z);
    camera.updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

/** Luce "da finestra" in alto a sinistra: ombre morbide in basso a destra. */
const Sun: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<THREE.DirectionalLight>(null);
  const c = cameraAt(frame);
  useLayoutEffect(() => {
    const l = ref.current;
    if (!l) return;
    l.position.set(c.x - 95, 165, c.z - 120);
    l.target.position.set(c.x, 0, c.z);
    l.target.updateMatrixWorld();
    const half = c.vis * 0.62;
    const cam = l.shadow.camera;
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.near = 1;
    cam.far = 600;
    cam.updateProjectionMatrix();
  });
  return (
    <directionalLight
      ref={ref}
      intensity={2.4}
      color="#fff6ea"
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-bias={-0.0005}
      shadow-normalBias={0.04}
      shadow-radius={5}
    />
  );
};

/** Quadrante color crema con numeri romani, come l'orologio della foto di Flow. */
let clockFace: THREE.CanvasTexture | null = null;
const getClockFace = () => {
  if (clockFace) return clockFace;
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S / 2);
  grd.addColorStop(0, "#f6efd9");
  grd.addColorStop(0.85, "#efe3c3");
  grd.addColorStop(1, "#d9c79f");
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.strokeStyle = "#2a2420";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, S * 0.44, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, S * 0.415, 0, Math.PI * 2);
  g.stroke();
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2;
    g.save();
    g.rotate(a);
    g.fillStyle = "#2a2420";
    if (k % 5 === 0) g.fillRect(-4, -S * 0.44, 8, S * 0.035);
    else g.fillRect(-1.5, -S * 0.44, 3, S * 0.025);
    g.restore();
  }
  const roman = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  g.fillStyle = "#231d19";
  g.textAlign = "center";
  g.textBaseline = "middle";
  roman.forEach((r, i) => {
    const a = (i / 12) * Math.PI * 2;
    g.save();
    g.rotate(a);
    g.translate(0, -S * 0.34);
    g.font = `500 ${S * 0.085}px "Times New Roman", "DejaVu Serif", Georgia, serif`;
    g.fillText(r, 0, 0);
    g.restore();
  });
  clockFace = new THREE.CanvasTexture(c);
  clockFace.colorSpace = THREE.SRGBColorSpace;
  clockFace.anisotropy = 8;
  return clockFace;
};

const popScale = (frame: number, at: number) =>
  spring({ frame: frame - at, fps: R_FPS, config: { damping: 11, stiffness: 110, mass: 0.9 } });

const Tiles: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const t = frame / R_FPS;
  return (
    <>
      {new Array(6).fill(0).map((_, i) => {
        const a = phaseStart(i);
        const appear = a + 4;
        if (frame < appear) return null;
        const p = tilePos(i);
        if (Math.abs(p.z - cam.z) > cam.vis / 2 + 90) return null;
        const sc = popScale(frame, appear);
        const build = p01(frame, a + 22, a + 218, (x) => x * x * (3 - 2 * x));
        const stage = i + 0.999 * build;
        return (
          <group key={i} position={[p.x, 0, p.z]} scale={[sc, sc, sc]}>
            <Diorama stage={stage} t={t} />
          </group>
        );
      })}
    </>
  );
};

/** Orologio da parete appoggiato sulla carta (come nel riferimento). */
const Clock: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = OUTRO_START + 4;
  if (frame < appear) return null;
  const cam = cameraAt(frame);
  if (Math.abs(CLOCK.z - cam.z) > cam.vis / 2 + 60) return null;
  const sc = popScale(frame, appear);
  // 36 mesi in time-lapse: la lancetta dei minuti gira veloce e rallenta
  const spin = p01(frame, OUTRO_START + 20, OUTRO_START + 230);
  const minute = spin * Math.PI * 2 * 36 + Math.PI * 0.35;
  const hour = spin * Math.PI * 2 * 3 + Math.PI * 1.4;
  const R = 30;
  return (
    <group position={[CLOCK.x, 0, CLOCK.z]} scale={[sc, sc, sc]}>
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[R, R, 5.2, 64]} />
        <meshStandardMaterial color="#8a4a26" roughness={0.38} metalness={0.1} />
      </mesh>
      <mesh position={[0, 5.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[R - 3, 96]} />
        <meshStandardMaterial map={getClockFace()} roughness={0.85} />
      </mesh>
      <mesh position={[0, 5.3, 0]}>
        <torusGeometry args={[R - 3, 0.5, 8, 64]} />
        <meshStandardMaterial color="#c9a46a" metalness={0.7} roughness={0.3} />
      </mesh>
      <group position={[0, 6.1, 0]} rotation={[0, -hour, 0]}>
        <mesh position={[0, 0, -6.5]} castShadow>
          <boxGeometry args={[1.6, 0.5, 13]} />
          <meshStandardMaterial color="#1f1b18" />
        </mesh>
      </group>
      <group position={[0, 6.8, 0]} rotation={[0, -minute, 0]}>
        <mesh position={[0, 0, -10]} castShadow>
          <boxGeometry args={[0.9, 0.4, 20]} />
          <meshStandardMaterial color="#1f1b18" />
        </mesh>
      </group>
      <mesh position={[0, 7.2, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.8, 16]} />
        <meshStandardMaterial color="#c9a46a" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
};

export const ReelScene: React.FC = () => {
  return (
    <>
      <TopDownCamera />
      <hemisphereLight args={["#f4fbff", "#7a8f86", 0.95]} />
      <Sun />
      {/* piano carta: riceve solo le ombre, la carta è disegnata in HTML sotto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 700]} receiveShadow>
        <planeGeometry args={[8000, 8000]} />
        <shadowMaterial color="#0c3537" opacity={0.42} />
      </mesh>
      <Tiles />
      <Clock />
    </>
  );
};

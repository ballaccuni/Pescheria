import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import { DURATION } from "../timeline";

// Keyframe di camera: [frame, posizione, target]
type K = [number, [number, number, number], [number, number, number]];

const KEYS: K[] = [
  [0, [420, 230, 520], [0, -10, 0]],
  [150, [260, 120, 300], [0, -6, 10]],
  // 01 rilievi e dragaggio
  [260, [70, 48, 110], [0, -8, 18]],
  [400, [-70, 52, 115], [-10, -8, 18]],
  // 02 diga foranea
  [520, [-250, 80, 150], [-130, 0, 20]],
  [650, [-200, 70, 160], [-90, 0, 50]],
  [790, [-20, 75, 170], [10, 0, 50]],
  [880, [170, 95, 150], [60, 0, 20]],
  // 03 cassoni
  [990, [150, 45, 75], [40, 0, -10]],
  [1120, [40, 38, 62], [-20, 0, -12]],
  [1250, [-110, 55, 60], [-30, 0, -14]],
  // 04 colmata e piazzale
  [1390, [-30, 150, 70], [0, 0, -35]],
  [1520, [110, 85, 50], [0, 0, -35]],
  // 05 gru e infrastrutture
  [1620, [150, 48, 85], [0, 20, -20]],
  [1740, [-70, 58, 105], [10, 18, -20]],
  [1830, [-120, 75, 120], [10, 10, 0]],
  // 06 operatività
  [1930, [230, 55, 130], [120, 5, 30]],
  [2020, [150, 52, 100], [10, 8, -10]],
  [2100, [-100, 62, 95], [0, 10, -15]],
  // finale
  [DURATION, [-300, 190, 330], [0, -5, -5]],
];

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  const curves = useMemo(() => {
    const pos = new THREE.CatmullRomCurve3(
      KEYS.map((k) => new THREE.Vector3(...k[1])),
      false,
      "centripetal",
    );
    const tgt = new THREE.CatmullRomCurve3(
      KEYS.map((k) => new THREE.Vector3(...k[2])),
      false,
      "centripetal",
    );
    return { pos, tgt };
  }, []);

  useLayoutEffect(() => {
    // mappa il frame su parametro della curva (uniforme per keyframe),
    // ammorbidendo leggermente ogni tratto per un movimento "dolly" continuo
    let i = 0;
    while (i < KEYS.length - 2 && frame > KEYS[i + 1][0]) i++;
    const [f0] = KEYS[i];
    const [f1] = KEYS[i + 1];
    const local = THREE.MathUtils.clamp((frame - f0) / (f1 - f0), 0, 1);
    const eased = THREE.MathUtils.lerp(local, smoothstep(local), 0.35);
    const u = (i + eased) / (KEYS.length - 1);
    const p = curves.pos.getPoint(u);
    const q = curves.tgt.getPoint(u);
    camera.position.copy(p);
    camera.lookAt(q);
    camera.fov = 40;
    camera.near = 1;
    camera.far = 6000;
    camera.updateProjectionMatrix();
  }, [frame, camera, curves]);

  return null;
};

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Bg, bgColor, C, F } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** Sfondo pieno con vignettatura morbida (effetto "carta" / luce da studio). */
export const Background: React.FC<{ bg: Bg; children?: React.ReactNode }> = ({
  bg,
  children,
}) => {
  const vignette =
    bg === "dark"
      ? "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.55) 100%)"
      : "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0.16) 100%)";
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor(bg) }}>
      <AbsoluteFill style={{ background: vignette }} />
      {children}
    </AbsoluteFill>
  );
};

/** Leggero "punch-in" all'ingresso e lento zoom per tutta la scena. */
export const Camera: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        scale: interpolate(
          frame,
          [0, 8, durationInFrames],
          [1.06, 1, 1.035],
          { ...clamp, easing: easeOut },
        ),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Etichetta tipo nastro adesivo, leggermente ruotata. */
export const Tape: React.FC<{
  text: string;
  dark?: boolean;
  delay?: number;
  rotate?: number;
  size?: number;
}> = ({ text, dark = false, delay = 2, rotate = -2, size = 30 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 8], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div
      style={{
        display: "inline-block",
        background: dark ? C.ink : C.paper,
        color: dark ? C.paper : C.ink,
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "10px 26px",
        rotate: `${rotate}deg`,
        boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        clipPath: "polygon(1% 4%, 99% 0, 100% 96%, 0 100%)",
        opacity: t,
        scale: interpolate(t, [0, 1], [1.25, 1]),
      }}
    >
      {text}
    </div>
  );
};

/** Riga della fonte in basso, in monospace. */
export const Source: React.FC<{ text?: string; bg: Bg }> = ({ text, bg }) => {
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 150,
        left: 80,
        right: 80,
        textAlign: "center",
        fontFamily: F.mono,
        fontSize: 22,
        color: bg === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
      }}
    >
      Fonte: {text}
    </div>
  );
};

/** Cerchio "disegnato a mano" che si traccia attorno a un elemento. */
export const HandCircle: React.FC<{
  width: number;
  height: number;
  delay?: number;
  color?: string;
  seed?: string;
}> = ({ width, height, delay = 12, color = C.ink, seed = "c" }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 16], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  // Ellisse irregolare con un leggero sormonto finale.
  const pts: string[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI * 0.6 + (i / steps) * Math.PI * 2.15;
    const wob = 1 + (random(`${seed}${i % 12}`) - 0.5) * 0.05;
    const grow = 1 + (i / steps) * 0.06;
    const x = width / 2 + Math.cos(a) * (width / 2) * wob * grow;
    const y = height / 2 + Math.sin(a) * (height / 2) * wob * grow;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg
      width={width * 1.2}
      height={height * 1.3}
      viewBox={`${-width * 0.1} ${-height * 0.15} ${width * 1.2} ${height * 1.3}`}
      style={{ position: "absolute", left: "50%", top: "50%", translate: "-50% -50%", overflow: "visible" }}
    >
      <path
        d={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
};

/** Testo che entra dal basso con dissolvenza. */
export const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay = 0,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 10], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div style={{ opacity: t, translate: `0px ${interpolate(t, [0, 1], [30, 0])}px`, ...style }}>
      {children}
    </div>
  );
};

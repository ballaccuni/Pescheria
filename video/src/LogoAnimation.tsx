import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { SoundEffects } from "./SoundEffects";

const fontFamily = "Lexend";
loadFont({
  family: fontFamily,
  url: staticFile("fonts/Lexend.woff2"),
  weight: "300 600",
});

// Colori presi dal logo originale
export const COLORS = {
  cream: "#FFF9F0",
  blue: "#3A96BF",
  deepBlue: "#1F78A8",
  slate: "#2F4858",
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Elementi del logo, nelle coordinate dell'immagine originale 1024x1024
const PARTS = {
  fish: { x: 195, y: 175, w: 650, h: 275 },
  pescheria: { x: 285, y: 478, w: 455, h: 64 },
  sapore: { x: 80, y: 540, w: 870, h: 155 },
  raffadali: { x: 315, y: 722, w: 405, h: 86 },
};

const Part: React.FC<{
  name: keyof typeof PARTS;
  style?: React.CSSProperties;
  clip?: string;
}> = ({ name, style, clip }) => {
  const p = PARTS[name];
  return (
    <Img
      src={staticFile(`logo/${name}.png`)}
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        width: p.w,
        height: p.h,
        clipPath: clip,
        ...style,
      }}
    />
  );
};

// Bollicine che escono dalla bocca del pesce
const Bubbles: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const bubbles = [
    { delay: 0, size: 16, drift: -18 },
    { delay: 14, size: 11, drift: 10 },
    { delay: 26, size: 20, drift: -6 },
    { delay: 48, size: 12, drift: 14 },
    { delay: 60, size: 17, drift: -14 },
    { delay: 82, size: 10, drift: 6 },
  ];
  const cycle = 100;
  return (
    <>
      {bubbles.map((b, i) => {
        const t = frame - start - b.delay;
        if (t < 0) return null;
        const local = t % cycle;
        const progress = local / 70;
        if (progress > 1) return null;
        const y = 300 - progress * 190;
        const x =
          200 + Math.sin(progress * Math.PI * 2) * 8 + b.drift * progress;
        const opacity = interpolate(progress, [0, 0.15, 0.75, 1], [0, 1, 1, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - b.size / 2,
              top: y - b.size / 2,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              border: `3.5px solid ${COLORS.blue}`,
              opacity,
            }}
          />
        );
      })}
    </>
  );
};

// Onde animate in basso
const Waves: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const rise = interpolate(frame, [0, 40], [80, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const wave = (amp: number, len: number, speed: number, base: number) => {
    let d = `M 0 ${height}`;
    for (let x = 0; x <= width; x += 10) {
      const y =
        base + Math.sin((x / len) * Math.PI * 2 + frame * speed) * amp + rise;
      d += ` L ${x} ${y}`;
    }
    return d + ` L ${width} ${height} Z`;
  };
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0 }}
    >
      <path
        d={wave(10, 520, 0.05, height - 46)}
        fill={COLORS.blue}
        opacity={0.12}
      />
      <path
        d={wave(8, 380, -0.07, height - 28)}
        fill={COLORS.blue}
        opacity={0.18}
      />
    </svg>
  );
};

const HOURS: {
  day: string;
  morning: string | null;
  afternoon: string | null;
}[] = [
  { day: "Lunedì", morning: null, afternoon: "17:30 – 20:00" },
  {
    day: "Martedì – Venerdì",
    morning: "8:00 – 13:30",
    afternoon: "17:30 – 20:00",
  },
  { day: "Sabato", morning: "8:00 – 13:00", afternoon: null },
];

export const LogoAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  // --- Scena 1: il logo si compone ---
  const fishReveal = interpolate(frame, [8, 58], [0, 100], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const fishBob = Math.sin(frame / 14) * 6;
  const fishTilt = Math.sin(frame / 18) * 1.5;

  const pescheriaIn = interpolate(frame, [45, 70], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const saporeIn = spring({ frame: frame - 58, fps, config: { damping: 14 } });
  const raffIn = interpolate(frame, [78, 100], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // --- Scena 2: il logo sale e fa spazio a slogan e orari ---
  const move = interpolate(frame, [135, 170], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const baseScale = width / 1024;
  const logoScale = interpolate(move, [0, 1], [baseScale, baseScale * 0.5]);
  // centro del contenuto del logo (coordinate originali)
  const cx = 512;
  const cy = 490;
  const targetY = interpolate(move, [0, 1], [width / 2, 205]);

  const slogan1 = interpolate(frame, [168, 190], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const slogan2 = interpolate(frame, [180, 205], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const divider = interpolate(frame, [205, 235], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const orariLabel = interpolate(frame, [215, 235], [0, 1], clamp);
  const headersIn = interpolate(frame, [228, 248], [0, 1], clamp);

  // --- Scena 3: slogan e orari lasciano spazio al sito web ---
  const infoOut = interpolate(frame, [395, 415], [1, 0], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, fontFamily }}>
      <Waves />

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          width: 1024,
          height: 1024,
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${width / 2 - cx * logoScale}px, ${
            targetY - cy * logoScale
          }px) scale(${logoScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${fishBob}px) rotate(${fishTilt}deg)`,
            transformOrigin: "520px 312px",
          }}
        >
          <Part
            name="fish"
            clip={`inset(0 ${100 - fishReveal}% 0 0)`}
            style={{
              transform: `translateX(${interpolate(fishReveal, [0, 100], [-40, 0])}px)`,
            }}
          />
          <Bubbles start={60} />
        </div>
        <Part
          name="pescheria"
          style={{
            opacity: pescheriaIn,
            transform: `scaleX(${interpolate(pescheriaIn, [0, 1], [1.25, 1])})`,
            filter: `blur(${(1 - pescheriaIn) * 6}px)`,
          }}
        />
        <Part
          name="sapore"
          style={{
            opacity: Math.min(1, saporeIn * 1.5),
            transform: `translateY(${(1 - saporeIn) * 50}px) scale(${interpolate(
              saporeIn,
              [0, 1],
              [0.92, 1],
            )})`,
          }}
        />
        <Part
          name="raffadali"
          clip={`inset(0 ${(1 - raffIn) * 100}% 0 0)`}
          style={{ opacity: raffIn }}
        />
      </div>

      <AbsoluteFill
        style={{
          opacity: infoOut,
          transform: `translateY(${(1 - infoOut) * -30}px)`,
        }}
      >
        {/* Slogan */}
        <div
          style={{
            position: "absolute",
            top: 420,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: COLORS.blue,
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: 7,
              textTransform: "uppercase",
              opacity: slogan1,
              transform: `translateY(${(1 - slogan1) * 20}px)`,
            }}
          >
            Da tre generazioni
          </div>
          <div
            style={{
              color: COLORS.slate,
              fontSize: 50,
              fontWeight: 500,
              marginTop: 10,
              opacity: slogan2,
              transform: `translateY(${(1 - slogan2) * 24}px)`,
            }}
          >
            per voi solo il pesce migliore
          </div>
        </div>

        {/* Divisore */}
        <div
          style={{
            position: "absolute",
            top: 600,
            left: width / 2 - 260 * divider,
            width: 520 * divider,
            height: 3,
            borderRadius: 2,
            backgroundColor: COLORS.blue,
            opacity: 0.6,
          }}
        />

        {/* Orari */}
        <div
          style={{
            position: "absolute",
            top: 625,
            width: "100%",
            textAlign: "center",
            color: COLORS.blue,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 8,
            opacity: orariLabel,
          }}
        >
          ORARI
        </div>
        {/* Intestazioni Mattina / Pomeriggio */}
        <div
          style={{
            position: "absolute",
            top: 676,
            left: 90,
            right: 90,
            padding: "0 28px",
            display: "flex",
            color: COLORS.blue,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: headersIn,
          }}
        >
          <div style={{ flex: 1.3 }} />
          <div style={{ flex: 1, textAlign: "right" }}>Mattina</div>
          <div style={{ flex: 1, textAlign: "right" }}>Pomeriggio</div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 718,
            left: 90,
            right: 90,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {HOURS.map((row, i) => {
            const p = spring({
              frame: frame - 235 - i * 12,
              fps,
              config: { damping: 16 },
            });
            return (
              <div
                key={row.day}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 28px",
                  borderRadius: 18,
                  backgroundColor: "rgba(58,150,191,0.09)",
                  opacity: Math.min(1, p * 1.4),
                  transform: `translateX(${(1 - p) * -60}px)`,
                }}
              >
                <div
                  style={{
                    flex: 1.3,
                    color: COLORS.slate,
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                >
                  {row.day}
                </div>
                <Slot value={row.morning} />
                <Slot value={row.afternoon} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <WebsiteCta start={410} />
      <SoundEffects durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const Slot: React.FC<{ value: string | null }> = ({ value }) => (
  <div
    style={{
      flex: 1,
      textAlign: "right",
      color: value ? COLORS.deepBlue : "rgba(47,72,88,0.35)",
      fontSize: 32,
      fontWeight: value ? 500 : 300,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {value ?? "—"}
  </div>
);

const SITE = "saporedimareraffadali.it";

// Pulsante del sito con cursore che clicca
const WebsiteCta: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - start;
  if (f < 0) return null;

  const labelIn = interpolate(f, [0, 20], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const pillIn = spring({ frame: f - 8, fps, config: { damping: 13 } });

  // il cursore entra dal basso a destra e si ferma sul pulsante
  const clickAt = 62;
  const cursorMove = interpolate(f, [24, 56], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const cursorX = interpolate(cursorMove, [0, 1], [1000, 610]);
  const cursorY = interpolate(cursorMove, [0, 1], [1120, 712]);
  const cursorOpacity = interpolate(f, [24, 32], [0, 1], clamp);
  const press = interpolate(
    f,
    [clickAt - 4, clickAt, clickAt + 6],
    [1, 0.82, 1],
    clamp,
  );
  const pillPress = interpolate(
    f,
    [clickAt - 4, clickAt, clickAt + 8],
    [1, 0.95, 1],
    clamp,
  );
  const filled = interpolate(f, [clickAt, clickAt + 10], [0, 1], clamp);
  const ripple = interpolate(f, [clickAt, clickAt + 28], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const hintIn = interpolate(f, [clickAt + 14, clickAt + 34], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 560,
          width: "100%",
          textAlign: "center",
          color: COLORS.slate,
          fontSize: 44,
          fontWeight: 500,
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 24}px)`,
        }}
      >
        Visita il nostro sito
      </div>

      <div
        style={{
          position: "absolute",
          top: 655,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "26px 54px",
            borderRadius: 999,
            border: `4px solid ${COLORS.blue}`,
            backgroundColor: `rgba(58,150,191,${filled})`,
            color: filled > 0.5 ? COLORS.cream : COLORS.deepBlue,
            fontSize: 46,
            fontWeight: 600,
            opacity: Math.min(1, pillIn * 1.5),
            transform: `scale(${pillIn * pillPress})`,
            boxShadow: `0 ${12 * filled}px ${30 * filled}px rgba(31,120,168,0.25)`,
          }}
        >
          {SITE}
          {/* onda del click */}
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: 999,
              border: `4px solid ${COLORS.blue}`,
              opacity: ripple > 0 ? 1 - ripple : 0,
              transform: `scale(${1 + ripple * 0.25}, ${1 + ripple * 0.9})`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 815,
          width: "100%",
          textAlign: "center",
          color: COLORS.blue,
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: 3,
          opacity: hintIn,
          transform: `translateY(${(1 - hintIn) * 16}px)`,
        }}
      >
        Ti aspettiamo!
      </div>

      {/* cursore */}
      <svg
        width={54}
        height={64}
        viewBox="0 0 27 32"
        style={{
          position: "absolute",
          left: cursorX,
          top: cursorY,
          opacity: cursorOpacity,
          transform: `scale(${press})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 4px 6px rgba(47,72,88,0.3))",
        }}
      >
        <path
          d="M2 2 L2 25 L8 19.5 L12.5 29 L16.5 27.2 L12 18 L20 18 Z"
          fill="#ffffff"
          stroke={COLORS.slate}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    </AbsoluteFill>
  );
};

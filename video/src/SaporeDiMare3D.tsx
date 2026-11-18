import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, HOURS, Slot } from "./LogoAnimation";
import { LogoThree, LogoThreeSounds } from "./LogoThree";
import { fontFamily } from "./font";

// Video completo: logo 3D, poi slogan e orari (come il logo animato, senza sito).

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const COMPACT_AT = 150;
const INFO = COMPACT_AT + 38; // quando iniziano slogan e orari

export const SaporeDiMare3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = (d: number, len = 22) =>
    interpolate(frame, [INFO + d, INFO + d + len], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const slogan1 = t(0);
  const slogan2 = t(12, 25);
  const divider = interpolate(frame, [INFO + 37, INFO + 67], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const orariLabel = interpolate(frame, [INFO + 47, INFO + 67], [0, 1], clamp);
  const headersIn = interpolate(frame, [INFO + 60, INFO + 80], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <LogoThree compactAt={COMPACT_AT} standalone={false} />

      {/* Slogan */}
      <div style={{ position: "absolute", top: 420, width: "100%", textAlign: "center" }}>
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
          per voi, solo il pesce migliore
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
      <div style={{ position: "absolute", top: 718, left: 90, right: 90, display: "flex", flexDirection: "column", gap: 18 }}>
        {HOURS.map((row, i) => {
          const p = spring({ frame: frame - INFO - 67 - i * 12, fps, config: { damping: 16 } });
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
              <div style={{ flex: 1.3, color: COLORS.slate, fontSize: 32, fontWeight: 600 }}>{row.day}</div>
              <Slot value={row.morning} />
              <Slot value={row.afternoon} />
            </div>
          );
        })}
      </div>

      {/* suoni */}
      <LogoThreeSounds />
      {[
        { at: 0, file: "note-d5", volume: 0.4 },
        { at: 12, file: "note-fs5", volume: 0.4 },
        { at: 47, file: "note-a4", volume: 0.3 },
        { at: 67, file: "note-d5", volume: 0.35 },
        { at: 79, file: "note-fs5", volume: 0.35 },
        { at: 91, file: "note-a5", volume: 0.35 },
      ].map((c) => (
        <Sequence key={`${c.file}${c.at}`} from={INFO + c.at} layout="none">
          <Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume * 1.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

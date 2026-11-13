import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { DURATION, PHASES, T, lin, prog } from "./timeline";

// Montserrat (variabile, 100–900) incluso localmente: il render non dipende dalla rete
const fontFamily = "Montserrat";
loadFont({
  family: fontFamily,
  url: staticFile("fonts/Montserrat-latin.woff2"),
  weight: "100 900",
  format: "woff2",
});

const ACCENT = "#ffb020";
const INK = "#0b1d2c";

const Panel: React.CSSProperties = {
  background: "rgba(8, 22, 36, 0.72)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  color: "white",
};

const Intro: React.FC<{ frame: number }> = ({ frame }) => {
  const inP = prog(frame, 10, 50);
  const out = 1 - prog(frame, T.intro[1] - 35, T.intro[1] - 5);
  const line = prog(frame, 30, 80);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ textAlign: "center", transform: `translateY(${(1 - inP) * 30}px)`, opacity: inP }}>
        <div style={{ fontSize: 26, letterSpacing: 14, fontWeight: 500, color: ACCENT, marginBottom: 18 }}>
          ANIMAZIONE 3D DI CANTIERE
        </div>
        <div
          style={{
            fontSize: 118,
            fontWeight: 800,
            color: "white",
            letterSpacing: 4,
            lineHeight: 1,
            textShadow: "0 8px 40px rgba(0,0,0,0.45)",
          }}
        >
          COSTRUZIONE DI UN PORTO
        </div>
        <div
          style={{
            height: 4,
            width: 520 * line,
            background: ACCENT,
            margin: "28px auto",
            borderRadius: 2,
          }}
        />
        <div style={{ fontSize: 34, fontWeight: 300, color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          Dal fondale naturale al terminal operativo, in 6 fasi
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PhaseCard: React.FC<{ frame: number; i: number }> = ({ frame, i }) => {
  const ph = PHASES[i];
  const [a, b] = T[ph.key];
  if (frame < a || frame > b + 5) return null;
  const inP = prog(frame, a + 6, a + 30);
  const outP = prog(frame, b - 22, b - 2);
  const vis = inP * (1 - outP);
  const x = (1 - inP) * -60 + outP * -60;
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        bottom: 150,
        width: 640,
        padding: "30px 36px 32px",
        ...Panel,
        opacity: vis,
        transform: `translateX(${x}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{ph.n}</div>
        <div style={{ fontSize: 22, letterSpacing: 6, fontWeight: 500, opacity: 0.75 }}>FASE</div>
      </div>
      <div style={{ fontSize: 46, fontWeight: 700, marginTop: 10, lineHeight: 1.1 }}>{ph.title}</div>
      <div style={{ height: 3, width: 90 * prog(frame, a + 18, a + 45), background: ACCENT, margin: "18px 0" }} />
      <div style={{ fontSize: 23, fontWeight: 300, lineHeight: 1.45, opacity: 0.92 }}>{ph.text}</div>
      <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
        {ph.stats.map(([k, v], j) => {
          const s = prog(frame, a + 30 + j * 8, a + 50 + j * 8);
          return (
            <div
              key={k}
              style={{
                flex: 1,
                padding: "14px 18px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                opacity: s,
                transform: `translateY(${(1 - s) * 14}px)`,
              }}
            >
              <div style={{ fontSize: 16, letterSpacing: 2, opacity: 0.7, textTransform: "uppercase" }}>{k}</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{v}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimelineBar: React.FC<{ frame: number }> = ({ frame }) => {
  const show = prog(frame, T.intro[1] - 20, T.intro[1] + 10) * (1 - prog(frame, T.outro[0] + 10, T.outro[0] + 40));
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        bottom: 56,
        display: "flex",
        gap: 10,
        opacity: show,
      }}
    >
      {PHASES.map((ph) => {
        const [a, b] = T[ph.key];
        const p = lin(frame, a, b);
        const active = frame >= a && frame < b;
        return (
          <div key={ph.key} style={{ flex: b - a }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: active ? 700 : 500,
                letterSpacing: 1.5,
                color: active ? "white" : "rgba(255,255,255,0.6)",
                marginBottom: 10,
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: p > 0 ? ACCENT : "inherit" }}>{ph.n}</span>&nbsp;&nbsp;{ph.title.toUpperCase()}
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${p * 100}%`, background: ACCENT }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HUD: React.FC<{ frame: number }> = ({ frame }) => {
  const show = prog(frame, T.intro[1] - 10, T.intro[1] + 20) * (1 - prog(frame, T.outro[0] + 10, T.outro[0] + 40));
  const total = lin(frame, T.dredge[0], T.ops[1]);
  const month = Math.max(1, Math.ceil(total * 36));
  const blink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.25;
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 80,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: show,
          color: "white",
          fontSize: 18,
          letterSpacing: 4,
          fontWeight: 600,
          textShadow: "0 2px 10px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff3b30", opacity: blink }} />
        TIME-LAPSE · CANTIERE PORTUALE
      </div>
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 80,
          padding: "16px 24px",
          ...Panel,
          opacity: show,
          display: "flex",
          gap: 34,
        }}
      >
        <div>
          <div style={{ fontSize: 14, letterSpacing: 3, opacity: 0.7 }}>AVANZAMENTO</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{Math.round(total * 100)}%</div>
        </div>
        <div>
          <div style={{ fontSize: 14, letterSpacing: 3, opacity: 0.7 }}>DURATA LAVORI</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>
            Mese {String(month).padStart(2, "0")}
            <span style={{ fontWeight: 300, opacity: 0.6 }}> / 36</span>
          </div>
        </div>
      </div>
    </>
  );
};

const Outro: React.FC<{ frame: number }> = ({ frame }) => {
  const a = T.outro[0];
  const inP = prog(frame, a + 25, a + 60);
  const fade = prog(frame, DURATION - 25, DURATION - 1);
  return (
    <>
      <AbsoluteFill
        style={{
          opacity: inP,
          background: "radial-gradient(ellipse 60% 45% at center, rgba(6,18,30,0.72) 0%, rgba(6,18,30,0.35) 60%, rgba(6,18,30,0) 100%)",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: inP }}>
        <div style={{ textAlign: "center", transform: `translateY(${(1 - inP) * 24}px)` }}>
          <div style={{ fontSize: 26, letterSpacing: 14, fontWeight: 500, color: ACCENT }}>OPERA COMPLETATA</div>
          <div
            style={{
              fontSize: 104,
              fontWeight: 800,
              color: "white",
              marginTop: 14,
              textShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            Il porto è operativo
          </div>
          <div style={{ display: "flex", gap: 60, justifyContent: "center", marginTop: 34, color: "white" }}>
            {[
              ["36", "mesi di lavori"],
              ["1.450 m", "di diga foranea"],
              ["400 m", "di banchina"],
              ["4", "gru STS"],
            ].map(([v, k], j) => {
              const s = prog(frame, a + 45 + j * 6, a + 70 + j * 6);
              return (
                <div key={k} style={{ opacity: s, transform: `translateY(${(1 - s) * 16}px)` }}>
                  <div style={{ fontSize: 46, fontWeight: 700, textShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>{v}</div>
                  <div style={{ fontSize: 20, fontWeight: 300, opacity: 0.85, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{k}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: INK, opacity: fade }} />
    </>
  );
};

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 20], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* vignetta e gradiente inferiore per leggibilità */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,10,20,0.45) 100%), linear-gradient(to top, rgba(4,14,24,0.55) 0%, rgba(4,14,24,0) 30%)",
        }}
      />
      {frame < T.intro[1] ? <Intro frame={frame} /> : null}
      {PHASES.map((_, i) => (
        <PhaseCard key={i} frame={frame} i={i} />
      ))}
      <TimelineBar frame={frame} />
      <HUD frame={frame} />
      {frame >= T.outro[0] ? <Outro frame={frame} /> : null}
      <AbsoluteFill style={{ background: INK, opacity: fadeIn }} />
    </AbsoluteFill>
  );
};

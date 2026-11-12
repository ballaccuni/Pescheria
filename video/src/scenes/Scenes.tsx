import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Bg, C, F, fgColor } from "../theme";
import { easeOut, HandCircle, Rise, Tape } from "../components/Common";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Area principale della scena (sopra i sottotitoli). */
const Stage: React.FC<{ children: React.ReactNode; top?: number; height?: number }> = ({
  children,
  top = 220,
  height = 960,
}) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 80,
      right: 80,
      height,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* TITOLONE: righe in maiuscolo, alcune evidenziate con box oro/nero   */
/* ------------------------------------------------------------------ */
export type HeadlineProps = {
  lines: string[]; // usa *testo* per evidenziare una riga
  tape?: string;
};

export const Headline: React.FC<HeadlineProps & { bg: Bg }> = ({ lines, tape, bg }) => {
  const frame = useCurrentFrame();
  const hlBg = bg === "gold" ? C.ink : C.gold;
  const hlFg = bg === "gold" ? C.gold : C.ink;
  return (
    <Stage>
      {tape ? (
        <div style={{ marginBottom: 40 }}>
          <Tape text={tape} />
        </div>
      ) : null}
      {lines.map((l, i) => {
        const hl = l.startsWith("*");
        const text = l.replace(/\*/g, "");
        const d = 2 + i * 4;
        const t = interpolate(frame, [d, d + 7], [0, 1], { ...clamp, easing: easeOut });
        return (
          <div
            key={i}
            style={{
              fontFamily: F.display,
              fontSize: 150,
              lineHeight: 1.02,
              textTransform: "uppercase",
              color: hl ? hlFg : fgColor(bg),
              background: hl ? hlBg : "transparent",
              padding: hl ? "0 18px" : 0,
              marginTop: hl ? 8 : 0,
              opacity: t,
              scale: interpolate(t, [0, 1], [1.3, 1]),
            }}
          >
            {text}
          </div>
        );
      })}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* NUMERO GIGANTE con etichetta, sottotitolo e cerchio a mano          */
/* ------------------------------------------------------------------ */
export type BigNumberProps = {
  value: string;
  tape?: string;
  sub?: string;
  circle?: boolean;
  countUp?: boolean; // anima da 0 al valore (solo se numerico)
};

export const BigNumber: React.FC<BigNumberProps & { bg: Bg }> = ({ value, tape, sub, circle, countUp, bg }) => {
  const frame = useCurrentFrame();
  const numColor = bg === "gold" ? C.ink : C.gold;
  const n = parseFloat(value.replace(",", "."));
  let shown = value;
  if (countUp && !Number.isNaN(n)) {
    const p = interpolate(frame, [3, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const suffix = value.replace(/^[\d.,]+/, "");
    shown = `${Math.round(n * p)}${suffix}`;
  }
  const t = interpolate(frame, [2, 10], [0, 1], { ...clamp, easing: easeOut });
  return (
    <Stage>
      {tape ? (
        <div style={{ marginBottom: 30 }}>
          <Tape text={tape} />
        </div>
      ) : null}
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: value.length > 6 ? 230 : 330,
            lineHeight: 1.05,
            color: numColor,
            opacity: t,
            scale: interpolate(t, [0, 1], [1.4, 1]),
            whiteSpace: "nowrap",
          }}
        >
          {shown}
        </div>
        {circle ? (
          <HandCircle width={Math.min(860, value.length * (value.length > 6 ? 105 : 150) + 140)} height={value.length > 6 ? 280 : 340} color={bg === "dark" ? C.paper : C.ink} delay={14} seed={value} />
        ) : null}
      </div>
      {sub ? (
        <Rise delay={8}>
          <div
            style={{
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: fgColor(bg),
              marginTop: 20,
            }}
          >
            {sub}
          </div>
        </Rise>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* CITAZIONE in corsivo con virgolette giganti                          */
/* ------------------------------------------------------------------ */
export type QuoteProps = { text: string; tape?: string };

export const Quote: React.FC<QuoteProps & { bg: Bg }> = ({ text, tape, bg }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <Stage>
      <Rise>
        <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 300, lineHeight: 0.6, color: bg === "gold" ? C.ink : C.gold, height: 150 }}>
          “
        </div>
      </Rise>
      {tape ? (
        <div style={{ margin: "10px 0 40px" }}>
          <Tape text={tape} />
        </div>
      ) : null}
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 112, lineHeight: 1.15, color: fgColor(bg), wordSpacing: "0.1em" }}>
        «
        {words.map((w, i) => {
          const d = 6 + i * 2;
          return (
            <span key={i} style={{ opacity: interpolate(frame, [d, d + 6], [0, 1], clamp) }}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
        »
      </div>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* ELENCO NUMERATO che si costruisce punto per punto                    */
/* ------------------------------------------------------------------ */
export type ListProps = { tape?: string; items: { title: string; text: string }[] };

export const List: React.FC<ListProps & { bg: Bg }> = ({ tape, items, bg }) => {
  const frame = useCurrentFrame();
  return (
    <Stage top={180} height={1000}>
      {tape ? (
        <div style={{ marginBottom: 60 }}>
          <Tape text={tape} dark />
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 44, alignSelf: "stretch" }}>
        {items.map((it, i) => {
          const d = 4 + i * 34;
          const t = interpolate(frame, [d, d + 10], [0, 1], { ...clamp, easing: easeOut });
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 30, textAlign: "left", opacity: t, translate: `${interpolate(t, [0, 1], [-40, 0])}px 0px` }}>
              <div style={{ flex: "0 0 auto", width: 84, height: 84, background: C.gold, color: C.ink, fontFamily: F.display, fontSize: 60, display: "flex", alignItems: "center", justifyContent: "center", rotate: `${i % 2 ? 2 : -2}deg` }}>
                {i + 1}
              </div>
              <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 56, lineHeight: 1.12, color: fgColor(bg) }}>
                {it.title} · <span style={{ fontWeight: 700, opacity: 0.75 }}>{it.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* DOCUMENTO di carta con timbro                                        */
/* ------------------------------------------------------------------ */
export type DocumentProps = { header: string; title: string; rows: string[]; stamp: string; stampColor?: "red" | "green" };

export const Document: React.FC<DocumentProps & { bg: Bg }> = ({ header, title, rows, stamp, stampColor = "red" }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: easeOut });
  const s = interpolate(frame, [26, 32], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const col = stampColor === "red" ? C.red : "#2E7D4F";
  return (
    <Stage>
      <div
        style={{
          position: "relative",
          width: 760,
          background: C.paper,
          padding: "60px 60px 70px",
          boxShadow: "0 30px 60px rgba(0,0,0,0.22)",
          rotate: `${interpolate(enter, [0, 1], [-6, -2])}deg`,
          translate: `0px ${interpolate(enter, [0, 1], [120, 0])}px`,
          opacity: enter,
        }}
      >
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ink, borderBottom: `3px solid ${C.ink}`, paddingBottom: 14 }}>
          {header}
        </div>
        <div style={{ fontFamily: F.display, fontSize: 92, lineHeight: 1.02, textTransform: "uppercase", color: C.ink, margin: "26px 0 30px" }}>
          {title}
        </div>
        {rows.map((r, i) => (
          <Rise key={i} delay={8 + i * 5}>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: C.ink, padding: "12px 0", borderBottom: "2px dashed rgba(0,0,0,0.2)", textAlign: "left" }}>
              ☐ {r}
            </div>
          </Rise>
        ))}
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: -110,
            fontFamily: F.display,
            fontSize: 108,
            color: col,
            border: `10px solid ${col}`,
            padding: "0 28px",
            textTransform: "uppercase",
            rotate: "-12deg",
            opacity: s * 0.92,
            scale: interpolate(s, [0, 1], [2.2, 1]),
            mixBlendMode: "multiply",
          }}
        >
          {stamp}
        </div>
      </div>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* CONFRONTO a due card                                                 */
/* ------------------------------------------------------------------ */
export type SplitProps = { tape?: string; left: { big: string; small: string }; right: { big: string; small: string } };

export const Split: React.FC<SplitProps & { bg: Bg }> = ({ tape, left, right }) => {
  const frame = useCurrentFrame();
  const card = (c: { big: string; small: string }, i: number) => {
    const d = 4 + i * 10;
    const t = interpolate(frame, [d, d + 8], [0, 1], { ...clamp, easing: easeOut });
    const dark = i === 1;
    return (
      <div
        key={i}
        style={{
          background: dark ? C.ink : C.gold,
          color: dark ? C.paper : C.ink,
          padding: "40px 30px",
          width: 430,
          rotate: `${dark ? 2 : -2}deg`,
          opacity: t,
          scale: interpolate(t, [0, 1], [1.3, 1]),
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontFamily: F.display, fontSize: 110, lineHeight: 1 }}>{c.big}</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 14 }}>{c.small}</div>
      </div>
    );
  };
  return (
    <Stage>
      {tape ? (
        <div style={{ marginBottom: 50 }}>
          <Tape text={tape} dark />
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 20 }}>
        {card(left, 0)}
        {card(right, 1)}
      </div>
    </Stage>
  );
};

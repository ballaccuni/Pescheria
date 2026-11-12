import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Bg, C, F } from "../theme";

type Word = { text: string; hl: boolean; start: number; end: number };

/**
 * Sottotitoli parola-per-parola, a gruppi di massimo 3 parole.
 * Le parole scritte tra *asterischi* vengono evidenziate in oro.
 * Le parole sono distribuite sulla durata della scena in proporzione alla lunghezza.
 */
const buildWords = (caption: string, total: number): Word[] => {
  const raw = caption.split(/\s+/).filter(Boolean);
  const weights = raw.map((w) => w.replace(/\*/g, "").length + 3);
  const sum = weights.reduce((a, b) => a + b, 0);
  const usable = total * 0.94;
  let t = 2;
  let inHl = false;
  return raw.map((w, i) => {
    const startsHl = w.startsWith("*");
    const endsHl = w.replace(/[.,:;!?»]+$/, "").endsWith("*");
    if (startsHl) inHl = true;
    const hl = inHl;
    if (endsHl) inHl = false;
    const dur = (weights[i] / sum) * (usable - 2);
    const word = { text: w.replace(/\*/g, ""), hl, start: t, end: t + dur };
    t += dur;
    return word;
  });
};

const chunk = (words: Word[]): Word[][] => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    const punct = /[.,:;!?»]$/.test(w.text);
    if (cur.length === 3 || punct) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
};

/** Raggruppa le parole consecutive con la stessa evidenziazione. */
const runs = (words: Word[]): Word[][] => {
  const out: Word[][] = [];
  words.forEach((w) => {
    const last = out[out.length - 1];
    if (last && last[0].hl === w.hl) last.push(w);
    else out.push([w]);
  });
  return out;
};

export const Caption: React.FC<{ text: string; bg: Bg; top?: number }> = ({ text, bg, top = 1290 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const groups = chunk(buildWords(text, durationInFrames));
  const active = groups.find((g, i) => {
    const next = groups[i + 1];
    return frame >= g[0].start && (!next || frame < next[0].start);
  });
  if (!active) return null;
  const fg = bg === "dark" ? C.paper : C.ink;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 0,
        fontFamily: F.sans,
        fontWeight: 800,
        fontSize: 64,
        lineHeight: 1.2,
      }}
    >
      {runs(active).map((run, ri) => {
        const goldOnGold = bg === "gold";
        const hl = run[0].hl;
        const runShown = frame >= run[0].start;
        return (
          <span
            key={ri}
            style={{
              opacity: runShown ? 1 : 0,
              color: hl && goldOnGold ? C.paper : fg,
              background: hl ? (goldOnGold ? C.ink : C.gold) : "transparent",
              padding: hl ? "0 12px" : 0,
              margin: "0 8px",
              whiteSpace: "pre-wrap",
            }}
          >
            {run.map((w, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: frame >= w.start ? 1 : 0,
                  scale: interpolate(frame, [w.start, w.start + 4], [0.85, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                {w.text}
                {i < run.length - 1 ? "\u00a0" : ""}
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
};

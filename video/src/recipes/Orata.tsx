import React from "react";
import { Easing, interpolate } from "remotion";
import { COLORS } from "../LogoAnimation";
import { mix } from "./ingredients";
import { clamp, mulberry32 } from "./utils";

// Orata intera vista di lato (com'è appoggiata in teglia), testa a sinistra.
// Lunga circa 400: da x=-200 (bocca) a x=208 (coda).

const BODY =
  "M -200 6 C -192 -44 -152 -78 -96 -88 C -30 -100 62 -82 122 -40 L 152 -17 L 152 17 C 62 72 -20 94 -90 86 C -150 78 -192 46 -200 6 Z";

const SCALES: [number, number][] = [];
for (let row = 0; row < 6; row++) {
  for (let col = 0; col < 9; col++) {
    SCALES.push([-84 + col * 26 + (row % 2) * 13, -52 + row * 21]);
  }
}

/** baked: 0 = cruda, 1 = cotta al forno. id: univoco per ogni pesce nella scena. */
export const Orata: React.FC<{ baked?: number; id: string }> = ({ baked = 0, id }) => {
  const line = COLORS.slate;
  const fin = mix("#8FA2AD", "#A8926B", baked * 0.75);
  const body = mix("#CBD5DB", "#DDCDA9", baked * 0.75);
  const back = mix("#9DB0BB", "#BBA172", baked * 0.75);
  const belly = mix("#EEF2F4", "#F2E7CD", baked * 0.75);
  return (
    <g>
      <defs>
        <clipPath id={`orataBody-${id}`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      {/* pinne dietro al corpo */}
      <path
        d="M -88 -82 Q -62 -126 -18 -114 Q 44 -114 118 -42 L 100 -46 Q 0 -98 -88 -82 Z"
        fill={fin}
        stroke={line}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path d="M 36 66 Q 74 104 112 40 Z" fill={fin} stroke={line} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M -62 80 Q -44 110 -18 86 Z" fill={fin} stroke={line} strokeWidth={3.5} strokeLinejoin="round" />
      {/* coda */}
      <path d="M 146 -17 L 208 -74 Q 190 0 208 74 L 146 17 Z" fill={fin} stroke={line} strokeWidth={3.5} strokeLinejoin="round" />
      <path
        d="M 162 -9 L 196 -46 M 164 0 L 192 0 M 162 9 L 196 46"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* corpo */}
      <path d={BODY} fill={body} />
      <g clipPath={`url(#orataBody-${id})`}>
        <path d="M -210 -110 L 170 -110 L 170 -28 C 60 -54 -60 -58 -210 -18 Z" fill={back} />
        <path d="M -210 44 C -80 62 60 52 170 20 L 170 120 L -210 120 Z" fill={belly} />
        {SCALES.map(([x, y], i) => (
          <path
            key={i}
            d={`M ${x - 9} ${y} Q ${x} ${y + 10} ${x + 9} ${y}`}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        <path d="M -104 -34 Q 0 -54 146 -6" stroke={fin} strokeWidth={2.5} fill="none" opacity={0.7} />
        {/* guancia dorata e fascia dorata tra gli occhi: il segno dell'orata */}
        <ellipse cx={-130} cy={14} rx={17} ry={10} fill="#E9C465" opacity={0.8 - baked * 0.4} />
        <path d="M -172 -38 Q -150 -62 -122 -72" stroke="#E9B93C" strokeWidth={11} strokeLinecap="round" fill="none" />
      </g>
      <path d={BODY} fill="none" stroke={line} strokeWidth={3.5} strokeLinejoin="round" />
      {/* opercolo */}
      <path d="M -112 -74 Q -78 2 -106 76" stroke={line} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.65} />
      <circle cx={-107} cy={-50} r={7} fill="#4A5A66" opacity={0.8} />
      {/* occhio (da cotto diventa bianco) */}
      <circle cx={-152} cy={-22} r={14} fill="#FFFFFF" stroke={line} strokeWidth={3.5} />
      <circle cx={-152} cy={-22} r={7.5} fill={mix("#1F2E38", "#DDE4E8", baked)} />
      <circle cx={-149} cy={-25} r={2.6} fill="#FFFFFF" />
      {/* bocca */}
      <path d="M -198 9 Q -186 17 -176 11" stroke={line} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* pinna pettorale */}
      <path d="M -72 18 Q -30 8 -8 40 Q -46 54 -72 18 Z" fill={fin} stroke={line} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};

const CRUST_BLOB =
  "M -92 -6 C -92 -52 -32 -72 30 -66 C 92 -60 134 -30 130 4 C 126 42 72 66 10 66 C -52 66 -92 40 -92 -6 Z";
// [crudo, dorato]
const CRUMB_TONES: [string, string][] = [
  ["#EBD3A0", "#D9A24B"],
  ["#DFC283", "#BE7C2C"],
  ["#F4E3BB", "#E6BC6A"],
  ["#D8B670", "#A86A22"],
];

/**
 * Panatura di pangrattato sopra l'orata (stesse coordinate del pesce).
 * local: fotogrammi da quando inizia a piovere il pangrattato. baked: doratura 0..1.
 */
export type CrustArea = { cx: number; rx: number; ry: number; blob: string; count: number };
const WHOLE_FISH_AREA: CrustArea = { cx: 19, rx: 108, ry: 64, blob: CRUST_BLOB, count: 230 };

export const Crust: React.FC<{ local: number; baked: number; seed: number; area?: CrustArea }> = ({
  local,
  baked,
  seed,
  area = WHOLE_FISH_AREA,
}) => {
  if (local < 0) return null;
  const rnd = mulberry32(seed);
  const crumbs: React.ReactNode[] = [];
  for (let i = 0; i < area.count; i++) {
    const a = rnd() * Math.PI * 2;
    // qualche briciola cade anche fuori dal pesce
    const rr = Math.sqrt(rnd()) * (rnd() < 0.1 ? 1.28 : 1);
    const x = area.cx + Math.cos(a) * rr * area.rx;
    const y = Math.sin(a) * rr * area.ry;
    const delay = rnd() * 42;
    const size = 3.5 + rnd() * 4.5;
    const tone = CRUMB_TONES[Math.floor(rnd() * CRUMB_TONES.length)];
    const l = local - delay;
    if (l < 0) continue;
    const fall = interpolate(l, [0, 9], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    crumbs.push(
      <circle
        key={i}
        cx={x}
        cy={y - (1 - fall) * 230}
        r={size}
        fill={mix(tone[0], tone[1], baked)}
        opacity={interpolate(l, [0, 3], [0, 1], clamp)}
      />,
    );
  }
  return (
    <g>
      <path d={area.blob} fill={mix("#E5CB93", "#CC9140", baked)} opacity={interpolate(local, [12, 46], [0, 0.94], clamp)} />
      {crumbs}
    </g>
  );
};

// ---------------------------------------------------------------- filetto

// Filetto di orata visto dall'alto, pelle sotto e polpa sopra.
// Lungo circa 320: da x=-152 (lato testa, più largo) a x=166 (coda).
const FILLET =
  "M -152 -8 C -152 -46 -104 -60 -32 -58 C 46 -55 116 -32 160 -8 C 168 -3 168 4 160 8 C 116 32 46 55 -32 58 C -104 60 -152 34 -152 -8 Z";

/** Zona coperta dalla panatura su un filetto. */
export const FILLET_CRUST: CrustArea = {
  cx: 2,
  rx: 128,
  ry: 38,
  count: 150,
  blob: "M -128 -6 C -128 -36 -80 -46 -20 -44 C 50 -42 104 -26 132 -6 C 104 18 50 38 -20 40 C -80 42 -128 26 -128 -6 Z",
};

/** baked: 0 = crudo (polpa rosata e lucida), 1 = cotto (polpa bianca). */
export const Fillet: React.FC<{ baked?: number; id: string }> = ({ baked = 0, id }) => {
  const flesh = mix("#F2DCCF", "#F8F1E6", baked);
  const lines = mix("#E3BFAE", "#E9DCC6", baked);
  return (
    <g>
      <defs>
        <clipPath id={`fillet-${id}`}>
          <path d={FILLET} />
        </clipPath>
      </defs>
      {/* pelle argentata che sporge dal bordo */}
      <path d={FILLET} fill={mix("#9DB0BB", "#B6A27E", baked * 0.7)} stroke={COLORS.slate} strokeWidth={3.5} />
      <g transform="scale(0.94 0.84)">
        <path d={FILLET} fill={flesh} />
        <g clipPath={`url(#fillet-${id})`}>
          {/* parte scura vicino alla pelle e linea centrale */}
          <path d="M -150 -2 C -60 6 60 4 166 0" stroke={mix("#D9A79A", "#E2CDB2", baked)} strokeWidth={9} fill="none" opacity={0.55} />
          {/* venature della polpa */}
          {[-118, -88, -58, -28, 2, 32, 62, 92, 122].map((x, i) => {
            const h = 52 - Math.max(0, x) * 0.24;
            return (
              <path
                key={i}
                d={`M ${x + 8} ${-h} Q ${x - 14} 0 ${x + 8} ${h}`}
                stroke={lines}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
          <ellipse cx={-70} cy={-24} rx={46} ry={9} fill="#FFFFFF" opacity={0.28 * (1 - baked)} transform="rotate(-6 -70 -24)" />
        </g>
      </g>
    </g>
  );
};

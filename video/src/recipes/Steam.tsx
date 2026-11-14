import React from "react";

/** Fili di vapore che salgono. Richiede il filtro #steamBlur nell'svg. */
export const Steam: React.FC<{ frame: number; strength: number; xs?: number[]; rise?: number }> = ({
  frame,
  strength,
  xs = [-140, -40, 70, 165],
  rise = 240,
}) => {
  if (strength <= 0) return null;
  return (
    <>
      {xs.map((x0, i) => {
        const period = 70;
        const ph = ((frame + i * 19) % period) / period;
        const y0 = -40 - ph * rise;
        const op = Math.sin(ph * Math.PI) * 0.22 * strength;
        const wob = (k: number) => Math.sin(ph * 6 + i + k) * 18;
        return (
          <path
            key={i}
            d={`M ${x0} ${y0 + 120} C ${x0 + wob(0)} ${y0 + 80}, ${x0 - wob(1)} ${y0 + 40}, ${x0 + wob(2)} ${y0}`}
            stroke="#FFFFFF"
            strokeWidth={26}
            strokeLinecap="round"
            fill="none"
            opacity={op}
            filter="url(#steamBlur)"
          />
        );
      })}
    </>
  );
};

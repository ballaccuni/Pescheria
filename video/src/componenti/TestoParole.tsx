import { interpolate, useCurrentFrame } from "remotion";
import { colori, font } from "../tema";

// Mostra il testo parola per parola. *parole* tra asterischi diventano dorate.
export const TestoParole: React.FC<{
  testo: string;
  inizio?: number;
  framePerParola?: number;
  dimensione?: number;
}> = ({ testo, inizio = 0, framePerParola = 4, dimensione = 96 }) => {
  const frame = useCurrentFrame();
  let evidenziato = false;
  const parole = testo.split(" ").map((p) => {
    const apre = p.startsWith("*");
    if (apre) evidenziato = true;
    const oro = evidenziato;
    if (p.replace(/[.,!?:;"]+$/, "").endsWith("*")) evidenziato = false;
    return { testo: p.replace(/\*/g, ""), oro };
  });

  return (
    <div
      style={{
        fontFamily: font.titolo,
        fontSize: dimensione,
        lineHeight: 1.12,
        color: colori.bianco,
        textAlign: "center",
      }}
    >
      {parole.map((p, i) => {
        const f = frame - inizio - i * framePerParola;
        const o = interpolate(f, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const y = interpolate(f, [0, 8], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.25em",
              opacity: o,
              transform: `translateY(${y}px)`,
              color: p.oro ? colori.oro : colori.bianco,
              fontStyle: p.oro ? "italic" : "normal",
            }}
          >
            {p.testo}
          </span>
        );
      })}
    </div>
  );
};

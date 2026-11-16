import { Img, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colori, font } from "../tema";
import { ALTEZZA, LARGHEZZA } from "../tema";

// Oggetti che cadono dall'alto girando su se stessi.
// tipo = "soldi" → banconote e monete disegnate nel codice;
// altrimenti è il nome di un PNG in public/immagini (es. un pesce, una conchiglia).
// strato "dietro" = oggetti piccoli e sfocati dietro al testo, "davanti" = grandi e nitidi.

const Banconota: React.FC = () => (
  <div
    style={{
      width: 240,
      height: 124,
      background: `linear-gradient(135deg, #cfe3c8, #9fc49a)`,
      border: "6px solid #f4f1e6",
      borderRadius: 6,
      boxShadow: "0 10px 18px rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 18px",
      fontFamily: font.titolo,
      fontWeight: 700,
      color: "#3f6b45",
    }}
  >
    <div style={{ fontSize: 46 }}>50</div>
    <div style={{ width: 62, height: 62, borderRadius: "50%", border: "4px solid #6f9a72", opacity: 0.8 }} />
    <div style={{ fontSize: 40 }}>€</div>
  </div>
);

const Moneta: React.FC = () => (
  <div
    style={{
      width: 96,
      height: 96,
      borderRadius: "50%",
      background: `radial-gradient(circle at 35% 30%, #fff3c4, ${colori.oro} 45%, ${colori.oroScuro})`,
      border: `5px solid ${colori.oroScuro}`,
      boxShadow: "0 8px 14px rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: font.titolo,
      fontWeight: 700,
      fontSize: 46,
      color: "#8a6418",
    }}
  >
    €
  </div>
);

export const Pioggia: React.FC<{
  tipo: string;
  strato: "dietro" | "davanti";
  inizio?: number;
  quantita?: number;
}> = ({ tipo, strato, inizio = 10, quantita = 14 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dietro = strato === "dietro";
  const n = dietro ? Math.round(quantita * 0.6) : quantita;

  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const seme = `${tipo}-${strato}-${i}`;
        const partenza = inizio + random(seme + "t") * fps * 1.6;
        const t = (frame - partenza) / fps;
        if (t < 0) return null;

        const x = random(seme + "x") * (LARGHEZZA + 100) - 50;
        const velocita = (dietro ? 650 : 950) + random(seme + "v") * 400;
        const y = -250 + velocita * t + 220 * t * t; // accelera come se cadesse davvero
        if (y > ALTEZZA + 300) return null;

        const ondeggio = Math.sin(t * 4 + i) * (dietro ? 25 : 45);
        const giro = (random(seme + "r") - 0.5) * 60 + t * (random(seme + "g") - 0.5) * 500;
        // Effetto 3D: l'oggetto si "gira" mostrando il fianco
        const ribalta = Math.cos(t * (3 + random(seme + "f") * 4));
        const scala = (dietro ? 0.55 : 0.9) + random(seme + "s") * 0.35;
        const moneta = tipo === "soldi" && random(seme + "m") < 0.4;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + ondeggio,
              top: y,
              transform: `translate(-50%, -50%) rotate(${giro}deg) scale(${scala}) scaleY(${0.35 + 0.65 * Math.abs(ribalta)})`,
              filter: dietro ? "blur(3px)" : undefined,
              opacity: dietro ? 0.75 : 1,
            }}
          >
            {tipo === "soldi" ? (
              moneta ? <Moneta /> : <Banconota />
            ) : (
              <Img src={staticFile(`immagini/${tipo}`)} style={{ width: 220 }} />
            )}
          </div>
        );
      })}
    </>
  );
};

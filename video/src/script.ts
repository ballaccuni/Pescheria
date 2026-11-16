/**
 * ============================================================
 *  COPIONE DEL VIDEO — modifica solo questo file per cambiare argomento.
 * ============================================================
 *
 * Ogni scena ha:
 *  - type:     "map" | "headline" | "number" | "quote" | "list" | "document" | "split" | "magnifier"
 *  - seconds:  durata della scena
 *  - bg:       "cream" | "dark" | "gold"   (ignorato per "map")
 *  - caption:  la frase detta dalla voce. Appare parola per parola.
 *              Metti *tra asterischi* le parole da evidenziare in oro.
 *  - source:   (facoltativo) fonte mostrata in piccolo in basso
 *  - ...le proprietà specifiche del tipo di scena (vedi esempi sotto)
 *
 * Se hai una voce registrata, mettila in public/voce.mp3 e imposta
 * VOICEOVER = "voce.mp3". Poi regola i "seconds" per andare a tempo.
 */
import type { Bg } from "./theme";
import type {
  BigNumberProps,
  DocumentProps,
  HeadlineProps,
  ListProps,
  QuoteProps,
  SplitProps,
} from "./scenes/Scenes";
import type { MapProps } from "./scenes/MapScene";
import type { MagnifierProps } from "./scenes/MagnifierScene";

export const VOICEOVER: string | null = null; // es. "voce.mp3"
export const MUSIC: string | null = null; // es. "musica.mp3" (volume basso)
export const HANDLE = "@saporedimare.raffadali"; // firma in basso a destra (null per toglierla)

type Base = { seconds: number; bg: Bg; caption: string; source?: string };
export type Scene =
  | (Base & { type: "map" } & MapProps)
  | (Base & { type: "headline" } & HeadlineProps)
  | (Base & { type: "number" } & BigNumberProps)
  | (Base & { type: "quote" } & QuoteProps)
  | (Base & { type: "list" } & ListProps)
  | (Base & { type: "document" } & DocumentProps)
  | (Base & { type: "split" } & SplitProps)
  | (Base & { type: "magnifier" } & MagnifierProps);

export const SCENES: Scene[] = [
  {
    type: "map",
    seconds: 7,
    bg: "cream",
    pin: { label: "Raffadali", lon: 13.533, lat: 37.404 },
    // Partenza + punti intermedi della strada [lon, lat] (tracciato indicativo)
    route: {
      label: "Porto Empedocle",
      lon: 13.527,
      lat: 37.289,
      via: [
        [13.545, 37.297],
        [13.562, 37.304],
        [13.566, 37.324],
        [13.556, 37.348],
        [13.546, 37.372],
        [13.537, 37.391],
      ],
    },
    tape: "Ogni mattina, prima dell'alba",
    caption: "Ogni mattina il pesce parte da *Porto Empedocle* e arriva *fresco a Raffadali.*",
  },
  {
    type: "headline",
    seconds: 4.5,
    bg: "gold",
    lines: ["Il pesce", "è fresco?", "*Come fai*", "*a saperlo?*"],
    caption: "Ma tu, al banco, come capisci se è *davvero fresco?*",
  },
  {
    type: "number",
    seconds: 4,
    bg: "dark",
    value: "4",
    tape: "I segni da controllare",
    sub: "Occhi · branchie · odore · carne",
    circle: true,
    caption: "Bastano *quattro controlli.* Te li spieghiamo.",
  },
  {
    type: "magnifier",
    seconds: 8,
    bg: "cream",
    tape: "Guardalo da vicino",
    // x, y = punto del disegno del pesce su cui si ferma la lente
    stops: [
      { x: 268, y: 528, title: "Occhio", text: "Lucido, vivo e convesso" },
      { x: 352, y: 566, title: "Branchie", text: "Rosso brillante, mai scure" },
      { x: 600, y: 560, title: "Pelle", text: "Brillante, squame ben attaccate" },
    ],
    caption: "Avvicinati e guarda bene: *l'occhio,* poi *le branchie,* e infine *la pelle.*",
  },
  {
    type: "list",
    seconds: 9,
    bg: "cream",
    tape: "Al banco del pesce",
    items: [
      { title: "Occhi", text: "lucidi, vivi e convessi" },
      { title: "Branchie", text: "rosso brillante, mai scure" },
      { title: "Odore", text: "di mare, mai di ammoniaca" },
      { title: "Carne", text: "soda: se la premi, torna su" },
    ],
    caption:
      "Occhi *lucidi e convessi,* branchie *rosso vivo,* odore di mare, e carne soda che *torna su* se la premi.",
  },
  {
    type: "quote",
    seconds: 5.5,
    bg: "dark",
    tape: "Famiglia Marino · dal 1987",
    text: "Il pesce fresco non puzza: profuma di mare.",
    caption: "In pescheria lo diciamo da sempre: il pesce fresco *profuma di mare.*",
  },
  {
    type: "document",
    seconds: 7,
    bg: "cream",
    header: "Etichetta del pesce",
    title: "Cosa deve esserci scritto",
    rows: ["Nome commerciale e scientifico", "Zona di pesca (FAO)", "Pescato o allevato", "Attrezzo di pesca"],
    stamp: "Obbligatoria",
    caption: "E poi c'è l'etichetta: per legge deve dirti *specie,* *zona di pesca* e metodo di produzione.",
    source: "Reg. UE 1379/2013",
  },
  {
    type: "number",
    seconds: 5,
    bg: "gold",
    value: "FAO 37",
    tape: "Zona di pesca",
    sub: "Mar Mediterraneo",
    circle: true,
    caption: "Se leggi FAO 37, vuol dire Mediterraneo: *il nostro mare.*",
    source: "FAO · Aree di pesca",
  },
  {
    type: "split",
    seconds: 4.5,
    bg: "cream",
    tape: "Lo devi sapere",
    left: { big: "Pescato", small: "In mare aperto" },
    right: { big: "Allevato", small: "In acquacoltura" },
    caption: "Pescato o allevato? Deve essere *scritto. Sempre.*",
  },
  {
    type: "number",
    seconds: 4.5,
    bg: "dark",
    value: "6:00",
    tape: "Ogni mattina",
    sub: "Lun – Sab · fino alle 13:30",
    caption: "Noi apriamo alle sei, con il pesce *appena arrivato.*",
  },
  {
    type: "headline",
    seconds: 5,
    bg: "cream",
    tape: "Via del Porto 12 · Raffadali",
    lines: ["Pescheria", "*Sapore*", "*di Mare*"],
    caption: "Pescheria Sapore di Mare. *Vieni a trovarci.*",
  },
];

export const FPS = 30;
export const totalFrames = () => SCENES.reduce((a, s) => a + Math.round(s.seconds * FPS), 0);

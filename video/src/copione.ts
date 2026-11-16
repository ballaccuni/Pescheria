// ─────────────────────────────────────────────────────────────
//  COPIONE DEL VIDEO — modifica solo questo file per cambiare
//  testi, immagini e durata delle scene.
//
//  etichetta  → targhetta gialla in alto (facoltativa)
//  titolo     → testo grande; compare parola per parola.
//               Le parole tra *asterischi* diventano dorate.
//  sottotitolo→ riga piccola sotto (facoltativa)
//  immagine   → nome del file in public/immagini (PNG con sfondo
//               trasparente). Se manca, appare un segnaposto.
//  segnaposto → testo mostrato nel segnaposto finché non c'è l'immagine
//  timbro     → scritta "timbrata" sopra l'immagine (facoltativa)
//  lente      → true per far passare una lente d'ingrandimento sull'immagine
//  pioggia    → "soldi" per far cadere banconote e monete dall'alto,
//               oppure il nome di un PNG in public/immagini da far cadere
//  secondi    → durata della scena
// ─────────────────────────────────────────────────────────────

export type Scena = {
  etichetta?: string;
  titolo: string;
  sottotitolo?: string;
  immagine?: string;
  segnaposto?: string;
  timbro?: string;
  lente?: boolean;
  pioggia?: string;
  secondi: number;
};

export const copione: Scena[] = [
  {
    etichetta: "Lo sapevi?",
    titolo: "Il pesce *fresco* si riconosce in 4 secondi.",
    segnaposto: "pesce intero",
    lente: true,
    secondi: 4.5,
  },
  {
    etichetta: "Primo segnale",
    titolo: "L'occhio: *lucido* e bombato.",
    sottotitolo: "Se è opaco o infossato, lascialo lì.",
    segnaposto: "occhio di pesce",
    secondi: 3.5,
  },
  {
    etichetta: "Secondo segnale",
    titolo: "Le branchie: *rosso vivo*.",
    sottotitolo: "Mai marroni o grigie.",
    segnaposto: "branchie",
    secondi: 3.5,
  },
  {
    etichetta: "Terzo segnale",
    titolo: "La carne è *soda*.",
    sottotitolo: "Premi col dito: deve tornare su.",
    segnaposto: "dito che preme",
    secondi: 3.5,
  },
  {
    etichetta: "Quarto segnale",
    titolo: "Profuma di *mare*.",
    sottotitolo: "Non di \"pesce\".",
    segnaposto: "onda",
    timbro: "Fresco ✓",
    secondi: 3.5,
  },
  {
    etichetta: "E il prezzo?",
    titolo: "Fresco *non vuol dire caro*.",
    sottotitolo: "Compri giusto, non butti niente.",
    segnaposto: "portafoglio",
    pioggia: "soldi",
    secondi: 4,
  },
  {
    etichetta: "Da noi",
    titolo: "Ogni mattina, *dal porto al banco*.",
    segnaposto: "banco del pesce",
    secondi: 4,
  },
];

export const chiusura = {
  nome: "Sapore di Mare",
  sottotitolo: "Pescheria",
  invito: "Vieni a trovarci",
  secondi: 3,
};

// Musica di sottofondo: metti un file in public/audio e scrivi qui il nome
// (es. "musica.mp3"). Lascia vuoto per nessuna musica.
export const musica = "";

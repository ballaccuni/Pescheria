# Video social — Sapore di Mare

Video verticali (1080×1920, 30 fps) per TikTok e Reels, creati con
[Remotion](https://www.remotion.dev). Usano i colori e i font del sito
(teal scuro, oro, Playfair Display + Lato).

## Avvio

```bash
cd video
npm install
npm run studio     # anteprima interattiva nel browser
npm run render     # crea out/video.mp4
```

## Come cambiare il video

Si modifica **solo `src/copione.ts`**:

- `etichetta`: targhetta gialla in alto
- `titolo`: compare parola per parola; le `*parole tra asterischi*` diventano dorate
- `sottotitolo`: riga piccola sotto l'immagine
- `immagine`: nome del file PNG in `public/immagini/`
- `timbro`: scritta rossa "timbrata" sopra l'immagine
- `secondi`: durata della scena

Finché una scena non ha `immagine`, al suo posto compare un riquadro segnaposto.
La musica va in `public/audio/` e il nome del file va scritto in `musica`.

## Immagini da Google Flow

1. In Flow genera ogni immagine usando i prompt in `PROMPT-FLOW.md`.
2. Scarica le immagini. Servono PNG con **sfondo trasparente**: se Flow le dà
   con lo sfondo bianco, lo si toglie con `rembg`
   (`pip install "rembg[cli]"` e poi `rembg i entrata.png uscita.png`),
   oppure chiedi a Claude di farlo.
3. Metti i file in `public/immagini/` e scrivi il nome nella scena giusta di `copione.ts`.

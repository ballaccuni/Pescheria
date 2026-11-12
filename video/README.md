# Video esplicativi verticali (Remotion)

Video 9:16 (1080×1920) in stile "explainer" con tipografia cinetica: palette oro/nero/crema,
etichette a nastro adesivo, numeri giganti, citazioni in corsivo, documenti con timbro,
mappe e sottotitoli parola per parola.

## Cambiare argomento
Modifica **solo** `src/script.ts`: ogni elemento di `SCENES` è una scena.

| type       | cosa mostra                          | proprietà principali                     |
|------------|--------------------------------------|------------------------------------------|
| `map`      | Sicilia con segnaposto               | `pin`, `route?`, `tape?`                 |
| `headline` | titolone, righe `*evidenziate*`      | `lines`, `tape?`                         |
| `number`   | numero gigante (+ cerchio a mano)    | `value`, `sub?`, `tape?`, `circle?`      |
| `quote`    | citazione in corsivo                 | `text`, `tape?`                          |
| `list`     | elenco numerato progressivo          | `items`, `tape?`                         |
| `document` | foglio con timbro                    | `header`, `title`, `rows`, `stamp`       |
| `split`    | confronto tra due card               | `left`, `right`, `tape?`                 |

Comuni a tutte: `seconds`, `bg` (`cream`/`dark`/`gold`), `caption` (frase della voce,
`*parole*` evidenziate in oro), `source` (fonte facoltativa).

## Voce e musica
Metti i file in `public/` e imposta `VOICEOVER = "voce.mp3"` / `MUSIC = "musica.mp3"` in `src/script.ts`,
poi regola i `seconds` di ogni scena per andare a tempo con la voce.

## Comandi
```bash
npm install
npm run dev                                   # anteprima interattiva (Remotion Studio)
npx remotion render Explainer out/video.mp4   # esporta l'MP4
```

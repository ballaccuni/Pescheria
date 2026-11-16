# Prompt per Google Flow

Usa lo stesso stile per tutte le immagini, così il video resta coerente.
Formato quadrato (1:1). Stile di base da aggiungere a ogni prompt:

> **Stile:** collage in carta ritagliata, fotografia vintage in mezzatinta
> con bordo bianco del ritaglio, soggetto singolo centrato, isolato su sfondo
> bianco pulito, nessun testo, nessuna ombra sullo sfondo.

| Scena | File | Prompt |
|---|---|---|
| 1 | `pesce-intero.png` | Un'orata intera fresca, vista di lato, squame lucide. |
| 2 | `occhio.png` | Primo piano della testa di un pesce con l'occhio lucido e bombato. |
| 3 | `branchie.png` | Branchie di pesce rosso vivo, con l'opercolo sollevato. |
| 4 | `dito.png` | Un dito che preme sul fianco di un pesce fresco. |
| 5 | `onda.png` | Un'onda del mare che si arriccia, con schiuma bianca. |
| 6 | `banco.png` | Un banco del pesce con cassette di legno e ghiaccio, pesce misto. |

Dopo averle scaricate, togli lo sfondo bianco (vedi `LEGGIMI.md`) e collegale
in `src/copione.ts`, per esempio `immagine: "pesce-intero.png"`.

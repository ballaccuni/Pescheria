// scoreSound(k): every time below is taken from the picture's own timeline in porto.js.
function scoreSound(k) {
  const D = 24;
  k.bed('room', 0, D - 0.4, { gain: 0.06, fadeOut: 1.2 });
  const mk = (t, dur, o) => k.play('marker', t, { dur, ...(o || {}) });
  const patter = (t0, t1, n, name, o) => { for (let i = 0; i < n; i++) k.play(name, t0 + (t1 - t0) * (i / n), o); };

  // 1 — hook
  mk(0.12, 0.2); mk(0.4, 0.2); mk(0.62, 0.22);            // "Come si costruisce"
  mk(0.45, 0.22, { pan: -0.5, gain: 0.5 }); mk(0.95, 0.25, { pan: -0.5, gain: 0.5 }); // anchor
  mk(0.82, 0.2, { gain: 1.1 }); mk(1.05, 0.22, { gain: 1.1 }); // "un porto?"
  mk(1.3, 0.28, { pan: 0.1 }); k.play('tap', 1.6);           // red underline
  mk(1.47, 0.36, { pan: 0.2, gain: 0.6 }); mk(1.6, 0.34, { pan: -0.1, gain: 0.5 });

  // 2 — studiare il mare
  k.play('eraser', 2.0, { dur: 0.75 });
  mk(2.75, 0.18, { pan: -0.7, gain: 0.7 }); mk(2.95, 0.4, { pan: -0.6, gain: 0.8 });
  mk(2.86, 0.44, { gain: 0.9 });                               // coastline
  patter(3.2, 3.7, 6, 'squeak', { gain: 0.35 });               // hatching
  mk(3.47, 0.25);                                              // TERRA
  [3.55, 3.75, 3.95].forEach((t, i) => { mk(t, 0.38, { gain: 0.5, pan: 0.2 * i }); k.play('pop', 4.1 + i * 0.2, { pan: 0.8, gain: 0.8 }); });
  [4.05, 4.17, 4.29].forEach((t, i) => mk(t, 0.18, { pan: -0.6 + i * 0.3, gain: 0.8 }));
  mk(4.5, 0.3, { pan: 0.1 });                                  // onde dominanti
  patter(4.52, 4.85, 5, 'tap', { gain: 0.35, pan: 0.4 });      // survey track
  mk(4.7, 0.32, { pan: -0.2 });                                // misura dei fondali

  // 3 — la diga foranea
  k.play('eraser', 5.2, { dur: 0.75 });
  mk(5.95, 0.35, { pan: -0.4 }); mk(6.0, 0.3, { gain: 0.5 }); // water + seabed (header writes under)
  patter(6.3, 6.9, 12, 'pebble', { gain: 0.9 });               // core stones, bottom up
  mk(6.75, 0.35, { gain: 0.6 });
  k.play('pop', 7.3, { pan: 0.6 });                            // nucleo di pietrame
  for (let i = 0; i < 9; i++) k.play('knock', 7.02 + i * 0.06, { pan: -0.6 + i * 0.05, gain: 0.55 });
  mk(7.55, 0.35); k.play('tap', 7.92);                         // crown wall
  k.play('pop', 8.0, { pan: -0.7 });                           // mantellata
  k.play('pop', 8.3, { pan: 0.3 });                            // muro paraonde
  mk(8.1, 0.33, { pan: -0.6, gain: 1.1 }); k.play('splash', 8.45, { pan: -0.3 });
  mk(8.52, 0.28, { pan: 0.6, gain: 0.6 }); k.play('pop', 8.86, { low: true, pan: 0.6, gain: 0.7 });

  // 4 — scavare il fondale (camera slides; marker keeps drawing)
  mk(9.0, 0.8, { gain: 0.7 });
  k.play('eraser', 9.5, { dur: 0.3, gain: 0.4, pan: -0.7 });
  mk(9.82, 0.4, { pan: -0.7, gain: 0.6 });                     // new header
  mk(9.85, 0.2); mk(10.05, 0.2); mk(10.22, 0.2);               // dredger
  k.play('rumble', 10.4, { dur: 0.95, gain: 0.8 });
  mk(10.27, 0.2, { gain: 0.6 });                               // draga
  mk(10.62, 0.3, { gain: 0.5, pan: 0.3 });                     // fondale naturale
  [10.9, 10.98, 11.06].forEach((t, i) => mk(t, 0.12, { gain: 0.6, pan: -0.5 + i * 0.1 }));
  mk(11.12, 0.28, { pan: -0.5 });                              // dimension line
  k.play('squeak', 11.42, { gain: 1.2 }); k.play('squeak', 11.52, { gain: 1.2 }); k.play('squeak', 11.63, { gain: 1.1 }); // "-16 m"
  mk(11.8, 0.3, { gain: 1.2 });                                // circle
  k.play('hit', 12.1);                                         // the key number

  // 5 — posare i cassoni
  mk(12.65, 0.65, { gain: 0.7 });
  k.play('eraser', 13.0, { dur: 0.3, gain: 0.4, pan: -0.7 });
  mk(13.32, 0.4, { pan: -0.7, gain: 0.6 });
  patter(13.3, 13.7, 7, 'pebble', { gain: 0.8 });              // stone bed
  mk(13.6, 0.4);                                               // caisson outline
  k.play('pop', 13.9, { pan: -0.6 });                          // scanno
  k.play('pop', 14.3, { pan: -0.6 });                          // cassone in c.a.
  mk(14.16, 0.22, { gain: 0.7 });
  k.play('gurgle', 14.2, { dur: 0.6 });
  k.play('thud', 14.8);
  k.play('hiss', 14.85, { dur: 0.55 });                        // sand fill
  k.play('pop', 15.3, { pan: -0.5 });                          // sabbia
  mk(15.32, 0.3);                                              // capping beam
  patter(15.45, 15.85, 6, 'squeak', { gain: 0.3, pan: 0.6 });  // backfill hatching
  mk(15.8, 0.18, { gain: 0.7 }); k.play('tap', 16.0);          // bollard
  k.play('pop', 16.2, { pan: 0.5 });                           // banchina

  // 6 — il porto prende forma
  k.play('eraser', 16.4, { dur: 0.75 });
  mk(17.16, 0.42, { pan: -0.6, gain: 0.7 });
  mk(17.2, 0.4, { gain: 0.7 });                                // coast
  mk(17.5, 0.55, { gain: 1 });                                 // breakwater
  patter(17.72, 18.12, 8, 'pebble', { gain: 0.6, pan: -0.3 });
  mk(18.0, 0.28, { pan: -0.7, gain: 0.8 }); mk(18.1, 0.28, { pan: -0.2, gain: 0.8 }); // waves stop
  mk(18.12, 0.32, { gain: 0.6, pan: 0.5 });                    // pier + quay
  patter(18.55, 18.8, 6, 'tap', { gain: 0.3 });                // containers
  mk(18.42, 0.26, { gain: 0.6 });                              // moored ship
  k.play('ping', 18.92, { note: 'E6', pan: 0.3 });             // green light
  k.play('ping', 19.02, { note: 'B5', pan: 0.6 });             // red light
  patter(19.2, 19.55, 5, 'tap', { gain: 0.3, pan: 0.8 });      // dashed route
  mk(19.5, 0.32);                                              // acque calme
  k.play('pop', 20.2, { pan: 0.7 });                           // imboccatura
  k.play('pop', 20.45, { pan: 0.1 });                          // banchina

  // 7 — takeaway
  mk(21.06, 0.34, { pan: 0.4 });                               // Un porto ha:
  [['C6', 21.4], ['E6', 21.85], ['G6', 22.3]].forEach(([n, t]) => { k.play('tick', t, { note: n, pan: 0.4 }); mk(t + 0.1, 0.33, { pan: 0.45, gain: 0.7 }); });
  mk(22.5, 0.5);                                               // closing line
  mk(23.0, 0.25, { gain: 0.9 });
  k.play('chord', 23.2, { dur: 1.6 });                         // resolves as the underline lands
}
window.scoreSound = scoreSound;

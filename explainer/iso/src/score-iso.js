// scoreSound(k): every time comes from BEATS + EV in porto-iso.js, the same numbers the picture uses.
function scoreSound(k) {
  const { at, EV } = window.PORTO_ISO;
  const m = { minor: true };
  const pop = (t, o) => k.play('pop', t, { ...m, ...(o || {}) });

  // 1 — hook
  k.play('whoomp', at('hook', 0.55));
  k.play('pop', at('hook', EV.hook.t1[0]), { gain: 0.8 });
  k.play('pop', at('hook', EV.hook.t2[0]), { gain: 0.9 });
  k.play('hiss', at('hook', 0.9), { ...m, dur: 1.4, gain: 0.35 });          // water lapping

  // 2 — studio: question tile drops, site tile rises
  k.tone(at('hook', EV.hook.fall[0]), { ...m, freq: [[0, 520], [0.5, 160]], dur: 0.5, gain: 0.12 });
  k.play('whoomp', at('studio', EV.studio.rise[0] + 0.55), { deep: true });
  k.play('pop', at('studio', EV.studio.head));
  k.play('hum', at('studio', EV.studio.boat[0]), { ...m, dur: EV.studio.boat[1] - EV.studio.boat[0], freq: 110, gain: 0.6 });
  for (let x = EV.studio.boat[0]; x < EV.studio.boat[1]; x += 0.37) k.play('blip', at('studio', x), { ...m, note: 'E6', gain: 0.6, pan: 0.2 });
  for (let i = 0; i < 6; i++) k.play('tap', at('studio', EV.studio.waves[0] + i * 0.1), { ...m, gain: 0.5, pan: -0.5 });
  pop(at('studio', EV.studio.tagBoat)); pop(at('studio', EV.studio.waves[1]), { pan: -0.5 }); pop(at('studio', EV.studio.depth), { pan: 0.6 });

  // 3 — diga
  k.play('pop', at('diga', EV.diga.head));
  k.play('knock', at('diga', EV.diga.pier[0]), { pan: -0.6 });
  const [b0, b1] = EV.diga.blocks;
  for (let i = 0; i < 26; i++) k.play('clack', at('diga', b0 + (b1 - b0) * i / 33.8), { ...m, pitch: i / 26, pan: 0.6 - i / 26 });
  pop(at('diga', EV.diga.tagDiga), { pan: -0.4 });
  k.play('thud', at('diga', EV.diga.wall[0] + 0.15), { gain: 0.6 });
  k.tone(at('diga', EV.diga.calm[0]), { freq: 'G3', dur: 1.2, gain: 0.07, a: 0.2, hold: 0.4, verb: 0.4 });
  k.tone(at('diga', EV.diga.calm[0]), { freq: 'D4', dur: 1.2, gain: 0.05, a: 0.2, hold: 0.4, verb: 0.4 });
  pop(at('diga', EV.diga.tagCalma - 0.4), { pan: 0.3 });
  k.play('ping', at('diga', EV.diga.lights), { note: 'E6', pan: -0.5 });
  k.play('ping', at('diga', EV.diga.lights + 0.1), { note: 'B5', pan: -0.7 });
  pop(at('diga', EV.diga.tagCalma), { pan: 0.5 });

  // 4 — fondale
  k.play('pop', at('fondale', EV.fondale.head));
  k.play('whoomp', at('fondale', EV.fondale.dredger[0] + 0.2), { gain: 0.5 });
  k.play('whoomp', at('fondale', EV.fondale.bill[0] + 0.2), { gain: 0.4 });
  pop(at('fondale', EV.fondale.tagDraga));
  for (let i = 0; i < 7; i++) k.play('tap', at('fondale', EV.fondale.pipe[0] + (EV.fondale.pipe[1] - EV.fondale.pipe[0]) * i / 7), { ...m, gain: 0.4 });
  const [d0, d1] = EV.fondale.dig;
  k.play('hum', at('fondale', d0), { ...m, dur: d1 - d0, gain: 0.9 });
  // billboard ticks exactly when the displayed metre changes (eased count, so they slow as it settles)
  let last = -10;
  for (let x = d0; x <= d1 + 1e-6; x += 1 / 120) {
    const v = Math.round(H.lerp(-10, -16, H.ease.inOut(H.clamp((x - d0) / (d1 - d0)))));
    if (v !== last) { k.play('blip', at('fondale', x), { ...m, note: 'A5', pan: -0.3 }); last = v; }
  }
  k.play('hit', at('fondale', EV.fondale.hit));                            // the key number, full volume

  // 5 — cassoni
  k.play('pop', at('cassoni', EV.cassoni.head));
  const c = EV.cassoni;
  for (let i = 0; i < 4; i++) {
    const t0 = c.first + i * c.step;
    k.play('toot', at('cassoni', t0), { ...m, pan: -0.2 + i * 0.2 });
    k.play('gurgle', at('cassoni', t0 + c.slide), { ...m, dur: c.sink });
    k.play('thud', at('cassoni', t0 + c.slide + c.sink), { gain: 0.55, pan: -0.2 + i * 0.2 });
  }
  pop(at('cassoni', c.tagCassone));
  k.play('hiss', at('cassoni', c.fill[0]), { dur: c.fill[1] - c.fill[0], gain: 0.8, pan: 0.5 });
  pop(at('cassoni', c.tagSabbia), { pan: 0.6 });

  // 6 — porto
  k.tone(at('porto', 0), { ...m, freq: [[0, 400], [0.3, 180]], dur: 0.3, gain: 0.1 });   // billboard folds away
  k.play('pop', at('porto', EV.porto.head));
  EV.porto.cranes.forEach((o, i) => k.play('pop', at('porto', o), { gain: 0.9, pan: -0.1 + i * 0.2 }));
  for (let i = 0; i < 12; i++) k.play('knock', at('porto', EV.porto.boxes[0] + (EV.porto.boxes[1] - EV.porto.boxes[0]) * i / 12), { ...m, gain: 0.35, pan: 0.3 });
  k.play('horn', at('porto', EV.porto.ship[0]), { pan: -0.6 });
  pop(at('porto', EV.porto.tagGru));
  for (let x = EV.porto.walkers + 0.4; x < 4.0; x += 0.32) k.play('tap', at('porto', x), { ...m, gain: 0.18, pan: 0.2 });
  pop(at('porto', EV.porto.tagBanchina), { pan: 0.5 });
  k.play('toot', at('porto', EV.porto.dock[0]), { ...m, note: 'D5' });
  pop(at('porto', EV.porto.tagImb), { pan: -0.5 });

  // 7 — takeaway
  k.play('pop', at('fine', EV.fine.headline), { gain: 0.9 });
  EV.fine.tags.forEach((o, i) => { k.play('pop', at('fine', o), { gain: 0.8 }); k.play('blip', at('fine', o), { note: ['C6', 'E6', 'G6'][i], gain: 0.8 }); });
  k.play('chord', at('fine', EV.fine.tags[2] + 0.3), { dur: 1.8 });         // resolves on the last tag
}
window.scoreSound = scoreSound;

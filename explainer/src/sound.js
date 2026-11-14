// sound.js: a small synthesized sound kit for the style explainers. Plain Web Audio, no audio files.
// Voiceover mode: SOUND.kit(ctx, { voiceover: true }) drops beds and music, plays anything marked minor
// (play(..., { minor: true }), tone/noise { minor: true }, or scheduled inside k.withMinor(() => ...)) at about 60%
// volume instead of full, and sits all effects a little lower, so the narration stays on top while the piece still
// sounds alive. In the full mix, minor sounds play at full volume. Scores can read k.vo to branch further.
// A style adds   explainerSound(k) { k.bed('room', 0, D); k.play('pop', 1.25); ... }   and the same
// call schedules into a live AudioContext (the player) or an OfflineAudioContext (the video render).
// Times are seconds on the explainer's own clock. Randomness is seeded, so every render is identical.
//
// NOTE: the copy of this kit pasted into the conversation was cut off after out(). Everything above the
// "STAND-IN" marker below is the original, unchanged. Everything after it is a compatible stand-in
// (tone, noise, play presets, bed, withMinor, SOUND.live, SOUND.renderOffline). Replace this file with the
// complete original kit when available; scoreSound() only uses play/bed/tone names defined in the stand-in.
(function () {
  'use strict';
  const SOUND = (window.SOUND = {});
  const TINY = 1e-4;

  // seeded random in [0,1), keyed by any string
  function rand(key) {
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    let a = h >>> 0 || 1;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // note names to Hz: 'A4' = 440, 'C#5', 'Eb3'
  const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function hz(n) {
    if (typeof n === 'number') return n;
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    const semis = STEP[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12 - 9;
    return 440 * Math.pow(2, semis / 12);
  }
  SOUND.hz = hz;

  SOUND.kit = function (ctx, opts) {
    const o = opts || {};
    const VO = !!o.voiceover;
    const MINOR = 0.6; // voiceover-mode volume for minor sounds
    let inMinor = false;
    const gainOf = (p, d) => (p.gain == null ? d : p.gain) * (VO && (p.minor || inMinor) ? MINOR : 1);
    const T0 = (o.start || 0) - 0; // explainer time that maps to ctx time `base`
    const base = ctx.currentTime + (o.delay || 0);
    // Start times snap to the sample grid (+ a quarter sample): in Chrome a source started a hair off the grid can
    // spike to about twice its set level.
    const SR = ctx.sampleRate;
    const at = (t) => (Math.round((base + (t - T0)) * SR) + 0.25) / SR;

    // ---- buses: sfx, amb, music -> compressor -> master; one shared reverb send
    const master = ctx.createGain(); master.gain.value = o.master == null ? 0.9 : o.master;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.18;
    comp.connect(master); master.connect(o.dest || ctx.destination);
    const bus = {};
    for (const [name, g] of Object.entries({ sfx: VO ? 0.7 : 0.85, amb: 0.5, music: 0.45 })) { bus[name] = ctx.createGain(); bus[name].gain.value = g; bus[name].connect(comp); }

    // generated room reverb: decaying stereo noise, darker toward the tail
    const verb = ctx.createConvolver();
    {
      const secs = 1.6, n = Math.floor(secs * ctx.sampleRate), ir = ctx.createBuffer(2, n, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const r = rand('verb' + c), d = ir.getChannelData(c); let lp = 0;
        for (let i = 0; i < n; i++) { const u = i / n; lp += (0.6 - 0.45 * u) * ((r() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - u, 3); }
      }
      verb.buffer = ir;
    }
    const verbIn = ctx.createGain(); verbIn.gain.value = 0.9; verbIn.connect(verb); verb.connect(comp);

    // seeded noise buffers: white, pink-ish and brown
    const noiseBuf = {};
    {
      const n = Math.floor(2.5 * ctx.sampleRate);
      for (const kind of ['white', 'pink', 'brown']) {
        const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), r = rand('noise-' + kind);
        let p0 = 0, p1 = 0, p2 = 0, br = 0;
        for (let i = 0; i < n; i++) {
          const w = r() * 2 - 1;
          if (kind === 'white') d[i] = w;
          else if (kind === 'pink') { p0 = 0.997 * p0 + 0.029 * w; p1 = 0.985 * p1 + 0.032 * w; p2 = 0.95 * p2 + 0.048 * w; d[i] = (p0 + p1 + p2 + w * 0.05) * 2.2; }
          else { br = (br + 0.02 * w) / 1.02; d[i] = br * 3.2; }
        }
        noiseBuf[kind] = b;
      }
    }

    // ---- automation helpers
    // a value or [[dt, value], ...] from the voice start; ramps are exponential (frequencies)
    function sweep(param, v, t) {
      if (!Array.isArray(v)) { param.setValueAtTime(v, t); return; }
      param.setValueAtTime(v[0][1], t + v[0][0]);
      for (let i = 1; i < v.length; i++) param.exponentialRampToValueAtTime(Math.max(v[i][1], 1), t + v[i][0]);
    }
    // amplitude: linear attack to `gain`, optional hold, exponential release to silence by `dur`
    function shape(param, t, gain, dur, a, hold) {
      a = Math.min(a == null ? 0.004 : a, dur * 0.9);
      hold = Math.min(hold || 0, dur - a);
      param.setValueAtTime(0, t);
      param.linearRampToValueAtTime(gain, t + a);
      if (hold > 0) param.setValueAtTime(gain, t + a + hold);
      param.exponentialRampToValueAtTime(TINY, t + dur);
      param.setValueAtTime(0, t + dur + 0.001);
    }
    function out(node, p) {
      const pan = ctx.createStereoPanner(); pan.pan.value = Math.max(-1, Math.min(1, p.pan || 0));
      node.connect(pan); pan.connect(bus[p.bus || 'sfx']);
      if (p.verb) { const s = ctx.createGain(); s.gain.value = p.verb; pan.connect(s); s.connect(verbIn); }
    }

    // ======================= STAND-IN (not part of the original kit) =======================
    const sources = [];
    const isPast = (t) => t < T0 - 0.03; // live playback from mid-piece skips one-shots that already happened
    const fhz = (v) => (Array.isArray(v) ? v.map(([dt, f]) => [dt, hz(f)]) : hz(v));

    // flutter: seeded amplitude wobble (a marker tip skipping over the gloss)
    function flutterNode(s, dur, depth, rate, key) {
      const g = ctx.createGain(), r = rand('fl' + key), step = 1 / (rate || 30);
      g.gain.setValueAtTime(1, s);
      for (let x = step; x < dur; x += step) g.gain.linearRampToValueAtTime(1 - depth * r(), s + x);
      return g;
    }

    function tone(t, p) {
      p = p || {};
      if (isPast(t)) return;
      const dur = p.dur || 0.2, s = at(t), osc = ctx.createOscillator();
      osc.type = p.type || 'sine';
      sweep(osc.frequency, fhz(p.freq == null ? 440 : p.freq), s);
      if (p.detune) osc.detune.value = p.detune;
      const g = ctx.createGain(); shape(g.gain, s, gainOf(p, 0.3), dur, p.a, p.hold);
      let n = osc;
      if (p.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = p.lp; n.connect(f); n = f; }
      n.connect(g); out(g, p);
      osc.start(s); osc.stop(s + dur + 0.05); sources.push(osc);
    }

    function noise(t, p) {
      p = p || {};
      if (isPast(t)) return;
      const dur = p.dur || 0.2, s = at(t), b = ctx.createBufferSource();
      b.buffer = noiseBuf[p.color || 'pink']; b.loop = true; b.playbackRate.value = p.rate || 1;
      let n = b;
      for (const fl of [].concat(p.f || [])) {
        const f = ctx.createBiquadFilter(); f.type = fl.type || 'bandpass'; sweep(f.frequency, fl.freq, s); f.Q.value = fl.q == null ? 0.8 : fl.q;
        n.connect(f); n = f;
      }
      if (p.flutter) { const fg = flutterNode(s, dur, p.flutter, p.flutterRate, t.toFixed(3) + (p.key || '')); n.connect(fg); n = fg; }
      const g = ctx.createGain(); shape(g.gain, s, gainOf(p, 0.3), dur, p.a, p.hold);
      n.connect(g); out(g, p);
      b.start(s, rand('off' + t.toFixed(3) + (p.color || ''))() * 1.5); b.stop(s + dur + 0.05); sources.push(b);
    }

    // presets tuned for a dry-erase marker on a glossy whiteboard
    const PRESETS = {
      // a marker stroke; dur = how long the stroke draws on
      marker(t, p) {
        const d = p.dur || 0.3, g = p.gain == null ? 1 : p.gain, r = rand('mk' + t.toFixed(3));
        noise(t, { ...p, color: 'pink', dur: d + 0.03, gain: 0.2 * g, a: 0.015, hold: d * 0.75, f: [{ type: 'bandpass', freq: 2600 + r() * 1400, q: 0.9 }, { type: 'highpass', freq: 1200, q: 0.5 }], flutter: 0.55, flutterRate: 28 });
        tone(t + 0.01, { ...p, type: 'triangle', freq: [[0, 950 + r() * 600], [d, 850 + r() * 700]], dur: d, gain: 0.018 * g, a: 0.03, hold: d * 0.6, lp: 3000 });
      },
      squeak(t, p) {
        const g = p.gain == null ? 1 : p.gain, r = rand('sq' + t.toFixed(3));
        noise(t, { ...p, color: 'pink', dur: 0.1, gain: 0.18 * g, a: 0.006, f: [{ type: 'bandpass', freq: 3400, q: 1.2 }] });
        tone(t, { ...p, type: 'triangle', freq: [[0, 1100 + r() * 500], [0.09, 1500 + r() * 600]], dur: 0.1, gain: 0.05 * g, a: 0.01, lp: 3500 });
      },
      tap(t, p) {
        const g = p.gain == null ? 1 : p.gain;
        noise(t, { ...p, color: 'white', dur: 0.045, gain: 0.28 * g, f: [{ type: 'bandpass', freq: 2400, q: 1.6 }] });
        tone(t, { ...p, freq: 1700, dur: 0.035, gain: 0.04 * g });
      },
      pop(t, p) {
        const g = p.gain == null ? 1 : p.gain, lo = p.low ? 0.6 : 1;
        tone(t, { ...p, freq: [[0, 480 * lo], [0.07, 1050 * lo]], dur: 0.1, gain: 0.24 * g, a: 0.003 });
        noise(t, { ...p, color: 'white', dur: 0.03, gain: 0.06 * g, f: [{ type: 'highpass', freq: 3000 }] });
      },
      knock(t, p) {
        const g = p.gain == null ? 1 : p.gain;
        tone(t, { ...p, freq: [[0, 230], [0.09, 120]], dur: 0.13, gain: 0.3 * g, a: 0.002 });
        noise(t, { ...p, color: 'brown', dur: 0.06, gain: 0.25 * g, f: [{ type: 'lowpass', freq: 1400 }] });
      },
      pebble(t, p) {
        const g = p.gain == null ? 1 : p.gain, r = rand('pb' + t.toFixed(3));
        noise(t, { ...p, color: 'white', dur: 0.03, gain: 0.12 * g, f: [{ type: 'bandpass', freq: 1800 + r() * 2200, q: 3 }] });
      },
      eraser(t, p) {
        const d = p.dur || 0.75, g = p.gain == null ? 1 : p.gain;
        noise(t, { ...p, color: 'pink', dur: d, gain: 0.32 * g, a: 0.05, hold: d * 0.7, f: [{ type: 'bandpass', freq: 750, q: 0.6 }, { type: 'lowpass', freq: 2600, q: 0.3 }], flutter: 0.7, flutterRate: 14 });
        noise(t, { ...p, color: 'brown', dur: d, gain: 0.18 * g, a: 0.05, hold: d * 0.7, f: [{ type: 'lowpass', freq: 300 }], verb: 0.05 });
      },
      splash(t, p) {
        const g = p.gain == null ? 1 : p.gain;
        noise(t, { ...p, color: 'white', dur: 0.5, gain: 0.26 * g, a: 0.005, f: [{ type: 'bandpass', freq: [[0, 4200], [0.45, 900]], q: 0.7 }], verb: 0.25 });
        tone(t, { ...p, freq: [[0, 140], [0.2, 60]], dur: 0.25, gain: 0.22 * g });
      },
      thud(t, p) {
        const g = p.gain == null ? 1 : p.gain;
        tone(t, { ...p, freq: [[0, 95], [0.3, 42]], dur: 0.42, gain: 0.5 * g, a: 0.003 });
        noise(t, { ...p, color: 'brown', dur: 0.25, gain: 0.4 * g, f: [{ type: 'lowpass', freq: 420 }], verb: 0.15 });
      },
      gurgle(t, p) {
        const d = p.dur || 0.6, g = p.gain == null ? 1 : p.gain, r = rand('gg' + t.toFixed(3));
        noise(t, { ...p, color: 'brown', dur: d, gain: 0.2 * g, a: 0.08, hold: d * 0.6, f: [{ type: 'lowpass', freq: 700 }] });
        for (let i = 0; i < Math.floor(d * 14); i++) { const tt = t + r() * d; tone(tt, { ...p, freq: [[0, 260 + r() * 200], [0.05, 600 + r() * 400]], dur: 0.06, gain: 0.07 * g }); }
      },
      hiss(t, p) {
        const d = p.dur || 0.5, g = p.gain == null ? 1 : p.gain;
        noise(t, { ...p, color: 'white', dur: d, gain: 0.1 * g, a: 0.08, hold: d * 0.6, f: [{ type: 'highpass', freq: 4500 }], flutter: 0.4, flutterRate: 40 });
      },
      rumble(t, p) {
        const d = p.dur || 1, g = p.gain == null ? 1 : p.gain;
        noise(t, { ...p, color: 'brown', dur: d, gain: 0.3 * g, a: 0.2, hold: d * 0.6, f: [{ type: 'lowpass', freq: 170 }] });
        tone(t, { ...p, type: 'sawtooth', freq: 48, dur: d, gain: 0.03 * g, a: 0.2, hold: d * 0.6, lp: 200 });
      },
      ping(t, p) {
        const g = p.gain == null ? 1 : p.gain, f = hz(p.note || 'E6');
        tone(t, { ...p, freq: f, dur: 0.6, gain: 0.14 * g, verb: 0.35 });
        tone(t, { ...p, freq: f * 2.01, dur: 0.3, gain: 0.03 * g });
      },
      tick(t, p) {
        const g = p.gain == null ? 1 : p.gain;
        PRESETS.squeak(t, { ...p, gain: 0.7 * g });
        tone(t + 0.02, { ...p, type: 'triangle', freq: hz(p.note || 'C6'), dur: 0.18, gain: 0.08 * g, verb: 0.2 });
      },
      // the key-number hit: a slammed marker cap, low boom, bright accent
      hit(t, p) {
        const g = p.gain == null ? 1 : p.gain;
        tone(t, { ...p, freq: [[0, 120], [0.5, 46]], dur: 0.7, gain: 0.55 * g, a: 0.002, verb: 0.2 });
        noise(t, { ...p, color: 'white', dur: 0.09, gain: 0.3 * g, f: [{ type: 'bandpass', freq: 2000, q: 0.8 }], verb: 0.3 });
        for (const n of ['C4', 'G4', 'C5']) tone(t, { ...p, type: 'triangle', freq: hz(n), dur: 0.9, gain: 0.06 * g, lp: 2600, verb: 0.35 });
      },
      // --- dimensional / isometric palette
      whoomp(t, p) {
        const g = p.gain == null ? 1 : p.gain, lo = p.deep ? 0.7 : 1;
        tone(t, { ...p, freq: [[0, 190 * lo], [0.3, 55 * lo]], dur: 0.38, gain: 0.42 * g, a: 0.01 });
        noise(t, { ...p, color: 'pink', dur: 0.28, gain: 0.22 * g, a: 0.02, f: [{ type: 'lowpass', freq: 700 }], verb: 0.12 });
      },
      clack(t, p) {
        const g = p.gain == null ? 1 : p.gain, k = p.pitch || 0;
        noise(t, { ...p, color: 'white', dur: 0.045, gain: 0.22 * g, f: [{ type: 'bandpass', freq: 1300 + 900 * k, q: 4 }] });
        tone(t, { ...p, freq: 520 + 320 * k, dur: 0.06, gain: 0.07 * g });
      },
      horn(t, p) {
        const g = p.gain == null ? 1 : p.gain, d = p.dur || 1.2;
        for (const n of ['A2', 'E3']) tone(t, { ...p, type: 'sawtooth', freq: hz(n), dur: d, gain: 0.09 * g, a: 0.08, hold: d * 0.65, lp: 650, verb: 0.4 });
      },
      toot(t, p) {
        const g = p.gain == null ? 1 : p.gain;
        tone(t, { ...p, type: 'square', freq: hz(p.note || 'A4'), dur: 0.26, gain: 0.05 * g, a: 0.02, hold: 0.14, lp: 1400 });
      },
      blip(t, p) {
        const g = p.gain == null ? 1 : p.gain;
        tone(t, { ...p, freq: hz(p.note || 'C6'), dur: 0.08, gain: 0.12 * g, a: 0.003 });
      },
      hum(t, p) {
        const g = p.gain == null ? 1 : p.gain, d = p.dur || 1;
        tone(t, { ...p, type: 'triangle', freq: p.freq || 72, dur: d, gain: 0.08 * g, a: 0.15, hold: d * 0.7, lp: 400 });
        noise(t, { ...p, color: 'brown', dur: d, gain: 0.1 * g, a: 0.15, hold: d * 0.7, f: [{ type: 'lowpass', freq: 260 }] });
      },
      chord(t, p) {
        const g = p.gain == null ? 1 : p.gain, d = p.dur || 1.6;
        (p.notes || ['C4', 'E4', 'G4', 'C5']).forEach((n, i) => tone(t + i * 0.025, { ...p, type: 'triangle', freq: hz(n), dur: d, gain: 0.07 * g, a: 0.02, hold: d * 0.25, lp: 2400, verb: 0.45 }));
      },
    };
    function play(name, t, p) { p = p || {}; const f = PRESETS[name]; if (!f) return; if (p.minor) { const m = inMinor; inMinor = true; f(t, p); inMinor = m; } else f(t, p); }

    // ambience bed: VO mode drops it; live playback from mid-piece joins it in progress
    function bed(name, t0, t1, p) {
      p = p || {};
      if (VO) return;
      const s0 = Math.max(t0, T0), dur = t1 - s0;
      if (dur <= 0.05) return;
      const s = at(s0), b = ctx.createBufferSource(); b.buffer = noiseBuf[name === 'room' ? 'pink' : 'brown']; b.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = name === 'room' ? 520 : 300;
      const g = ctx.createGain(), lvl = p.gain == null ? 0.07 : p.gain, fi = s0 > t0 ? 0.05 : (p.fadeIn || 0.6), fo = p.fadeOut || 0.8;
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(lvl, s + fi);
      g.gain.setValueAtTime(lvl, s + Math.max(fi, dur - fo)); g.gain.linearRampToValueAtTime(0, s + dur);
      b.connect(hp); hp.connect(lp); lp.connect(g); out(g, { ...p, bus: 'amb' });
      b.start(s, rand('bed' + name)() * 2); b.stop(s + dur + 0.05); sources.push(b);
    }
    function music() { /* this style uses no music */ }
    function withMinor(fn) { const m = inMinor; inMinor = true; try { fn(); } finally { inMinor = m; } }
    function stop() {
      const now = ctx.currentTime;
      try { master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now); master.gain.linearRampToValueAtTime(0, now + 0.04); } catch (e) {}
      for (const s of sources) { try { s.stop(now + 0.05); } catch (e) {} }
      setTimeout(() => { try { master.disconnect(); } catch (e) {} }, 120);
    }
    return { vo: VO, ctx, hz, play, tone, noise, bed, music, withMinor, stop };
  };

  let LIVE = null;
  // Start the score playing in sync from explainer time `fromT`; returns stop().
  SOUND.live = function (score, fromT, opts) {
    if (!LIVE) LIVE = new (window.AudioContext || window.webkitAudioContext)();
    if (LIVE.state === 'suspended') LIVE.resume();
    const k = SOUND.kit(LIVE, { ...(opts || {}), start: fromT || 0, delay: 0.03 });
    try { score(k); } catch (e) { console.error(e); }
    return () => k.stop();
  };
  // Render the score offline; resolves to interleaved stereo Float32Array.
  SOUND.renderOffline = async function (score, dur, sr, opts) {
    sr = sr || 48000;
    const n = Math.ceil(dur * sr), ctx = new OfflineAudioContext(2, n, sr);
    const k = SOUND.kit(ctx, { ...(opts || {}), start: 0 });
    score(k);
    const buf = await ctx.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), out = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { out[2 * i] = L[i]; out[2 * i + 1] = R[i]; }
    return out;
  };
})();

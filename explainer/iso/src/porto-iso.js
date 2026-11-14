// "Come si costruisce un porto" — Isometric Pastel (Dimensional).
// Every frame is a pure function of t. All randomness comes from H.rng / H.makeNoise.
// All timing is read from BEATS (+ per-beat event offsets in EV); edit those for a new take.
(function () {
  'use strict';
  const W = 1280, HH = 720;

  // ---------------- timing ----------------
  const BEATS = [
    { id: 'hook',    t0: 0.0,  t1: 2.6,  n: 0, head: '' },
    { id: 'studio',  t0: 2.6,  t1: 6.2,  n: 1, head: 'Studio del mare' },
    { id: 'diga',    t0: 6.2,  t1: 10.4, n: 2, head: 'La diga foranea' },
    { id: 'fondale', t0: 10.4, t1: 14.6, n: 3, head: 'Scavare il fondale' },
    { id: 'cassoni', t0: 14.6, t1: 18.8, n: 4, head: 'Posare i cassoni' },
    { id: 'porto',   t0: 18.8, t1: 23.0, n: 5, head: 'Il porto al lavoro' },
    { id: 'fine',    t0: 23.0, t1: 25.5, n: 0, head: '' },
  ];
  const DURATION = 26.5; // last beat + ~1 s hold on the takeaway
  // event offsets (seconds from the start of their beat)
  const EV = {
    hook: { rise: [0, 0.8], t1: [0.3, 0.9], t2: [0.8, 1.3], fall: [2.6, 3.2] },
    studio: { rise: [0.55, 1.35], head: 1.1, boat: [1.4, 3.5], tagBoat: 1.6, waves: [2.0, 2.6], depth: 2.7 },
    diga: { head: 0.2, pier: [0.4, 0.9], blocks: [0.8, 2.6], wall: [2.4, 2.9], tagDiga: 2.0, lights: 2.9, calm: [2.6, 3.4], tagCalma: 3.2 },
    fondale: { head: 0.2, dredger: [0.5, 0.9], tagDraga: 1.0, bill: [0.8, 1.2], pipe: [1.0, 1.6], dig: [1.3, 3.2], hit: 3.2 },
    cassoni: { head: 0.2, first: 0.5, step: 0.7, slide: 0.4, sink: 0.3, tagCassone: 1.0, fill: [3.2, 3.8], back: [3.4, 3.9], tagSabbia: 3.5 },
    porto: { head: 0.2, pave: [0.2, 0.6], cranes: [0.5, 0.7, 0.9], tagGru: 1.2, boxes: [1.0, 1.8], ship: [1.0, 2.6], dock: [2.6, 3.4], walkers: 1.5, tagBanchina: 2.0, tagImb: 2.6 },
    fine: { pull: [0, 0.9], headline: 0.5, tags: [1.0, 1.35, 1.7] },
  };
  const B = Object.fromEntries(BEATS.map((b) => [b.id, b]));
  const at = (id, off) => B[id].t0 + off;                       // absolute time of an event
  const P = (t, a, b) => H.clamp((t - a) / (b - a));
  const PR = (t, id, r) => P(t, at(id, r[0]), at(id, r[1]));    // progress over an event range
  const E = H.ease, L = H.lerp;
  const pop = (p) => (p <= 0 ? 0 : E.back(H.clamp(p)));

  // ---------------- palette ----------------
  const C = {
    bgTop: '#f7f0e8', bgBot: '#e8e4f3', ink: '#2c3140', inkSoft: '#6b7085',
    coral: '#ff7a6b', sea: '#8ccbe2', seaCalm: '#a6daea', seaDeep: '#6eb2d0', foam: '#ffffff',
    land: '#efe3c6', grass: '#c7e3b5', beach: '#f3dfb0', pave: '#e6e3de', concrete: '#dcd8d1',
    rock: '#bdb8b2', armour: '#cfd2d8', sediment: '#e8d3a3', bedrock: '#cbb9a0', sand: '#f0c98a',
    hull: '#6f87c6', bridge: '#ffffff', shadow: '#3d3a5c',
    boxes: ['#f4b8a3', '#a9d7c3', '#f6d98c', '#b9c4f0', '#f2a9c0'],
    people: ['#ff7a6b', '#6f87c6', '#7cc3a5', '#f2b45c'],
    green: '#4fbf86', red: '#ff5b5b',
  };
  const DARK = '#3a3f58';
  const tone = (col, k) => H.rgba(H.mix(col, DARK, k));

  // ---------------- isometric camera ----------------
  const C30 = 0.8660254, S30 = 0.5, BASE = 19;
  const zz = (z) => (z >= 0 ? z : z * 0.5); // below the waterline depths are drawn at half scale
  const CAM = { fx: 20, fy: 13, fz: 0, zoom: 0.8, ox: 640, oy: 400, dy: 0 };
  function Pj(x, y, z) {
    const S = BASE * CAM.zoom;
    const u = (x - y) * C30, v = (x + y) * S30 - zz(z);
    const uf = (CAM.fx - CAM.fy) * C30, vf = (CAM.fx + CAM.fy) * S30 - zz(CAM.fz);
    return [CAM.ox + (u - uf) * S, CAM.oy + (v - vf) * S + CAM.dy];
  }
  const CAMS = {
    hook: { fx: 6, fy: 4, fz: 0, zoom: 1.75, oy: 500 },
    studio: { fx: 21, fy: 14, fz: -6, zoom: 0.84, oy: 400 },
    diga: { fx: 24, fy: 18, fz: 0, zoom: 1.45, oy: 400 },
    fondale: { fx: 34, fy: 8, fz: -4, zoom: 1.0, oy: 380 },
    cassoni: { fx: 31, fy: 9, fz: -5, zoom: 1.3, oy: 400 },
    porto: { fx: 22, fy: 10, fz: 2, zoom: 1.08, oy: 420 },
    fine: { fx: 20, fy: 13, fz: -7, zoom: 0.66, oy: 460 },
  };
  function setCam(t) {
    let i = 0; for (let k = 0; k < BEATS.length; k++) if (t >= BEATS[k].t0) i = k;
    const b = BEATS[i], cur = CAMS[b.id], prev = CAMS[BEATS[Math.max(1, i - 1)].id];
    const g = i <= 1 ? 1 : E.inOut(P(t, b.t0, b.t0 + 0.9));
    const push = 1 + 0.025 * P(t, b.t0, b.t1); // slow camera push inside each beat
    for (const k of ['fx', 'fy', 'fz', 'zoom', 'oy']) CAM[k] = L(prev[k], cur[k], g);
    CAM.zoom *= push; CAM.ox = 640; CAM.dy = 0;
  }

  // ---------------- drawing primitives ----------------
  function poly(ctx, pts, fill) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  // flat three-tone box: top lightest, front-left mid, front-right darkest
  function box(ctx, x, y, z, w, d, h, col, o = {}) {
    if (h <= 0.001) return;
    const z1 = z + h;
    poly(ctx, [Pj(x + w, y, z), Pj(x + w, y + d, z), Pj(x + w, y + d, z1), Pj(x + w, y, z1)], tone(col, 0.26));
    poly(ctx, [Pj(x, y + d, z), Pj(x + w, y + d, z), Pj(x + w, y + d, z1), Pj(x, y + d, z1)], tone(col, 0.13));
    if (!o.noTop) poly(ctx, [Pj(x, y, z1), Pj(x + w, y, z1), Pj(x + w, y + d, z1), Pj(x, y + d, z1)], H.rgba(col));
    if (o.edge !== false) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
      const a = Pj(x, y + d, z1), b = Pj(x + w, y + d, z1), c = Pj(x + w, y, z1);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); ctx.restore();
    }
  }
  function topQuad(ctx, x0, y0, x1, y1, z, col) { poly(ctx, [Pj(x0, y0, z), Pj(x1, y0, z), Pj(x1, y1, z), Pj(x0, y1, z)], col); }
  function isoCircle(ctx, cx, cy, z, r, n = 32) { const o = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; o.push(Pj(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); } return o; }

  // ---------------- scene items (depth-sorted, with long soft shadows) ----------------
  let ITEMS = [], SHAD = [];
  let ALPHA = 1;
  function item(key, draw, layer = 'above') { const a = ALPHA; ITEMS.push({ key, layer, draw: a >= 1 ? draw : (c) => { c.save(); c.globalAlpha *= a; draw(c); c.restore(); } }); }
  // a box item; split at the waterline so the water surface can sit between the two halves
  function boxItem(x, y, z, w, d, h, col, o = {}) {
    if (h <= 0.001) return;
    const key = x + w / 2 + y + d / 2 + (o.k || 0);
    if (z < 0 && z + h > 0) {
      item(key, (c) => box(c, x, y, z, w, d, -z, col, { ...o, noTop: true, edge: false }), 'under');
      item(key, (c) => box(c, x, y, 0, w, d, z + h, col, o));
    } else item(key, (c) => box(c, x, y, z, w, d, h, col, o), z + h <= 0 ? 'under' : 'above');
    if (z + h > 0 && !o.noShadow) SHAD.push([x, y, Math.max(0, z), w, d, z + h - Math.max(0, z)]);
  }
  function drawShadows(ctx) {
    if (!SHAD.length) return;
    const lay = shadowLayer(), g = lay.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, HH); g.fillStyle = '#000';
    for (const [x, y, z, w, d, h] of SHAD) {
      const sx = 0.75 * h, sy = -0.55 * h; // long shadows fall toward screen-right
      const f = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]].map(([a, b]) => Pj(a, b, z));
      const s = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]].map(([a, b]) => Pj(a + sx, b + sy, z));
      poly(g, f, '#000'); poly(g, s, '#000');
      for (let i = 0; i < 4; i++) poly(g, [f[i], f[(i + 1) % 4], s[(i + 1) % 4], s[i]], '#000');
    }
    ctx.save(); ctx.globalAlpha = 0.15; ctx.filter = 'blur(5px)';
    ctx.globalCompositeOperation = 'multiply';
    // tint the shadow toward the cool shadow colour
    const tint = tintLayer(); const tg = tint.getContext('2d');
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, HH);
    tg.drawImage(lay, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = C.shadow; tg.fillRect(0, 0, W, HH);
    ctx.drawImage(tint, 0, 0);
    ctx.restore();
  }
  let SL = null, TL = null;
  const shadowLayer = () => SL || (SL = H.layer(W, HH));
  const tintLayer = () => TL || (TL = H.layer(W, HH));

  // ---------------- labels: white pinned tags, header pill, connectors ----------------
  function tag(ctx, text, ax, ay, dx, dy, p, o = {}) {
    if (p <= 0) return;
    const s = pop(p), big = !!o.big;
    ctx.save();
    ctx.font = big ? '800 64px Inter' : '600 28px Inter';
    const tw = ctx.measureText(text).width, w = tw + (big ? 64 : 58), h = big ? 84 : 50;
    const tx = ax + dx, ty = ay + dy;
    // pin line + anchor dot
    const lp = H.clamp(p * 2.2);
    ctx.strokeStyle = 'rgba(44,49,64,0.55)'; ctx.lineWidth = 2;
    const ey = ty + (dy < 0 ? h / 2 : -h / 2);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(L(ax, tx, lp), L(ay, ey, lp)); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ax, ay, 6, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = C.coral; ctx.stroke();
    ctx.translate(tx, ty); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(61,58,92,0.22)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff'; roundRect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(-w / 2 + (big ? 28 : 24), 0, big ? 9 : 7, 0, 7); ctx.fill();
    ctx.fillStyle = big ? C.coral : C.ink; ctx.textBaseline = 'middle';
    ctx.fillText(text, -w / 2 + (big ? 46 : 40), big ? 3 : 1);
    ctx.restore();
  }
  function headerPill(ctx, n, text, p, alpha = 1) {
    if (p <= 0 || alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = '600 30px Inter'; const tw = ctx.measureText(text).width, w = tw + 92, h = 58, x = 34, y = 30;
    const s = pop(p); ctx.translate(x, y + h / 2); ctx.scale(s, s); ctx.translate(-x, -(y + h / 2));
    ctx.shadowColor = 'rgba(61,58,92,0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#fff'; roundRect(ctx, x, y, w, h, h / 2); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(x + 30, y + h / 2, 19, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 24px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), x + 30, y + h / 2 + 1);
    ctx.fillStyle = C.ink; ctx.font = '600 30px Inter'; ctx.textAlign = 'left'; ctx.fillText(text, x + 60, y + h / 2 + 1);
    ctx.restore();
  }
  function headers(ctx, t) {
    for (let i = 1; i < BEATS.length - 1; i++) {
      const b = BEATS[i], nb = BEATS[i + 1];
      if (t < b.t0) continue;
      const a = i + 1 < BEATS.length - 1 ? 1 - P(t, nb.t0 - 0.15, nb.t0 + 0.1) : 1 - P(t, nb.t0, nb.t0 + 0.3);
      headerPill(ctx, b.n, b.head, P(t, at(b.id, EV[b.id].head || 0.2), at(b.id, (EV[b.id].head || 0.2) + 0.45)), a);
    }
  }
  // curved dashed connector with an arrowhead
  function connector(ctx, a, c, b, p, col = C.ink) {
    if (p <= 0) return;
    const pts = []; for (let i = 0; i <= 40 * p; i++) { const s = i / 40; pts.push([(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]]); }
    if (pts.length < 2) return;
    ctx.save(); ctx.strokeStyle = H.rgba(col, 0.85); ctx.lineWidth = 3.5; ctx.setLineDash([10, 9]); ctx.lineCap = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]);
    if (p >= 0.98) {
      const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[pts.length - 3], ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = H.rgba(col, 0.9); ctx.beginPath(); ctx.moveTo(x2 + Math.cos(ang) * 6, y2 + Math.sin(ang) * 6);
      ctx.lineTo(x2 + Math.cos(ang + 2.5) * 16, y2 + Math.sin(ang + 2.5) * 16); ctx.lineTo(x2 + Math.cos(ang - 2.5) * 16, y2 + Math.sin(ang - 2.5) * 16); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------- background + finishing ----------------
  let BG = null;
  function background() {
    if (BG) return BG;
    const c = H.layer(W, HH), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, HH); gr.addColorStop(0, C.bgTop); gr.addColorStop(1, C.bgBot);
    g.fillStyle = gr; g.fillRect(0, 0, W, HH);
    const rg = g.createRadialGradient(640, 300, 50, 640, 300, 760); rg.addColorStop(0, 'rgba(255,255,255,0.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, HH);
    // faint isometric dot grid on the backdrop
    g.fillStyle = 'rgba(120,112,160,0.08)';
    for (let j = 0; j < 40; j++) for (let i = 0; i < 60; i++) { const x = i * 28 + (j % 2) * 14, y = j * 16 + 6; g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill(); }
    BG = c; return c;
  }
  function finish(ctx, t) {
    H.vignette(ctx, W, HH, 0.1, '96,88,140');
    H.grain(ctx, W, HH, 0.022, 500 + Math.floor(t * 24));
  }

  // ---------------- the world: one long floating tile, x 0..40 along the coast, y 0 (land) .. 26 (open sea) ----------------
  const TX = 40, TY = 26, ZB = -22, LANDZ = 1.5;
  // seabed profile along y (what the cut-away face at x = 40 shows)
  function seabed(y, s) {
    let z;
    if (y <= 5.5) z = LANDZ;
    else if (y <= 9.5) z = L(LANDZ, -10, (y - 5.5) / 4);
    else if (y <= 21.6) z = -10;
    else z = L(-10, -11, H.clamp((y - 21.6) / 2));
    if (s.dig > 0 && y >= 6.6 && y <= 17.4) {
      const edge = H.clamp(Math.min((y - 6.6) / 0.4, (17.4 - y) / 0.4));
      z = Math.min(z, L(z, -16, s.dig * edge));
    }
    if (s.back > 0 && y >= 5.5 && y <= 7) z = L(z, LANDZ, s.back);
    return z;
  }
  function state(t) {
    return {
      dig: E.inOut(PR(t, 'fondale', EV.fondale.dig)),
      bw: PR(t, 'diga', EV.diga.blocks), wall: PR(t, 'diga', EV.diga.wall), pier: PR(t, 'diga', EV.diga.pier),
      fill: PR(t, 'cassoni', EV.cassoni.fill), back: E.inOut(PR(t, 'cassoni', EV.cassoni.back)),
      caisson: [0, 1, 2, 3].map((i) => {
        const t0 = at('cassoni', EV.cassoni.first + i * EV.cassoni.step);
        return { slide: E.out(P(t, t0, t0 + EV.cassoni.slide)), sink: E.inOut(P(t, t0 + EV.cassoni.slide, t0 + EV.cassoni.slide + EV.cassoni.sink)), on: t >= t0 };
      }),
      pave: E.out(PR(t, 'porto', EV.porto.pave)),
    };
  }

  // underside soft shadow on the backdrop: the tile floats
  function tileShadow(ctx) {
    const c = Pj(TX / 2, TY / 2, ZB - 14), S = BASE * CAM.zoom;
    ctx.save(); ctx.filter = 'blur(18px)'; ctx.fillStyle = 'rgba(61,58,92,0.16)';
    ctx.beginPath(); ctx.ellipse(c[0] + 30, c[1] + 20, 30 * S, 9 * S, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  function tileBody(ctx, t, s) {

    // front-left face (y = TY): open-sea section
    const fy = TY;
    poly(ctx, [Pj(0, fy, ZB), Pj(TX, fy, ZB), Pj(TX, fy, -17), Pj(0, fy, -17)], tone(C.bedrock, 0.13));
    poly(ctx, [Pj(0, fy, -17), Pj(TX, fy, -17), Pj(TX, fy, -11), Pj(0, fy, -11)], tone(C.sediment, 0.13));
    poly(ctx, [Pj(0, fy, -11), Pj(TX, fy, -11), Pj(TX, fy, 0), Pj(0, fy, 0)], H.rgba(H.mix(C.seaDeep, DARK, 0.06), 0.92));

    // front-right face (x = TX): the cut-away cross-section, land → quay → basin → breakwater → open sea
    const ys = []; for (let y = 0; y <= TY + 0.001; y += 0.25) ys.push(y);
    const prof = ys.map((y) => [y, seabed(y, s)]);
    poly(ctx, [Pj(TX, 0, ZB), Pj(TX, TY, ZB), Pj(TX, TY, -17), ...prof.slice().reverse().map(([y, z]) => Pj(TX, y, Math.min(z, -17 + (z + 17) * 0)))], tone(C.bedrock, 0.26));
    // sediment band: from 6 m below the bed up to the bed
    poly(ctx, [...prof.map(([y, z]) => Pj(TX, y, z)), ...prof.slice().reverse().map(([y, z]) => Pj(TX, y, Math.max(ZB, Math.min(z, 0) - 6)))], tone(C.sediment, 0.24));
    // land fill above the waterline
    poly(ctx, [...prof.filter(([y, z]) => z >= 0).map(([y, z]) => Pj(TX, y, z)), ...prof.filter(([y, z]) => z >= 0).reverse().map(([y]) => Pj(TX, y, 0))], tone(C.land, 0.24));
    // water column
    const wet = prof.filter(([y, z]) => z < 0);
    if (wet.length) poly(ctx, [...wet.map(([y, z]) => Pj(TX, y, z)), Pj(TX, TY, 0), Pj(TX, wet[0][0], 0)], H.rgba(H.mix(C.seaDeep, DARK, 0.12), 0.95));
    // caisson in section (the last one sits on the face)
    const k = s.caisson[3];
    if (k.on) {
      const y0 = L(13, 7, k.slide), top = L(5, LANDZ, k.sink), bot = top - 17.5;
      if (k.sink > 0.99) poly(ctx, [Pj(TX, 6.6, -17), Pj(TX, 10.9, -17), Pj(TX, 10.9, -16), Pj(TX, 6.6, -16)], tone(C.rock, 0.26));
      poly(ctx, [Pj(TX, y0, bot), Pj(TX, y0 + 3.5, bot), Pj(TX, y0 + 3.5, top), Pj(TX, y0, top)], tone(C.concrete, 0.24));
      for (let c = 0; c < 2; c++) {
        const a = y0 + 0.35 + c * 1.6, b = a + 1.2;
        const fillTop = bot + 1 + (top - bot - 1.6) * s.fill;
        poly(ctx, [Pj(TX, a, bot + 1), Pj(TX, b, bot + 1), Pj(TX, b, top - 0.4), Pj(TX, a, top - 0.4)], tone(C.seaDeep, 0.2));
        if (s.fill > 0) poly(ctx, [Pj(TX, a, bot + 1), Pj(TX, b, bot + 1), Pj(TX, b, fillTop), Pj(TX, a, fillTop)], tone(C.sand, 0.2));
      }
    }
    // breakwater in section
    if (s.bw > 0) {
      const h = H.clamp(s.bw * 1.2);
      const crest = L(-10, 1.2, h);
      poly(ctx, [Pj(TX, 16.6, -10), Pj(TX, 18.4, crest), Pj(TX, 20.0, crest), Pj(TX, 22.2, -10)], tone(C.rock, 0.24));
      poly(ctx, [Pj(TX, 20.0, crest), Pj(TX, 20.9, crest), Pj(TX, 23.4, -10), Pj(TX, 22.2, -10)], tone(C.armour, 0.22));
      if (s.wall > 0) { const wz = crest + 2.2 * pop(s.wall); poly(ctx, [Pj(TX, 18.5, crest), Pj(TX, 19.9, crest), Pj(TX, 19.9, wz), Pj(TX, 19.2, wz), Pj(TX, 19.2, crest + 1.2), Pj(TX, 18.5, crest + 1.2)], tone(C.concrete, 0.22)); }
    }
    // depth scale ticks on the face
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    for (const z of [-5, -10, -15]) { const a = Pj(TX, TY, z), b = Pj(TX, TY - 0.8, z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.restore();
  }

  function seaAndLand(ctx, t, s) {
    // land top
    topQuad(ctx, 0, 0, TX, 5.5, LANDZ, H.rgba(C.land));
    // grass strip at the back
    topQuad(ctx, 0, 0, TX, 1.6, LANDZ, H.rgba(C.grass));
    // beach slope (above water part)
    poly(ctx, [Pj(0, 5.5, LANDZ), Pj(TX, 5.5, LANDZ), Pj(TX, 6.2, 0), Pj(0, 6.2, 0)], H.rgba(C.beach));
    // seabed seen through the water
    topQuad(ctx, 0, 6.2, TX, TY, -10, H.rgba(H.mix(C.sediment, C.seaDeep, 0.35)));
    if (s.dig > 0) {
      topQuad(ctx, 10 + 30 * (1 - s.dig), 6.6, TX, 17.4, L(-10, -16, s.dig), H.rgba(H.mix(C.sediment, C.seaDeep, 0.6)));
    }
  }

  function water(ctx, t, s) {
    const calm = s.bw > 0.6;
    // whole sea surface
    poly(ctx, [Pj(0, 6.2, 0), Pj(TX, 6.2, 0), Pj(TX, TY, 0), Pj(0, TY, 0)], H.rgba(C.sea, 0.82));
    // the calm basin inside the breakwater
    if (s.bw > 0) { ctx.save(); ctx.globalAlpha = H.clamp((s.bw - 0.4) * 2); poly(ctx, [Pj(10, 6.2, 0), Pj(TX, 6.2, 0), Pj(TX, 17.6, 0), Pj(10, 17.6, 0)], H.rgba(C.seaCalm, 0.75)); ctx.restore(); }
    // incoming wave crests: they travel to the shore until the breakwater stops them
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const stopFull = 7, stopBw = 21.4;
    for (let k = 0; k < 7; k++) {
      const y = TY - ((t * 1.6 + k * 3.1) % (TY - stopFull));
      const r = H.rng(40 + k);
      for (let seg = 0; seg < 5; seg++) {
        const x0 = seg * 8 + r.range(0, 2), x1 = x0 + r.range(3, 5.5);
        const blocked = calm && y < stopBw && x1 > 10;
        if (blocked) continue;
        const a = H.clamp((TY - y) / 2) * H.clamp((y - stopFull) / 2);
        ctx.globalAlpha = a * 0.8;
        const p0 = Pj(x0, y, 0), p1 = Pj(x1, y, 0); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
    }
    // foam along the breakwater's seaward face
    if (calm) {
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff';
      for (let i = 0; i < 26; i++) { const x = 10.5 + i * 1.15, ph = Math.sin(t * 3 + i * 1.7) * 0.5 + 0.5; const p = Pj(x, 22.0 + ph * 0.3, 0); ctx.beginPath(); ctx.ellipse(p[0], p[1], 4 + ph * 3, 2 + ph, 0, 0, 7); ctx.fill(); }
    }
    // shoreline foam
    ctx.globalAlpha = 0.7; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; const a = Pj(0, 6.3, 0), b = Pj(calm ? 14 : TX, 6.3, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.restore();
  }

  // ---------------- props ----------------
  function shipItems(x, y, len, beam, o = {}) {
    const hull = o.hull || C.hull; const prevA = ALPHA; ALPHA = o.alpha == null ? 1 : o.alpha;
    boxItem(x, y, -0.8, len, beam, 2.2, hull, { k: 0.1 });
    // bow wedge
    item(x + len + y + beam / 2 + 0.2, (c) => {
      const bl = beam * 0.9, z0 = -0.8, z1 = 1.4;
      const A = [x + len, y], Bp = [x + len + bl, y + beam / 2], Cp = [x + len, y + beam];
      if (z0 < 0) {/* below water part is hidden by the water surface */}
      poly(c, [Pj(A[0], A[1], 0), Pj(Bp[0], Bp[1], 0), Pj(Bp[0], Bp[1], z1), Pj(A[0], A[1], z1)], tone(hull, 0.3));
      poly(c, [Pj(Bp[0], Bp[1], 0), Pj(Cp[0], Cp[1], 0), Pj(Cp[0], Cp[1], z1), Pj(Bp[0], Bp[1], z1)], tone(hull, 0.13));
      poly(c, [Pj(A[0], A[1], z1), Pj(Bp[0], Bp[1], z1), Pj(Cp[0], Cp[1], z1)], H.rgba(hull));
    });
    const bh = o.small ? 1.4 : 3.2;
    boxItem(x + 0.3, y + 0.3, 1.4, o.small ? 1.4 : 2.2, beam - 0.6, bh, C.bridge, { k: 0.3 });
    boxItem(x + 0.7, y + 0.5, 1.4 + bh, 0.7, beam - 1.0, 0.5, C.coral, { k: 0.31 });
    if (o.boxes) {
      const r = H.rng(o.seed || 9);
      for (let i = 0; i < Math.floor((len - 3.6) / 1.6); i++) for (let j = 0; j < 2; j++) {
        const hgt = r.int(1, 2);
        boxItem(x + 3 + i * 1.6, y + 0.25 + j * (beam - 0.5) / 2, 1.4, 1.45, (beam - 0.5) / 2 - 0.05, hgt * 0.9, r.pick(C.boxes), { k: 0.35, noShadow: true });
      }
    }
    ALPHA = prevA;
  }
  function smallBoat(x, y, col, o = {}) {
    boxItem(x, y, -0.4, 3, 1.4, 1.0, col, { k: 0.1 });
    boxItem(x + 0.5, y + 0.25, 0.6, 1.0, 0.9, 1.0, '#fff', { k: 0.2 });
  }
  function crane(x, p) {
    if (p <= 0) return;
    const s = pop(p), h = 7 * s;
    for (const [dx, dy] of [[0, 7.6], [3, 7.6], [0, 9.8], [3, 9.8]]) boxItem(x + dx, dy, LANDZ, 0.45, 0.45, h, C.coral, { k: 0.5 });
    boxItem(x - 0.2, 7.4, LANDZ + h, 3.9, 3.0, 1.0 * s, C.coral, { k: 0.6 });
    boxItem(x + 1.2, 2.5, LANDZ + h + 1.0 * s, 1.1, 13.5, 0.7 * s, '#ff9a8d', { k: 1.5 });
    boxItem(x + 0.9, 7.6, LANDZ + h + 1.7 * s, 1.7, 2.2, 1.0 * s, '#ffffff', { k: 1.6 });
  }
  function lighthouse(x, y, col, p, blink) {
    if (p <= 0) return;
    const s = pop(p);
    boxItem(x - 0.4, y - 0.4, LANDZ, 0.8, 0.8, 3.0 * s, '#ffffff', { k: 2 });
    boxItem(x - 0.45, y - 0.45, LANDZ + 3.0 * s, 0.9, 0.9, 0.7 * s, col, { k: 2.1 });
    if (blink > 0) item(x + y + 3, (c) => {
      const q = Pj(x, y, LANDZ + 3.35 * s), S = BASE * CAM.zoom;
      const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], 2.2 * S);
      g.addColorStop(0, H.rgba(col, 0.55 * blink)); g.addColorStop(1, H.rgba(col, 0));
      c.fillStyle = g; c.beginPath(); c.arc(q[0], q[1], 2.2 * S, 0, 7); c.fill();
    });
  }
  function person(x, y, z, col, phase) {
    item(x + y + 0.05, (c) => {
      const S = BASE * CAM.zoom, p = Pj(x, y, z), step = Math.sin(phase) * 0.06 * S;
      c.fillStyle = 'rgba(61,58,92,0.18)'; c.beginPath(); c.ellipse(p[0] + 0.25 * S, p[1], 0.35 * S, 0.12 * S, 0, 0, 7); c.fill();
      c.fillStyle = tone(col, 0.25); c.fillRect(p[0] - 0.12 * S + step, p[1] - 0.45 * S, 0.1 * S, 0.45 * S); c.fillRect(p[0] + 0.02 * S - step, p[1] - 0.45 * S, 0.1 * S, 0.45 * S);
      c.fillStyle = H.rgba(col); roundRect(c, p[0] - 0.17 * S, p[1] - 1.05 * S, 0.34 * S, 0.62 * S, 0.12 * S); c.fill();
      c.fillStyle = '#ffd9c2'; c.beginPath(); c.arc(p[0], p[1] - 1.22 * S, 0.17 * S, 0, 7); c.fill();
      c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(p[0], p[1] - 1.3 * S, 0.17 * S, Math.PI, 0); c.fill(); // hard hat
    });
  }
  function billboard(t, p, value) {
    if (p <= 0) return;
    const s = pop(p), x0 = 24, x1 = 34, y = 2.6, z0 = LANDZ + 2.6 * s, z1 = z0 + 6.2 * s;
    boxItem(25.5, 2.2, LANDZ, 0.4, 0.4, 2.8 * s, '#b7bccb', { k: -1 });
    boxItem(32.1, 2.2, LANDZ, 0.4, 0.4, 2.8 * s, '#b7bccb', { k: -1 });
    boxItem(x0, 2.0, z0, x1 - x0, 0.6, z1 - z0, '#ffffff', { k: -0.8 });
    item(x0 + y + 9, (c) => {
      const o = Pj(x0, y, z1), S = BASE * CAM.zoom;
      c.save(); c.setTransform(C30 * S / 19, S30 * S / 19, 0, S / 19, o[0], o[1]);
      c.fillStyle = C.inkSoft; c.font = '600 30px Inter'; c.fillText('PROFONDITÀ', 16, 40);
      c.fillStyle = C.coral; c.font = '800 66px Inter'; c.fillText(value, 16, 106);
      c.restore();
    });
  }

  // ---------------- the world scene ----------------
  function world(ctx, t) {
    const s = state(t);
    ITEMS = []; SHAD = [];

    // --- study: survey boat on a lawn-mower track with sonar rings
    const st = PR(t, 'studio', EV.studio.boat);
    if (st > 0 && t < at('diga', 0.8)) {
      const legs = [[6, 13], [30, 13], [30, 16.5], [6, 16.5]], seg = st * 3, i = Math.min(2, Math.floor(seg)), f = seg - i;
      const bx = L(legs[i][0], legs[i + 1][0], f), by = L(legs[i][1], legs[i + 1][1], f);
      const fade = 1 - P(t, at('diga', 0.4), at('diga', 0.8));
      if (fade > 0.02) {
        smallBoat(bx - 1.5, by - 0.7, C.coral);
        item(bx + by - 0.5, (c) => {
          c.save(); c.globalAlpha = fade;
          for (let k = 0; k < 3; k++) { const ph = (t * 0.9 + k / 3) % 1; c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; c.lineWidth = 2; const pts = isoCircle(c, bx, by, 0, 1 + ph * 4); c.beginPath(); pts.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke(); }
          c.restore();
        }, 'under');
      }
    }

    // --- breakwater: armour blocks pop from the root (x = 40) to the head (x = 10)
    if (s.bw > 0) {
      const r = H.rng(77);
      for (let i = 0; i < 26; i++) {
        const x = TX - 1.15 - i * 1.15, pp = H.clamp(s.bw * 1.3 - (i / 26)) ;
        for (let row = 0; row < 3; row++) {
          const yy = [17.4, 20.0, 21.0][row], sz = row === 0 ? 0.8 : 1.0, hgt = (row === 0 ? 0.7 : r.range(0.9, 1.4)) * pop(pp);
          if (pp > 0) boxItem(x + r.range(-0.1, 0.1), yy, -0.3, sz, sz, hgt + 0.3, row === 0 ? C.rock : C.armour, { k: 0.2 });
        }
        if (pp > 0) boxItem(x, 18.2, -0.3, 1.15, 1.8, 0.8 * pop(pp), C.rock, { noShadow: true });
      }
      if (s.wall > 0) boxItem(10, 18.6, 0.5, 30, 1.3, 1.9 * pop(s.wall), C.concrete, { k: 0.4 });
    }
    if (s.pier > 0) boxItem(3, 6.2, -2, 2, 6.8, (2 + LANDZ) * pop(s.pier), C.concrete);
    const lp = P(t, at('diga', EV.diga.lights), at('diga', EV.diga.lights + 0.4)), blink = (0.5 + 0.5 * Math.sin(t * 5)) * lp;
    lighthouse(10.6, 19.3, C.green, lp, blink);
    lighthouse(4, 12.6, C.red, lp, (0.5 + 0.5 * Math.sin(t * 5 + 2)) * lp);

    // --- dredger + floating pipeline + depth billboard
    const dp = PR(t, 'fondale', EV.fondale.dredger);
    if (dp > 0 && t < at('cassoni', 0.4)) {
      const fade = 1 - P(t, at('cassoni', 0), at('cassoni', 0.4));
      if (fade > 0.05) {
        const dx = 22 + 9 * s.dig, sc = pop(dp);
        boxItem(dx, 11, -0.6, 7 * sc, 3, 1.8, '#f2b45c', { k: 0.1 });
        boxItem(dx + 0.5, 11.4, 1.2, 2, 2.2, 2.4 * sc, '#ffffff', { k: 0.3 });
        boxItem(dx + 6.2, 11.9, 1.2, 0.4, 1.2, 4.2 * sc, C.coral, { k: 0.4 });
        const pp = PR(t, 'fondale', EV.fondale.pipe);
        for (let i = 0; i < 7; i++) if (pp > i / 7) { const fx = dx - 1 - i * 1.4, fy = L(12, 6.8, i / 6); boxItem(fx, fy, -0.2, 0.9, 0.9, 0.55, '#ffffff', { k: 0.1, noShadow: true }); }
      }
    }
    // the billboard folds away before the quay equipment arrives
    const bp = PR(t, 'fondale', EV.fondale.bill) * (1 - P(t, at('porto', 0), at('porto', 0.35)));
    const depth = Math.round(L(-10, -16, s.dig));
    billboard(t, bp, `${depth === 0 ? 0 : '−' + Math.abs(depth)} m`);

    // --- caissons: towed in, sunk onto the bed, filled with sand
    s.caisson.forEach((k, i) => {
      if (!k.on) return;
      const x = 14 + i * 6.5, y = L(13, 7, k.slide), top = L(5, LANDZ, k.sink), w = i === 3 ? TX - x : 6.4;
      boxItem(x, y, top - 17.5, w, 3.5, 17.5, C.concrete, { k: 0.2 });
      // open cells on top, sand fills them
      item(x + w / 2 + y + 1.75 + 0.3, (c) => {
        for (let a = 0; a < 3; a++) for (let b2 = 0; b2 < 2; b2++) {
          const cx0 = x + 0.3 + a * (w - 0.6) / 3, cy0 = y + 0.3 + b2 * 1.45, cw = (w - 0.6) / 3 - 0.25, cd = 1.2;
          topQuad(c, cx0, cy0, cx0 + cw, cy0 + cd, top + 0.001, s.fill > 0 ? H.rgba(H.mix(C.seaDeep, C.sand, s.fill)) : tone(C.seaDeep, 0.15));
        }
      });
    });
    // tug pulling the caisson that is arriving
    s.caisson.forEach((k, i) => { if (k.on && k.slide < 1) smallBoat(14 + i * 6.5 + 2, L(17, 11, k.slide), '#7cc3a5'); });
    if (s.back > 0) boxItem(14, 5.5, LANDZ - 0.01, TX - 14, 1.5 * s.back, 0.01, C.land, { noShadow: true });

    // --- quay paving, cranes, containers, ship, workers
    if (s.pave > 0) item(14 + 13 + 5, (c) => { c.save(); c.globalAlpha = s.pave; topQuad(c, 14, 1.6, TX, 10.5, LANDZ + 0.02, H.rgba(C.pave)); c.restore(); }, 'flat');
    EV.porto.cranes.forEach((o, i) => crane(19 + i * 7, P(t, at('porto', o), at('porto', o + 0.45))));
    const boxesP = PR(t, 'porto', EV.porto.boxes);
    if (boxesP > 0) {
      const r = H.rng(311); let idx = 0;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
        const pp = H.clamp(boxesP * 1.4 - idx / 12), n = r.int(1, 3), col = r.pick(C.boxes); idx++;
        if (pp > 0) boxItem(15 + i * 3.4, 2.2 + j * 1.5, LANDZ, 2.8, 1.2, 0.95 * n * pop(pp), col, { k: 0 });
      }
    }
    const sp = E.inOut(PR(t, 'porto', EV.porto.ship)), dk = E.inOut(PR(t, 'porto', EV.porto.dock));
    if (sp > 0) {
      const x = L(-6, 15.5, sp), y = L(13.8, 10.8, dk);
      shipItems(x, y, 18, 2.9, { boxes: true, seed: 5, alpha: H.clamp((x + 6) / 6) });
    }
    if (t >= at('porto', EV.porto.walkers)) {
      const a = P(t, at('porto', EV.porto.walkers), at('porto', EV.porto.walkers + 0.4));
      if (a > 0.5) for (let i = 0; i < 5; i++) {
        const sp2 = 0.6 + (i % 3) * 0.2, base = 16 + i * 4.5, x = base + ((t * sp2 + i * 1.3) % 4), y = 6.4 + (i % 2) * 0.5;
        person(x, y, LANDZ, C.people[i % 4], t * 9 + i);
      }
    }
    return s;
  }

  function renderWorld(ctx, t) {
    const s = world(ctx, t);
    tileShadow(ctx);
    seaAndLand(ctx, t, s);
    ITEMS.filter((i) => i.layer === 'under').sort((a, b) => a.key - b.key).forEach((i) => i.draw(ctx));
    tileBody(ctx, t, s);
    water(ctx, t, s);
    ITEMS.filter((i) => i.layer === 'flat').forEach((i) => i.draw(ctx));
    drawShadows(ctx);
    ITEMS.filter((i) => i.layer === 'above').sort((a, b) => a.key - b.key).forEach((i) => i.draw(ctx));
    return s;
  }

  // ---------------- the hook tile ----------------
  function hookTile(ctx, t) {
    ITEMS = []; SHAD = [];
    const rise = E.back(PR(t, 'hook', EV.hook.rise)), fall = E.in(P(t, at('hook', EV.hook.fall[0]), at('hook', EV.hook.fall[1])));
    CAM.fx = CAMS.hook.fx; CAM.fy = CAMS.hook.fy; CAM.fz = 0; CAM.zoom = CAMS.hook.zoom; CAM.oy = CAMS.hook.oy;
    CAM.dy = (1 - rise) * 320 + fall * 520;
    withAlpha(ctx, H.clamp(rise * 1.5) * (1 - fall), (ctx) => hookBody(ctx, t));
    hookTitle(ctx, t, fall);
  }
  function hookBody(ctx, t) {
    const tx = 12, ty = 8;
    const c = Pj(tx / 2, ty / 2, -8), S = BASE * CAM.zoom;
    ctx.save(); ctx.filter = 'blur(14px)'; ctx.fillStyle = 'rgba(61,58,92,0.18)'; ctx.beginPath(); ctx.ellipse(c[0] + 20, c[1] + 18, 8 * S, 2.5 * S, 0, 0, 7); ctx.fill(); ctx.restore();
    poly(ctx, [Pj(0, ty, -6), Pj(tx, ty, -6), Pj(tx, ty, 0), Pj(0, ty, 0)], tone(C.seaDeep, 0.13));
    poly(ctx, [Pj(tx, 0, -6), Pj(tx, ty, -6), Pj(tx, ty, 0), Pj(tx, 2, 0), Pj(tx, 2, LANDZ), Pj(tx, 0, LANDZ)], tone(C.sediment, 0.26));
    poly(ctx, [Pj(tx, 2.6, -4), Pj(tx, ty, -4), Pj(tx, ty, 0), Pj(tx, 2.6, 0)], tone(C.seaDeep, 0.22));
    topQuad(ctx, 0, 0, tx, 2, LANDZ, H.rgba(C.land));
    poly(ctx, [Pj(0, 2, LANDZ), Pj(tx, 2, LANDZ), Pj(tx, 2.6, 0), Pj(0, 2.6, 0)], H.rgba(C.beach));
    poly(ctx, [Pj(0, 2.6, 0), Pj(tx, 2.6, 0), Pj(tx, ty, 0), Pj(0, ty, 0)], H.rgba(C.sea, 0.95));
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const y = ty - ((t * 1.2 + k * 1.8) % 5); const a = Pj(1, y, 0), b = Pj(5, y, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    const bob = Math.sin(t * 2) * 0.08;
    shipItems(2.2, 4.6 + bob, 6.4, 1.7, { boxes: true, seed: 3, small: true });
    person(9, 1, LANDZ, C.people[0], 0);
    drawShadows(ctx);
    ITEMS.sort((a, b) => a.key - b.key).forEach((i) => i.draw(ctx));
  }
  function hookTitle(ctx, t, fall) {
    ctx.save(); ctx.globalAlpha = 1 - fall; ctx.textAlign = 'center'; ctx.fillStyle = C.ink;
    const a1 = PR(t, 'hook', EV.hook.t1), a2 = PR(t, 'hook', EV.hook.t2);
    ctx.globalAlpha = (1 - fall) * a1; ctx.font = '800 56px Inter'; ctx.fillText('Come si costruisce', 640, 120 - (1 - E.out(a1)) * 20);
    ctx.globalAlpha = (1 - fall) * a2; ctx.fillStyle = C.coral; ctx.font = '800 72px Inter'; ctx.fillText('un porto?', 640, 200 - (1 - E.out(a2)) * 20);
    ctx.restore();
  }

  // ---------------- tags per beat ----------------
  function tags(ctx, t, s) {
    const T = (id, off) => P(t, at(id, off), at(id, off + 0.45));
    const out = (id) => 1 - P(t, B[id].t1 - 0.25, B[id].t1); // tags clear in the pause before the next beat
    const g = (x, y, z) => Pj(x, y, z);
    if (t >= B.studio.t0 && t < B.diga.t0 + 0.6) {
      const st = PR(t, 'studio', EV.studio.boat), legs = [[6, 13], [30, 13], [30, 16.5], [6, 16.5]], seg = st * 3, i = Math.min(2, Math.floor(seg)), f = seg - i;
      const bx = L(legs[i][0], legs[i + 1][0], f), by = L(legs[i][1], legs[i + 1][1], f), a = g(bx, by, 1.5);
      const o = out('studio');
      tag(ctx, 'Rilievo del fondale', a[0], a[1], 0, -96, T('studio', EV.studio.tagBoat) * o);
      const wp = PR(t, 'studio', EV.studio.waves);
      if (o > 0) { ctx.save(); ctx.globalAlpha = o; connector(ctx, g(4, 25, 0), g(-2, 15, 4), g(3, 8, 0.5), wp, C.coral); ctx.restore(); }
      const w = g(3, 22, 0); tag(ctx, 'Onde', w[0], w[1], -60, 60, T('studio', EV.studio.waves[1]) * o);
      const d = g(TX, 13, -10); tag(ctx, 'Fondale −10 m', d[0], d[1], 150, -10, T('studio', EV.studio.depth) * o);
    }
    if (t >= B.diga.t0 && t < B.fondale.t0) {
      const o = out('diga');
      const a = g(16, 19.2, 2.4); tag(ctx, 'Diga foranea', a[0], a[1], -40, -120, T('diga', EV.diga.tagDiga) * o);
      const c = g(32, 12, 0); tag(ctx, 'Acqua calma', c[0], c[1], 20, -110, T('diga', EV.diga.tagCalma) * o);
      const m = g(30, 21.4, 1.2); tag(ctx, 'Massi', m[0], m[1], 40, 90, T('diga', EV.diga.tagCalma - 0.4) * o);
    }
    if (t >= B.fondale.t0 && t < B.cassoni.t0) {
      const o = out('fondale');
      const dx = 22 + 9 * s.dig, a = g(dx + 3, 12, 3.5); tag(ctx, 'Draga', a[0], a[1], -30, -100, T('fondale', EV.fondale.tagDraga) * o);
      // down arrows on the cut face while the bed is lowered
      const ap = PR(t, 'fondale', EV.fondale.dig);
      if (ap > 0 && o > 0) {
        ctx.save(); ctx.globalAlpha = o * H.clamp(ap * 4); ctx.strokeStyle = C.coral; ctx.fillStyle = C.coral; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (const y of [10, 13, 16]) { const p0 = g(TX, y, -7), p1 = g(TX, y, L(-9, -15, s.dig)); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p1[0], p1[1] + 6); ctx.lineTo(p1[0] - 8, p1[1] - 6); ctx.lineTo(p1[0] + 8, p1[1] - 6); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      }
      const h = P(t, at('fondale', EV.fondale.hit), at('fondale', EV.fondale.hit + 0.35)), f = g(TX, 12, -16);
      tag(ctx, '−16 m', f[0], f[1], 170, -40, h * o, { big: true });
    }
    if (t >= B.cassoni.t0 && t < B.porto.t0) {
      const o = out('cassoni');
      const a = g(28, 8.8, LANDZ); tag(ctx, 'Cassone in c.a.', a[0], a[1], -90, -130, T('cassoni', EV.cassoni.tagCassone) * o);
      const b = g(TX, 8.8, -9); tag(ctx, 'Sabbia', b[0], b[1], 120, 40, T('cassoni', EV.cassoni.tagSabbia) * o);
    }
    if (t >= B.porto.t0 && t < B.fine.t0) {
      const o = out('porto');
      const a = g(26.5, 8.5, 10); tag(ctx, 'Gru', a[0], a[1], -10, -80, T('porto', EV.porto.tagGru) * o);
      const b = g(30, 9.5, LANDZ); tag(ctx, 'Banchina', b[0], b[1], 120, 70, T('porto', EV.porto.tagBanchina) * o);
      const c = g(7, 16, 0); tag(ctx, 'Imboccatura', c[0], c[1], -60, 90, T('porto', EV.porto.tagImb) * o);
    }
    if (t >= B.fine.t0) {
      const hp = P(t, at('fine', EV.fine.headline), at('fine', EV.fine.headline + 0.5));
      ctx.save(); ctx.globalAlpha = hp; ctx.fillStyle = C.ink; ctx.font = '800 54px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Ecco il porto', 640, 78 - (1 - E.out(hp)) * 16); ctx.restore();
      const [a1, a2, a3] = EV.fine.tags;
      const a = g(22, 19, 2.5); tag(ctx, 'Diga → acqua calma', a[0], a[1], -130, 90, T('fine', a1));
      const b = g(TX, 12, -16); tag(ctx, '−16 m', b[0], b[1], 160, -20, T('fine', a2), { big: true });
      const c = g(20, 6, 8); tag(ctx, 'Banchine su cassoni', c[0], c[1], -170, -80, T('fine', a3));
    }
  }

  // draw fn at full opacity into a layer, then composite it at alpha a
  let AL = null;
  function withAlpha(ctx, a, fn) {
    if (a <= 0.001) { fn(nullCtx()); return; }
    if (a >= 0.999) { fn(ctx); return; }
    const lay = AL || (AL = H.layer(W, HH)), g = lay.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, HH); g.globalAlpha = 1; g.filter = 'none';
    fn(g);
    ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(lay, 0, 0); ctx.restore();
  }
  let NC = null;
  const nullCtx = () => { const c = (NC || (NC = H.layer(W, HH))).getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, HH); return c; };

  // ---------------- the explainer ----------------
  function explainer(ctx, W_, H_, t) {
    t = H.clamp(t, 0, DURATION);
    ctx.save();
    ctx.drawImage(background(), 0, 0);
    if (t < at('studio', EV.studio.rise[0] + 0.05)) hookTile(ctx, t);
    else if (t < at('hook', EV.hook.fall[1])) hookTile(ctx, t);
    if (t >= at('studio', EV.studio.rise[0])) {
      setCam(t);
      const r = PR(t, 'studio', EV.studio.rise);
      CAM.dy = (1 - E.back(r)) * 420;
      let s; withAlpha(ctx, H.clamp(r * 1.6), (c) => { s = renderWorld(c, t); });
      tags(ctx, t, s);
      headers(ctx, t);
    }
    ctx.restore();
    finish(ctx, t);
  }

  window.PORTO_ISO = { BEATS, EV, DURATION, at };
  window.explainer = explainer;
  window.DURATION = DURATION;
  window.BEATS = BEATS;
})();

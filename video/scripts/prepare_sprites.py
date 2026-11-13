"""Separa gli oggetti "mobili" di ogni fase (sprite con trasparenza) dal resto che cresce.

Uso: python3 prepare_sprites.py public/stages

Per ogni transizione k (fase k-1 -> fase k) scrive:
  g{k}.png        R = maschera morbida delle parti che CRESCONO, G = ordine di crescita
  sp{k}_{i}.png   ritagli RGBA degli oggetti che si MUOVONO (presi dalla foto della fase k)
  sprites.json    posizione e animazione di ogni ritaglio
"""
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

P = sys.argv[1]
imgs = [np.asarray(Image.open(os.path.join(P, f"s{k}.jpg")).convert("RGB"), dtype=np.float32) / 255 for k in range(8)]
H, W = imgs[0].shape[:2]

# seme della crescita per le parti che crescono (frazioni x, y)
SEEDS = {1: (0.45, 0.55), 2: (0.12, 0.30), 3: (0.12, 0.30), 4: (0.70, 0.40), 5: (0.30, 0.33), 6: (0.40, 0.30), 7: (0.80, 0.45)}


def change_mask(k):
    a, b = imgs[k - 1], imgs[k]
    d = np.abs(ndi.gaussian_filter(a, (2, 2, 0)) - ndi.gaussian_filter(b, (2, 2, 0))).sum(axis=2)
    m = d > 0.2
    m = ndi.binary_opening(m, iterations=2)
    m = ndi.binary_closing(m, iterations=5)
    lab, n = ndi.label(m)
    sizes = ndi.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, 1 + np.where(sizes > 250)[0])
    m = ndi.binary_dilation(m, iterations=6)
    return ndi.binary_fill_holes(m)


def red_boats(k, m):
    """Scafi rossi (draghe, rimorchiatori) nuovi in questa fase."""
    b = imgs[k]
    r, g, bl = b[..., 0], b[..., 1], b[..., 2]
    red = (r > 0.42) & (r - g > 0.18) & (r - bl > 0.12)
    red &= ndi.binary_erosion(m, iterations=2)
    red = ndi.binary_opening(red, iterations=1)
    # i pezzi rossi vicini (prua, poppa) appartengono alla stessa barca
    lab, n = ndi.label(ndi.binary_dilation(red, iterations=18))
    out = []
    for i in range(1, n + 1):
        core = red & (lab == i)
        if core.sum() < 60:
            continue
        c = ndi.binary_fill_holes(ndi.binary_dilation(core, iterations=12)) & m
        if c.sum() > 400:
            out.append(c)
    return out


def components(m, min_area):
    lab, n = ndi.label(m)
    return [lab == i for i in range(1, n + 1) if (lab == i).sum() >= min_area]


def slices(c, axis, n):
    """Divide una componente in n fette lungo un asse (0 = y, 1 = x)."""
    ys, xs = np.nonzero(c)
    v = ys if axis == 0 else xs
    lo, hi = v.min(), v.max() + 1
    cuts = np.linspace(lo, hi, n + 1).astype(int)
    grid = np.mgrid[0:H, 0:W][axis]
    return [c & (grid >= cuts[i]) & (grid < cuts[i + 1]) for i in range(n)]


def geodesic_order(mask, seed):
    s = 4
    ms = mask[::s, ::s]
    if not ms.any():
        return np.zeros((H, W), np.float32)
    hs, ws = ms.shape
    dist = np.full(ms.shape, np.inf, dtype=np.float32)
    pts = np.argwhere(ms)
    start = pts[np.argmin(((pts - np.array([seed[1] * hs, seed[0] * ws])) ** 2).sum(1))]
    q = deque([tuple(start)])
    dist[tuple(start)] = 0
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < hs and 0 <= nx < ws and ms[ny, nx]:
                nd = dist[y, x] + (1.414 if dy and dx else 1)
                if nd < dist[ny, nx]:
                    dist[ny, nx] = nd
                    q.append((ny, nx))
    fin = np.isfinite(dist)
    far = dist[fin].max() if fin.any() else 1
    yy, xx = np.mgrid[0:hs, 0:ws]
    eu = np.hypot(yy - start[0], xx - start[1]).astype(np.float32)
    dist[~fin] = far * 0.6 + eu[~fin] * 0.6
    dist[~ms] = 0
    o = dist / max(1e-6, dist[ms].max())
    o = np.asarray(Image.fromarray((o * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255
    return ndi.gaussian_filter(o, 3)


meta = {}
for k in range(1, 8):
    m = change_mask(k)
    sprites = []  # (maschera, animazione)

    if k == 1:  # draghe che arrivano dal mare aperto (dal basso)
        for i, c in enumerate(sorted(red_boats(k, m), key=lambda c: np.nonzero(c)[0].mean())):
            sprites.append((c, {"anim": "glide", "dx": 40 - 30 * i, "dy": 105, "rot": -10 + 8 * i, "delay": 0.04 + 0.12 * i, "dur": 0.5}))
    if k == 4:  # rimorchiatori + cassoni che arrivano uno alla volta
        boats = red_boats(k, m)
        for i, c in enumerate(boats):
            sprites.append((c, {"anim": "glide", "dx": 60, "dy": 150, "rot": -12, "delay": 0.0 + 0.1 * i, "dur": 0.5}))
        rest = m & ~np.any(boats, axis=0) if boats else m.copy()
        big = max(components(rest, 2000), key=lambda c: c.sum())
        for i, c in enumerate(slices(big, 0, 5)):
            sprites.append((c, {"anim": "glide", "dx": 0, "dy": 120, "rot": 0, "delay": 0.15 + 0.12 * i, "dur": 0.32}))
    if k == 5:  # banchina posata da sinistra a destra + barche
        boats = red_boats(k, m)
        for i, c in enumerate(boats):
            sprites.append((c, {"anim": "glide", "dx": 110, "dy": 70, "rot": 10, "delay": 0.4 + 0.07 * i, "dur": 0.35}))
        rest = m & ~np.any(boats, axis=0) if boats else m.copy()
        big = max(components(rest, 2000), key=lambda c: c.sum())
        for i, c in enumerate(slices(big, 1, 6)):
            sprites.append((c, {"anim": "drop", "dx": 0, "dy": -40, "rot": 0, "delay": 0.05 + 0.08 * i, "dur": 0.3}))
    if k == 6:  # gru, magazzini, faro: scendono dall'alto con un rimbalzo
        comps = sorted(components(m, 1500), key=lambda c: (np.nonzero(c)[0].mean() + np.nonzero(c)[1].mean() * 0.3))
        for i, c in enumerate(comps):
            sprites.append((c, {"anim": "drop", "dx": 0, "dy": -60, "rot": 0, "delay": 0.04 + 0.1 * i, "dur": 0.32}))
    if k == 7:  # la nave entra dal mare; i container cadono a pile
        comps = components(m, 5000)
        ship = min(comps, key=lambda c: np.nonzero(c)[1].mean())
        boxes = max(comps, key=lambda c: np.nonzero(c)[1].mean())
        sprites.append((ship, {"anim": "glide", "dx": 0, "dy": 165, "rot": 0, "delay": 0.0, "dur": 0.6}))
        for i, c in enumerate(slices(boxes, 0, 5)):
            sprites.append((c, {"anim": "drop", "dx": 0, "dy": -50, "rot": 0, "delay": 0.42 + 0.08 * i, "dur": 0.25}))

    moving = np.zeros_like(m)
    out = []
    for i, (c, anim) in enumerate(sprites):
        moving |= c
        soft = np.clip(ndi.gaussian_filter(ndi.binary_dilation(c, iterations=2).astype(np.float32), 1.5) * 1.3, 0, 1)
        ys, xs = np.nonzero(soft > 0.02)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = (imgs[k][y0:y1, x0:x1] * 255).astype(np.uint8)
        rgba[..., 3] = (soft[y0:y1, x0:x1] * 255).astype(np.uint8)
        name = f"sp{k}_{i}.png"
        Image.fromarray(rgba, "RGBA").save(os.path.join(P, name))
        out.append({"file": name, "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0), **anim})
    meta[k] = out

    grow = m & ~ndi.binary_dilation(moving, iterations=3)
    soft = np.clip(ndi.gaussian_filter(grow.astype(np.float32), 4) * 1.25, 0, 1)
    order = geodesic_order(grow, SEEDS[k])
    rgb = np.zeros((H, W, 3), np.uint8)
    rgb[..., 0] = (soft * 255).astype(np.uint8)
    rgb[..., 1] = (np.clip(order, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(rgb).save(os.path.join(P, f"g{k}.png"))
    print(k, "oggetti mobili:", len(out), "| area che cresce:", int(grow.sum()))

json.dump(meta, open(os.path.join(P, "sprites.json"), "w"), indent=1)

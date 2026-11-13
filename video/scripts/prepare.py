"""Prepara immagini, maschere e ordine di crescita per il video "plastico fotografico"."""
import glob
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
ORDER = [0, 4, 2, 3, 1, 5, 6, 7]  # base, dragaggio, diga, tetrapodi, cassoni, banchina, gru, nave
files = sorted(glob.glob(os.path.join(src, "[0-9][0-9]_*.jpg")))

imgs = []
for k, i in enumerate(ORDER):
    im = Image.open(files[i]).convert("RGB")
    im.save(os.path.join(dst, f"s{k}.jpg"), quality=95)
    imgs.append(np.asarray(im, dtype=np.float32) / 255)
Image.open(files[8]).convert("RGB").save(os.path.join(dst, "clock.jpg"), quality=95)

H, W = imgs[0].shape[:2]
meta = {"w": W, "h": H, "steps": []}

# seme di crescita per ogni transizione (frazione x, y dell'immagine) — da dove "parte" il lavoro
SEEDS = [
    (0.45, 0.55),  # dragaggio: dal centro del bacino
    (0.12, 0.30),  # diga: dalla radice a terra, lato sinistro
    (0.12, 0.30),  # tetrapodi: lungo la diga dalla radice
    (0.70, 0.40),  # cassoni: dalla costa verso il largo
    (0.30, 0.33),  # banchina: da sinistra a destra lungo la costa
    (0.40, 0.30),  # gru ed edifici
    (0.80, 0.45),  # nave e container
]

for k in range(1, len(imgs)):
    a, b = imgs[k - 1], imgs[k]
    d = np.abs(ndi.gaussian_filter(a, (2, 2, 0)) - ndi.gaussian_filter(b, (2, 2, 0))).sum(axis=2)
    m = d > 0.2
    m = ndi.binary_opening(m, iterations=2)
    m = ndi.binary_closing(m, iterations=5)
    lab, n = ndi.label(m)
    sizes = ndi.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, 1 + np.where(sizes > 250)[0])
    m = ndi.binary_dilation(m, iterations=6)
    m = ndi.binary_fill_holes(m)
    soft = ndi.gaussian_filter(m.astype(np.float32), 4)
    soft = np.clip(soft * 1.25, 0, 1)

    # ordine di comparsa: distanza geodetica dentro la maschera a partire dal seme
    s = 4
    ms = m[::s, ::s]
    hs, ws = ms.shape
    dist = np.full(ms.shape, np.inf, dtype=np.float32)
    sx, sy = SEEDS[k - 1]
    pts = np.argwhere(ms)
    target = np.array([sy * hs, sx * ws])
    start = pts[np.argmin(((pts - target) ** 2).sum(1))]
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
    # componenti non raggiunte: distanza euclidea dal seme, dopo quelle raggiunte
    finite = np.isfinite(dist)
    far = dist[finite].max() if finite.any() else 1
    yy, xx = np.mgrid[0:hs, 0:ws]
    eu = np.hypot(yy - start[0], xx - start[1]).astype(np.float32)
    dist[~finite] = far * 0.6 + eu[~finite] * 0.6
    dist[~ms] = 0
    order = dist / max(1e-6, dist[ms].max())
    order = np.asarray(Image.fromarray((order * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), dtype=np.float32) / 255
    order = ndi.gaussian_filter(order, 3)
    rgb = np.zeros((H, W, 3), dtype=np.uint8)
    rgb[..., 0] = (soft * 255).astype(np.uint8)
    rgb[..., 1] = (np.clip(order, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(rgb).save(os.path.join(dst, f"t{k}.png"))

    ys, xs = np.nonzero(m)
    meta["steps"].append(
        {
            "cx": float(xs.mean() / W),
            "cy": float(ys.mean() / H),
            "x0": float(xs.min() / W),
            "x1": float(xs.max() / W),
            "y0": float(ys.min() / H),
            "y1": float(ys.max() / H),
        }
    )
    print(k, meta["steps"][-1])

# bordo del plastico (per posizionare gli appunti) dalla base: differenza dalla carta
base = imgs[-1]
paper = np.median(base[: H // 6, :, :].reshape(-1, 3), axis=0)
dd = np.abs(base - paper).sum(axis=2)
obj = ndi.binary_opening(dd > 0.35, iterations=3)
ys, xs = np.nonzero(obj)
meta["diorama"] = {"x0": float(np.percentile(xs, 1) / W), "x1": float(np.percentile(xs, 99) / W), "y0": float(np.percentile(ys, 1) / H), "y1": float(np.percentile(ys, 99) / H)}

# orologio: centro e raggio del quadrante color crema
c = np.asarray(Image.open(files[8]).convert("RGB"), dtype=np.float32) / 255
cream = (c[..., 0] > 0.8) & (c[..., 1] > 0.75) & (c[..., 2] > 0.6) & (c[..., 0] - c[..., 2] > 0.05)
cream = ndi.binary_opening(cream, iterations=3)
lab, n = ndi.label(cream)
sizes = ndi.sum(cream, lab, range(1, n + 1))
big = lab == (1 + int(np.argmax(sizes)))
big = ndi.binary_fill_holes(big)
ys, xs = np.nonzero(big)
meta["clock"] = {"cx": float(xs.mean() / W), "cy": float(ys.mean() / H), "r": float(np.sqrt(big.sum() / np.pi) / W)}
print("diorama", meta["diorama"])
print("clock", meta["clock"])
json.dump(meta, open(os.path.join(dst, "meta.json"), "w"), indent=1)

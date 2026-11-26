"""Ricalca le parti del logo originale (public/logo/*.png) in sagome vettoriali.

Per ogni parte salva i contorni esterni e i buchi, nelle coordinate dell'immagine
originale 1024x1024, in src/logo-shapes.json (usato dal logo 3D).
Uso: python3 scripts/trace-logo.py
"""

import json
import os

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
# posizione di ogni ritaglio nell'immagine originale
PARTS = {
    "fish": (195, 175),
    "pescheria": (285, 478),
    "sapore": (80, 540),
    "raffadali": (315, 722),
}
UP = 4  # ingrandisco prima di ricalcare: contorni più morbidi

out = {}
for name, (ox, oy) in PARTS.items():
    img = cv2.imread(os.path.join(ROOT, "public", "logo", f"{name}.png"), cv2.IMREAD_UNCHANGED)
    alpha = img[:, :, 3].astype(np.float32)
    big = cv2.resize(alpha, None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), 1.2)
    mask = (big > 127).astype(np.uint8) * 255
    contours, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    hier = hier[0]
    shapes = []
    for i, c in enumerate(contours):
        if hier[i][3] != -1:
            continue  # è un buco: lo aggiungo al suo contorno esterno
        if cv2.contourArea(c) < 20 * UP * UP:
            continue  # puntini di rumore
        def pts(cc):
            cc = cv2.approxPolyDP(cc, 0.35 * UP, True)
            return [[round(ox + p[0][0] / UP, 2), round(oy + p[0][1] / UP, 2)] for p in cc]
        holes = []
        j = hier[i][2]
        while j != -1:
            if cv2.contourArea(contours[j]) >= 6 * UP * UP:
                holes.append(pts(contours[j]))
            j = hier[j][0]
        shapes.append({"outer": pts(c), "holes": holes})
    out[name] = shapes
    print(name, len(shapes), "sagome,", sum(len(s["outer"]) + sum(len(h) for h in s["holes"]) for s in shapes), "punti")

with open(os.path.join(ROOT, "src", "logo-shapes.json"), "w") as f:
    json.dump(out, f)

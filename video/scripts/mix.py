"""Mixa voce narrante (Kokoro) ed effetti sonori sincronizzati con PortoDiscesa."""
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

VO, SFX_DIR, FFMPEG, OUT = sys.argv[1:5]
SR = 48000
FPS = 30
INTRO, PH, N = 170, 240, 7
C = INTRO + N * PH  # 1850
DUR = (C + 390) / FPS  # 74.67 s
rng = np.random.default_rng(7)


def load(path):
    raw = subprocess.run(
        [FFMPEG, "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def db(x):
    return 10 ** (x / 20)


sfx = {n: load(os.path.join(SFX_DIR, f"{n}.mp3")) for n in ["pop", "whoosh", "whoosh-short", "whoosh-cinematic", "sparkle", "click-soft", "chime"]}
for k, v in sfx.items():
    sfx[k] = v / (np.abs(v).max() + 1e-9)


def pencil(dur, strokes_per_s=9.0):
    """Matita sulla carta: rumore filtrato con colpi di tratto irregolari."""
    n = int(dur * SR)
    noise = rng.standard_normal(n).astype(np.float32)
    b, a = signal.butter(2, [1800, 7000], btype="band", fs=SR)
    hiss = signal.lfilter(b, a, noise)
    env = np.zeros(n, dtype=np.float32)
    t = 0.0
    while t < dur:
        L = rng.uniform(0.05, 0.12)
        s, e = int(t * SR), min(n, int((t + L) * SR))
        if e > s:
            w = np.sin(np.linspace(0, np.pi, e - s)) ** 0.7
            env[s:e] = np.maximum(env[s:e], w * rng.uniform(0.5, 1.0))
        t += 1 / strokes_per_s * rng.uniform(0.7, 1.3)
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.03 * SR))
    out = hiss * env * fade
    return out / (np.abs(out).max() + 1e-9)


track_fx = np.zeros(int(DUR * SR) + SR, dtype=np.float32)
track_vo = np.zeros_like(track_fx)


def put(buf, sample, at_s, gain_db):
    s = int(at_s * SR)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sample))
    buf[s:e] += sample[: e - s] * db(gain_db)


fx = lambda name, frame, g: put(track_fx, sfx[name], frame / FPS, g)  # noqa: E731
pen = lambda frame, frames, g=-21: put(track_fx, pencil(frames / FPS), frame / FPS, g)  # noqa: E731

# --- intro ---
fx("pop", 4, -13)
pen(8, 56)  # titolo
fx("whoosh", 70, -17)  # zoom sul plastico
pen(96, 26)  # cerchio
pen(140, 30, -24)  # freccia verso la fase 1

# --- fasi ---
for k in range(1, N + 1):
    a = INTRO + (k - 1) * PH
    fx("whoosh-short", a - 2, -15)  # la telecamera scende
    fx("pop", a + 3, -12)  # compare il plastico
    fx("sparkle", a + 40, -22)  # inizia la costruzione
    fx("whoosh", a + 122, -16)  # zoom forte
    pen(a + 146, 26)  # cerchio
    pen(a + 156, 24, -24)  # freccia verso il cerchio
    pen(a + 164, 26, -23)  # titolo
    for fr in range(a + 176, a + 214, 3):  # numero che scorre
        fx("click-soft", fr, -30)
    pen(a + 206, 32, -24)  # freccia verso il basso

# --- orologio ---
fx("whoosh-short", C - 2, -15)
fx("pop", C + 3, -11)
# ticchettio che accelera e rallenta con le lancette (stessa curva di easing)
ts = np.linspace(0, 1, 4000)
ease = np.where(ts < 0.5, 4 * ts**3, 1 - (-2 * ts + 2) ** 3 / 2)
turns = ease * 36
last = 0
for i, tt in enumerate(ts):
    if turns[i] - last >= 0.5:  # un tic ogni mezzo giro di lancetta
        last = turns[i]
        fx("click-soft", C + 20 + tt * 190, -20)
pen(C + 50, 34)
pen(C + 86, 26)
pen(C + 96, 24, -24)
pen(C + 140, 60, -22)
fx("whoosh-cinematic", C + 236, -11)  # zoom indietro su tutta la tavola
fx("chime", C + 300, -12)  # didascalia finale

# --- voce ---
starts = [0.5] + [(INTRO + (k - 1) * PH) / FPS + 0.6 for k in range(1, N + 1)] + [C / FPS + 1.3]
for i, st in enumerate(starts):
    v, sr = sf.read(os.path.join(VO, f"l{i}.wav"), dtype="float32")
    if v.ndim > 1:
        v = v.mean(axis=1)
    v = signal.resample_poly(v, SR, sr).astype(np.float32)
    v /= np.abs(v).max() + 1e-9
    put(track_vo, v, st, -2.5)

# ducking: effetti più bassi mentre parla la voce
env = np.abs(track_vo)
win = int(0.25 * SR)
env = np.convolve(env, np.ones(win) / win, mode="same")
duck = 1 - 0.55 * np.clip(env / (env.max() * 0.25 + 1e-9), 0, 1)
mix = track_vo + track_fx * duck
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= db(-1) / (np.abs(mix).max() + 1e-9)
mix = mix[: int(DUR * SR)]
fade = int(0.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
sf.write(OUT, np.stack([mix, mix], axis=1), SR, subtype="PCM_16")
print("ok", OUT, f"{len(mix) / SR:.2f}s", "rms dBFS", round(20 * np.log10(np.sqrt((mix**2).mean()) + 1e-9), 1))

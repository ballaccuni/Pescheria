"""Compone e sintetizza la musichetta di sottofondo in public/sfx/music.wav.

Stile: allegro mediterraneo in Re maggiore, 100 BPM, 8 battute (~19 s),
stessa tonalità degli effetti sonori. Solo numpy.

Uso: python3 scripts/make-music.py
"""

import os
import wave

import numpy as np

SR = 48000
BPM = 100
BEAT = 60 / BPM
DUR = 19.6
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx", "music.wav")
rng = np.random.default_rng(11)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def pluck(freq, dur, bright=0.5, decay=0.996):
    """Karplus-Strong vettorizzato a blocchi: corda pizzicata (chitarra/mandolino)."""
    n = int(SR * dur)
    p = max(2, int(round(SR / freq)))
    buf = rng.uniform(-1, 1, p)
    # attacco più o meno brillante
    buf = bright * buf + (1 - bright) * np.convolve(buf, np.ones(4) / 4, mode="same")
    out = np.empty(n + p)
    out[:p] = buf
    i = p
    while i < n + p:
        prev = out[i - p : i]
        nxt = np.empty(p)
        nxt[:-1] = 0.5 * (prev[:-1] + prev[1:])
        nxt[-1] = 0.5 * (prev[-1] + out[i - p])
        nxt *= decay
        m = min(p, n + p - i)
        out[i : i + m] = nxt[:m]
        i += m
    x = out[p:]
    tail = int(SR * 0.05)
    x[-tail:] *= np.linspace(1, 0, tail)
    return x


def glock(freq, dur=1.6):
    t = np.arange(int(SR * dur)) / SR
    x = (
        np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.2)
        + 0.25 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 9)
        + 0.08 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 20)
    )
    a = int(SR * 0.002)
    x[:a] *= np.linspace(0, 1, a)
    return x


def bass(freq, dur):
    t = np.arange(int(SR * dur)) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 2.2)
    rel = int(SR * 0.06)
    env[-rel:] *= np.linspace(1, 0, rel)
    return x * env


def shaker(dur=0.09):
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = np.diff(np.concatenate([[0], noise]))  # passa-alto semplice
    return noise * np.exp(-t * 60) * np.minimum(1, t / 0.004)


class Track:
    def __init__(self):
        self.buf = np.zeros((int(SR * (DUR + 3)), 2))

    def add(self, x, at_beat, gain=1.0, pan=0.0):
        s = int(SR * at_beat * BEAT)
        e = min(len(self.buf), s + len(x))
        l = np.sqrt(0.5 * (1 - pan))
        r = np.sqrt(0.5 * (1 + pan))
        self.buf[s:e, 0] += x[: e - s] * gain * l
        self.buf[s:e, 1] += x[: e - s] * gain * r


# Accordi (MIDI): D - Bm - G - A, due volte, finale su D
D, Bm, G, A = (
    [50, 57, 62, 66, 69],
    [47, 54, 59, 62, 66],
    [43, 55, 59, 62, 67],
    [45, 52, 57, 61, 64],
)
PROG = [D, Bm, G, A, D, Bm, G, A]

# Melodia (battuta, beat nella battuta, nota MIDI, durata in beat)
MELODY = [
    # frase 1: entra dopo che il logo si è formato (battuta 2)
    (1, 0, 78, 1), (1, 1, 76, 0.5), (1, 1.5, 74, 0.5), (1, 2, 76, 1), (1, 3, 78, 1),
    (2, 0, 79, 1.5), (2, 1.5, 78, 0.5), (2, 2, 76, 1), (2, 3, 74, 1),
    (3, 0, 76, 1), (3, 1, 73, 1), (3, 2, 76, 1), (3, 3, 81, 1),
    # frase 2 (orari)
    (4, 0, 78, 1.5), (4, 1.5, 81, 0.5), (4, 2, 78, 1), (4, 3, 76, 1),
    (5, 0, 74, 1), (5, 1, 78, 1), (5, 2, 83, 1.5), (5, 3.5, 81, 0.5),
    (6, 0, 79, 1), (6, 1, 78, 1), (6, 2, 76, 1), (6, 3, 74, 1),
    (7, 0, 73, 1), (7, 1, 76, 1), (7, 2, 81, 2),
]

if __name__ == "__main__":
    tr = Track()

    for bar, chord in enumerate(PROG):
        b0 = bar * 4
        root = chord[0]
        # basso: radice sul 1, quinta sul 3
        low = 38 + (root - 38) % 12  # radice tra Re2 e Do#3
        tr.add(bass(hz(low), BEAT * 1.8), b0, 0.55)
        tr.add(bass(hz(low + 7 if low + 7 <= 50 else low - 5), BEAT * 1.8), b0 + 2, 0.45)
        # chitarra: arpeggio in crome
        pattern = [1, 2, 3, 4, 2, 3, 4, 3]
        for k, idx in enumerate(pattern):
            note = chord[idx]
            tr.add(pluck(hz(note), BEAT * 2.2, bright=0.45), b0 + k * 0.5, 0.32, pan=-0.35)
        # mandolino: accordo staccato sui tempi deboli (2 e 4), doppio colpo
        for off in (1, 3):
            for j, note in enumerate(chord[2:]):
                for rep in (0, 0.12):
                    tr.add(
                        pluck(hz(note + 12), BEAT * 0.6, bright=0.8, decay=0.99),
                        b0 + off + rep + j * 0.015,
                        0.09,
                        pan=0.4,
                    )
        # shaker in crome (dalla battuta 2), accento sui battere
        if bar >= 1:
            for k in range(8):
                tr.add(shaker(), b0 + k * 0.5, 0.05 if k % 2 else 0.08, pan=0.2)

    for bar, beat, note, length in MELODY:
        tr.add(glock(hz(note), BEAT * length + 1.0), bar * 4 + beat, 0.22, pan=0.1)

    # finale: accordo di Re che risuona
    for j, note in enumerate(D):
        tr.add(pluck(hz(note), 3.0, bright=0.5, decay=0.998), 32 + j * 0.06, 0.3, pan=-0.2)
    tr.add(bass(hz(38), 2.5), 32, 0.5)
    tr.add(glock(hz(86), 2.5), 32.2, 0.18)

    x = tr.buf[: int(SR * DUR)]
    # piccolo riverbero (echi sfumati) per un suono più morbido
    rev = np.zeros_like(x)
    for delay, g in [(0.031, 0.25), (0.067, 0.18), (0.113, 0.12), (0.171, 0.08)]:
        d = int(SR * delay)
        rev[d:, 0] += x[:-d, 1] * g
        rev[d:, 1] += x[:-d, 0] * g
    x = x + rev
    # passa-alto a 35 Hz: elimina componente continua e rimbombo
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= (1 / (1 + (35 / np.maximum(f, 1e-3)) ** 4))[:, None]
    x = np.fft.irfft(spec, n=len(x), axis=0)
    # dissolvenze
    fi, fo = int(SR * 0.8), int(SR * 1.5)
    x[:fi] *= np.linspace(0, 1, fi)[:, None]
    x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    x = x / np.max(np.abs(x)) * 0.85
    with wave.open(OUT, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print("ok", round(len(x) / SR, 2), "s")

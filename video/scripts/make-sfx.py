"""Sintetizza gli effetti sonori del video in public/sfx/ (solo numpy, nessun file esterno).

Uso: python3 scripts/make-sfx.py
"""

import os
import wave

import numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
rng = np.random.default_rng(7)


def t(dur):
    return np.arange(int(SR * dur)) / SR


def save(name, x, peak=0.9):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    m = np.max(np.abs(x)) or 1.0
    x = x / m * peak
    # micro fade per evitare click
    f = min(len(x), int(SR * 0.004))
    ramp = np.linspace(0, 1, f)[:, None]
    x[:f] *= ramp
    x[-f:] *= ramp[::-1]
    data = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def bandpass_sweep(noise, f_from, f_to, q=1.2):
    """Filtro passa-banda con frequenza centrale che varia nel tempo (a blocchi via FFT)."""
    n = len(noise)
    block = 1024
    out = np.zeros(n)
    win = np.hanning(block * 2)
    for start in range(0, n, block):
        seg = noise[start : start + block * 2]
        if len(seg) < block * 2:
            seg = np.pad(seg, (0, block * 2 - len(seg)))
        pos = min(1.0, start / max(1, n - 1))
        fc = f_from * (f_to / f_from) ** pos
        spec = np.fft.rfft(seg * win)
        freqs = np.fft.rfftfreq(block * 2, 1 / SR)
        bw = fc / q
        gain = np.exp(-0.5 * ((freqs - fc) / bw) ** 2)
        y = np.fft.irfft(spec * gain)
        end = min(n, start + block * 2)
        out[start:end] += y[: end - start]
    return out


def lowpass(x, cutoff):
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= 1 / (1 + (freqs / cutoff) ** 4)
    return np.fft.irfft(spec, n=len(x))


def env_ad(n, attack, decay_shape=3.0):
    a = int(SR * attack)
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a)
    rest = n - a
    e[a:] = np.exp(-decay_shape * np.linspace(0, 1, rest))
    return e


def whoosh(dur=0.9, f_from=300, f_to=2600, reverse=False):
    x = bandpass_sweep(rng.standard_normal(int(SR * dur)), f_from, f_to, q=1.4)
    tt = np.linspace(0, 1, len(x))
    e = np.sin(np.pi * tt**0.7) ** 2
    x = x * e
    if reverse:
        x = x[::-1]
    # leggero allargamento stereo
    d = int(SR * 0.012)
    return np.stack([x, np.roll(x, d)], axis=1)


def marimba(freq, dur=1.1):
    tt = t(dur)
    x = (
        np.sin(2 * np.pi * freq * tt) * np.exp(-tt * 5)
        + 0.35 * np.sin(2 * np.pi * freq * 3.93 * tt) * np.exp(-tt * 16)
        + 0.12 * np.sin(2 * np.pi * freq * 9.2 * tt) * np.exp(-tt * 40)
    )
    click = rng.standard_normal(len(tt)) * np.exp(-tt * 400) * 0.15
    return (x + click) * env_ad(len(tt), 0.002, 0.5)


def chime(freqs, dur=2.2, spread=0.06):
    tt = t(dur)
    x = np.zeros(len(tt))
    for i, f in enumerate(freqs):
        off = int(SR * spread * i)
        tl = tt[: len(tt) - off]
        tone = (
            np.sin(2 * np.pi * f * tl)
            + 0.3 * np.sin(2 * np.pi * f * 2.76 * tl) * np.exp(-tl * 6)
        ) * np.exp(-tl * 2.2)
        x[off:] += tone * (0.85**i)
    return x * env_ad(len(tt), 0.003, 0.3)


def bubble(f0=380, f1=1300, dur=0.12):
    tt = t(dur)
    freq = f0 + (f1 - f0) * (tt / dur) ** 1.6
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * np.exp(-tt * 28) * env_ad(len(tt), 0.004, 0.2)


def bubbles_cluster():
    out = np.zeros(int(SR * 0.6))
    for i, (start, f0, f1) in enumerate(
        [(0.0, 420, 1400), (0.09, 520, 1700), (0.2, 360, 1200), (0.33, 600, 1900)]
    ):
        b = bubble(f0, f1) * (0.9 - i * 0.12)
        s = int(SR * start)
        out[s : s + len(b)] += b
    return out


def pop(freq=220, dur=0.35):
    tt = t(dur)
    f = freq * (1 + 1.5 * np.exp(-tt * 40))
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-tt * 14)
    snap = lowpass(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 120) * 0.4
    return body + snap


def mouse_click():
    out = np.zeros(int(SR * 0.16))
    for start, amp, cut in [(0.0, 1.0, 5000), (0.075, 0.6, 3800)]:
        n = int(SR * 0.03)
        tt = t(0.03)
        c = lowpass(rng.standard_normal(n), cut) * np.exp(-tt * 260)
        c += 0.5 * np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 300)
        s = int(SR * start)
        out[s : s + n] += c * amp
    return out


def ocean(dur):
    """Ambiente marino: rumore filtrato con onde lente, stereo."""
    n = int(SR * dur)
    tt = np.arange(n) / SR
    chans = []
    for ph in (0.0, 1.3):
        brown = np.cumsum(rng.standard_normal(n))
        brown -= np.convolve(brown, np.ones(4801) / 4801, mode="same")
        brown = lowpass(brown, 900)
        hiss = lowpass(rng.standard_normal(n), 4500) * 0.25
        swell = 0.55 + 0.45 * np.sin(2 * np.pi * tt / 6.5 + ph) ** 2
        foam = np.clip(np.sin(2 * np.pi * tt / 6.5 + ph - 0.6), 0, 1) ** 3
        chans.append(brown / np.max(np.abs(brown)) * swell + hiss * foam)
    x = np.stack(chans, axis=1)
    fade = np.ones(n)
    fi, fo = int(SR * 1.5), int(SR * 2.0)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[-fo:] = np.linspace(1, 0, fo)
    return x * fade[:, None]


# note (Hz): scala pentatonica di Re, calda e marina
D4, E4, Fs4, A4, B4 = 293.66, 329.63, 369.99, 440.0, 493.88
D5, E5, Fs5, A5, B5, D6 = 587.33, 659.25, 739.99, 880.0, 987.77, 1174.66

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    save("ocean", ocean(19.5), peak=0.5)
    save("whoosh-fish", whoosh(1.7, 250, 2200), peak=0.8)
    save("whoosh-soft", whoosh(1.0, 400, 1800), peak=0.7)
    save("whoosh-out", whoosh(0.8, 2000, 500, reverse=True), peak=0.7)
    save("swipe", whoosh(0.5, 1500, 4500), peak=0.6)
    save("bubbles", bubbles_cluster(), peak=0.8)
    save("shimmer", chime([A5, D6, E5 * 2], dur=1.8, spread=0.05), peak=0.7)
    save("pop", pop(196), peak=0.9)
    for name, f in [
        ("note-d5", D5), ("note-fs5", Fs5), ("note-a5", A5),
        ("note-b5", B5), ("note-a4", A4), ("note-d6", D6),
    ]:
        save(name, marimba(f), peak=0.8)
    save("click", mouse_click(), peak=0.9)
    save("success", chime([D5, Fs5, A5, D6], dur=2.6, spread=0.08), peak=0.8)
    print("ok")

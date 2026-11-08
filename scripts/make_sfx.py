"""
Membuat efek suara HALUS secara sintetis (tanpa file dari internet, bebas lisensi) -> public/sfx/*.wav
whoosh, pop, ding, tick, thump (lembut, bukan dentuman), shimmer, swell.
Jalankan: python scripts/make_sfx.py   (butuh numpy + scipy)
"""
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(11)


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na > 0:
        e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    if nr > 0:
        e[-nr:] *= np.cos(np.linspace(0, np.pi / 2, nr)) ** 2
    return e


def norm(x, peak_db=-6.0):
    peak = 10 ** (peak_db / 20)
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def save(name, left, right=None):
    if right is None:
        right = left
    st = np.stack([left, right], axis=1)
    st = norm(st)
    wavfile.write(os.path.join(OUT, f"{name}.wav"), SR, (st * 32767).astype(np.int16))


def bandsweep(noise, f0, f1, q=0.7, blocks=60):
    """noise lewat filter band yang bergeser f0 -> f1 (per blok, di-crossfade)"""
    n = len(noise)
    out = np.zeros(n)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for b in range(blocks):
        f = f0 * (f1 / f0) ** (b / max(1, blocks - 1))
        lo, hi = max(40, f / (1 + q)), min(SR / 2 - 100, f * (1 + q))
        sos = butter(2, [lo, hi], btype="band", fs=SR, output="sos")
        s, e = edges[b], edges[b + 1]
        pad = 2048
        seg = noise[max(0, s - pad): e]
        y = sosfilt(sos, seg)[-(e - s):]
        out[s:e] = y
    return out


# whoosh: noise band menyapu naik lalu turun, panning kiri -> kanan
n = int(0.75 * SR)
w = bandsweep(rng.standard_normal(n), 300, 3200) * env_adsr(n, 0.38, 0.34)
pan = np.linspace(0.2, 0.8, n)
save("whoosh", w * (1 - pan) * 1.4, w * pan * 1.4)

# pop: sinus turun cepat + klik kecil
n = int(0.16 * SR)
tt = np.arange(n) / SR
f = 720 * np.exp(-tt * 18) + 260
ph = 2 * np.pi * np.cumsum(f) / SR
p = np.sin(ph) * np.exp(-tt * 34)
p[:60] += rng.standard_normal(60) * np.linspace(0.4, 0, 60)
save("pop", p)

# ding: lonceng lembut (harmonik) dengan peluruhan panjang
n = int(1.4 * SR)
tt = np.arange(n) / SR
d = (np.sin(2 * np.pi * 1318.5 * tt) + 0.35 * np.sin(2 * np.pi * 2637 * tt) + 0.12 * np.sin(2 * np.pi * 3955.5 * tt)) * np.exp(-tt * 3.2)
d *= env_adsr(n, 0.004, 0.2)
save("ding", d)

# tick: klik pendek bernada
n = int(0.05 * SR)
tt = np.arange(n) / SR
k = (np.sin(2 * np.pi * 2400 * tt) * 0.6 + rng.standard_normal(n) * 0.25) * np.exp(-tt * 140)
save("tick", k)

# thump: getaran rendah yang lembut (bukan dentuman keras)
n = int(0.7 * SR)
tt = np.arange(n) / SR
f = 62 * np.exp(-tt * 2.5) + 38
ph = 2 * np.pi * np.cumsum(f) / SR
th = np.sin(ph) * np.exp(-tt * 5.5)
lp = sosfilt(butter(2, 180, btype="low", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-tt * 9) * 0.6
save("thump", (th + lp) * env_adsr(n, 0.01, 0.15))

# shimmer: kilau nada tinggi acak, sangat halus
n = int(1.6 * SR)
tt = np.arange(n) / SR
sh = np.zeros(n)
for i in range(9):
    fr = rng.uniform(2200, 5200)
    sh += np.sin(2 * np.pi * fr * tt + rng.uniform(0, 6)) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(5, 11) * tt))
sh *= env_adsr(n, 0.45, 0.8)
save("shimmer", sh * 0.7, np.roll(sh, 900) * 0.7)

# swell: naik pelan (noise tersaring + pad lembut)
n = int(2.6 * SR)
tt = np.arange(n) / SR
nz = bandsweep(rng.standard_normal(n), 200, 2400, q=1.0)
pad = np.sin(2 * np.pi * 220 * tt) * 0.3 + np.sin(2 * np.pi * 329.6 * tt) * 0.22
rise = (tt / tt[-1]) ** 2
sw = (nz * 0.8 + pad) * rise * env_adsr(n, 0.05, 0.25)
save("swell", sw)

print("SFX dibuat di", os.path.abspath(OUT))

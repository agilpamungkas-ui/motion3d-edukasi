"""Membuat tekstur grain (film) dan kertas secara prosedural -> public/textures/*.png"""
import os
import numpy as np
from PIL import Image

out = os.path.join(os.path.dirname(__file__), "..", "public", "textures")
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)

# grain: noise abu-abu di sekitar tengah, tile 256 px
g = rng.normal(128, 38, (256, 256)).clip(0, 255).astype(np.uint8)
Image.fromarray(g, "L").convert("RGB").save(os.path.join(out, "grain.png"))

# kertas: noise frekuensi rendah + serat halus, tile 512 px (dipakai dengan blend multiply)
n = 512
base = np.zeros((n, n))
for scale, amp in [(8, 0.5), (16, 0.3), (64, 0.2)]:
    small = rng.random((scale, scale))
    big = np.array(Image.fromarray((small * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)) / 255.0
    base += amp * big
base = (base - base.min()) / (base.max() - base.min())
fib = np.zeros((n, n))
for _ in range(900):
    x, y = rng.integers(0, n, 2)
    L = rng.integers(8, 40)
    ang = rng.random() * np.pi
    for k in range(L):
        xx = int(x + k * np.cos(ang)) % n
        yy = int(y + k * np.sin(ang)) % n
        fib[yy, xx] += 0.6
paper = 1.0 - 0.10 * base - 0.08 * np.clip(fib, 0, 1)
img = (np.stack([paper * 250, paper * 244, paper * 232], -1)).clip(0, 255).astype(np.uint8)
Image.fromarray(img, "RGB").save(os.path.join(out, "paper.png"))
print("ok")

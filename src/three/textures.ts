/**
 * Tekstur & geometri prosedural (dibuat dari kode, tanpa file gambar).
 * Benua di sini FIKTIF/gaya saja, bukan peta asli. Untuk peta asli, taruh tekstur
 * equirectangular di public/ dan pakai prop `map` (lihat README).
 */
import { BufferAttribute, CanvasTexture, Color, IcosahedronGeometry, SRGBColorSpace } from "three";
import type { Theme } from "../themes";

const hash = (x: number, y: number, z: number, s: number) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};

const fade = (t: number) => t * t * (3 - 2 * t);

export const vnoise = (x: number, y: number, z: number, s: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);
  const c000 = hash(xi, yi, zi, s);
  const c100 = hash(xi + 1, yi, zi, s);
  const c010 = hash(xi, yi + 1, zi, s);
  const c110 = hash(xi + 1, yi + 1, zi, s);
  const c001 = hash(xi, yi, zi + 1, s);
  const c101 = hash(xi + 1, yi, zi + 1, s);
  const c011 = hash(xi, yi + 1, zi + 1, s);
  const c111 = hash(xi + 1, yi + 1, zi + 1, s);
  const x00 = c000 + (c100 - c000) * u;
  const x10 = c010 + (c110 - c010) * u;
  const x01 = c001 + (c101 - c001) * u;
  const x11 = c011 + (c111 - c011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
};

export const fbm = (x: number, y: number, z: number, s: number, oct = 5) => {
  let a = 0.5;
  let f = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += a * vnoise(x * f + i * 13.7, y * f + i * 7.3, z * f + i * 3.1, s + i);
    norm += a;
    a *= 0.5;
    f *= 2.02;
  }
  return sum / norm;
};

const height = (x: number, y: number, z: number) => fbm(x * 1.8 + 5.2, y * 1.8 + 1.3, z * 1.8 + 9.1, 7);

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const poster = (t: number, steps: number) => (steps > 0 ? Math.round(t * steps) / steps : t);

const percentile = (arr: Float32Array, q: number, step = 7) => {
  const s: number[] = [];
  for (let i = 0; i < arr.length; i += step) s.push(arr[i]);
  s.sort((a, b) => a - b);
  return s[Math.floor(s.length * q)];
};

const texCache = new Map<string, CanvasTexture>();

/** tekstur permukaan bumi (equirectangular), sesuai warna tema */
export const earthTexture = (th: Theme) => {
  const hit = texCache.get(th.id);
  if (hit) return hit;
  const W = 768;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const hs = new Float32Array(W * H);
  const ice = new Float32Array(W * H);
  for (let j = 0; j < H; j++) {
    const theta = (Math.PI * (j + 0.5)) / H;
    for (let i = 0; i < W; i++) {
      const phi = (2 * Math.PI * (i + 0.5)) / W;
      const x = -Math.cos(phi) * Math.sin(theta);
      const y = Math.cos(theta);
      const z = Math.sin(phi) * Math.sin(theta);
      hs[j * W + i] = height(x, y, z);
      ice[j * W + i] = Math.abs(Math.PI / 2 - theta) + (fbm(x * 4, y * 4, z * 4, 3, 3) - 0.5) * 0.35;
    }
  }
  const sea = percentile(hs, 0.62);
  const E = th.earth;
  const deep = rgb(E.deep);
  const ocean = rgb(E.ocean);
  const land = rgb(E.land);
  const high = rgb(E.high);
  const iceC = rgb(E.ice);
  const coast = E.coast ? rgb(E.coast) : null;
  for (let k = 0; k < W * H; k++) {
    const h = hs[k];
    let c: [number, number, number];
    if (h < sea) {
      c = mix(ocean, deep, poster(clamp01((sea - h) / 0.09), E.posterize));
    } else {
      c = mix(land, high, poster(clamp01((h - sea) / 0.12), E.posterize));
    }
    if (coast && Math.abs(h - sea) < 0.0042) c = coast;
    if (ice[k] > 1.22) c = iceC;
    img.data[k * 4] = c[0];
    img.data[k * 4 + 1] = c[1];
    img.data[k * 4 + 2] = c[2];
    img.data[k * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  texCache.set(th.id, tex);
  return tex;
};

const lowCache = new Map<string, IcosahedronGeometry>();

/** bumi low-poly: tiap segitiga satu warna (gaya papercraft) */
export const lowPolyEarth = (th: Theme) => {
  const hit = lowCache.get(th.id);
  if (hit) return hit;
  const g = new IcosahedronGeometry(1, 3);
  const pos = g.getAttribute("position");
  const faces = pos.count / 3;
  const hs = new Float32Array(faces);
  const lats = new Float32Array(faces);
  for (let f = 0; f < faces; f++) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let v = 0; v < 3; v++) {
      x += pos.getX(f * 3 + v);
      y += pos.getY(f * 3 + v);
      z += pos.getZ(f * 3 + v);
    }
    const l = Math.hypot(x, y, z);
    x /= l;
    y /= l;
    z /= l;
    hs[f] = height(x, y, z);
    lats[f] = Math.abs(Math.asin(y));
  }
  const sea = percentile(hs, 0.6, 1);
  const E = th.earth;
  const colors = new Float32Array(pos.count * 3);
  const tmp = new Color();
  const cA = new Color();
  const cB = new Color();
  for (let f = 0; f < faces; f++) {
    const h = hs[f];
    if (lats[f] > 1.18) {
      tmp.set(E.ice);
    } else if (h < sea) {
      cA.set(E.ocean);
      cB.set(E.deep);
      tmp.copy(cA).lerp(cB, poster(clamp01((sea - h) / 0.09), E.posterize || 3));
    } else {
      cA.set(E.land);
      cB.set(E.high);
      tmp.copy(cA).lerp(cB, poster(clamp01((h - sea) / 0.12), E.posterize || 3));
    }
    for (let v = 0; v < 3; v++) {
      colors[(f * 3 + v) * 3] = tmp.r;
      colors[(f * 3 + v) * 3 + 1] = tmp.g;
      colors[(f * 3 + v) * 3 + 2] = tmp.b;
    }
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  g.computeVertexNormals();
  lowCache.set(th.id, g);
  return g;
};

/**
 * Alat bantu animasi. SEMUA gerak adalah fungsi murni dari waktu `t` (detik timeline):
 * tanpa CSS transition, tanpa Math.random() (pakai rand), tanpa Date. Kalau tidak, render bisa berkedip.
 */
import { createContext, useContext } from "react";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { Euler, Matrix4, OrthographicCamera, PerspectiveCamera, Quaternion, Vector3 } from "three";

export type V3 = [number, number, number];

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Kurva dari skill motion-design: masuk = easeOut, keluar = easeIn, pindah keadaan = easeInOut.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.6, 0, 0.9, 0.35);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const overshoot = Easing.bezier(0.55, 0, 0.2, 1.12);
export const linear = (x: number) => x;

/** progres 0..1 antara t0..t1 dengan easing */
export const prog = (t: number, t0: number, t1: number, ease: (x: number) => number = easeOut) => {
  if (t <= t0) return 0;
  if (t >= t1) return 1;
  return ease((t - t0) / (t1 - t0));
};

/** jendela: naik di [a, a+inDur], tahan, turun di [b-outDur, b] */
export const win = (t: number, a: number, b: number, inDur = 0.6, outDur = 0.4) =>
  Math.min(prog(t, a, a + inDur, easeOut), 1 - prog(t, b - outDur, b, easeIn));

/** pegas sederhana (tanpa state) untuk "pop": 0 -> 1 dengan sedikit lewat */
export const pop = (t: number, at: number, dur = 0.55) => {
  if (t <= at) return 0;
  const x = (t - at) / dur;
  if (x >= 1) return 1;
  return 1 - Math.exp(-6 * x) * Math.cos(9 * x);
};

/** acak deterministik 0..1 */
export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** skala waktu: >1 berarti video diregangkan mengikuti audio */
export const TimeScale = createContext(1);

/** detik timeline saat ini */
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useContext(TimeScale);
  return frame / fps / s;
};

// ---------- kamera ----------
export type Cam = { pos: V3; target: V3; fov: number; ortho?: boolean; zoom?: number };

export const lerpV = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  pos: lerpV(a.pos, b.pos, t),
  target: lerpV(a.target, b.target, t),
  fov: lerp(a.fov, b.fov, t),
  ortho: a.ortho,
  zoom: lerp(a.zoom ?? 100, b.zoom ?? 100, t),
});

/** jalur kamera: tiap kunci = "pindah ke cam ini mulai `at` selama `dur` detik" */
export const camTrack = (t: number, keys: { at: number; dur: number; cam: Cam }[]) => {
  let cur = keys[0].cam;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    cur = lerpCam(cur, k.cam, prog(t, k.at, k.at + k.dur, easeInOut));
  }
  return cur;
};

/** kamera three.js yang sama persis dengan kamera di kanvas, untuk memproyeksikan titik 3D ke layar */
export const makeCamera = (cam: Cam, w: number, h: number) => {
  if (cam.ortho) {
    const c = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 200);
    c.zoom = cam.zoom ?? 100;
    c.position.set(...cam.pos);
    c.up.set(0, 1, 0);
    c.lookAt(...cam.target);
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
    return c;
  }
  const c = new PerspectiveCamera(cam.fov, w / h, 0.05, 200);
  c.position.set(...cam.pos);
  c.up.set(0, 1, 0);
  c.lookAt(...cam.target);
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true);
  return c;
};

export const project = (c: PerspectiveCamera | OrthographicCamera, p: V3, w: number, h: number) => {
  const v = new Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
};

/** matriks objek (rotasi Euler XYZ sama dengan <group rotation={[x, y, z]}>) */
export const objMatrix = (rot: V3, pos: V3 = [0, 0, 0], scale = 1) =>
  new Matrix4().compose(new Vector3(...pos), new Quaternion().setFromEuler(new Euler(rot[0], rot[1], rot[2], "XYZ")), new Vector3(scale, scale, scale));

export const toWorld = (m: Matrix4, p: V3): V3 => {
  const v = new Vector3(...p).applyMatrix4(m);
  return [v.x, v.y, v.z];
};

/** jari-jari bola di layar (piksel) */
export const screenRadius = (cam: Cam, center: V3, r: number, h: number) => {
  if (cam.ortho) return r * (cam.zoom ?? 100);
  const dx = cam.pos[0] - center[0];
  const dy = cam.pos[1] - center[1];
  const dz = cam.pos[2] - center[2];
  const d2 = dx * dx + dy * dy + dz * dz;
  const f = h / 2 / Math.tan((cam.fov * Math.PI) / 360);
  return (f * r) / Math.sqrt(Math.max(d2 - r * r, 1e-6));
};

/** format angka gaya Indonesia: 12,2 / 2.900 */
export const fmtID = (n: number, digits = 0) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

/** rapikan posisi y label agar tidak bertumpuk (urutan dipertahankan) */
export const spreadLabels = (ys: number[], gap: number, lo: number, hi: number) => {
  const idx = ys.map((y, i) => [y, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(ys.length);
  let prev = -Infinity;
  for (const [y, i] of idx) {
    const v = Math.max(y, prev + gap, lo);
    out[i] = v;
    prev = v;
  }
  // geser ke atas bila melewati batas bawah
  const over = Math.max(0, prev - hi);
  return out.map((v) => v - over);
};

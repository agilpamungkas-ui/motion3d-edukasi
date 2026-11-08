/**
 * Bumi 3D yang bisa "dibelah" (cutaway). Semua prop = keadaan pada satu frame:
 *  - spin  : rotasi sumbu bumi (radian)       - tilt : kemiringan ke arah kamera
 *  - cut   : sudut belahan (radian, 0 = utuh) - xray : 0..1 permukaan jadi tembus pandang
 *  - hlIdx : lapisan yang disorot (0 kerak, 1 mantel, 2 inti luar, 3 inti dalam), hl: 0..1
 *  - glow  : denyut cahaya lapisan yang disorot
 * Ketebalan kerak DIBESARKAN agar terlihat (ilustrasi, bukan skala asli).
 */
import { useLoader } from "@react-three/fiber";
import React, { useMemo } from "react";
import { staticFile } from "remotion";
import {
  AdditiveBlending,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  BufferGeometry,
  Color,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Plane,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import type { V3 } from "../lib";
import type { Theme } from "../themes";
import { earthTexture, lowPolyEarth } from "./textures";

export const LAYERS = [
  { key: "kerak", nama: "Kerak", r0: 0.92, r1: 1.0 },
  { key: "mantel", nama: "Mantel", r0: 0.546, r1: 0.92 },
  { key: "intiLuar", nama: "Inti luar", r0: 0.19, r1: 0.546 },
  { key: "intiDalam", nama: "Inti dalam", r0: 0.0, r1: 0.19 },
] as const;

/** titik di bidang belahan (lokal bumi): azimut `az`, jarak dari pusat r, sudut dari kutub utara `polarDeg` */
export const faceAnchor = (az: number, r: number, polarDeg: number): V3 => {
  const p = (polarDeg * Math.PI) / 180;
  return [r * Math.sin(p) * Math.sin(az), r * Math.cos(p), r * Math.sin(p) * Math.cos(az)];
};

const geoCache: Record<string, BufferGeometry> = {};
const cached = <T extends BufferGeometry>(key: string, make: () => T): T => {
  if (!geoCache[key]) geoCache[key] = make();
  return geoCache[key] as T;
};

const ringGeo = (i: number, low: boolean) =>
  cached(`ring${i}${low}`, () => new RingGeometry(Math.max(LAYERS[i].r0, 0.0005), LAYERS[i].r1, low ? 14 : 128, 1, -Math.PI / 2, Math.PI));

const faceLines = (low: boolean) =>
  cached(`faceLines${low}`, () => {
    const pts: number[] = [];
    const radii = [1.0, 0.92, 0.546, 0.19];
    const n = low ? 14 : 96;
    for (const r of radii) {
      for (let k = 0; k < n; k++) {
        const a0 = -Math.PI / 2 + (Math.PI * k) / n;
        const a1 = -Math.PI / 2 + (Math.PI * (k + 1)) / n;
        pts.push(r * Math.cos(a0), r * Math.sin(a0), 0, r * Math.cos(a1), r * Math.sin(a1), 0);
      }
    }
    pts.push(0, -1, 0, 0, 1, 0);
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pts, 3));
    return g;
  });

const gridLines = () =>
  cached("grid", () => {
    const pts: number[] = [];
    const r = 1.004;
    const seg = 96;
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = r * Math.sin((lat * Math.PI) / 180);
      const rr = r * Math.cos((lat * Math.PI) / 180);
      for (let k = 0; k < seg; k++) {
        const a0 = (2 * Math.PI * k) / seg;
        const a1 = (2 * Math.PI * (k + 1)) / seg;
        pts.push(rr * Math.cos(a0), y, rr * Math.sin(a0), rr * Math.cos(a1), y, rr * Math.sin(a1));
      }
    }
    for (let m = 0; m < 12; m++) {
      const az = (m * Math.PI) / 6;
      for (let k = 0; k < seg / 2; k++) {
        const p0 = (Math.PI * k) / (seg / 2);
        const p1 = (Math.PI * (k + 1)) / (seg / 2);
        pts.push(
          r * Math.sin(p0) * Math.sin(az), r * Math.cos(p0), r * Math.sin(p0) * Math.cos(az),
          r * Math.sin(p1) * Math.sin(az), r * Math.cos(p1), r * Math.sin(p1) * Math.cos(az),
        );
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pts, 3));
    return g;
  });

const sphere = (r: number, w = 128, h = 96) => cached(`sph${r}-${w}`, () => new SphereGeometry(r, w, h));

const atmoVert = /* glsl */ `
#include <clipping_planes_pars_vertex>
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}`;

const atmoFrag = /* glsl */ `
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform float uK;
varying vec3 vN;
varying vec3 vV;
void main() {
  #include <clipping_planes_fragment>
  float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
  gl_FragColor = vec4(uColor * f * uK, f * uK);
}`;

export type EarthProps = {
  th: Theme;
  spin: number;
  tilt?: number;
  cut?: number;
  xray?: number;
  hlIdx?: number;
  hl?: number;
  glow?: number;
  position?: V3;
  scale?: number;
  /** opsional: peta asli equirectangular di public/, mis. "textures/bumi.jpg" */
  mapUrl?: string;
};

/** Bumi. Kalau `mapUrl` diisi, permukaan memakai gambar peta itu; kalau kosong, pola benua prosedural sesuai tema. */
export const Earth: React.FC<EarthProps> = (props) => (props.mapUrl ? <EarthWithMap {...props} mapUrl={props.mapUrl} /> : <EarthCore {...props} map={null} />);

const EarthWithMap: React.FC<EarthProps & { mapUrl: string }> = (props) => {
  const tex = useLoader(TextureLoader, staticFile(props.mapUrl));
  tex.colorSpace = SRGBColorSpace;
  return <EarthCore {...props} map={tex} />;
};

const EarthCore: React.FC<EarthProps & { map: Texture | null }> = ({ th, spin, tilt = 0.3, cut = 0, xray = 0, hlIdx = -1, hl = 0, glow = 0, position = [0, 0, 0], scale = 1, map }) => {
  const low = th.mat.lowPoly && !map;
  const tex = useMemo(() => (map ? map : low ? null : earthTexture(th)), [th, low, map]);
  const lowGeo = useMemo(() => (low ? lowPolyEarth(th) : null), [th, low]);
  const planes = useMemo(() => [new Plane(), new Plane()], []);
  const atmoUniforms = useMemo(() => ({ uColor: { value: new Color(th.mat.atmoColor) }, uK: { value: th.mat.atmo } }), [th]);

  const hasCut = cut > 0.002;
  const M = earthMatrix(tilt, spin, position, scale);
  planes[0].set(new Vector3(-1, 0, 0), 0).applyMatrix4(M);
  planes[1].set(new Vector3(Math.cos(cut), 0, -Math.sin(cut)), 0).applyMatrix4(M);
  const clip = hasCut ? planes : [];

  const dim = new Color(th.bg.mid);
  const faceColor = (i: number) => {
    const c = new Color(th.layers[i]);
    if (hlIdx >= 0 && i !== hlIdx) c.lerp(dim, 0.4 * hl);
    return c;
  };
  const faceEm = (i: number) => {
    const base = th.mat.emissiveFaces * (hlIdx >= 0 && i !== hlIdx ? 1 - 0.6 * hl : 1);
    return base + (i === hlIdx ? hl * (0.35 + 0.45 * glow) : 0);
  };

  const surfaceOpacity = 1 - 0.8 * xray;

  return (
    <group position={position} rotation={[tilt, spin, 0]} scale={scale}>
      {/* permukaan */}
      <mesh geometry={low ? lowGeo! : sphere(1)} renderOrder={4}>
        <meshStandardMaterial
          map={tex}
          vertexColors={low}
          flatShading={low}
          roughness={th.mat.roughness}
          metalness={th.mat.metalness}
          emissiveMap={th.mat.surfaceGlow > 0 ? tex : null}
          emissive={th.mat.surfaceGlow > 0 ? "#ffffff" : "#000000"}
          emissiveIntensity={th.mat.surfaceGlow}
          clippingPlanes={clip}
          clipIntersection
          transparent={xray > 0.001}
          opacity={surfaceOpacity}
          depthWrite={xray < 0.5}
        />
      </mesh>

      {/* lapisan dalam versi tembus pandang (x-ray) */}
      {xray > 0.001
        ? [1, 2, 3].map((i) => (
            <mesh key={`x${i}`} geometry={sphere(LAYERS[i].r1, 96, 64)} renderOrder={4 - i}>
              <meshStandardMaterial
                color={th.layers[i]}
                emissive={th.layers[i]}
                emissiveIntensity={0.35}
                roughness={0.5}
                transparent
                opacity={(i === 3 ? 0.85 : 0.45) * xray}
                depthWrite={false}
                clippingPlanes={clip}
                clipIntersection
              />
            </mesh>
          ))
        : null}

      {/* bidang belahan: setengah cincin untuk tiap lapisan, di dua sisi irisan */}
      {hasCut
        ? LAYERS.map((_, i) =>
            [0, cut].map((alpha, j) => (
              <mesh key={`f${i}${j}`} geometry={ringGeo(i, low)} rotation={[0, alpha - Math.PI / 2, 0]} renderOrder={5}>
                <meshStandardMaterial
                  color={faceColor(i)}
                  emissive={th.layers[i]}
                  emissiveIntensity={faceEm(i)}
                  roughness={Math.min(1, th.mat.roughness + 0.1)}
                  metalness={0}
                  flatShading={low}
                  side={DoubleSide}
                  polygonOffset
                  polygonOffsetFactor={1}
                  polygonOffsetUnits={1}
                />
              </mesh>
            )),
          )
        : null}

      {/* garis tepi irisan */}
      {hasCut && th.mat.lines > 0
        ? [0, cut].map((alpha, j) => (
            <lineSegments key={`l${j}`} geometry={faceLines(low)} rotation={[0, alpha - Math.PI / 2, 0]} renderOrder={6}>
              <lineBasicMaterial color={th.mat.lineColor} transparent opacity={th.mat.lines} toneMapped={false} />
            </lineSegments>
          ))
        : null}

      {/* garis lintang-bujur (gaya neon/blueprint) */}
      {th.mat.lines > 0.3 ? (
        <lineSegments geometry={gridLines()} renderOrder={6}>
          <lineBasicMaterial color={th.mat.lineColor} transparent opacity={th.mat.lines * 0.45 * surfaceOpacity} clippingPlanes={clip} clipIntersection toneMapped={false} />
        </lineSegments>
      ) : null}

      {/* atmosfer (cahaya tepi) */}
      {th.mat.atmo > 0 ? (
        <mesh geometry={sphere(1.025, 96, 64)} renderOrder={7}>
          <shaderMaterial
            vertexShader={atmoVert}
            fragmentShader={atmoFrag}
            uniforms={atmoUniforms}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            clipping
            clippingPlanes={clip}
            clipIntersection
          />
        </mesh>
      ) : null}
    </group>
  );
};

/** matriks transformasi bumi, sama dengan <Earth> (untuk memproyeksikan label) */
export const earthMatrix = (tilt: number, spin: number, position: V3 = [0, 0, 0], scale = 1) => {
  const m = new Matrix4();
  m.makeRotationFromEuler(new Euler(tilt, spin, 0, "XYZ"));
  m.scale(new Vector3(scale, scale, scale));
  m.setPosition(new Vector3(...position));
  return m;
};

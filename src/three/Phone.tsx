/**
 * Ponsel "exploded view" untuk konten tutorial (bongkar isi perangkat).
 * Ponsel diletakkan telentang, bagian-bagiannya terangkat bertumpuk ke atas (seperti diagram servis).
 * explode: 0 = rapat, 1 = terurai penuh. yaw: putaran di sumbu vertikal.
 */
import React, { useMemo } from "react";
import { Matrix4 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { lerp, type V3 } from "../lib";
import { mixHex, type Theme } from "../themes";

export const PHONE_PARTS = [
  { nama: "Kaca pelindung", w: 0.8, h: 1.62, d: 0.02, y: 0 },
  { nama: "Layar OLED", w: 0.78, h: 1.6, d: 0.035, y: 0 },
  { nama: "Papan sirkuit", w: 0.66, h: 0.5, d: 0.03, y: 0.5 },
  { nama: "Baterai", w: 0.64, h: 0.92, d: 0.07, y: -0.24 },
  { nama: "Casing belakang", w: 0.82, h: 1.64, d: 0.08, y: 0 },
] as const;

/** ketinggian (sumbu lokal z) tiap bagian */
export const partZ = (i: number, explode: number) => (2 - i) * lerp(0.055, 0.5, explode);

/** titik jangkar label (lokal): sudut kanan-depan tiap bagian (selalu terlihat walau bertumpuk) */
export const partAnchor = (i: number, explode: number): V3 => {
  const p = PHONE_PARTS[i];
  return [p.w / 2 - 0.06, p.y - p.h / 2 + 0.08, partZ(i, explode) + p.d / 2];
};

/** matriks ponsel (sama dengan <Phone>), untuk memproyeksikan label */
export const phoneMatrix = (yaw: number, position: V3 = [0, 0, 0], scale = 1) => {
  const m = new Matrix4().makeTranslation(position[0], position[1], position[2]);
  m.multiply(new Matrix4().makeRotationY(yaw));
  m.multiply(new Matrix4().makeRotationX(-Math.PI / 2));
  m.multiply(new Matrix4().makeScale(scale, scale, scale));
  return m;
};

const geoCache = new Map<number, RoundedBoxGeometry>();
const box = (i: number) => {
  const hit = geoCache.get(i);
  if (hit) return hit;
  const p = PHONE_PARTS[i];
  const g = new RoundedBoxGeometry(p.w, p.h, p.d, 4, Math.min(0.06, p.d / 2 - 0.001));
  geoCache.set(i, g);
  return g;
};

export const Phone: React.FC<{ th: Theme; explode: number; yaw: number; position?: V3; hl?: number; scale?: number }> = ({ th, explode, yaw, position = [0, 0, 0], hl = -1, scale = 1 }) => {
  const neutral = useMemo(() => mixHex(th.bg.mid, th.ink, th.dark ? 0.35 : 0.22), [th]);
  const colors = [th.accent3, "#0E1322", th.accent, th.accent2, neutral];
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {PHONE_PARTS.map((p, i) => {
          const z = partZ(i, explode);
          const isGlass = i === 0;
          const isScreen = i === 1;
          const em = hl === i ? 0.45 : isScreen ? 0.25 : 0.04;
          return (
            <group key={p.nama} position={[0, p.y, z]}>
              <mesh geometry={box(i)}>
                <meshPhysicalMaterial
                  color={colors[i]}
                  emissive={isScreen ? th.accent : colors[i]}
                  emissiveIntensity={em}
                  roughness={isGlass ? 0.05 : th.mat.roughness}
                  metalness={i === 4 ? 0.3 : th.mat.metalness}
                  clearcoat={isGlass ? 1 : th.mat.clearcoat}
                  transparent={isGlass}
                  opacity={isGlass ? 0.35 : 1}
                  depthWrite={!isGlass}
                />
              </mesh>
              {i === 2
                ? [
                    [-0.16, 0.06, 0.12, 0.12],
                    [0.08, 0.08, 0.16, 0.1],
                    [0.1, -0.1, 0.1, 0.08],
                    [-0.15, -0.12, 0.08, 0.06],
                  ].map(([x, y, w, h], k) => (
                    <mesh key={k} position={[x, y, p.d / 2 + 0.012]}>
                      <boxGeometry args={[w, h, 0.024]} />
                      <meshStandardMaterial color={th.dark ? "#1b2233" : th.ink} roughness={0.5} />
                    </mesh>
                  ))
                : null}
              {i === 1 ? (
                <mesh position={[0, 0, p.d / 2 + 0.002]}>
                  <planeGeometry args={[p.w - 0.08, p.h - 0.1]} />
                  <meshBasicMaterial color={th.accent} transparent opacity={0.35} toneMapped={false} />
                </mesh>
              ) : null}
              {i === 4 ? (
                <mesh position={[-0.22, 0.6, -p.d / 2 - 0.012]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.085, 0.085, 0.03, 32]} />
                  <meshStandardMaterial color={th.dark ? "#0b0f18" : "#1a1f2e"} roughness={0.3} metalness={0.4} />
                </mesh>
              ) : null}
            </group>
          );
        })}
      </group>
    </group>
  );
};

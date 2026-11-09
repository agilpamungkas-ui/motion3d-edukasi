/**
 * Dua batang perubahan (naik vs turun) di atas satu alas, untuk angka positif/negatif.
 * up / down: progres 0..1. Tinggi asli diatur lewat hUp / hDown (unit dunia).
 * Titik label: barTop(-1) = puncak batang naik, barTop(1) = dasar batang turun.
 */
import React from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { V3 } from "../lib";
import { mixHex, type Theme } from "../themes";

export const BAR_X = 0.44;
const base = new RoundedBoxGeometry(1.7, 0.06, 0.8, 4, 0.03);
const unit = new RoundedBoxGeometry(0.46, 1, 0.46, 4, 0.06);

export const ChangeBars: React.FC<{
  th: Theme;
  up: number;
  down: number;
  hUp: number;
  hDown: number;
  colorUp: string;
  colorDown: string;
  rot?: V3;
  position?: V3;
  opacity?: number;
}> = ({ th, up, down, hUp, hDown, colorUp, colorDown, rot = [0, 0, 0], position = [0, 0, 0], opacity = 1 }) => {
  const h1 = Math.max(0.001, hUp * up);
  const h2 = Math.max(0.001, hDown * down);
  return (
    <group position={position} rotation={rot}>
      <mesh geometry={base}>
        <meshStandardMaterial color={mixHex(th.bg.mid, th.ink, th.dark ? 0.3 : 0.16)} roughness={0.9} transparent opacity={opacity} />
      </mesh>
      <mesh geometry={unit} position={[-BAR_X, h1 / 2 + 0.035, 0]} scale={[1, h1, 1]}>
        <meshStandardMaterial color={colorUp} roughness={th.mat.roughness} emissive={colorUp} emissiveIntensity={0.12} transparent opacity={opacity} />
      </mesh>
      <mesh geometry={unit} position={[BAR_X, -h2 / 2 - 0.035, 0]} scale={[1, h2, 1]}>
        <meshStandardMaterial color={colorDown} roughness={th.mat.roughness} emissive={colorDown} emissiveIntensity={0.08} transparent opacity={opacity} />
      </mesh>
    </group>
  );
};

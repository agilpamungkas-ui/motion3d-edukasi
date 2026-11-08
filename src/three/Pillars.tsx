/**
 * Data 3D: pilar yang tumbuh (untuk angka/perbandingan). grow: 0..1
 */
import React from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clamp, easeOut, type V3 } from "../lib";
import { mixHex, type Theme } from "../themes";

export type Pillar = { nama: string; nilai: number; label: string; warna: string };

export const pillarHeight = (nilai: number, max: number) => 0.18 + 1.75 * (nilai / max);
export const pillarX = (i: number, n: number) => (i - (n - 1) / 2) * 0.78;

const base = new RoundedBoxGeometry(3.4, 0.12, 1.2, 4, 0.05);
const unit = new RoundedBoxGeometry(0.52, 1, 0.52, 4, 0.06);

export const Pillars: React.FC<{ th: Theme; data: Pillar[]; grow: number; rot?: V3 }> = ({ th, data, grow, rot = [0, 0, 0] }) => {
  const max = Math.max(...data.map((d) => d.nilai));
  return (
    <group rotation={rot}>
      <mesh geometry={base} position={[0, -0.06, 0]}>
        <meshStandardMaterial color={mixHex(th.bg.mid, th.ink, th.dark ? 0.25 : 0.12)} roughness={0.9} />
      </mesh>
      {data.map((d, i) => {
        const g = easeOut(clamp(grow * 1.4 - i * 0.12));
        const h = Math.max(0.001, pillarHeight(d.nilai, max) * g);
        return (
          <mesh key={d.nama} geometry={unit} position={[pillarX(i, data.length), h / 2, 0]} scale={[1, h, 1]}>
            <meshStandardMaterial color={d.warna} roughness={th.mat.roughness} metalness={th.mat.metalness} emissive={d.warna} emissiveIntensity={th.mat.emissiveFaces} />
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * Garis medan magnet dipol (r = L·sin²θ) yang "tergambar" perlahan, plus titik aliran.
 * draw: 0..1 (seberapa banyak garis sudah tergambar), t: detik (untuk titik aliran)
 */
import React, { useMemo } from "react";
import { CatmullRomCurve3, TubeGeometry, Vector3 } from "three";
import { clamp } from "../lib";
import type { Theme } from "../themes";

type Line = { geo: TubeGeometry; curve: CatmullRomCurve3; order: number };

let LINES: Line[] | null = null;
const makeLines = () => {
  if (LINES) return LINES;
  const out: Line[] = [];
  const Ls = [1.45, 1.85, 2.4];
  let order = 0;
  for (const L of Ls) {
    for (let k = 0; k < 8; k++) {
      const phi = (k * Math.PI) / 4 + L * 0.6;
      const th0 = Math.asin(Math.sqrt(1 / L));
      const pts: Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const th = th0 + ((Math.PI - 2 * th0) * i) / 64;
        const r = L * Math.sin(th) ** 2;
        pts.push(new Vector3(r * Math.sin(th) * Math.cos(phi), r * Math.cos(th), r * Math.sin(th) * Math.sin(phi)));
      }
      const curve = new CatmullRomCurve3(pts);
      out.push({ geo: new TubeGeometry(curve, 110, 0.009, 6, false), curve, order: order++ });
    }
  }
  LINES = out;
  return out;
};

export const FieldLines: React.FC<{ th: Theme; draw: number; t: number; tilt?: number; opacity?: number }> = ({ th, draw, t, tilt = 0.3, opacity = 1 }) => {
  const lines = useMemo(makeLines, []);
  if (draw <= 0.001) return null;
  return (
    <group rotation={[tilt, 0, 0.19]}>
      {lines.map((ln) => {
        const local = clamp(draw * 1.35 - (ln.order % 8) * 0.04);
        const n = ln.geo.index!.count;
        const c = Math.floor((n * local) / 3) * 3;
        ln.geo.setDrawRange(0, c);
        const dot = ln.curve.getPointAt((t * 0.11 + ln.order * 0.137) % 1);
        return (
          <group key={ln.order}>
            <mesh geometry={ln.geo}>
              <meshBasicMaterial color={th.accent} transparent opacity={0.7 * opacity} toneMapped={false} depthWrite={false} />
            </mesh>
            {local > 0.98 ? (
              <mesh position={[dot.x, dot.y, dot.z]}>
                <sphereGeometry args={[0.026, 10, 8]} />
                <meshBasicMaterial color={th.accent2} transparent opacity={opacity} toneMapped={false} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

/**
 * Gelombang gempa: denyut di episentrum + "sinar" gelombang yang melengkung menembus bumi.
 * cx, cy, R = pusat & jari-jari bumi di layar (hasil proyeksi).
 */
import React from "react";
import { easeInOut, prog } from "../lib";
import { hexA, type Theme } from "../themes";

export const Seismic: React.FC<{ th: Theme; t: number; quake: number; rays: number; out: number; cx: number; cy: number; R: number; epiDeg?: number }> = ({
  th,
  t,
  quake,
  rays,
  out,
  cx,
  cy,
  R,
  epiDeg = -62,
}) => {
  if (t < quake || t > out + 0.5) return null;
  const fade = 1 - prog(t, out, out + 0.5);
  const ea = (epiDeg * Math.PI) / 180;
  const ex = cx + R * Math.cos(ea);
  const ey = cy + R * Math.sin(ea);
  const exits = [-8, 22, 52, 82, 112, 142, 172];
  const c = th.accent2;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: fade, overflow: "visible" }}>
      {[0, 1, 2].map((k) => {
        const p = prog(t, quake + k * 0.35, quake + k * 0.35 + 1.6);
        if (p <= 0 || p >= 1) return null;
        return <circle key={k} cx={ex} cy={ey} r={14 + 120 * p} fill="none" stroke={c} strokeWidth={4} opacity={1 - p} />;
      })}
      {exits.map((deg, k) => {
        const a = (deg * Math.PI) / 180;
        const xx = cx + R * Math.cos(a);
        const yy = cy + R * Math.sin(a);
        const mx = (ex + xx) / 2;
        const my = (ey + yy) / 2;
        const ox = mx - cx;
        const oy = my - cy;
        const ol = Math.hypot(ox, oy) || 1;
        const bend = R * 0.22;
        const qx = mx + (ox / ol) * bend;
        const qy = my + (oy / ol) * bend;
        const len = Math.hypot(qx - ex, qy - ey) + Math.hypot(xx - qx, yy - qy);
        const p = prog(t, rays + k * 0.13, rays + k * 0.13 + 1.6, easeInOut);
        const tt = p;
        const dx = (1 - tt) * (1 - tt) * ex + 2 * (1 - tt) * tt * qx + tt * tt * xx;
        const dy = (1 - tt) * (1 - tt) * ey + 2 * (1 - tt) * tt * qy + tt * tt * yy;
        return (
          <g key={`r${k}`}>
            <path
              d={`M ${ex} ${ey} Q ${qx} ${qy} ${xx} ${yy}`}
              fill="none"
              stroke={k % 2 ? th.accent : c}
              strokeWidth={3.5}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - p)}
              opacity={0.9}
              style={{ filter: th.dark ? `drop-shadow(0 0 6px ${hexA(c, 0.7)})` : undefined }}
            />
            {p > 0 && p < 1 ? <circle cx={dx} cy={dy} r={8} fill="#ffffff" /> : null}
          </g>
        );
      })}
      <circle cx={ex} cy={ey} r={12} fill={c} stroke={th.dark ? "#000" : "#fff"} strokeWidth={3} />
    </svg>
  );
};

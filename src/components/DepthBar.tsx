/**
 * Penggaris kedalaman HORIZONTAL (0 km di kiri, pusat Bumi di kanan) dengan penanda yang bergeser.
 */
import React from "react";
import { easeIn, fmtID, prog } from "../lib";
import { hexA, type Theme } from "../themes";
import type { Seg } from "./Gauge";

export const DepthBar: React.FC<{
  th: Theme;
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  max: number;
  segs: Seg[];
  ticks: number[];
  marker: number;
  markerLabel: string;
  markerColor?: string;
  unit?: string;
}> = ({ th, t, at, out, x, y, w, max, segs, ticks, marker, markerLabel, markerColor, unit = "km" }) => {
  const p = prog(t, at, at + 1.0);
  const po = out !== undefined ? prog(t, out, out + 0.4, easeIn) : 0;
  if (p <= 0 || po >= 1) return null;
  const X = (v: number) => x + (v / max) * w;
  const mx = X(Math.max(0, Math.min(max, marker)));
  const c = markerColor ?? th.accent2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - po }}>
      {ticks.map((v, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: X(v),
            top: y - 36,
            transform: `translateX(${i === 0 ? 0 : i === ticks.length - 1 ? -100 : -50}%)`,
            fontFamily: th.font.mono,
            fontSize: 22,
            fontWeight: 500,
            color: th.muted,
            whiteSpace: "nowrap",
            opacity: prog(t, at + 0.3 + i * 0.1, at + 0.8 + i * 0.1),
          }}
        >
          {fmtID(v)}
          {i === ticks.length - 1 ? ` ${unit}` : ""}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: 16,
          borderRadius: 8,
          overflow: "hidden",
          background: hexA(th.ink, 0.1),
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 8px)`,
        }}
      >
        {segs.map((s, i) => (
          <div key={i} style={{ position: "absolute", top: 0, left: (s.from / max) * w, width: Math.max(3, ((s.to - s.from) / max) * w), height: 16, background: s.color }} />
        ))}
      </div>
      <svg width={30} height={20} style={{ position: "absolute", left: mx - 15, top: y + 20, opacity: p }}>
        <path d="M15 2 L28 18 L2 18 Z" fill={c} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: Math.min(x + w - 10, Math.max(x + 10, mx)),
          top: y + 42,
          transform: `translateX(${mx < x + 120 ? 0 : mx > x + w - 120 ? -100 : -50}%)`,
          padding: "6px 14px",
          borderRadius: 10,
          background: c,
          color: th.dark ? "#101010" : "#ffffff",
          fontFamily: th.font.mono,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          opacity: p,
        }}
      >
        {markerLabel}
      </div>
    </div>
  );
};

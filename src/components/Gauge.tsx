/**
 * Penggaris kedalaman vertikal (0 di atas). Segmen berwarna + penanda yang bergerak.
 */
import React from "react";
import { easeIn, fmtID, prog } from "../lib";
import { hexA, type Theme } from "../themes";

export type Seg = { from: number; to: number; color: string };

export const DepthGauge: React.FC<{
  th: Theme;
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  h: number;
  max: number;
  segs: Seg[];
  ticks: number[];
  marker: number;
  markerLabel?: string;
  unit?: string;
  tickSide?: "left" | "right";
}> = ({ th, t, at, out, x, y, h, max, segs, ticks, marker, markerLabel, unit = "km", tickSide = "right" }) => {
  const p = prog(t, at, at + 0.9);
  const po = out !== undefined ? prog(t, out, out + 0.4, easeIn) : 0;
  if (p <= 0 || po >= 1) return null;
  const Y = (v: number) => y + (v / max) * h;
  const barW = 18;
  const my = Y(Math.min(max, Math.max(0, marker)));
  const labX = tickSide === "right" ? x + barW + 16 : undefined;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - po }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: barW,
          height: h,
          borderRadius: 9,
          overflow: "hidden",
          background: hexA(th.ink, 0.1),
          clipPath: `inset(0 0 ${(1 - p) * 100}% 0 round 9px)`,
        }}
      >
        {segs.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: 0, top: (s.from / max) * h, width: barW, height: Math.max(2, ((s.to - s.from) / max) * h), background: s.color }} />
        ))}
      </div>
      {ticks.map((v, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: labX,
            top: Y(v) - 13,
            fontFamily: th.font.mono,
            fontSize: 22,
            fontWeight: 500,
            color: th.muted,
            opacity: prog(t, at + 0.3 + i * 0.08, at + 0.7 + i * 0.08),
            whiteSpace: "nowrap",
          }}
        >
          {fmtID(v)} {i === ticks.length - 1 ? unit : ""}
        </div>
      ))}
      <div style={{ position: "absolute", left: x - 30, top: my - 12, opacity: p, display: "flex", alignItems: "center" }}>
        <svg width={24} height={24}>
          <path d="M2 2 L22 12 L2 22 Z" fill={th.accent2} />
        </svg>
      </div>
      {markerLabel ? (
        <div
          style={{
            position: "absolute",
            right: 1080 - (x - 38),
            top: my - 22,
            padding: "8px 14px",
            borderRadius: 10,
            background: th.accent2,
            color: th.dark ? "#101010" : "#ffffff",
            fontFamily: th.font.mono,
            fontWeight: 700,
            fontSize: 24,
            whiteSpace: "nowrap",
            opacity: p,
          }}
        >
          {markerLabel}
        </div>
      ) : null}
    </div>
  );
};

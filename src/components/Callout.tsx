/**
 * Label penunjuk: titik di objek 3D (ax, ay) -> garis siku -> kotak label (lx, ly).
 * Titik jangkar dihitung dari proyeksi 3D sehingga label "menempel" walau objek berputar.
 */
import React from "react";
import { easeIn, easeInOut, pop, prog } from "../lib";
import { hexA, type Theme } from "../themes";

export const Callout: React.FC<{
  th: Theme;
  t: number;
  at: number;
  out?: number;
  ax: number;
  ay: number;
  lx: number;
  ly: number;
  title: string;
  sub?: React.ReactNode;
  color?: string;
  side?: "right" | "left";
  subSize?: number;
}> = ({ th, t, at, out, ax, ay, lx, ly, title, sub, color, side = "right", subSize = 54 }) => {
  if (t < at) return null;
  const po = out !== undefined ? prog(t, out, out + 0.4, easeIn) : 0;
  if (po >= 1) return null;
  const c = color ?? th.accent;
  const pDot = pop(t, at, 0.5);
  const pLine = prog(t, at + 0.1, at + 0.7, easeInOut);
  const pLab = prog(t, at + 0.45, at + 1.0);
  const dir = side === "right" ? 1 : -1;
  const ex = lx - dir * 36;
  const len = Math.hypot(ex - ax, ly - ay) + Math.abs(lx - ex);
  const ring = prog(t, at, at + 1.1);
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - po }}>
        <path
          d={`M ${ax} ${ay} L ${ex} ${ly} L ${lx} ${ly}`}
          fill="none"
          stroke={c}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - pLine)}
          style={{ filter: th.dark ? `drop-shadow(0 0 6px ${hexA(c, 0.6)})` : undefined }}
        />
        <circle cx={ax} cy={ay} r={11 * pDot} fill={c} stroke={th.dark ? "#000" : "#fff"} strokeWidth={3} />
        <circle cx={ax} cy={ay} r={12 + 30 * ring} fill="none" stroke={c} strokeWidth={3} opacity={0.6 * (1 - ring)} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: side === "right" ? lx + 18 : undefined,
          right: side === "left" ? 1080 - lx + 18 : undefined,
          top: ly - 44,
          textAlign: side === "right" ? "left" : "right",
          opacity: pLab * (1 - po),
          transform: `translateX(${(1 - pLab) * 20 * dir}px)`,
        }}
      >
        <div style={{ fontFamily: th.font.mono, fontWeight: 700, fontSize: 26, letterSpacing: "0.2em", textTransform: "uppercase", color: c, lineHeight: 1 }}>{title}</div>
        {sub ? (
          <div
            style={{
              marginTop: 12,
              fontFamily: th.font.display,
              fontWeight: th.font.displayWeight,
              fontSize: subSize,
              letterSpacing: th.font.tracking,
              color: th.ink,
              lineHeight: 1,
              whiteSpace: "nowrap",
              textShadow: th.dark ? "0 2px 16px rgba(0,0,0,0.65)" : "0 2px 12px rgba(255,255,255,0.7)",
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </>
  );
};

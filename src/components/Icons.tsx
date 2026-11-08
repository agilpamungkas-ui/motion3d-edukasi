/**
 * Ikon & grafik kecil buatan sendiri (SVG): apel (analogi kulit), panah konveksi,
 * kartu seismograf, lencana langkah, mata bor.
 */
import React from "react";
import { easeIn, pop, prog, rand } from "../lib";
import { hexA, type Theme } from "../themes";

export const AppleIcon: React.FC<{ th: Theme; t: number; at: number; out?: number; x: number; y: number; size?: number; skin: string; label: string }> = ({
  th,
  t,
  at,
  out,
  x,
  y,
  size = 220,
  skin,
  label,
}) => {
  const s = pop(t, at, 0.6);
  const po = out !== undefined ? prog(t, out, out + 0.35, easeIn) : 0;
  if (s <= 0 || po >= 1) return null;
  const draw = prog(t, at + 0.2, at + 1.2);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, transform: `scale(${s})`, transformOrigin: "50% 60%", opacity: 1 - po, textAlign: "center" }}>
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <path d="M100 58 C 72 34, 22 46, 26 104 C 30 158, 72 186, 100 172 C 128 186, 170 158, 174 104 C 178 46, 128 34, 100 58 Z" fill="#FFF3E0" />
        <path
          d="M100 58 C 72 34, 22 46, 26 104 C 30 158, 72 186, 100 172 C 128 186, 170 158, 174 104 C 178 46, 128 34, 100 58 Z"
          fill="none"
          stroke={skin}
          strokeWidth={7}
          strokeDasharray={520}
          strokeDashoffset={520 * (1 - draw)}
          strokeLinecap="round"
        />
        <path d="M100 58 C 100 44, 104 32, 112 22" stroke="#7A5A3A" strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M110 34 C 124 18, 146 18, 154 26 C 142 40, 122 44, 110 34 Z" fill={th.accent} opacity={0.9} />
      </svg>
      <div
        style={{
          display: "inline-block",
          marginTop: -4,
          padding: "8px 14px",
          borderRadius: 999,
          background: th.dark ? hexA("#000000", 0.6) : hexA("#ffffff", 0.85),
          border: `2px solid ${skin}`,
          fontFamily: th.font.mono,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: th.ink,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** dua panah melingkar (arus konveksi pelan) */
export const Convection: React.FC<{ th: Theme; t: number; at: number; out?: number; x: number; y: number; r?: number; color: string }> = ({ th, t, at, out, x, y, r = 70, color }) => {
  const p = prog(t, at, at + 0.8);
  const po = out !== undefined ? prog(t, out, out + 0.4, easeIn) : 0;
  if (p <= 0 || po >= 1) return null;
  const rot = (t - at) * 24;
  const arc = (cx: number, cy: number, cw: boolean, k: number) => {
    const a0 = cw ? -150 : 30;
    const a1 = cw ? 120 : 300;
    const pt = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = pt(a0);
    const [x1, y1] = pt(a1);
    return (
      <g key={k} transform={`rotate(${cw ? rot : -rot} ${cx} ${cy})`}>
        <path d={`M ${x0} ${y0} A ${r} ${r} 0 1 1 ${x1} ${y1}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={600} strokeDashoffset={600 * (1 - p)} />
        <circle cx={x1} cy={y1} r={9} fill={color} />
      </g>
    );
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: (1 - po) * 0.95, filter: th.dark ? `drop-shadow(0 0 8px ${hexA(color, 0.6)})` : undefined }}>
      {arc(x - r * 1.05, y, true, 0)}
      {arc(x + r * 1.05, y, false, 1)}
    </svg>
  );
};

/** kartu seismograf kecil: garis bergetar yang membesar setelah gempa */
export const SeismoCard: React.FC<{ th: Theme; t: number; at: number; quake: number; out?: number; x: number; y: number; w?: number; h?: number }> = ({
  th,
  t,
  at,
  quake,
  out,
  x,
  y,
  w = 380,
  h = 130,
}) => {
  const p = prog(t, at, at + 0.5);
  const po = out !== undefined ? prog(t, out, out + 0.35, easeIn) : 0;
  if (p <= 0 || po >= 1) return null;
  const n = 120;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const xx = 18 + ((w - 36) * i) / (n - 1);
    const age = t - quake - (n - 1 - i) * 0.03;
    const env = age < 0 ? 0.06 : Math.exp(-age * 0.55) * (1 - Math.exp(-age * 9));
    const v = (Math.sin(i * 1.7 + t * 22) * 0.6 + (rand(i + Math.floor(t * 30)) - 0.5) * 0.9) * env;
    pts.push(`${xx},${h / 2 + 18 + v * (h * 0.38)}`);
  }
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h + 36,
        borderRadius: 18,
        background: th.dark ? hexA("#000000", 0.4) : hexA("#ffffff", 0.7),
        border: `2px solid ${hexA(th.ink, 0.14)}`,
        opacity: p * (1 - po),
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 18, top: 12, fontFamily: th.font.mono, fontSize: 20, fontWeight: 700, letterSpacing: "0.2em", color: th.muted }}>SEISMOGRAF</div>
      <svg width={w} height={h + 36} style={{ position: "absolute", left: 0, top: 0 }}>
        <polyline points={pts.join(" ")} fill="none" stroke={th.accent} strokeWidth={3} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const StepBadge: React.FC<{ th: Theme; t: number; at: number; out?: number; x: number; y: number; n: string; total?: string }> = ({ th, t, at, out, x, y, n, total }) => {
  const s = at <= 0 ? 1 : pop(t, at, 0.55);
  const po = out !== undefined ? prog(t, out, out + 0.3, easeIn) : 0;
  if (s <= 0 || po >= 1) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "baseline", gap: 10, transform: `scale(${s})`, transformOrigin: "0% 50%", opacity: 1 - po }}>
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: 26,
          background: th.accent,
          color: th.dark ? "#0A0A0A" : "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: th.font.display,
          fontWeight: th.font.displayWeight,
          fontSize: 48,
        }}
      >
        {n}
      </div>
      {total ? <div style={{ fontFamily: th.font.mono, fontSize: 26, color: th.muted, letterSpacing: "0.15em" }}>/ {total}</div> : null}
    </div>
  );
};

/** bor turun dari atas menuju titik (px, py) */
export const Drill: React.FC<{ th: Theme; t: number; at: number; out?: number; px: number; py: number; len?: number; depth?: number }> = ({ th, t, at, out, px, py, len = 230, depth = 0 }) => {
  const p = prog(t, at, at + 1.3);
  const po = out !== undefined ? prog(t, out, out + 0.4, easeIn) : 0;
  if (p <= 0 || po >= 1) return null;
  const headY = py - len + len * p + depth;
  const ring = prog(t, at + 1.3, at + 2.2);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - po }}>
      <line x1={px} y1={py - len - 30} x2={px} y2={headY} stroke={th.accent2} strokeWidth={5} strokeLinecap="round" />
      <rect x={px - 26} y={py - len - 50} width={52} height={22} rx={6} fill={th.accent2} />
      <path d={`M ${px - 12} ${headY - 6} L ${px + 12} ${headY - 6} L ${px} ${headY + 16} Z`} fill={th.accent2} />
      {ring > 0 && ring < 1 ? <ellipse cx={px} cy={py} rx={20 + 70 * ring} ry={(20 + 70 * ring) * 0.35} fill="none" stroke={th.accent2} strokeWidth={3} opacity={1 - ring} /> : null}
    </svg>
  );
};

/**
 * Tipografi: Kicker (label kecil), Headline (kata muncul dari balik masker, *aksen* satu frasa),
 * Body, Captions (subtitle karaoke), Chip, Ticker (angka berjalan).
 * Tulis aksen dengan bintang: "Seberapa *dalam* kamu bisa menggali?"
 */
import React from "react";
import { easeIn, easeOut, fmtID, pop, prog } from "../lib";
import { hexA, type Theme } from "../themes";

type Word = { txt: string; acc: boolean };

const parse = (s: string): Word[] => {
  const out: Word[] = [];
  for (const part of s.split(/(\*[^*]+\*)/g)) {
    if (!part) continue;
    const acc = part.startsWith("*") && part.endsWith("*");
    const raw = acc ? part.slice(1, -1) : part;
    for (const w of raw.split(" ")) if (w) out.push({ txt: w, acc });
  }
  return out;
};

export const Kicker: React.FC<{ th: Theme; t: number; text: string; at: number; out?: number; x?: number; y: number; color?: string; dot?: string }> = ({
  th,
  t,
  text,
  at,
  out,
  x = 70,
  y,
  color,
  dot,
}) => {
  const p = at <= 0 ? 1 : prog(t, at, at + 0.5);
  const po = out !== undefined ? prog(t, out, out + 0.35, easeIn) : 0;
  if (p <= 0 || po >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: th.font.mono,
        fontWeight: 500,
        fontSize: 26,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: color ?? th.muted,
        opacity: p * (1 - po),
        transform: `translateX(${(1 - p) * -18}px)`,
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 6, background: dot ?? th.accent, boxShadow: th.dark ? `0 0 16px ${dot ?? th.accent}` : "none" }} />
      {text}
    </div>
  );
};

export const Headline: React.FC<{
  th: Theme;
  t: number;
  text: string;
  at: number;
  out?: number;
  x?: number;
  y: number;
  w?: number;
  size?: number;
  align?: "left" | "center";
  accent?: string;
  color?: string;
}> = ({ th, t, text, at, out, x = 70, y, w = 940, size = 104, align = "left", accent, color }) => {
  const words = parse(text);
  if (out !== undefined && t > out + 0.6 + words.length * 0.03) return null;
  if (at > 0 && t < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: align,
        fontFamily: th.font.display,
        fontWeight: th.font.displayWeight,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: th.font.tracking,
        color: color ?? th.ink,
      }}
    >
      {words.map((wd, i) => {
        const st = at + i * 0.09;
        const p = at <= 0 ? 1 : prog(t, st, st + 0.8, easeOut);
        const po = out !== undefined ? prog(t, out + i * 0.03, out + 0.4 + i * 0.03, easeIn) : 0;
        return (
          <React.Fragment key={i}>
            {i > 0 ? " " : null}
            <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.1em", marginBottom: "-0.1em" }}>
              <span
                style={{
                  display: "inline-block",
                  transformOrigin: "0% 100%",
                  transform: `translateY(${(1 - p) * 110 - po * 110}%) rotate(${(1 - p) * 5}deg)`,
                  color: wd.acc ? accent ?? th.accent : undefined,
                  fontStyle: wd.acc && th.font.accentItalic ? "italic" : undefined,
                }}
              >
                {wd.txt}
              </span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Body: React.FC<{ th: Theme; t: number; text: string; at: number; out?: number; x?: number; y: number; w?: number; size?: number; align?: "left" | "center"; color?: string }> = ({
  th,
  t,
  text,
  at,
  out,
  x = 70,
  y,
  w = 940,
  size = 42,
  align = "left",
  color,
}) => {
  const p = at <= 0 ? 1 : prog(t, at, at + 0.6);
  const po = out !== undefined ? prog(t, out, out + 0.35, easeIn) : 0;
  if (p <= 0 || po >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: align,
        fontFamily: th.font.body,
        fontWeight: th.font.bodyWeight,
        fontSize: size,
        lineHeight: 1.25,
        color: color ?? th.muted,
        opacity: p * (1 - po),
        transform: `translateY(${(1 - p) * 18}px)`,
      }}
    >
      {text}
    </div>
  );
};

export type Cap = [string, number, number];

/** subtitle karaoke: kata yang sedang diucapkan diberi warna sorotan. Timing kata = perkiraan proporsional panjang kata. */
export const Captions: React.FC<{ th: Theme; t: number; chunks: Cap[]; y?: number; size?: number }> = ({ th, t, chunks, y = 1480, size = 52 }) => {
  const c = chunks.find(([, a, b]) => t >= a - 0.08 && t <= b + 0.22);
  if (!c) return null;
  const [txt, a, b] = c;
  const words = txt.split(" ");
  const lens = words.map((w) => Math.max(2, w.replace(/[^\p{L}\p{N}]/gu, "").length + 1));
  const total = lens.reduce((s, v) => s + v, 0);
  const cur = ((t - a) / Math.max(0.2, b - a)) * total;
  const pIn = prog(t, a - 0.08, a + 0.12);
  const pOut = prog(t, b + 0.02, b + 0.22, easeIn);
  let acc = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: y,
        textAlign: "center",
        fontFamily: th.font.body,
        fontWeight: th.font.capWeight,
        fontSize: size,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
        opacity: pIn * (1 - pOut),
        transform: `translateY(${(1 - pIn) * 12}px)`,
        textShadow: th.dark ? "0 3px 18px rgba(0,0,0,0.6)" : "0 2px 10px rgba(255,255,255,0.6)",
      }}
    >
      {words.map((w, i) => {
        const s = acc;
        acc += lens[i];
        const active = cur >= s && cur < acc;
        const done = cur >= acc;
        return (
          <span key={i} style={{ color: active ? th.capHi : done ? th.ink : hexA(th.ink, 0.5) }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};

export const Chip: React.FC<{ th: Theme; t: number; at: number; out?: number; x: number; y: number; text: string; color?: string; size?: number; solid?: boolean }> = ({
  th,
  t,
  at,
  out,
  x,
  y,
  text,
  color,
  size = 34,
  solid,
}) => {
  const s = at <= 0 ? 1 : pop(t, at, 0.6);
  const po = out !== undefined ? prog(t, out, out + 0.3, easeIn) : 0;
  if (s <= 0 || po >= 1) return null;
  const c = color ?? th.accent;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${s * (1 - po * 0.2)})`,
        transformOrigin: "0% 50%",
        opacity: Math.min(1, s * 1.5) * (1 - po),
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 26px",
        borderRadius: 999,
        background: solid ? c : th.dark ? hexA("#000000", 0.45) : hexA("#FFFFFF", 0.75),
        border: `2.5px solid ${c}`,
        color: solid ? (th.dark ? "#0B0B0B" : "#FFFFFF") : th.ink,
        fontFamily: th.font.body,
        fontWeight: th.font.bodyWeight,
        fontSize: size,
        whiteSpace: "nowrap",
        boxShadow: th.dark ? `0 0 28px ${hexA(c, 0.25)}` : "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      {!solid ? <span style={{ width: 14, height: 14, borderRadius: 7, background: c }} /> : null}
      {text}
    </div>
  );
};

/** angka berjalan dari `from` ke `to` */
export const tick = (t: number, at: number, dur: number, from: number, to: number, digits = 0) => fmtID(from + (to - from) * prog(t, at, at + dur, easeOut), digits);

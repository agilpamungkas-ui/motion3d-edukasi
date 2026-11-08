/**
 * Latar: gradasi + pola (grid/titik/isometrik/kertas) yang bergeser pelan, kotak berkedip,
 * debu melayang, vignette, dan grain film. "Tidak ada yang benar-benar diam."
 */
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { rand } from "../lib";
import { hexA, type Theme } from "../themes";

export const Background: React.FC<{ th: Theme; t: number; w?: number; h?: number }> = ({ th, t, w = 1080, h = 1920 }) => {
  const { bg } = th;
  const drift = t * 6;
  const line = hexA(bg.line, bg.lineOpacity);
  let pattern: React.CSSProperties | null = null;
  if (bg.kind === "grid") {
    pattern = {
      backgroundImage: `linear-gradient(${line} 1.5px, transparent 1.5px), linear-gradient(90deg, ${line} 1.5px, transparent 1.5px)`,
      backgroundSize: `${bg.cell}px ${bg.cell}px`,
      backgroundPosition: `0px ${drift}px`,
    };
  } else if (bg.kind === "dots") {
    pattern = {
      backgroundImage: `radial-gradient(circle, ${line} 2.2px, transparent 2.8px)`,
      backgroundSize: `${bg.cell}px ${bg.cell}px`,
      backgroundPosition: `${drift * 0.5}px ${drift}px`,
    };
  } else if (bg.kind === "iso") {
    pattern = {
      backgroundImage: `repeating-linear-gradient(30deg, ${line} 0 1.5px, transparent 1.5px ${bg.cell}px), repeating-linear-gradient(150deg, ${line} 0 1.5px, transparent 1.5px ${bg.cell}px)`,
      backgroundPosition: `0px ${drift}px`,
    };
  }

  const cells = bg.twinkle
    ? new Array(14).fill(0).map((_, i) => {
        const cx = Math.floor(rand(i * 3.1) * (w / bg.cell)) * bg.cell;
        const cy = Math.floor(rand(i * 7.7) * (h / bg.cell)) * bg.cell + (drift % bg.cell);
        const a = Math.max(0, Math.sin(t * (0.6 + rand(i) * 0.9) + i * 2.1)) * 0.07;
        return <div key={i} style={{ position: "absolute", left: cx, top: cy, width: bg.cell, height: bg.cell, background: hexA(bg.line, a) }} />;
      })
    : null;

  const dust = bg.dust
    ? new Array(26).fill(0).map((_, i) => {
        const x = rand(i * 1.7) * w + Math.sin(t * 0.3 + i) * 14;
        const y = (((rand(i * 9.3) * h - t * (8 + rand(i * 2.2) * 14)) % h) + h) % h;
        const s = 2 + rand(i * 4.4) * 3;
        const a = 0.18 + rand(i * 5.5) * 0.3;
        return <div key={`d${i}`} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: s, background: hexA(th.ink, a) }} />;
      })
    : null;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${bg.top} 0%, ${bg.mid} 50%, ${bg.bottom} 100%)`, overflow: "hidden" }}>
      {pattern ? <AbsoluteFill style={pattern} /> : null}
      {bg.kind === "paper" ? (
        <AbsoluteFill style={{ backgroundImage: `url(${staticFile("textures/paper.png")})`, backgroundSize: "512px 512px", opacity: 0.55, mixBlendMode: "multiply" }} />
      ) : null}
      {cells}
      {dust}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 46%, transparent 52%, ${th.dark ? `rgba(0,0,0,${th.vignette})` : `rgba(60,40,20,${th.vignette})`} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** grain film di atas segalanya (diacak tiap 2 frame) */
export const Grain: React.FC<{ th: Theme; t: number }> = ({ th, t }) => {
  const seed = Math.floor(t * 15);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("textures/grain.png")})`,
        backgroundSize: "256px 256px",
        backgroundPosition: `${Math.floor(rand(seed) * 256)}px ${Math.floor(rand(seed + 0.5) * 256)}px`,
        opacity: th.grain,
        mixBlendMode: th.dark ? "screen" : "multiply",
        pointerEvents: "none",
      }}
    />
  );
};

/** gradasi penutup atas & bawah agar teks tetap terbaca saat objek 3D lewat di bawahnya */
export const Scrim: React.FC<{ th: Theme; top?: number; bottom?: number; strength?: number }> = ({ th, top = 560, bottom = 520, strength = 0.85 }) => (
  <>
    <AbsoluteFill style={{ height: top, background: `linear-gradient(180deg, ${hexA(th.bg.top, strength)} 0%, ${hexA(th.bg.top, strength * 0.75)} 45%, ${hexA(th.bg.top, 0)} 100%)` }} />
    <AbsoluteFill style={{ top: 1920 - bottom, height: bottom, background: `linear-gradient(0deg, ${hexA(th.bg.bottom, strength * 0.8)} 0%, ${hexA(th.bg.bottom, strength * 0.5)} 40%, ${hexA(th.bg.bottom, 0)} 100%)` }} />
  </>
);

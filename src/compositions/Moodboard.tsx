/**
 * Moodboard: 6 gaya visual + 3 teknik 3D, semua dirender dari kode repo ini.
 * Render: npm run moodboard  ->  out/moodboard.png
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { THEMES } from "../themes";
import { StyleFrameView, type FrameSpec } from "./StyleFrame";

const S = 0.45;
const TW = 1080 * S;
const TH = 1920 * S;
const CAP = 176;
const GAP = 36;
const M = 48;
const HEAD = 250;
export const MOOD_W = M * 2 + TW * 3 + GAP * 2;
export const MOOD_H = HEAD + (TH + CAP) * 3 + GAP * 2 + 70;

type Tile = { spec: FrameSpec; label: string; note?: string };

const TILES: Tile[] = [
  { label: "Neon Grid", spec: { tema: "neon", jenis: "cutaway", kicker: "Sains · 60 detik", judul: "Apa isi *Bumi?*", cap: "Lapisan mana yang paling bikin kamu penasaran?", layer: 2, calloutTitle: "Inti luar", calloutSub: "besi cair" } },
  { label: "Clay Pastel", spec: { tema: "clay", jenis: "cutaway", kicker: "Pengetahuan", judul: "Setipis *kulit apel*", cap: "Kalau Bumi sebesar apel, kerak setipis kulitnya", layer: 0, calloutTitle: "Kerak", calloutSub: "5–70 km" } },
  { label: "Glass Lab", spec: { tema: "glass", jenis: "xray", kicker: "Sains modern", judul: "Lihat *tembus* ke dalam", cap: "Gelombang gempa membantu memetakan isi Bumi", layer: 3, calloutTitle: "Inti dalam", calloutSub: "5.000+ °C" } },
  { label: "Paper Craft", spec: { tema: "paper", jenis: "cutaway", kicker: "Bab 2 · Geologi", judul: "Kisah di bawah *kaki kita*", cap: "Mantel bergerak sangat pelan menggeser lempeng", layer: 1, calloutTitle: "Mantel", calloutSub: "± 2.900 km" } },
  { label: "Cinematic Dark", spec: { tema: "cinema", jenis: "cutaway", kicker: "Berkas 04 · Inti bumi", judul: "Yang *tak terlihat*", cap: "Sepanas permukaan Matahari, tapi tetap padat", layer: 3, calloutTitle: "Inti dalam", calloutSub: "padat" } },
  { label: "Isometric Bright", spec: { tema: "iso", jenis: "cutaway", kicker: "Cara kerja", judul: "4 lapisan *Bumi*", cap: "Kita bongkar satu per satu dari luar ke dalam", layer: 0, calloutTitle: "Kerak", calloutSub: "5–70 km", step: "01" } },
  { label: "Teknik · Exploded view", note: "untuk tutorial: bongkar perangkat/benda", spec: { tema: "iso", jenis: "exploded", kicker: "Tutorial · 5 bagian", judul: "Bongkar isi *HP-mu*", cap: "Kita lihat satu per satu, dari depan ke belakang" } },
  { label: "Teknik · Medan & partikel", note: "garis gaya, aliran, orbit", spec: { tema: "neon", jenis: "field", kicker: "Fisika bumi", judul: "Perisai *magnet* Bumi", cap: "Putaran logam cair menciptakan medan magnet", chip: "melindungi dari angin Matahari" } },
  { label: "Teknik · Data 3D", note: "angka & perbandingan jadi pilar", spec: { tema: "clay", jenis: "data", kicker: "Data · ketebalan lapisan", judul: "Seberapa *tebal?*", cap: "Mantel adalah lapisan paling tebal" } },
];

const INK = "#16140F";
const MUTED = "#6E675C";

export const Moodboard: React.FC = () => (
  <AbsoluteFill style={{ background: "#EDEAE3" }}>
    <div style={{ position: "absolute", left: M, top: 56, fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 64, letterSpacing: "-0.02em", color: INK }}>
      Moodboard · Motion 3D Edukasi
    </div>
    <div style={{ position: "absolute", left: M, top: 142, width: MOOD_W - M * 2, fontFamily: "Plus Jakarta Sans", fontWeight: 500, fontSize: 28, lineHeight: 1.35, color: MUTED }}>
      6 gaya visual + 3 teknik 3D untuk konten tutorial & pengetahuan · format 9:16 · semua frame dirender langsung dari repo motion3d-edukasi (Remotion + React Three Fiber)
    </div>
    {TILES.map((tile, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = M + col * (TW + GAP);
      const y = HEAD + row * (TH + CAP + GAP);
      const th = THEMES[tile.spec.tema];
      const swatches = [th.bg.mid, th.accent, th.accent2, th.accent3, th.ink];
      return (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: x, top: y, width: TW, height: TH, borderRadius: 22, overflow: "hidden", boxShadow: "0 18px 40px rgba(20,16,10,0.18)" }}>
            <div style={{ width: 1080, height: 1920, transform: `scale(${S})`, transformOrigin: "0 0", position: "relative" }}>
              <StyleFrameView spec={tile.spec} />
            </div>
          </div>
          <div style={{ position: "absolute", left: x, top: y + TH + 18, width: TW }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 22, color: MUTED }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 33, color: INK, letterSpacing: "-0.01em" }}>{tile.label}</span>
            </div>
            <div style={{ marginTop: 6, fontFamily: "Plus Jakarta Sans", fontWeight: 500, fontSize: 21, lineHeight: 1.3, color: MUTED, height: 56 }}>
              {tile.note ? `${tile.note} · gaya ${th.nama}` : `Cocok: ${th.cocok}`}
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              {swatches.map((c, k) => (
                <span key={k} style={{ width: 30, height: 30, borderRadius: 15, background: c, border: "2px solid rgba(0,0,0,0.12)" }} />
              ))}
              <span style={{ marginLeft: 10, fontFamily: "JetBrains Mono", fontWeight: 500, fontSize: 18, color: MUTED }}>
                {th.font.display}
                {th.font.display !== th.font.body ? ` + ${th.font.body}` : ""}
              </span>
            </div>
          </div>
        </React.Fragment>
      );
    })}
    <div style={{ position: "absolute", left: M, bottom: 30, fontFamily: "JetBrains Mono", fontSize: 20, color: MUTED }}>
      Ilustrasi: tebal kerak dibesarkan agar terlihat · benua pada bola bumi adalah pola fiktif, bukan peta asli
    </div>
  </AbsoluteFill>
);

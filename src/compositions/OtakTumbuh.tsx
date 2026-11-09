/**
 * "Olahraga bikin otak tumbuh, beneran?" (9:16, ±80 dtk).
 * Waktu dari timeline-otak.json (dipasang ke jeda audio). Semua gerak = fungsi murni dari t.
 * Gaya terkunci: tema clay, otak x-ray dengan hipokampus menyala (sorotan = hi(th)).
 */
import { Audio } from "@remotion/media";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, Sequence, staticFile, useVideoConfig } from "remotion";
import { z } from "zod";
import TLjson from "../../timeline-otak.json";
import { Background, Grain, Scrim } from "../components/Background";
import { Callout } from "../components/Callout";
import { Captions, Chip, Headline, Kicker, tick, type Cap } from "../components/Text";
import {
  camTrack,
  clamp,
  easeIn,
  easeInOut,
  easeOut,
  lerp,
  lerpV,
  makeCamera,
  objMatrix,
  overshoot,
  pop,
  prog,
  project,
  rand,
  TimeScale,
  toWorld,
  useT,
  win,
  type Cam,
  type V3,
} from "../lib";
import { hexA, hi, TEMA_IDS, THEMES, type Theme } from "../themes";
import { Brain, HIP_CENTER } from "../three/Brain";
import { BAR_X, ChangeBars } from "../three/ChangeBars";
import { Stage } from "../three/Stage";

type Scene = { start: number; end: number; cap: Cap[] } & Record<string, number | Cap[]>;
type SK = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7";
const TL = TLjson as unknown as Record<SK, Scene> & { meta: { judul: string; durasi: number; audio: string }; sfx: [number, string, number][] };
const n = (s: Scene, k: string) => s[k] as number;
const CAPS: Cap[] = (["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const).flatMap((k) => TL[k].cap);

export const otakSchema = z.object({
  tema: z.enum(TEMA_IDS),
  subtitle: z.boolean(),
  sfx: z.boolean(),
  pakaiNarasi: z.boolean(),
  skalaKeAudio: z.boolean(),
  handle: z.string(),
  adaNarasi: z.boolean(),
  skala: z.number(),
});
type Props = z.infer<typeof otakSchema>;

export const otakDefaults: Props = {
  tema: "clay",
  subtitle: true,
  sfx: true,
  pakaiNarasi: true,
  skalaKeAudio: false,
  handle: "@agilpamungks",
  adaNarasi: false,
  skala: 1,
};

export const OTAK_DURASI = TL.meta.durasi;

export const hitungMetadataOtak: CalculateMetadataFunction<Props> = async ({ props }) => {
  const fps = 30;
  let dur = TL.meta.durasi;
  let adaNarasi = false;
  let skala = 1;
  if (props.pakaiNarasi) {
    try {
      const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(staticFile(TL.meta.audio)) });
      const d = await input.computeDuration();
      if (d > 1) {
        adaNarasi = true;
        if (props.skalaKeAudio) {
          skala = (d + 0.5) / TL.meta.durasi;
          dur = d + 0.5;
        } else dur = Math.max(dur, d + 0.5);
      }
    } catch {
      // belum ada audio
    }
  }
  return { durationInFrames: Math.ceil(dur * fps), props: { ...props, adaNarasi, skala } };
};

// ---------------- koreografi ----------------
const W = 1080;
const H = 1920;

const C: Record<string, Cam> = {
  hook: { pos: [0, 0.4, 6.9], target: [0, -0.12, 0], fov: 32 },
  center: { pos: [0, 0.35, 7.0], target: [0, -0.1, 0], fov: 32 },
  close: { pos: [0.1, 0.1, 5.0], target: [0, -0.22, 0], fov: 32 },
  upper: { pos: [0, 0.3, 7.5], target: [0, -0.2, 0], fov: 32 },
};
const KEYS = [
  { at: 0, dur: 0, cam: C.hook },
  { at: 0.3, dur: 7.0, cam: C.center },
  { at: 7.7, dur: 2.0, cam: C.close },
  { at: TL.s3.start - 0.1, dur: 1.4, cam: C.upper },
  { at: TL.s5.start, dur: 1.6, cam: C.close },
  { at: TL.s6.start - 0.1, dur: 1.4, cam: C.upper },
  { at: TL.s7.start - 0.1, dur: 1.6, cam: C.center },
];

/** posisi & skala otak: tengah (besar) atau atas (kecil, memberi ruang untuk data) */
type Place = { pos: V3; s: number };
const P_MID: Place = { pos: [0, 0, 0], s: 1 };
const P_UP: Place = { pos: [0, 0.72, 0], s: 0.6 };
const placeAt = (t: number): Place => {
  const keys: [number, number, Place][] = [
    [TL.s3.start - 0.1, 1.4, P_UP],
    [TL.s5.start, 1.6, P_MID],
    [TL.s6.start - 0.1, 1.4, P_UP],
    [TL.s7.start - 0.1, 1.6, P_MID],
  ];
  let cur = P_MID;
  for (const [at, dur, p] of keys) {
    const k = prog(t, at, at + dur, easeInOut);
    cur = { pos: lerpV(cur.pos, p.pos, k), s: lerp(cur.s, p.s, k) };
  }
  return cur;
};

const rotAt = (t: number): V3 => [0.12, -1.25 + 0.32 * Math.sin(t * 0.32) - 0.5 * (1 - prog(t, 0, 6, easeOut)), 0];

// ---------------- komponen ----------------
export const OtakTumbuh: React.FC<Props> = (p) => (
  <TimeScale.Provider value={p.skala || 1}>
    <Inner {...p} />
  </TimeScale.Provider>
);

const Inner: React.FC<Props> = (p) => {
  const th = THEMES[p.tema];
  const t = useT();
  const { fps } = useVideoConfig();
  const sc = p.skala || 1;
  const s2 = TL.s2;
  const s3 = TL.s3;
  const s4 = TL.s4;
  const s5 = TL.s5;
  const s6 = TL.s6;
  const s7 = TL.s7;

  // ----- keadaan 3D -----
  const cam = camTrack(t, KEYS);
  const pl = placeAt(t);
  const rot = rotAt(t);
  const xray = 0.92 * win(t, n(s2, "xray"), s6.start + 0.6, 1.4, 1.0);
  const xrayEnd = 0.6 * prog(t, n(s7, "kaki") - 0.4, n(s7, "kaki") + 0.8, easeInOut);
  const xr = Math.max(xray, xrayEnd);

  // ukuran hipokampus: menyusut (usia), tumbuh (hero), tumbuh lagi (BDNF)
  let grow = 1;
  grow -= 0.16 * prog(t, n(s2, "shrink"), n(s2, "shrink") + 6, easeInOut);
  grow += 0.16 * prog(t, s3.start, s3.start + 1.2, easeInOut);
  grow += 0.28 * prog(t, n(s4, "naik") + 0.1, n(s4, "naik") + 1.5, overshoot);
  grow -= 0.28 * prog(t, n(s4, "jam") + 1.5, s4.end, easeInOut);
  grow += 0.22 * prog(t, n(s5, "lebih"), n(s5, "lebih") + 1.6, overshoot);
  grow -= 0.12 * prog(t, s6.start, s6.start + 1.2, easeInOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.0);
  const glow = clamp(
    0.25 +
      0.6 * prog(t, n(s2, "hip"), n(s2, "hip") + 0.8) -
      0.45 * prog(t, n(s2, "shrink"), n(s2, "shrink") + 5) +
      0.45 * prog(t, s3.start, s3.start + 1) +
      0.3 * win(t, n(s4, "naik"), n(s4, "turun"), 0.4, 0.8) * pulse +
      0.35 * win(t, n(s5, "bdnf"), s5.end, 0.8, 0.6) * pulse,
  );

  const up = prog(t, n(s4, "naik") + 0.2, n(s4, "naik") + 1.8, overshoot);
  const down = prog(t, n(s4, "turun") + 0.2, n(s4, "turun") + 1.8, easeOut);
  const barsOn = win(t, n(s4, "naik") - 0.3, n(s4, "jam") + 0.2, 0.5, 0.5);
  const BARS_POS: V3 = [0, -0.5, 0];
  const BARS_ROT: V3 = [0.18, -0.32, 0];
  const H_UP = 0.62;
  const H_DOWN = 0.43;

  // ----- proyeksi -----
  const c3 = makeCamera(cam, W, H);
  const M = objMatrix(rot, pl.pos, pl.s);
  const hip = project(c3, toWorld(M, HIP_CENTER), W, H);
  const MB = objMatrix(BARS_ROT, BARS_POS, 1);
  const upTop = project(c3, toWorld(MB, [-BAR_X, H_UP * up + 0.06, 0]), W, H);
  const downBot = project(c3, toWorld(MB, [BAR_X, -H_DOWN * down - 0.06, 0]), W, H);
  const baseL = project(c3, toWorld(MB, [-BAR_X, -0.04, 0.4]), W, H);
  const baseR = project(c3, toWorld(MB, [BAR_X, 0.04, 0.4]), W, H);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background th={th} t={t} />

      <Stage th={th} cam={cam}>
        <Brain th={th} rot={rot} xray={xr} glow={glow} grow={grow} position={pl.pos} scale={pl.s} />
        {barsOn > 0 ? (
          <ChangeBars th={th} up={up} down={down} hUp={H_UP} hDown={H_DOWN} colorUp={hi(th)} colorDown={th.accent2} rot={BARS_ROT} position={BARS_POS} opacity={barsOn} />
        ) : null}
      </Stage>
      <Scrim th={th} strength={0.7} />

      {/* S5: partikel BDNF mengalir ke hipokampus (di belakang teks) */}
      <BdnfFlow th={th} t={t} at={n(s5, "bdnf")} more={n(s5, "lebih")} out={s5.end - 0.2} tx={hip.x} ty={hip.y} />

      {/* ---------- S1 hook ---------- */}
      <Kicker th={th} t={t} text="Sains · Otak" at={0} out={TL.s1.end - 0.4} y={150} />
      <Headline th={th} t={t} text="Olahraga bikin otak *tumbuh?*" at={0} out={TL.s1.end - 0.5} y={200} size={92} />
      <Chip th={th} t={t} at={n(TL.s1, "clickbait")} out={n(TL.s1, "riset") - 0.2} x={70} y={1300} text="clickbait?" color={th.accent3} size={36} />
      <Chip th={th} t={t} at={n(TL.s1, "riset")} out={TL.s1.end - 0.3} x={70} y={1300} text="ada penelitiannya" color={hi(th)} solid size={36} />

      {/* ---------- S2 hipokampus ---------- */}
      <Kicker th={th} t={t} text="Bagian dalam otak" at={s2.start + 0.1} out={s2.end - 0.4} y={150} />
      <Headline th={th} t={t} text="Si *kuda laut* di otakmu" at={s2.start + 0.2} out={n(s2, "shrink") - 0.4} y={200} size={92} />
      <Headline th={th} t={t} text="Pelan-pelan *menyusut*" at={n(s2, "shrink")} out={s2.end - 0.5} y={200} size={92} accent={th.accent2} />
      <Callout
        th={th}
        t={t}
        at={n(s2, "hip")}
        out={s2.end - 0.5}
        ax={hip.x}
        ay={hip.y}
        lx={clamp(hip.x + 120, 560, 620)}
        ly={hip.y + 230}
        title="Hipokampus"
        sub={t < n(s2, "memori") ? "bentuk kuda laut" : "pusat ingatan"}
        subSize={50}
        color={hi(th)}
      />
      <Chip th={th} t={t} at={n(s2, "persen")} out={s2.end - 0.4} x={70} y={1340} text="−1–2% per tahun (usia lanjut)" color={th.accent2} size={34} />

      {/* ---------- S3 studi ---------- */}
      <Kicker th={th} t={t} text="Uji coba · 1 tahun" at={s3.start + 0.2} out={s3.end - 0.4} y={150} />
      <Headline th={th} t={t} text="Studi 2011: *120 lansia*" at={s3.start + 0.3} out={s3.end - 0.4} y={200} size={88} />
      <People th={th} t={t} at={n(s3, "orang")} walk={n(s3, "jalan")} stretch={n(s3, "regang")} out={s3.end - 0.3} />
      <Chip th={th} t={t} at={n(s3, "jalan")} out={s3.end - 0.3} x={70} y={1268} text="Jalan cepat · 40 mnt, 3×/minggu" color={hi(th)} size={32} />
      <Chip th={th} t={t} at={n(s3, "regang")} out={s3.end - 0.3} x={70} y={1358} text="Peregangan saja" color={th.accent2} size={32} />
      <ScanLine th={th} t={t} at={n(s3, "scan")} out={s3.end + 0.2} top={300} h={470} />

      {/* ---------- S4 hasil (hero) ---------- */}
      <Kicker th={th} t={t} text="Hasil pindaian MRI" at={s4.start + 0.1} out={s4.end - 0.4} y={150} />
      <Headline th={th} t={t} text="*Hasilnya?*" at={s4.start + 0.1} out={n(s4, "naik") - 0.2} y={200} size={110} />
      <Headline th={th} t={t} text="Hipokampus *tumbuh*" at={n(s4, "naik")} out={n(s4, "jam") - 0.4} y={200} size={92} />
      <Headline th={th} t={t} text="Jam otak *mundur*" at={n(s4, "jam")} out={s4.end - 0.5} y={200} size={96} />
      <BarLabel th={th} t={t} at={n(s4, "naik") + 0.5} out={n(s4, "jam")} x={upTop.x} y={upTop.y - 104} text={`+${tick(t, n(s4, "naik") + 0.2, 1.6, 0, 2, 0)}%`} color={hi(th)} />
      <BarLabel th={th} t={t} at={n(s4, "turun") + 0.5} out={n(s4, "jam")} x={downBot.x} y={downBot.y + 2} text={`−${tick(t, n(s4, "turun") + 0.2, 1.6, 0, 1.4, 1)}%`} color={th.accent2} />
      <BarName th={th} t={t} at={n(s4, "naik") + 0.2} out={n(s4, "jam")} x={baseL.x} y={baseL.y + 34} text="jalan cepat" />
      <BarName th={th} t={t} at={n(s4, "turun") + 0.2} out={n(s4, "jam")} x={baseR.x} y={baseR.y - 150} text="peregangan" />
      <Clock th={th} t={t} at={n(s4, "jam") + 0.2} out={s4.end - 0.3} cx={540} cy={1060} r={150} />
      <Chip th={th} t={t} at={n(s4, "jam") + 2.4} out={s4.end - 0.3} x={290} y={1260} text="≈ 1–2 tahun lebih muda" color={hi(th)} solid size={34} />

      {/* ---------- S5 BDNF ---------- */}
      <Kicker th={th} t={t} text="Kenapa bisa?" at={s5.start + 0.1} out={s5.end - 0.4} y={150} />
      <Headline th={th} t={t} text="Kok *bisa*?" at={s5.start + 0.15} out={n(s5, "bdnf") - 0.3} y={200} size={110} />
      <Headline th={th} t={t} text="*BDNF* = pupuk otak" at={n(s5, "bdnf")} out={s5.end - 0.4} y={200} size={96} />
      <Callout
        th={th}
        t={t}
        at={n(s5, "lebih")}
        out={s5.end - 0.4}
        ax={hip.x}
        ay={hip.y}
        lx={clamp(hip.x + 120, 560, 620)}
        ly={hip.y + 230}
        title="Hipokampus"
        sub="ikut tumbuh"
        subSize={50}
        color={hi(th)}
      />
      <Chip th={th} t={t} at={n(s5, "pupuk")} out={s5.end - 0.4} x={70} y={1340} text="protein penumbuh sel saraf" color={hi(th)} size={34} />

      {/* ---------- S6 jujur ---------- */}
      <Kicker th={th} t={t} text="Catatan jujur" at={s6.start + 0.1} out={s6.end - 0.4} y={150} />
      <Headline th={th} t={t} text="Tapi *jujur* ya…" at={s6.start + 0.2} out={s6.end - 0.4} y={200} size={100} />
      <Notes th={th} t={t} ats={[n(s6, "lansia"), n(s6, "studi"), n(s6, "vonis")]} out={s6.end - 0.3} />

      {/* ---------- S7 CTA ---------- */}
      <Kicker th={th} t={t} text="Resepnya" at={s7.start + 0.1} out={n(s7, "cta") - 0.4} y={150} />
      <Headline th={th} t={t} text="Cukup *jalan kaki*" at={s7.start + 0.2} out={n(s7, "cta") - 0.4} y={200} size={100} />
      <Chip th={th} t={t} at={n(s7, "menit")} out={n(s7, "cta") - 0.3} x={70} y={1340} text="mulai 10 menit hari ini" color={hi(th)} solid size={36} />
      <Headline th={th} t={t} text="*Simpan* buat pengingat" at={n(s7, "cta")} y={200} size={96} />
      <Chip th={th} t={t} at={n(s7, "cta") + 0.6} x={70} y={1340} text={`Follow ${p.handle}`} color={th.accent} solid size={34} />

      {p.subtitle ? <Captions th={th} t={t} chunks={CAPS} /> : null}
      <Grain th={th} t={t} />

      {/* ---------- audio ---------- */}
      {p.adaNarasi && p.pakaiNarasi ? <Audio src={staticFile(TL.meta.audio)} /> : null}
      {p.sfx
        ? TL.sfx.map(([at, name, vol], i) => (
            <Sequence key={i} from={Math.round(at * sc * fps)} durationInFrames={Math.round(3 * fps)} layout="none">
              <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};

// ---------------- bagian 2D ----------------

/** 120 orang (12 × 10): kiri = jalan cepat, kanan = peregangan */
const People: React.FC<{ th: Theme; t: number; at: number; walk: number; stretch: number; out: number }> = ({ th, t, at, walk, stretch, out }) => {
  const po = prog(t, out, out + 0.4, easeIn);
  if (t < at - 0.1 || po >= 1) return null;
  const cols = 12;
  const rows = 10;
  const gx = 66;
  const gy = 42;
  const x0 = 540 - ((cols - 1) * gx) / 2;
  const y0 = 820;
  const items: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const s = pop(t, at + (r + c) * 0.03 + rand(i) * 0.08, 0.5);
      const left = c < cols / 2;
      const k = left ? prog(t, walk + (cols / 2 - 1 - c) * 0.04, walk + 0.4 + (cols / 2 - 1 - c) * 0.04) : prog(t, stretch + (c - cols / 2) * 0.04, stretch + 0.4 + (c - cols / 2) * 0.04);
      const col = left ? hi(th) : th.accent2;
      const fill = k > 0.5 ? col : hexA(th.ink, 0.28);
      const x = x0 + c * gx + (c >= cols / 2 ? 16 : -16);
      const y = y0 + r * gy;
      const hop = left && k > 0 ? -5 * Math.abs(Math.sin((t - walk) * 6 + c * 0.7 + r)) * prog(t, walk, walk + 0.6) : 0;
      items.push(
        <g key={i} transform={`translate(${x} ${y + hop}) scale(${Math.min(1.15, s)})`} opacity={Math.min(1, s * 1.5)}>
          <circle cx={0} cy={-11} r={7} fill={fill} />
          <rect x={-8} y={-2} width={16} height={18} rx={7} fill={fill} />
        </g>,
      );
    }
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - po }}>
      {items}
    </svg>
  );
};

/** garis pindai MRI yang menyapu otak */
const ScanLine: React.FC<{ th: Theme; t: number; at: number; out: number; top: number; h: number }> = ({ th, t, at, out, top, h }) => {
  if (t < at || t > out) return null;
  const k = ((t - at) / 1.25) % 1;
  const y = top + h * easeInOut(k);
  const o = win(t, at, out, 0.3, 0.3);
  return (
    <div style={{ position: "absolute", left: 200, width: 680, top: y - 3, height: 6, borderRadius: 3, background: hi(th), opacity: 0.85 * o, boxShadow: `0 0 26px ${hexA(hi(th), 0.7)}` }} />
  );
};

const BarLabel: React.FC<{ th: Theme; t: number; at: number; out: number; x: number; y: number; text: string; color: string }> = ({ th, t, at, out, x, y, text, color }) => {
  const s = pop(t, at, 0.55);
  const po = prog(t, out, out + 0.35, easeIn);
  if (s <= 0 || po >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 160,
        width: 320,
        top: y,
        textAlign: "center",
        fontFamily: th.font.display,
        fontWeight: th.font.displayWeight,
        fontSize: 74,
        letterSpacing: th.font.tracking,
        color,
        opacity: Math.min(1, s * 1.4) * (1 - po),
        transform: `scale(${s})`,
        textShadow: "0 2px 12px rgba(255,255,255,0.7)",
      }}
    >
      {text}
    </div>
  );
};

const BarName: React.FC<{ th: Theme; t: number; at: number; out: number; x: number; y: number; text: string }> = ({ th, t, at, out, x, y, text }) => {
  const p = prog(t, at, at + 0.5);
  const po = prog(t, out, out + 0.35, easeIn);
  if (p <= 0 || po >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 160,
        width: 320,
        top: y,
        textAlign: "center",
        fontFamily: th.font.mono,
        fontSize: 26,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: th.muted,
        opacity: p * (1 - po),
      }}
    >
      {text}
    </div>
  );
};

/** jam yang jarumnya berputar mundur */
const Clock: React.FC<{ th: Theme; t: number; at: number; out: number; cx: number; cy: number; r: number }> = ({ th, t, at, out, cx, cy, r }) => {
  const s = pop(t, at, 0.6);
  const po = prog(t, out, out + 0.4, easeIn);
  if (s <= 0 || po >= 1) return null;
  const back = prog(t, at + 0.4, at + 3.2, easeInOut);
  const aMin = -back * 4 * 360; // jarum menit mundur 4 putaran
  const aHr = 60 - back * 120;
  const arc = back * 300;
  const ar = r + 26;
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + ar * Math.cos(rad(0));
  const y1 = cy + ar * Math.sin(rad(0));
  const x2 = cx + ar * Math.cos(rad(-arc));
  const y2 = cy + ar * Math.sin(rad(-arc));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, s * 1.4) * (1 - po) }}>
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
        <circle cx={cx} cy={cy} r={r} fill={hexA("#FFFFFF", 0.82)} stroke={th.ink} strokeWidth={8} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return <line key={i} x1={cx + Math.sin(a) * (r - 14)} y1={cy - Math.cos(a) * (r - 14)} x2={cx + Math.sin(a) * (r - (i % 3 ? 26 : 38))} y2={cy - Math.cos(a) * (r - (i % 3 ? 26 : 38))} stroke={th.muted} strokeWidth={i % 3 ? 4 : 7} strokeLinecap="round" />;
        })}
        <line x1={cx} y1={cy} x2={cx + Math.sin((aHr * Math.PI) / 180) * r * 0.5} y2={cy - Math.cos((aHr * Math.PI) / 180) * r * 0.5} stroke={th.ink} strokeWidth={12} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + Math.sin((aMin * Math.PI) / 180) * r * 0.78} y2={cy - Math.cos((aMin * Math.PI) / 180) * r * 0.78} stroke={hi(th)} strokeWidth={8} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={12} fill={hi(th)} />
        {arc > 1 ? (
          <path d={`M ${x1} ${y1} A ${ar} ${ar} 0 ${arc > 180 ? 1 : 0} 0 ${x2} ${y2}`} fill="none" stroke={hi(th)} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 18" />
        ) : null}
      </g>
    </svg>
  );
};

/** partikel BDNF: dari bawah layar mengalir ke titik hipokampus */
const BdnfFlow: React.FC<{ th: Theme; t: number; at: number; more: number; out: number; tx: number; ty: number }> = ({ th, t, at, more, out, tx, ty }) => {
  if (t < at || t > out + 0.6) return null;
  const o = win(t, at, out + 0.5, 0.6, 0.6);
  const N = 46;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const active = i < 24 || t > more + (i - 24) * 0.05;
    if (!active) continue;
    const period = 2.4 - (t > more ? 0.6 : 0);
    const ph = rand(i + 1) * period;
    const k = ((t - at + ph) % period) / period;
    const side = i % 2 ? 1 : -1;
    const sx = 540 + side * (560 + rand(i + 50) * 120);
    const sy = 700 + rand(i + 90) * 650;
    const mx = lerp(sx, tx, 0.5) + (rand(i + 7) - 0.5) * 300;
    const my = lerp(sy, ty, 0.5) + (rand(i + 11) - 0.5) * 260;
    const e = easeIn(k);
    const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * tx;
    const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ty;
    const a = Math.min(1, k * 5) * (1 - prog(k, 0.85, 1));
    const r = 7 + rand(i + 3) * 6;
    dots.push(<circle key={i} cx={x} cy={y} r={r} fill={hi(th)} opacity={a * 0.85} />);
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: o, filter: `drop-shadow(0 0 8px ${hexA(hi(th), 0.6)})` }}>
      {dots}
    </svg>
  );
};

/** tiga catatan kejujuran */
const Notes: React.FC<{ th: Theme; t: number; ats: number[]; out: number }> = ({ th, t, ats, out }) => {
  const rows: [string, string][] = [
    ["Subjek", "diuji pada orang lanjut usia"],
    ["Studi lanjutan", "hasilnya belum selalu sama"],
    ["Kesimpulan", "petunjuk kuat, bukan janji"],
  ];
  const po = prog(t, out, out + 0.4, easeIn);
  if (t < ats[0] || po >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 70, top: 980, width: 940, opacity: 1 - po }}>
      {rows.map(([k, v], i) => {
        const s = pop(t, ats[i], 0.5);
        if (s <= 0) return null;
        const last = i === 2;
        return (
          <div
            key={k}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 16,
              padding: "18px 26px",
              borderRadius: 20,
              background: last ? hi(th) : hexA("#FFFFFF", 0.82),
              border: `2.5px solid ${last ? hi(th) : hexA(th.ink, 0.12)}`,
              transform: `translateX(${(1 - Math.min(1, s)) * -40}px)`,
              opacity: Math.min(1, s * 1.4),
            }}
          >
            <span style={{ fontFamily: th.font.mono, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: last ? "#FFFFFF" : th.muted }}>{k}</span>
            <span style={{ fontFamily: th.font.display, fontWeight: th.font.displayWeight, fontSize: 44, letterSpacing: th.font.tracking, color: last ? "#FFFFFF" : th.ink }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
};

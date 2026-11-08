/**
 * Video contoh: "Apa isi Bumi?" (9:16, ±90 dtk).
 * Semua waktu dibaca dari timeline.json. Semua gerak = fungsi murni dari t.
 * Ganti gaya: prop `tema` di panel kanan Remotion Studio.
 */
import { Audio } from "@remotion/media";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, Sequence, staticFile, useVideoConfig } from "remotion";
import { z } from "zod";
import TLjson from "../../timeline.json";
import { Background, Grain, Scrim } from "../components/Background";
import { Callout } from "../components/Callout";
import { DepthBar } from "../components/DepthBar";
import { DepthGauge } from "../components/Gauge";
import { AppleIcon, Convection, Drill, SeismoCard } from "../components/Icons";
import { Seismic } from "../components/Seismic";
import { Captions, Chip, Headline, Kicker, tick, type Cap } from "../components/Text";
import {
  camTrack,
  clamp,
  easeIn,
  easeInOut,
  easeOut,
  lerp,
  makeCamera,
  overshoot,
  pop,
  prog,
  project,
  screenRadius,
  TimeScale,
  toWorld,
  useT,
  win,
  type Cam,
} from "../lib";
import { hexA, hi, TEMA_IDS, THEMES, type Theme } from "../themes";
import { Earth, earthMatrix, faceAnchor, LAYERS } from "../three/Earth";
import { FieldLines } from "../three/FieldLines";
import { Stage } from "../three/Stage";

type Scene = { start: number; end: number; cap: Cap[] } & Record<string, number | Cap[]>;
const TL = TLjson as unknown as Record<"s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8" | "s9", Scene> & {
  meta: { judul: string; durasi: number };
  sfx: [number, string, number][];
};
const n = (s: Scene, k: string) => s[k] as number;
const CAPS: Cap[] = (["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"] as const).flatMap((k) => TL[k].cap);

export const lapisanSchema = z.object({
  tema: z.enum(TEMA_IDS),
  subtitle: z.boolean(),
  sfx: z.boolean(),
  pakaiNarasi: z.boolean(),
  skalaKeAudio: z.boolean(),
  handle: z.string(),
  adaNarasi: z.boolean(),
  skala: z.number(),
  /** opsional: peta asli di public/, mis. "textures/bumi.jpg" (kosong = benua prosedural) */
  peta: z.string(),
});
type Props = z.infer<typeof lapisanSchema>;

export const lapisanDefaults: Props = {
  tema: "neon",
  subtitle: true,
  sfx: true,
  pakaiNarasi: true,
  skalaKeAudio: false,
  handle: "@agilpamungks",
  adaNarasi: false,
  skala: 1,
  peta: "",
};

/** Durasi otomatis: kalau public/audio/narasi.mp3 ada, video minimal sepanjang audio (atau diregangkan bila skalaKeAudio). */
export const hitungMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const fps = 30;
  let dur = TL.meta.durasi;
  let adaNarasi = false;
  let skala = 1;
  if (props.pakaiNarasi) {
    try {
      const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(staticFile("audio/narasi.mp3")) });
      const d = await input.computeDuration();
      if (d > 1) {
        adaNarasi = true;
        if (props.skalaKeAudio) {
          skala = d / TL.meta.durasi;
          dur = d;
        } else {
          dur = Math.max(dur, d + 0.5);
        }
      }
    } catch {
      // belum ada file narasi: pakai durasi timeline
    }
  }
  return { durationInFrames: Math.ceil(dur * fps), props: { ...props, adaNarasi, skala } };
};

// ---------------- koreografi 3D ----------------
const W = 1080;
const H = 1920;
const CUT = Math.PI / 2;
const TILT = 0.3;
const FACE_AZ = -0.3; // arah tengah irisan (radian, 0 = menghadap kamera)
const SPIN_T = FACE_AZ - CUT / 2 + 4 * Math.PI;
const SPIN_SPEED = 0.22;
const SPIN_C = SPIN_T - 0.25 - SPIN_SPEED * 32.6;
const spinFree = (t: number) => SPIN_C + SPIN_SPEED * t;

const spinAt = (t: number) => {
  if (t < 31) return spinFree(t);
  if (t < 32.6) return lerp(spinFree(t), SPIN_T, prog(t, 31, 32.6, easeInOut));
  const sway = 0.08 * Math.sin((t - 32.6) * 0.4) * prog(t, 32.6, 34.6);
  const outro = t > 77 ? (t - 77) * 0.06 : 0;
  return SPIN_T + sway + outro;
};

const C: Record<string, Cam> = {
  wide: { pos: [0, 1.0, 8.6], target: [0, 0.12, 0], fov: 32 },
  hook: { pos: [0, 0.95, 7.9], target: [0, 0.08, 0], fov: 32 },
  kola: { pos: [0.62, 1.05, 8.2], target: [0.62, 0.16, 0], fov: 32 },
  seismic: { pos: [0, 0.6, 9.3], target: [0, -0.06, 0], fov: 32 },
  hero: { pos: [0, 1.05, 7.7], target: [0, 0.0, 0], fov: 32 },
  crust: { pos: [0.65, 1.4, 6.5], target: [0.22, 0.16, 0], fov: 32 },
  mantle: { pos: [0.35, 1.15, 6.9], target: [0.12, 0.02, 0], fov: 32 },
  outer: { pos: [0.15, 0.95, 6.5], target: [0.05, -0.05, 0], fov: 32 },
  field: { pos: [0, 1.1, 11.0], target: [0, 0.0, 0], fov: 32 },
  inner: { pos: [0.3, 0.9, 6.7], target: [0.06, -0.16, 0.05], fov: 32 },
  outro: { pos: [0, 1.25, 9.8], target: [0, -0.42, 0], fov: 32 },
};

const KEYS = [
  { at: 0, dur: 0, cam: C.wide },
  { at: 0.4, dur: 7.0, cam: C.hook },
  { at: 7.5, dur: 1.4, cam: C.kola },
  { at: 19.2, dur: 1.5, cam: C.seismic },
  { at: 30.8, dur: 2.8, cam: C.hero },
  { at: 34.8, dur: 1.6, cam: C.crust },
  { at: 45.2, dur: 1.6, cam: C.mantle },
  { at: 55.4, dur: 1.4, cam: C.outer },
  { at: 59.4, dur: 2.2, cam: C.field },
  { at: 65.8, dur: 2.4, cam: C.inner },
  { at: 76.4, dur: 2.4, cam: C.outro },
];

// titik label di bidang irisan kanan untuk tiap lapisan [jarak dari pusat, sudut dari kutub]
const ANCHOR: [number, number][] = [
  [0.96, 38],
  [0.74, 52],
  [0.38, 64],
  [0.08, 90],
];

const layerWindow = (t: number) => {
  const s = [TL.s5, TL.s6, TL.s7, TL.s8];
  for (let i = 0; i < 4; i++) {
    if (t >= s[i].start && t < s[i].end) return { idx: i, hl: win(t, s[i].start + 0.2, s[i].end, 0.6, 0.45) };
  }
  return { idx: -1, hl: 0 };
};

// ---------------- komponen ----------------
export const LapisanBumi: React.FC<Props> = (p) => (
  <TimeScale.Provider value={p.skala || 1}>
    <Inner {...p} />
  </TimeScale.Provider>
);

const Inner: React.FC<Props> = (p) => {
  const th = THEMES[p.tema];
  const t = useT();
  const { fps } = useVideoConfig();
  const sc = p.skala || 1;

  // keadaan 3D pada waktu t
  const cam = camTrack(t, KEYS);
  const spin = spinAt(t);
  const cut = CUT * prog(t, n(TL.s4, "open"), n(TL.s4, "open") + 1.7, overshoot);
  const xray = win(t, n(TL.s3, "xray"), TL.s3.end + 0.3, 1.2, 0.7);
  const { idx, hl } = layerWindow(t);
  const glow = t > TL.s8.start ? 0.5 + 0.5 * Math.sin((t - TL.s8.start) * 3.2) : 0;
  const field = prog(t, n(TL.s7, "field"), n(TL.s7, "field") + 2.6, easeInOut);
  const fieldOpacity = 1 - prog(t, TL.s7.end - 0.6, TL.s7.end + 0.4, easeIn);

  // proyeksi untuk label
  const c3 = makeCamera(cam, W, H);
  const M = earthMatrix(TILT, spin);
  const anchor = (i: number) => project(c3, toWorld(M, faceAnchor(cut, ANCHOR[i][0], ANCHOR[i][1])), W, H);
  const pole = project(c3, toWorld(M, [0, 1, 0]), W, H);
  const center = project(c3, [0, 0, 0], W, H);
  const R = screenRadius(cam, [0, 0, 0], 1, H);
  const labelPos = (a: { x: number; y: number }) => ({ lx: clamp(a.x + 90, 600, 700), ly: 590 });

  // penanda kedalaman (penggaris horizontal)
  let depth = 35;
  depth = lerp(depth, 2890, prog(t, TL.s6.start + 0.2, TL.s6.start + 1.4, easeInOut));
  depth = lerp(depth, 5150, prog(t, TL.s7.start + 0.2, TL.s7.start + 1.4, easeInOut));
  depth = lerp(depth, 6371, prog(t, TL.s8.start + 0.2, TL.s8.start + 1.4, easeInOut));
  const depthLabel = t < TL.s6.start + 0.6 ? "kerak" : t < TL.s7.start + 0.6 ? "mantel" : t < TL.s8.start + 0.6 ? "inti luar" : "pusat Bumi";

  const L = LAYERS;
  const segs = [
    { from: 0, to: 70, color: th.layers[0] },
    { from: 70, to: 2890, color: th.layers[1] },
    { from: 2890, to: 5150, color: th.layers[2] },
    { from: 5150, to: 6371, color: th.layers[3] },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background th={th} t={t} />

      <Stage th={th} cam={cam}>
        <Earth th={th} spin={spin} tilt={TILT} cut={cut} xray={xray} hlIdx={idx} hl={hl} glow={glow} mapUrl={p.peta || undefined} />
        <FieldLines th={th} draw={field} t={t} tilt={TILT} opacity={fieldOpacity} />
      </Stage>
      <Scrim th={th} />

      {/* ---------- S1 hook ---------- */}
      <Kicker th={th} t={t} text="Pengetahuan · Geosains" at={0} out={TL.s1.end - 0.4} y={150} />
      <Headline th={th} t={t} text="Seberapa *dalam* kamu bisa menggali?" at={0} out={TL.s1.end - 0.5} y={200} size={80} />
      <Drill th={th} t={t} at={n(TL.s1, "drill")} out={TL.s2.end - 0.5} px={pole.x} py={pole.y} len={105} />

      {/* ---------- S2 Kola ---------- */}
      <Kicker th={th} t={t} text="Rekor manusia" at={TL.s2.start + 0.2} out={TL.s2.end - 0.4} y={150} />
      <Headline th={th} t={t} text="Lubang terdalam *buatan manusia*" at={TL.s2.start + 0.3} out={n(TL.s2, "kola") - 0.4} y={200} size={88} />
      <Headline th={th} t={t} text="Cuma *12,2 km*" at={n(TL.s2, "kola")} out={TL.s2.end - 0.5} y={200} size={110} accent={hi(th)} />
      <DepthGauge
        th={th}
        t={t}
        at={n(TL.s2, "gauge")}
        out={TL.s2.end - 0.5}
        x={860}
        y={560}
        h={760}
        max={70}
        segs={[{ from: 0, to: 70, color: hexA(th.layers[0], 0.85) }]}
        ticks={[0, 10, 20, 30, 40, 50, 60, 70]}
        marker={12.262 * prog(t, n(TL.s2, "kola"), n(TL.s2, "kola") + 1.8, easeOut)}
        markerLabel={t >= n(TL.s2, "kola") ? `Kola · ${tick(t, n(TL.s2, "kola"), 1.8, 0, 12.262, 1)} km` : undefined}
      />
      <Chip th={th} t={t} at={n(TL.s2, "stamp")} out={TL.s2.end - 0.5} x={70} y={1340} text="BELUM TEMBUS KERAK" color={th.accent3} solid size={36} />
      {t > TL.s2.start && t < TL.s2.end ? (
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 1366,
            width: 330,
            textAlign: "right",
            fontFamily: th.font.mono,
            fontSize: 22,
            color: th.muted,
            opacity: win(t, n(TL.s2, "gauge") + 0.6, TL.s2.end - 0.4, 0.6, 0.4),
          }}
        >
          tebal kerak: 5–70 km
        </div>
      ) : null}

      {/* ---------- S3 gelombang gempa ---------- */}
      <Kicker th={th} t={t} text="Cara ilmuwan tahu" at={TL.s3.start + 0.2} out={TL.s3.end - 0.3} y={150} />
      <Headline th={th} t={t} text="*Dengarkan* gempanya" at={TL.s3.start + 0.3} out={TL.s3.end - 0.3} y={200} size={96} />
      <SeismoCard th={th} t={t} at={n(TL.s3, "quake") - 0.3} quake={n(TL.s3, "quake")} out={TL.s3.end - 0.3} x={70} y={1190} />
      <Seismic th={th} t={t} quake={n(TL.s3, "quake")} rays={n(TL.s3, "rays")} out={TL.s3.end - 0.6} cx={center.x} cy={center.y} R={R} />
      <Chip th={th} t={t} at={25.7} out={TL.s3.end - 0.3} x={70} y={1370} text="kecepatan berubah di tiap lapisan" color={th.accent2} size={32} />

      {/* ---------- S4 belah ---------- */}
      <Headline th={th} t={t} text="Ayo kita *belah* Bumi." at={TL.s4.start + 0.2} out={TL.s4.end - 0.3} y={200} size={112} accent={hi(th)} />

      {/* ---------- S5–S8 lapisan ---------- */}
      {[TL.s5, TL.s6, TL.s7, TL.s8].map((s, i) => (
        <React.Fragment key={i}>
          <Kicker th={th} t={t} text={`Lapisan 0${i + 1} / 04`} at={s.start + 0.1} out={s.end - 0.35} y={150} dot={th.layers[i]} />
          <Headline
            th={th}
            t={t}
            text={`*${L[i].nama}*`}
            at={s.start + 0.2}
            out={i === 2 ? n(TL.s7, "field") - 0.6 : s.end - 0.4}
            y={190}
            size={130}
            accent={th.layers[i] === th.bg.mid ? th.ink : th.layers[i]}
          />
        </React.Fragment>
      ))}
      <Headline th={th} t={t} text="Perisai *magnet* Bumi" at={n(TL.s7, "field") - 0.1} out={TL.s7.end - 0.4} y={190} size={110} accent={th.accent} />
      <DepthBar
        th={th}
        t={t}
        at={TL.s5.start + 0.6}
        out={TL.s8.end - 0.4}
        x={70}
        y={395}
        w={940}
        max={6371}
        segs={segs}
        ticks={[0, 2890, 5150, 6371]}
        marker={depth}
        markerLabel={depthLabel}
        markerColor={hi(th)}
      />

      {/* kerak */}
      {(() => {
        const a = anchor(0);
        const { lx, ly } = labelPos(a);
        return <Callout th={th} t={t} at={n(TL.s5, "label")} out={TL.s5.end - 0.4} ax={a.x} ay={a.y} lx={lx} ly={ly} title="Kerak" sub="5–70 km" color={hi(th)} />;
      })()}
      <AppleIcon th={th} t={t} at={n(TL.s5, "apple")} out={TL.s5.end - 0.4} x={60} y={1060} size={230} skin={th.layers[0]} label="≈ setipis kulit apel" />

      {/* mantel */}
      {(() => {
        const a = anchor(1);
        const { lx, ly } = labelPos(a);
        const count = n(TL.s6, "count");
        return (
          <>
            <Callout
              th={th}
              t={t}
              at={n(TL.s6, "label")}
              out={TL.s6.end - 0.4}
              ax={a.x}
              ay={a.y}
              lx={lx}
              ly={ly}
              title="Mantel"
              sub={t < count ? "paling tebal" : `± ${tick(t, count, 1.5, 0, 2900)} km`}
              color={hi(th)}
            />
            <Convection th={th} t={t} at={n(TL.s6, "flow")} out={TL.s6.end - 0.4} x={a.x - 70} y={a.y + 200} r={62} color={th.ink} />
          </>
        );
      })()}
      <Chip th={th} t={t} at={n(TL.s6, "thick")} out={TL.s6.end - 0.4} x={70} y={1340} text="lapisan paling tebal" color={th.layers[1]} size={32} />

      {/* inti luar */}
      {(() => {
        const a = anchor(2);
        const { lx, ly } = labelPos(a);
        return <Callout th={th} t={t} at={n(TL.s7, "label")} out={n(TL.s7, "field") - 0.6} ax={a.x} ay={a.y} lx={lx} ly={ly} title="Inti luar" sub="besi & nikel cair" subSize={48} color={hi(th)} />;
      })()}
      <Chip th={th} t={t} at={n(TL.s7, "shield")} out={TL.s7.end - 0.4} x={70} y={1340} text="melindungi dari angin Matahari" color={th.accent} size={32} />

      {/* inti dalam */}
      {(() => {
        const a = anchor(3);
        const { lx, ly } = labelPos(a);
        const temp = n(TL.s8, "temp");
        return (
          <Callout
            th={th}
            t={t}
            at={n(TL.s8, "label")}
            out={TL.s8.end - 0.4}
            ax={a.x}
            ay={a.y}
            lx={lx}
            ly={ly}
            title="Inti dalam"
            sub={t < temp ? "bola besi padat" : `${tick(t, temp, 1.6, 0, 5000)}+ °C`}
            subSize={t < temp ? 48 : 60}
            color={hi(th)}
          />
        );
      })()}
      <Chip th={th} t={t} at={n(TL.s8, "sun")} out={TL.s8.end - 0.4} x={70} y={1250} text="≈ sepanas permukaan Matahari" color={th.accent2} size={32} />
      <Chip th={th} t={t} at={n(TL.s8, "pressure")} out={TL.s8.end - 0.4} x={70} y={1345} text="padat karena tekanan luar biasa" color={th.layers[3]} size={32} />

      {/* ---------- S9 penutup ---------- */}
      <Headline th={th} t={t} text="Di bawah kakimu, dunia yang *terus bergerak*" at={TL.s9.start + 0.3} out={n(TL.s9, "cta") - 0.3} y={190} size={88} />
      <Summary th={th} t={t} at={n(TL.s9, "summary")} out={n(TL.s9, "cta") - 0.3} />
      <Headline th={th} t={t} text="*Simpan* video ini" at={n(TL.s9, "cta") + 0.1} y={190} size={116} accent={hi(th)} />
      <Chip th={th} t={t} at={n(TL.s9, "cta") + 1.2} x={70} y={1200} text="Lapisan mana yang bikin kamu penasaran?" color={hi(th)} size={33} />
      <Chip th={th} t={t} at={n(TL.s9, "cta") + 1.8} x={70} y={1295} text={`Follow ${p.handle}`} color={th.accent} solid size={34} />

      {p.subtitle ? <Captions th={th} t={t} chunks={CAPS} /> : null}
      <Grain th={th} t={t} />

      {/* ---------- audio ---------- */}
      {p.adaNarasi && p.pakaiNarasi ? <Audio src={staticFile("audio/narasi.mp3")} /> : null}
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

/** ringkasan 4 lapisan di akhir video */
const Summary: React.FC<{ th: Theme; t: number; at: number; out: number }> = ({ th, t, at, out }) => {
  const rows: [string, string][] = [
    ["Kerak", "5–70 km · tempat kita berdiri"],
    ["Mantel", "± 2.900 km · bergerak pelan"],
    ["Inti luar", "besi & nikel cair · medan magnet"],
    ["Inti dalam", "padat · 5.000+ °C"],
  ];
  const po = prog(t, out, out + 0.4, easeIn);
  if (t < at || po >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 70, top: 1080, width: 940, opacity: 1 - po }}>
      {rows.map(([name, info], i) => {
        const s = pop(t, at + i * 0.25, 0.5);
        return (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 14,
              padding: "14px 22px",
              borderRadius: 18,
              background: th.dark ? hexA("#000000", 0.5) : hexA("#ffffff", 0.78),
              border: `2px solid ${hexA(th.layers[i], 0.6)}`,
              transform: `translateX(${(1 - Math.min(1, s)) * -40}px)`,
              opacity: Math.min(1, s * 1.4),
            }}
          >
            <span style={{ width: 22, height: 22, borderRadius: 6, background: th.layers[i], flex: "none" }} />
            <span style={{ fontFamily: th.font.display, fontWeight: th.font.displayWeight, fontSize: 38, color: th.ink, minWidth: 210 }}>{name}</span>
            <span style={{ fontFamily: th.font.body, fontWeight: th.font.bodyWeight, fontSize: 28, color: th.muted }}>{info}</span>
          </div>
        );
      })}
    </div>
  );
};

/** durasi awal (detik) sebelum dihitung ulang dari audio */
export const DURASI_TIMELINE = TL.meta.durasi;

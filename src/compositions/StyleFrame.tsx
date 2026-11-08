/**
 * Satu frame contoh (9:16) untuk moodboard / referensi gaya.
 * Dipakai oleh Moodboard (9 kotak) dan bisa diekspor sendiri lewat komposisi "GayaFrame".
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { Background, Grain } from "../components/Background";
import { Callout } from "../components/Callout";
import { Captions, Chip, Headline, Kicker } from "../components/Text";
import { StepBadge } from "../components/Icons";
import { makeCamera, project, spreadLabels, toWorld, type Cam, type V3 } from "../lib";
import { hi, TEMA_IDS, THEMES, type TemaId } from "../themes";
import { Earth, earthMatrix, faceAnchor } from "../three/Earth";
import { FieldLines } from "../three/FieldLines";
import { PHONE_PARTS, Phone, partAnchor, phoneMatrix } from "../three/Phone";
import { Pillars, pillarHeight, pillarX, type Pillar } from "../three/Pillars";
import { Stage } from "../three/Stage";
import { objMatrix } from "../lib";

export const JENIS = ["cutaway", "xray", "field", "exploded", "data"] as const;
export type Jenis = (typeof JENIS)[number];

export type FrameSpec = {
  tema: TemaId;
  jenis: Jenis;
  kicker: string;
  judul: string;
  cap: string;
  /** lapisan yang disorot & diberi label (cutaway/xray) */
  layer?: number;
  calloutTitle?: string;
  calloutSub?: string;
  step?: string;
  chip?: string;
};

const W = 1080;
const H = 1920;
export const CUT = Math.PI / 2;
/** spin agar irisan menghadap kamera di azimut `faceAz` */
export const spinFacing = (faceAz: number) => faceAz - CUT / 2;

// titik label di bidang irisan kanan (azimut lokal = CUT) untuk tiap lapisan
export const LAYER_ANCHOR: [number, number][] = [
  [0.96, 38],
  [0.74, 52],
  [0.38, 64],
  [0.08, 90],
];

export const DEFAULT_SPECS: Record<Jenis, Omit<FrameSpec, "tema">> = {
  cutaway: { jenis: "cutaway", kicker: "Sains · 60 detik", judul: "Apa isi *Bumi?*", cap: "Lapisan mana yang paling bikin kamu penasaran?", layer: 2, calloutTitle: "Inti luar", calloutSub: "besi cair" },
  xray: { jenis: "xray", kicker: "Pengetahuan", judul: "Lihat *tembus* ke dalam", cap: "Gelombang gempa membantu memetakan isi Bumi", layer: 3, calloutTitle: "Inti dalam", calloutSub: "5.000+ °C" },
  field: { jenis: "field", kicker: "Fisika bumi", judul: "Perisai *magnet* Bumi", cap: "Putaran logam cair menciptakan medan magnet", chip: "melindungi dari angin Matahari" },
  exploded: { jenis: "exploded", kicker: "Tutorial · 5 bagian", judul: "Bongkar isi *HP-mu*", cap: "Kita lihat satu per satu, dari depan ke belakang" },
  data: { jenis: "data", kicker: "Data · ketebalan lapisan", judul: "Seberapa *tebal?*", cap: "Mantel adalah lapisan paling tebal" },
};

export const styleSchema = z.object({
  tema: z.enum(TEMA_IDS),
  jenis: z.enum(JENIS),
});

const PILLAR_DATA = (th: (typeof THEMES)[TemaId]): Pillar[] => [
  { nama: "Kerak", nilai: 70, label: "≤ 70", warna: th.layers[0] },
  { nama: "Mantel", nilai: 2890, label: "± 2.900", warna: th.layers[1] },
  { nama: "Inti luar", nilai: 2260, label: "± 2.260", warna: th.layers[2] },
  { nama: "Inti dalam", nilai: 1220, label: "1.220*", warna: th.layers[3] },
];

export const StyleFrameView: React.FC<{ spec: FrameSpec; t?: number }> = ({ spec, t = 3 }) => {
  const th = THEMES[spec.tema];
  const tilt = 0.3;

  // ---------- kamera & objek per jenis ----------
  let cam: Cam = { pos: [0, 1.0, 8.6], target: [0, 0.16, 0], fov: 32 };
  let spin = spinFacing(-0.3);
  let cut = CUT;
  let xray = 0;
  if (th.ortho) {
    cam = { pos: [6, 4.6, 6], target: [0, -0.05, 0], fov: 32, ortho: true, zoom: 370 };
    spin = spinFacing(Math.PI / 4 - 0.12);
  }
  if (spec.tema === "cinema") cam = { pos: [1.5, 0.45, 7.0], target: [0.28, 0.04, 0], fov: 32 };
  if (spec.jenis === "xray") {
    cut = 0;
    xray = 1;
    spin = 1.2;
  }
  if (spec.jenis === "field") {
    cut = 0;
    spin = 2.2;
    cam = { pos: [0, 0.55, 8.4], target: [0, 0.1, 0], fov: 32 };
  }

  const c3 = makeCamera(cam, W, H);
  const M = earthMatrix(tilt, spin);
  const L = spec.layer ?? -1;

  // ---------- label ----------
  let callout: React.ReactNode = null;
  if ((spec.jenis === "cutaway" || spec.jenis === "xray") && L >= 0 && spec.calloutTitle) {
    const [r, pd] = LAYER_ANCHOR[L];
    const local: V3 = spec.jenis === "xray" ? [0, 0, 0] : faceAnchor(cut, r, pd);
    const a = project(c3, toWorld(M, local), W, H);
    const lx = Math.min(690, Math.max(600, a.x + 90));
    const ly = spec.tema === "cinema" ? 520 : 545;
    callout = <Callout th={th} t={t} at={0.2} ax={a.x} ay={a.y} lx={lx} ly={ly} title={spec.calloutTitle} sub={spec.calloutSub} color={hi(th)} />;
  }

  // ---------- objek 3D ----------
  let scene: React.ReactNode = null;
  let overlays: React.ReactNode = null;
  if (spec.jenis === "cutaway" || spec.jenis === "xray") {
    scene = <Earth th={th} spin={spin} tilt={tilt} cut={cut} xray={xray} hlIdx={L} hl={spec.jenis === "cutaway" ? 1 : 0} glow={0.6} />;
  } else if (spec.jenis === "field") {
    scene = (
      <>
        <Earth th={th} spin={spin} tilt={tilt} />
        <FieldLines th={th} draw={1} t={t} tilt={tilt} />
      </>
    );
    overlays = spec.chip ? <Chip th={th} t={t} at={0} x={70} y={1300} text={spec.chip} color={th.accent2} size={32} /> : null;
  } else if (spec.jenis === "exploded") {
    cam = { pos: [0, 4.1, 8.0], target: [0.2, 0.3, 0], fov: 32 };
    const yaw = 0.62;
    const pos: V3 = [-0.3, 0, 0];
    const sc = 0.95;
    const pm = phoneMatrix(yaw, pos, sc);
    const c = makeCamera(cam, W, H);
    scene = <Phone th={th} explode={1} yaw={yaw} position={pos} scale={sc} hl={1} />;
    overlays = (
      <>
        {(() => {
          const pts = PHONE_PARTS.map((_, i) => project(c, toWorld(pm, partAnchor(i, 1)), W, H));
          const ys = spreadLabels(pts.map((a) => a.y + 6), 128, 520, 1370);
          return PHONE_PARTS.map((p, i) => (
            <Callout key={p.nama} th={th} t={t} at={0.1 + i * 0.12} ax={pts[i].x} ay={pts[i].y} lx={770} ly={ys[i]} title={`0${i + 1}`} sub={p.nama} subSize={30} color={i === 1 ? hi(th) : th.ink} />
          ));
        })()}
      </>
    );
  } else if (spec.jenis === "data") {
    cam = { pos: [3.4, 3.55, 9.6], target: [0.1, 0.94, 0], fov: 32 };
    const rotY = -0.62;
    const pm = objMatrix([0, rotY, 0]);
    const c = makeCamera(cam, W, H);
    const data = PILLAR_DATA(th);
    const max = Math.max(...data.map((d) => d.nilai));
    scene = <Pillars th={th} data={data} grow={1} rot={[0, rotY, 0]} />;
    overlays = (
      <>
        {data.map((d, i) => {
          const top = project(c, toWorld(pm, [pillarX(i, data.length), pillarHeight(d.nilai, max) + 0.1, 0]), W, H);
          return (
            <div key={d.nama} style={{ position: "absolute", left: top.x - 130 + (i === 0 ? -64 : 0), top: top.y - 100, width: 260, textAlign: "center" }}>
              <div style={{ fontFamily: th.font.mono, fontWeight: 700, fontSize: 21, letterSpacing: "0.12em", textTransform: "uppercase", color: th.muted }}>{d.nama}</div>
              <div style={{ marginTop: 6, fontFamily: th.font.display, fontWeight: th.font.displayWeight, fontSize: 44, color: th.ink, letterSpacing: th.font.tracking, lineHeight: 1 }}>{d.label}</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 70, top: 1400, fontFamily: th.font.mono, fontSize: 22, color: th.muted }}>dalam km · *inti dalam = jari-jari</div>
      </>
    );
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background th={th} t={t} />
      <Stage th={th} cam={cam}>
        {scene}
      </Stage>
      {callout}
      {overlays}
      <Kicker th={th} t={t} text={spec.kicker} at={0} y={150} />
      <Headline th={th} t={t} text={spec.judul} at={0} y={200} size={spec.judul.length > 18 ? 104 : 124} />
      {spec.step ? <StepBadge th={th} t={t} at={0} x={70} y={1250} n={spec.step} total="04" /> : null}
      <Captions th={th} t={1.25} chunks={[[spec.cap, 0, 2.4]]} />
      <Grain th={th} t={t} />
    </AbsoluteFill>
  );
};

/** komposisi "GayaFrame": pilih tema + jenis di panel kanan Studio */
export const StyleFrame: React.FC<z.infer<typeof styleSchema>> = ({ tema, jenis }) => <StyleFrameView spec={{ tema, ...DEFAULT_SPECS[jenis] }} />;

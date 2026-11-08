/**
 * Template TUTORIAL langkah demi langkah dengan exploded view 3D (±26 dtk, tanpa narasi).
 * Ubah judul & isi langkah di panel kanan Remotion Studio (tanpa koding).
 * Untuk benda lain: ganti <Phone> dengan model kamu (lihat README: "Pakai model 3D sendiri").
 */
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Background, Grain, Scrim } from "../components/Background";
import { Callout } from "../components/Callout";
import { StepBadge } from "../components/Icons";
import { Chip, Headline, Kicker } from "../components/Text";
import { easeIn, easeInOut, makeCamera, pop, prog, project, spreadLabels, toWorld, type Cam } from "../lib";
import { hexA, hi, TEMA_IDS, THEMES } from "../themes";
import { PHONE_PARTS, Phone, partAnchor, phoneMatrix } from "../three/Phone";
import { Stage } from "../three/Stage";

export const tutorialSchema = z.object({
  tema: z.enum(TEMA_IDS),
  kicker: z.string(),
  judul: z.string(),
  langkah: z.array(z.object({ judul: z.string(), info: z.string() })).max(5),
  penutup: z.string(),
  handle: z.string(),
  sfx: z.boolean(),
});
type Props = z.infer<typeof tutorialSchema>;

export const tutorialDefaults: Props = {
  tema: "iso",
  kicker: "Tutorial · 5 bagian",
  judul: "Bongkar isi *HP-mu*",
  langkah: [
    { judul: "Kaca pelindung", info: "Lapisan paling luar, menahan gores & benturan" },
    { judul: "Layar OLED", info: "Tiap piksel menyala sendiri, tanpa lampu latar" },
    { judul: "Papan sirkuit", info: "Otak HP: prosesor, memori, dan modem" },
    { judul: "Baterai", info: "Litium-ion, sumber tenaga semua komponen" },
    { judul: "Casing belakang", info: "Pelindung terakhir sekaligus dudukan kamera" },
  ],
  penutup: "*Simpan* untuk nanti",
  handle: "@agilpamungks",
  sfx: true,
};

const INTRO = 3.2;
const EXPLODE = 1.6;
const STEP = 3.4;
const OUTRO = 3.8;
export const TUTORIAL_DURASI = INTRO + EXPLODE + STEP * 5 + OUTRO;

const W = 1080;
const H = 1920;

export const TutorialLangkah: React.FC<Props> = (p) => {
  const th = THEMES[p.tema];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const n = Math.min(5, p.langkah.length);
  const tExplode = INTRO;
  const tSteps = INTRO + EXPLODE;
  const tOutro = tSteps + STEP * n;

  const explode = prog(t, tExplode, tExplode + EXPLODE, easeInOut) * (1 - 0.6 * prog(t, tOutro, tOutro + 1.2, easeInOut));
  const step = t >= tSteps && t < tOutro ? Math.floor((t - tSteps) / STEP) : -1;
  const yaw = 0.62 + 0.18 * Math.sin(t * 0.25) + (1 - prog(t, 0, INTRO, easeInOut)) * -0.9;
  const pos: [number, number, number] = [-0.3, 0, 0];
  const scale = 0.95;
  const cam: Cam = { pos: [0, 4.1, 8.0], target: [0.2, 0.3, 0], fov: 32 };
  const c3 = makeCamera(cam, W, H);
  const pm = phoneMatrix(yaw, pos, scale);
  const pts = PHONE_PARTS.map((_, i) => project(c3, toWorld(pm, partAnchor(i, explode)), W, H));
  const ys = spreadLabels(
    pts.map((a) => a.y + 6),
    128,
    520,
    1180,
  );

  const sfx: [number, string, number][] = [
    [0, "swell", 0.15],
    [tExplode, "whoosh", 0.35],
    ...p.langkah.slice(0, n).map((_, i) => [tSteps + i * STEP, "pop", 0.32] as [number, string, number]),
    [tOutro, "ding", 0.3],
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background th={th} t={t} />
      <Stage th={th} cam={cam}>
        <Phone th={th} explode={explode} yaw={yaw} position={pos} scale={scale} hl={step} />
      </Stage>
      <Scrim th={th} strength={0.6} />

      <Kicker th={th} t={t} text={p.kicker} at={0} out={tOutro - 0.3} y={150} />
      <Headline th={th} t={t} text={p.judul} at={0} out={tOutro - 0.4} y={200} size={104} />

      {/* label semua bagian; yang sedang dibahas disorot */}
      {t > tExplode + EXPLODE * 0.7 && t < tOutro
        ? PHONE_PARTS.slice(0, n).map((part, i) => (
            <div key={part.nama} style={{ opacity: step === -1 || step === i ? 1 : 0.35 }}>
              <Callout
                th={th}
                t={t}
                at={tExplode + EXPLODE * 0.7 + i * 0.12}
                out={tOutro - 0.4}
                ax={pts[i].x}
                ay={pts[i].y}
                lx={770}
                ly={ys[i]}
                title={`0${i + 1}`}
                sub={p.langkah[i]?.judul ?? part.nama}
                subSize={30}
                color={step === i ? hi(th) : th.ink}
              />
            </div>
          ))
        : null}

      {/* kartu langkah aktif */}
      {step >= 0 ? (
        <StepCard
          key={step}
          th={th}
          t={t}
          at={tSteps + step * STEP}
          out={tSteps + (step + 1) * STEP - 0.25}
          n={step + 1}
          total={n}
          judul={p.langkah[step].judul}
          info={p.langkah[step].info}
        />
      ) : null}

      <Headline th={th} t={t} text={p.penutup} at={tOutro + 0.1} y={200} size={116} accent={hi(th)} />
      <Chip th={th} t={t} at={tOutro + 0.9} x={70} y={1480} text={`Follow ${p.handle}`} color={th.accent} solid size={34} />
      <Grain th={th} t={t} />

      {p.sfx
        ? sfx.map(([at, name, vol], i) => (
            <Sequence key={i} from={Math.round(at * fps)} durationInFrames={Math.round(3 * fps)} layout="none">
              <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};

const StepCard: React.FC<{ th: (typeof THEMES)["iso"]; t: number; at: number; out: number; n: number; total: number; judul: string; info: string }> = ({ th, t, at, out, n, total, judul, info }) => {
  const s = pop(t, at, 0.55);
  const po = prog(t, out, out + 0.25, easeIn);
  if (s <= 0 || po >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 1395,
        width: 940,
        padding: "26px 30px",
        borderRadius: 28,
        background: th.dark ? hexA("#000000", 0.55) : hexA("#ffffff", 0.86),
        border: `2px solid ${hexA(hi(th), 0.5)}`,
        boxShadow: th.dark ? "none" : "0 20px 50px rgba(15,27,61,0.12)",
        display: "flex",
        gap: 26,
        alignItems: "center",
        transform: `translateY(${(1 - Math.min(1, s)) * 30}px)`,
        opacity: Math.min(1, s * 1.4) * (1 - po),
      }}
    >
      <div style={{ position: "relative", width: 92, height: 92, flex: "none" }}>
        <StepBadge th={th} t={t} at={0} x={0} y={0} n={String(n).padStart(2, "0")} />
      </div>
      <div>
        <div style={{ fontFamily: th.font.mono, fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", color: th.muted }}>
          LANGKAH {n} / {total}
        </div>
        <div style={{ marginTop: 6, fontFamily: th.font.display, fontWeight: th.font.displayWeight, fontSize: 48, color: th.ink, letterSpacing: th.font.tracking, lineHeight: 1.05 }}>{judul}</div>
        <div style={{ marginTop: 8, fontFamily: th.font.body, fontWeight: 500, fontSize: 30, color: th.muted, lineHeight: 1.3 }}>{info}</div>
      </div>
    </div>
  );
};

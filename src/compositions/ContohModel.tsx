/**
 * Contoh memakai model .glb sendiri (molekul air dari scripts/make_model.py). ±10 dtk.
 * Ganti `src` dengan model kamu di public/models/. Label memakai posisi atom yang sudah diketahui;
 * untuk model lain, isi titik label sendiri (koordinat model setelah dinormalkan, lihat README).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Background, Grain, Scrim } from "../components/Background";
import { Callout } from "../components/Callout";
import { Chip, Headline, Kicker } from "../components/Text";
import { makeCamera, objMatrix, project, toWorld, type Cam, type V3 } from "../lib";
import { hi, TEMA_IDS, THEMES } from "../themes";
import { Model } from "../three/Model";
import { Stage } from "../three/Stage";

export const contohSchema = z.object({ tema: z.enum(TEMA_IDS) });
export const CONTOH_DURASI = 10;

// posisi atom setelah model dinormalkan (lihat scripts/make_model.py):
// lebar model 2,386 unit, titik tengah kotak y = -0,238 -> skala s = FIT / 2,386
const FIT = 1.7;
const S = FIT / 2.386;
const ATOM = { O: [0, 0.238 * S, 0] as V3, H1: [0.873 * S, -0.438 * S, 0] as V3, H2: [-0.873 * S, -0.438 * S, 0] as V3 };

export const ContohModel: React.FC<z.infer<typeof contohSchema>> = ({ tema }) => {
  const th = THEMES[tema];
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const t = frame / fps;
  const rot: V3 = [0.12, 0.55 * Math.sin(t * 0.5), 0];
  const cam: Cam = th.ortho ? { pos: [0, 0.6, 10], target: [0, 0, 0], fov: 32, ortho: true, zoom: 300 } : { pos: [0, 0.35, 6.4], target: [0, -0.05, 0], fov: 32 };
  const c3 = makeCamera(cam, W, H);
  const m = objMatrix(rot);
  const o = project(c3, toWorld(m, ATOM.O), W, H);
  const h1 = project(c3, toWorld(m, ATOM.H1), W, H);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background th={th} t={t} />
      <Stage th={th} cam={cam}>
        <Model src="models/molekul-air.glb" fit={FIT} rotation={rot} />
      </Stage>
      <Scrim th={th} strength={0.5} />
      <Kicker th={th} t={t} text="Contoh model .glb" at={0} y={150} />
      <Headline th={th} t={t} text="Molekul *air*" at={0} y={200} size={124} />
      <Callout th={th} t={t} at={1.0} ax={o.x} ay={o.y} lx={640} ly={600} title="Oksigen" sub="O" color={hi(th)} />
      <Callout th={th} t={t} at={1.6} ax={h1.x} ay={h1.y} lx={720} ly={1270} title="Hidrogen" sub="H" color={th.accent} />
      <Chip th={th} t={t} at={2.4} x={70} y={1400} text="sudut ikatan ± 104,5°" color={th.accent2} size={34} />
      <Grain th={th} t={t} />
    </AbsoluteFill>
  );
};

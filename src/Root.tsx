import React from "react";
import { Composition, Still } from "remotion";
import { loadAllFonts } from "./fonts";
import { DURASI_TIMELINE, hitungMetadata, LapisanBumi, lapisanDefaults, lapisanSchema } from "./compositions/LapisanBumi";
import { MOOD_H, MOOD_W, Moodboard } from "./compositions/Moodboard";
import { StyleFrame, styleSchema } from "./compositions/StyleFrame";
import { TutorialLangkah, tutorialDefaults, tutorialSchema, TUTORIAL_DURASI } from "./compositions/TutorialLangkah";
import { CONTOH_DURASI, ContohModel, contohSchema } from "./compositions/ContohModel";

loadAllFonts();

export const RemotionRoot: React.FC = () => (
  <>
    {/* Video contoh pengetahuan: "Apa isi Bumi?" */}
    <Composition
      id="LapisanBumi"
      component={LapisanBumi}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={Math.ceil(DURASI_TIMELINE * 30)}
      schema={lapisanSchema}
      defaultProps={lapisanDefaults}
      calculateMetadata={hitungMetadata}
    />
    {/* Template tutorial langkah demi langkah (exploded view) */}
    <Composition
      id="TutorialLangkah"
      component={TutorialLangkah}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={Math.ceil(TUTORIAL_DURASI * 30)}
      schema={tutorialSchema}
      defaultProps={tutorialDefaults}
    />
    {/* Contoh memakai model .glb sendiri */}
    <Composition
      id="ContohModel"
      component={ContohModel}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={CONTOH_DURASI * 30}
      schema={contohSchema}
      defaultProps={{ tema: "glass" as const }}
    />
    <Still id="Moodboard" component={Moodboard} width={MOOD_W} height={MOOD_H} />
    <Still id="GayaFrame" component={StyleFrame} width={1080} height={1920} schema={styleSchema} defaultProps={{ tema: "neon" as const, jenis: "cutaway" as const }} />
  </>
);

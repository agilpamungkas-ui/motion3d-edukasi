import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Semua font berlisensi SIL Open Font License (bebas dipakai komersial). File ada di public/fonts.
const FONTS: [family: string, file: string, weight: string, style: string][] = [
  ["Poppins", "poppins-latin-500-normal.woff2", "500", "normal"],
  ["Poppins", "poppins-latin-600-normal.woff2", "600", "normal"],
  ["Poppins", "poppins-latin-700-normal.woff2", "700", "normal"],
  ["Plus Jakarta Sans", "plus-jakarta-sans-latin-500-normal.woff2", "500", "normal"],
  ["Plus Jakarta Sans", "plus-jakarta-sans-latin-700-normal.woff2", "700", "normal"],
  ["Plus Jakarta Sans", "plus-jakarta-sans-latin-800-normal.woff2", "800", "normal"],
  ["Plus Jakarta Sans", "plus-jakarta-sans-latin-800-italic.woff2", "800", "italic"],
  ["Space Grotesk", "space-grotesk-latin-500-normal.woff2", "500", "normal"],
  ["Space Grotesk", "space-grotesk-latin-700-normal.woff2", "700", "normal"],
  ["JetBrains Mono", "jetbrains-mono-latin-500-normal.woff2", "500", "normal"],
  ["JetBrains Mono", "jetbrains-mono-latin-700-normal.woff2", "700", "normal"],
  ["Fraunces", "fraunces-latin-600-normal.woff2", "600", "normal"],
  ["Fraunces", "fraunces-latin-800-normal.woff2", "800", "normal"],
  ["Fraunces", "fraunces-latin-600-italic.woff2", "600", "italic"],
  ["Instrument Serif", "instrument-serif-latin-400-normal.woff2", "400", "normal"],
  ["Instrument Serif", "instrument-serif-latin-400-italic.woff2", "400", "italic"],
];

let loaded = false;

export const loadAllFonts = () => {
  if (loaded) {
    return;
  }
  loaded = true;
  for (const [family, file, weight, style] of FONTS) {
    loadFont({ family, url: staticFile(`fonts/${file}`), weight, style });
  }
};

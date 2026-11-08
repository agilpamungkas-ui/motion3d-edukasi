/**
 * 6 gaya visual. Ganti gaya = ganti satu kata (`tema`) di panel kanan Remotion Studio.
 * Aturan warna: SATU aksen utama yang punya arti (jawaban, hal yang berubah). Jangan tambah hex baru di komponen.
 */
export const TEMA_IDS = ["neon", "clay", "glass", "paper", "cinema", "iso"] as const;
export type TemaId = (typeof TEMA_IDS)[number];

export type BgKind = "grid" | "dots" | "paper" | "gradient" | "iso";
type V3 = [number, number, number];

export type Theme = {
  id: TemaId;
  nama: string;
  cocok: string;
  dark: boolean;
  bg: { kind: BgKind; top: string; mid: string; bottom: string; line: string; lineOpacity: number; cell: number; twinkle: boolean; dust: boolean };
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  accent3: string;
  capHi: string;
  font: { display: string; displayWeight: number; body: string; bodyWeight: number; capWeight: number; mono: string; tracking: string; accentItalic: boolean };
  mat: {
    roughness: number;
    metalness: number;
    lowPoly: boolean;
    clearcoat: number;
    surfaceGlow: number;
    emissiveFaces: number;
    lines: number;
    lineColor: string;
    atmo: number;
    atmoColor: string;
  };
  light: { ambient: number; hemiSky: string; hemiGround: string; hemi: number; key: number; keyColor: string; keyPos: V3; rim: number; rimColor: string; rimPos: V3 };
  /** warna lapisan: kerak, mantel, inti luar, inti dalam */
  layers: [string, string, string, string];
  earth: { deep: string; ocean: string; land: string; high: string; ice: string; coast: string | null; posterize: number };
  grain: number;
  vignette: number;
  ortho: boolean;
};

export const THEMES: Record<TemaId, Theme> = {
  neon: {
    id: "neon",
    nama: "Neon Grid",
    cocok: "sains, teknologi, fakta cepat (senada gaya BOOKSMARTID)",
    dark: true,
    bg: { kind: "grid", top: "#0D2F24", mid: "#09231B", bottom: "#070909", line: "#7DE2B8", lineOpacity: 0.07, cell: 60, twinkle: true, dust: true },
    ink: "#F0F0F0",
    muted: "#8DB5A3",
    accent: "#4DA8F0",
    accent2: "#FFD84D",
    accent3: "#FF5FA2",
    capHi: "#FFEB3B",
    font: { display: "Poppins", displayWeight: 700, body: "Poppins", bodyWeight: 600, capWeight: 700, mono: "JetBrains Mono", tracking: "-0.01em", accentItalic: false },
    mat: { roughness: 0.55, metalness: 0.1, lowPoly: false, clearcoat: 0, surfaceGlow: 0.55, emissiveFaces: 0.32, lines: 0.5, lineColor: "#4DA8F0", atmo: 1.1, atmoColor: "#4DA8F0" },
    light: { ambient: 0.35, hemiSky: "#a6e9ff", hemiGround: "#06140f", hemi: 0.55, key: 2.1, keyColor: "#ffffff", keyPos: [3, 4, 5], rim: 2.6, rimColor: "#4DA8F0", rimPos: [-4, 2, -3] },
    layers: ["#4DA8F0", "#FF6B6B", "#FFB347", "#FFD84D"],
    earth: { deep: "#03241C", ocean: "#0A3A2E", land: "#1E6B52", high: "#2F8F6E", ice: "#CFEFE4", coast: "#4DA8F0", posterize: 0 },
    grain: 0.06,
    vignette: 0.5,
    ortho: false,
  },
  clay: {
    id: "clay",
    nama: "Clay Pastel",
    cocok: "edukasi umum, psikologi ringan, tutorial yang ramah",
    dark: false,
    bg: { kind: "dots", top: "#F8F1E8", mid: "#F2E7DA", bottom: "#E9DCCB", line: "#C4AE98", lineOpacity: 0.45, cell: 54, twinkle: false, dust: false },
    ink: "#2B2420",
    muted: "#8C7B6E",
    accent: "#FF6B4A",
    accent2: "#4A7BFF",
    accent3: "#FFC93C",
    capHi: "#FF6B4A",
    font: { display: "Plus Jakarta Sans", displayWeight: 800, body: "Plus Jakarta Sans", bodyWeight: 700, capWeight: 800, mono: "JetBrains Mono", tracking: "-0.035em", accentItalic: true },
    mat: { roughness: 0.95, metalness: 0, lowPoly: false, clearcoat: 0, surfaceGlow: 0, emissiveFaces: 0.04, lines: 0, lineColor: "#000000", atmo: 0, atmoColor: "#ffffff" },
    light: { ambient: 0.6, hemiSky: "#fff3e6", hemiGround: "#c9a98a", hemi: 0.9, key: 2.3, keyColor: "#fff1e0", keyPos: [3, 5, 4], rim: 0.9, rimColor: "#ffd2b0", rimPos: [-3, 2, -4] },
    layers: ["#C9A27E", "#F28C5B", "#F7C548", "#FFF1C1"],
    earth: { deep: "#6FA8DC", ocean: "#8CC2EE", land: "#94CC86", high: "#C5E3A0", ice: "#FFFFFF", coast: null, posterize: 0 },
    grain: 0.05,
    vignette: 0.12,
    ortho: false,
  },
  glass: {
    id: "glass",
    nama: "Glass Lab",
    cocok: "teknologi, AI, keuangan, sains modern",
    dark: true,
    bg: { kind: "dots", top: "#0B1236", mid: "#070B22", bottom: "#03040C", line: "#7C9CFF", lineOpacity: 0.16, cell: 48, twinkle: false, dust: true },
    ink: "#EEF2FF",
    muted: "#93A0D6",
    accent: "#62F3E0",
    accent2: "#7C9CFF",
    accent3: "#FF7AD9",
    capHi: "#62F3E0",
    font: { display: "Space Grotesk", displayWeight: 700, body: "Plus Jakarta Sans", bodyWeight: 700, capWeight: 800, mono: "JetBrains Mono", tracking: "-0.025em", accentItalic: false },
    mat: { roughness: 0.18, metalness: 0.05, lowPoly: false, clearcoat: 1, surfaceGlow: 0.15, emissiveFaces: 0.3, lines: 0.28, lineColor: "#7C9CFF", atmo: 0.9, atmoColor: "#7C9CFF" },
    light: { ambient: 0.3, hemiSky: "#a9b8ff", hemiGround: "#0a0f2a", hemi: 0.6, key: 2.0, keyColor: "#ffffff", keyPos: [2, 4, 5], rim: 3.2, rimColor: "#FF7AD9", rimPos: [-4, 1, -3] },
    layers: ["#62F3E0", "#7C9CFF", "#B57CFF", "#FF7AD9"],
    earth: { deep: "#0B1446", ocean: "#16247C", land: "#3A55C8", high: "#6F86FF", ice: "#E6EBFF", coast: "#62F3E0", posterize: 0 },
    grain: 0.05,
    vignette: 0.45,
    ortho: false,
  },
  paper: {
    id: "paper",
    nama: "Paper Craft",
    cocok: "sejarah, budaya, storytelling, buku",
    dark: false,
    bg: { kind: "paper", top: "#F4ECDE", mid: "#EFE5D3", bottom: "#E6D9C2", line: "#B9A98D", lineOpacity: 0, cell: 0, twinkle: false, dust: false },
    ink: "#2E2A24",
    muted: "#857A6A",
    accent: "#D94F30",
    accent2: "#2F6F73",
    accent3: "#E9B44C",
    capHi: "#D94F30",
    font: { display: "Fraunces", displayWeight: 800, body: "Plus Jakarta Sans", bodyWeight: 700, capWeight: 800, mono: "JetBrains Mono", tracking: "-0.02em", accentItalic: true },
    mat: { roughness: 1, metalness: 0, lowPoly: true, clearcoat: 0, surfaceGlow: 0, emissiveFaces: 0.02, lines: 0, lineColor: "#2E2A24", atmo: 0, atmoColor: "#ffffff" },
    light: { ambient: 0.6, hemiSky: "#fff8ec", hemiGround: "#b8a487", hemi: 0.7, key: 2.6, keyColor: "#fff6e8", keyPos: [4, 5, 3], rim: 0.6, rimColor: "#ffe2c4", rimPos: [-3, 2, -4] },
    layers: ["#B98B5E", "#D94F30", "#E9B44C", "#F6E3B4"],
    earth: { deep: "#2F6F73", ocean: "#4F9A94", land: "#A5B66A", high: "#D9C27E", ice: "#FBF7EE", coast: null, posterize: 4 },
    grain: 0.07,
    vignette: 0.16,
    ortho: false,
  },
  cinema: {
    id: "cinema",
    nama: "Cinematic Dark",
    cocok: "misteri, investigasi, true crime, suasana mencekam",
    dark: true,
    bg: { kind: "gradient", top: "#0E0B09", mid: "#070606", bottom: "#000000", line: "#ffffff", lineOpacity: 0, cell: 0, twinkle: false, dust: true },
    ink: "#F5F1EA",
    muted: "#9A9186",
    accent: "#FF5A1F",
    accent2: "#E8C07D",
    accent3: "#9AA4B2",
    capHi: "#FF7A3D",
    font: { display: "Instrument Serif", displayWeight: 400, body: "Plus Jakarta Sans", bodyWeight: 700, capWeight: 800, mono: "JetBrains Mono", tracking: "-0.01em", accentItalic: true },
    mat: { roughness: 0.6, metalness: 0.2, lowPoly: false, clearcoat: 0.3, surfaceGlow: 0, emissiveFaces: 0.18, lines: 0, lineColor: "#000000", atmo: 0.55, atmoColor: "#FF5A1F" },
    light: { ambient: 0.06, hemiSky: "#3a3530", hemiGround: "#000000", hemi: 0.25, key: 2.9, keyColor: "#ffe9d6", keyPos: [4, 3, 2.5], rim: 4.5, rimColor: "#FF5A1F", rimPos: [-4, 1.2, -2] },
    layers: ["#6B5E52", "#A63A1E", "#E0702A", "#FFC266"],
    earth: { deep: "#0D1418", ocean: "#1A2A33", land: "#3D4A3A", high: "#6B6A55", ice: "#D9D6CF", coast: null, posterize: 0 },
    grain: 0.12,
    vignette: 0.85,
    ortho: false,
  },
  iso: {
    id: "iso",
    nama: "Isometric Bright",
    cocok: "cara kerja, tutorial langkah demi langkah, infografis",
    dark: false,
    bg: { kind: "iso", top: "#F5F8FF", mid: "#EAF1FF", bottom: "#DCE7FF", line: "#2F6BFF", lineOpacity: 0.09, cell: 64, twinkle: false, dust: false },
    ink: "#0F1B3D",
    muted: "#5B6B94",
    accent: "#2F6BFF",
    accent2: "#FFB020",
    accent3: "#FF5C7A",
    capHi: "#2F6BFF",
    font: { display: "Plus Jakarta Sans", displayWeight: 800, body: "Plus Jakarta Sans", bodyWeight: 700, capWeight: 800, mono: "JetBrains Mono", tracking: "-0.035em", accentItalic: false },
    mat: { roughness: 0.6, metalness: 0, lowPoly: false, clearcoat: 0, surfaceGlow: 0, emissiveFaces: 0.05, lines: 0.22, lineColor: "#0F1B3D", atmo: 0, atmoColor: "#ffffff" },
    light: { ambient: 0.65, hemiSky: "#ffffff", hemiGround: "#b9c9ee", hemi: 0.8, key: 2.2, keyColor: "#ffffff", keyPos: [3, 5, 2], rim: 1.0, rimColor: "#cfe0ff", rimPos: [-3, 2, -3] },
    layers: ["#8FA8D8", "#FF8A5C", "#FFB020", "#FFE08A"],
    earth: { deep: "#2F6BFF", ocean: "#5B8DFF", land: "#4CC38A", high: "#9BE0B5", ice: "#FFFFFF", coast: null, posterize: 0 },
    grain: 0.03,
    vignette: 0.08,
    ortho: true,
  },
};

/** warna sorotan (label, penanda): neon pakai kuning khas BOOKSMARTID, tema lain pakai aksen */
export const hi = (th: Theme) => (th.id === "neon" ? th.accent2 : th.accent);

/** '#RRGGBB' + alpha -> 'rgba(...)' */
export const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** campur dua warna hex (ruang sRGB), t = 0..1 */
export const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round((((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
};

# Repo motion lain yang ditemukan (riset Nov 2026)

Ringkasan riset sebelum kit ini dibuat. Kesimpulannya: mesinnya sudah ada (HyperFrames, Remotion), tapi belum ada template gratis siap pakai untuk konten pengetahuan 3D 9:16. Karena itu kit ini dibangun di atas Remotion + React Three Fiber.

| Repo | Isi | Kelebihan | Catatan |
|---|---|---|---|
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | HTML + CSS + GSAP jadi MP4 deterministik, dibuat untuk agen AI | Paling dekat dengan alur HTML/GSAP-mu; Apache-2.0; skill `/hyperframes` untuk Claude Code; katalog ±450 blok termasuk 3D & gerak kamera | Gaya "3D Brand/Science Explainer" lewat `/style-sampling` termasuk fitur Pro (berbayar). Butuh Node 22+ & FFmpeg |
| [remotion-dev/template-three](https://github.com/remotion-dev/template-three) | Template resmi Remotion + React Three Fiber | Dukungan 3D resmi (`@remotion/three`), frame-akurat | Contohnya minim (HP berputar), belum ada pola konten edukasi |
| [remotion-dev/skills](https://www.remotion.dev/docs/ai/skills) | Skill resmi Remotion untuk Claude Code | Claude jadi paham aturan Remotion | `npx remotion skills add` di folder repo |
| [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | Python, animasi matematika gaya 3Blue1Brown, ada `ThreeDScene` | Terbaik untuk matematika/fisika | Gaya khas "papan tulis", kurang cocok untuk objek 3D realistis |
| [theatre-js/theatre](https://github.com/theatre-js/theatre) | Editor keyframe visual untuk Three.js | Atur gerak kamera dengan mouse | Pengembangan publik pindah ke repo privat; Studio berlisensi AGPL |
| [Revideo](https://docs.re.video/3d-animations-with-threejs) | Turunan Motion Canvas, bisa memasang Three.js | Kode TypeScript, ringan | Fokus 2D |
| [echris6/motion-video-kit](https://notes.nicolasdeville.com/github/motion-video-kit/) | Skill Claude Code untuk video peluncuran bisnis | Aturan gerak dari 28 film, *critic loop*, pola Three.js | Untuk iklan bisnis, bukan konten edukasi |

Lisensi Remotion: gratis untuk perorangan dan perusahaan sampai 3 orang ([FAQ lisensi](https://www.remotion.dev/docs/license/faq)).

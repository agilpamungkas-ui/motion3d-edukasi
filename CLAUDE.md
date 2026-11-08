# CLAUDE.md: panduan kerja di repo ini

Repo ini adalah kit video 3D 9:16 (Remotion 4 + React Three Fiber + three.js 0.178) untuk konten tutorial & pengetahuan milik Agil (IG @agilpamungks, YouTube Shorts). Bahasa konten: Indonesia santai.

## Perintah
- `npm run dev`: Remotion Studio (preview).
- `npx remotion still <Komposisi> out/x.png --frame=<n>`: satu frame.
- `node scripts/contact-sheet.mjs . <Komposisi> <detik,...> [props] [skala]` lalu `python scripts/sheet.py ...`: contact sheet untuk review.
- `npm run render` / `render:preview` / `render:tutorial` / `moodboard`.
- `npx tsc`: cek tipe (wajib bersih sebelum selesai).
- Di sandbox Linux tanpa GPU: tambahkan `--gl=angle` (atau `--gl=swangle`) dan `--browser-executable=<chrome-headless-shell>` bila perlu.

## Arsitektur
- **Waktu hidup di `timeline.json`**: tiap adegan `sN` punya `start`, `end`, ketukan bernama, dan `cap` (subtitle `[teks, mulai, selesai]`). `sfx` = `[detik, nama, volume]`. Komponen tidak boleh menulis detik sendiri, kecuali offset relatif dari ketukan (`n(TL.s2,"kola") + 1.8`).
- **Semua gerak = fungsi murni dari `t`** (`useT()` di `src/lib.ts`). Tanpa CSS transition, tanpa `Math.random()` (pakai `rand(n)`), tanpa `Date`.
- **Gaya = token di `src/themes.ts`**. Jangan menulis hex baru di komponen. Warna sorotan: `hi(th)`.
- **3D** di `src/three/`. Komponen 3D menerima keadaan sebagai prop (spin, cut, explode, draw...), bukan animasi sendiri.
- **Label menempel ke objek 3D**: hitung titik 3D lewat `makeCamera(cam)`, `objMatrix`/`earthMatrix`, `toWorld`, dan `project` (kamera yang sama dengan `<Stage cam>`). Rapikan label bertumpuk dengan `spreadLabels`.
- Kamera: `camTrack(t, KEYS)`. Tiap kunci = pindah ke posisi kamera mulai `at` selama `dur`.
- Model .glb: `<Model src="models/x.glb" fit={2} />` di dalam `<Stage>`.

## Selera gerak (dari skill motion-design)
- Easing: masuk `easeOut`, keluar `easeIn` (durasinya ±setengah dari masuk), pindah keadaan `easeInOut`, momen mendarat `overshoot`. Linear hanya untuk gerak terus-menerus (rotasi).
- Stagger kata ±0,09 dtk, item daftar ±0,2–0,25 dtk. Adegan saling tumpang-tindih, jangan ada jeda kosong.
- Tahan teks cukup lama untuk dibaca: minimal 1 dtk, +0,25 dtk per kata setelah 3 kata.
- Satu fokus per frame. Satu momen "hero" per video (di contoh: Bumi dibelah).
- Frame 0 tidak boleh kosong (jadi thumbnail). Area aman: atas ±150 px, bawah ±250 px (UI Reels/Shorts). Subtitle di y ≈ 1480.
- Teks di layar ≤ 4–6 kata. Aksen satu frasa: `"Seberapa *dalam* kamu bisa menggali?"`.

## Cara kerja yang Agil suka
- Alur: topik, lalu naskah, timeline.json, adegan, contact sheet, baru render MP4 setelah Agil bilang oke.
- Naskah narasi **lebih dari 60 detik**, dengan tag ekspresi berbahasa Inggris untuk TTS, contoh `[warm, empathetic]`, `[curious]`.
- Durasi video mengikuti durasi audio narasi (`public/audio/narasi.mp3`).
- SFX halus saja (pop, whoosh tipis, ding kecil). Video tanpa suara tidak disukai.
- Fakta wajib bersumber. Catat di `docs/sumber-fakta.md`. Yang belum terverifikasi tandai [CEK].
- Jangan mengaku sudah mendengar audio atau menonton video. Yang bisa dicek hanya frame diam.

## Menambah video baru
1. Salin pola `src/compositions/LapisanBumi.tsx` (atau `TutorialLangkah.tsx` untuk tutorial).
2. Buat file timeline sendiri (mis. `timeline-pesawat.json`) dan impor di komposisi baru.
3. Daftarkan di `src/Root.tsx` (1080×1920, 30 fps, `schema` zod agar bisa diatur dari panel).
4. Cek `npx tsc`, buat contact sheet, perbaiki tabrakan teks/objek, baru render.

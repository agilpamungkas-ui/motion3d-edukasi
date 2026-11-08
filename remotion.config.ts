/**
 * Pengaturan render. Berlaku untuk `npm run dev`, `npm run render`, dan `npm run moodboard`.
 * Semua opsi: https://remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";

// Three.js (WebGL) butuh renderer "angle" supaya model 3D ikut terender di laptop (Windows/Mac).
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(20);
Config.setPixelFormat("yuv420p");

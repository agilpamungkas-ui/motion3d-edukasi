// Render beberapa frame diam sekaligus (satu browser) untuk dicek sebelum render penuh.
// Pakai: node scripts/contact-sheet.mjs . LapisanBumi 0,10,24,34 [propsJSON] [skala]
// Lalu (opsional) gabungkan jadi satu gambar: python scripts/sheet.py out/contact/LapisanBumi_list.json out/contact.jpg
// Variabel lingkungan BROWSER (opsional) = path Chrome/Chromium; kosongkan agar Remotion memakai browser bawaannya.
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const [, , dirArg, id, timesArg, propsArg, scaleArg] = process.argv;
const dir = path.resolve(dirArg);
const require = createRequire(path.join(dir, "package.json"));
const { bundle } = require("@remotion/bundler");
const { openBrowser, selectComposition, renderStill } = require("@remotion/renderer");
const times = timesArg.split(",").map(Number);
const inputProps = propsArg ? JSON.parse(propsArg) : {};
const scale = scaleArg ? Number(scaleArg) : 0.4;
const outDir = path.join(dir, "out", "contact");
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(dir, "src/index.ts"), onProgress: () => {} });
const browserExecutable = process.env.BROWSER || null;
const chromiumOptions = { gl: "angle" };
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const composition = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, browserExecutable, chromiumOptions });
const files = [];
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
  const output = path.join(outDir, `${id}_${String(t).replace(".", "_")}.jpg`);
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, output, frame, imageFormat: "jpeg", jpegQuality: 85, scale, inputProps, puppeteerInstance: browser, browserExecutable, chromiumOptions, overwrite: true });
  files.push([t, output]);
  console.log(`t=${t}s frame=${frame} ${Date.now() - t0}ms`);
}
await browser.close({ silent: true });
fs.writeFileSync(path.join(outDir, `${id}_list.json`), JSON.stringify(files));

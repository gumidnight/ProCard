/**
 * Brand asset exporter — SVG → PNG
 * Run: node scripts/export-brand.mjs
 */

import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const brandDir = join(root, "public", "brand");
const outDir = join(brandDir, "exports");

await mkdir(outDir, { recursive: true });

const exports_ = [
  // Mark — all profile picture / icon sizes
  { src: "mark-dark.svg", out: "mark-512.png", w: 512, h: 512 },
  { src: "mark-dark.svg", out: "mark-256.png", w: 256, h: 256 },
  { src: "mark-dark.svg", out: "mark-180.png", w: 180, h: 180 },
  { src: "mark-dark.svg", out: "mark-64.png", w: 64, h: 64 },
  { src: "mark-dark.svg", out: "mark-32.png", w: 32, h: 32 },
  { src: "mark-dark.svg", out: "mark-16.png", w: 16, h: 16 },
  { src: "mark-light.svg", out: "mark-light-512.png", w: 512, h: 512 },

  // Logo horizontal — social headers / embeds
  { src: "logo-dark.svg", out: "logo-dark-2x.png", w: 520, h: 96 },
  { src: "logo-dark.svg", out: "logo-dark-1x.png", w: 260, h: 48 },
  { src: "logo-light.svg", out: "logo-light-2x.png", w: 520, h: 96 },
  { src: "logo-light.svg", out: "logo-light-1x.png", w: 260, h: 48 },

  // Stacked — square social avatar / app store
  { src: "logo-stacked.svg", out: "logo-stacked-512.png", w: 512, h: 320 },
  { src: "logo-stacked.svg", out: "logo-stacked-256.png", w: 256, h: 160 },
];

let ok = 0;
let failed = 0;

for (const { src, out, w, h } of exports_) {
  try {
    await sharp(join(brandDir, src))
      .resize(w, h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(join(outDir, out));
    console.log(`✓  ${out}  (${w}×${h})`);
    ok++;
  } catch (err) {
    console.error(`✗  ${out}  — ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${ok} exported, ${failed} failed → public/brand/exports/`);

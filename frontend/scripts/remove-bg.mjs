/**
 * Remove backgrounds from images using ML segmentation + edge erosion.
 *
 * Usage:
 *   node scripts/remove-bg.mjs <input> [output] [--erode=3]
 */

import { removeBackground } from "@imgly/background-removal-node";
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const positional = args.filter((a) => !a.startsWith("--"));

if (positional.length === 0) {
  console.error("Usage: node scripts/remove-bg.mjs <input> [output] [--erode=3]");
  process.exit(1);
}

const inputPath = resolve(positional[0]);
const outputPath = resolve(positional[1] || positional[0]);

const erodeFlag = flags.find((f) => f.startsWith("--erode="));
const ERODE_PX = erodeFlag ? parseInt(erodeFlag.split("=")[1], 10) : 3;

async function removeBg(input, output) {
  console.log(`ML segmentation: ${input}...`);
  const imageBuffer = readFileSync(input);
  const blob = new Blob([imageBuffer], { type: "image/png" });

  const result = await removeBackground(blob);
  const pngBuffer = Buffer.from(await result.arrayBuffer());

  // Parse PNG to get raw pixels
  const png = PNG.sync.read(pngBuffer);
  const { width: w, height: h, data: pixels } = png;

  console.log(`Eroding edges by ${ERODE_PX}px...`);

  // Extract alpha
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    alpha[i] = pixels[i * 4 + 3];
  }

  // Erode: set each pixel's alpha to the min in its neighborhood
  const eroded = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let minA = 255;
      for (let dy = -ERODE_PX; dy <= ERODE_PX; dy++) {
        for (let dx = -ERODE_PX; dx <= ERODE_PX; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
            minA = 0;
          } else {
            minA = Math.min(minA, alpha[ny * w + nx]);
          }
        }
      }
      eroded[y * w + x] = minA;
    }
  }

  // Write eroded alpha back
  for (let i = 0; i < w * h; i++) {
    pixels[i * 4 + 3] = eroded[i];
  }

  const outPng = PNG.sync.write(png);
  writeFileSync(output, outPng);
  console.log(`Saved: ${output} (${outPng.length} bytes)`);
}

await removeBg(inputPath, outputPath);

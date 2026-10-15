import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { cropDetection } from "./crop.ts";

async function photo(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#808080" } }).jpeg().toBuffer();
}

test("crops the padded box and returns a JPEG data URL", async () => {
  const image = await photo(1000, 800);
  const { crop, area } = await cropDetection(image, { x1: 0.25, y1: 0.25, x2: 0.75, y2: 0.75 });
  assert.match(crop, /^data:image\/jpeg;base64,/);
  const meta = await sharp(Buffer.from(crop.split(",")[1], "base64")).metadata();
  // 0.5 wide box padded 4% each side = 0.54 of 1000 px; under the 512 cap it is scaled down.
  assert.equal(meta.width, 512);
  assert.ok(Math.abs(area - 0.54 * 0.54) < 0.001);
});

test("small crops are not enlarged", async () => {
  const image = await photo(400, 400);
  const { crop } = await cropDetection(image, { x1: 0, y1: 0, x2: 0.5, y2: 0.5 });
  const meta = await sharp(Buffer.from(crop.split(",")[1], "base64")).metadata();
  assert.equal(meta.width, 208);
});

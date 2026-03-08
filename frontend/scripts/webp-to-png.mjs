import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.resolve("public");
const FILES = ["hero-casual.png", "hero-outfit.png"];

for (const file of FILES) {
  const filePath = path.join(PUBLIC_DIR, file);
  console.log(`Converting ${file} to PNG...`);
  const input = await readFile(filePath);
  const buffer = await sharp(input).png().toBuffer();
  await writeFile(filePath, buffer);
  console.log(`  Done.`);
}

import Replicate from "replicate";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const IMAGES = ["hero-casual.png", "hero-outfit.png"];
const PUBLIC_DIR = path.resolve("public");

async function removeBackground(filename) {
  const filePath = path.join(PUBLIC_DIR, filename);
  const buffer = await readFile(filePath);
  const base64 = buffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  console.log(`Processing ${filename}...`);

  const output = await replicate.run("openai/gpt-image-1.5", {
    input: {
      prompt: "Remove the background from this image completely. Output only the person/clothing with a fully transparent background. Keep every detail of the subject intact.",
      image: dataUri,
      quality: "high",
    },
  });

  const url = output[0].url();
  console.log(`  Got result: ${url}`);

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));
  console.log(`  Saved ${filename}`);
}

for (const img of IMAGES) {
  await removeBackground(img);
}

console.log("Done.");

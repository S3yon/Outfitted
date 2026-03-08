const API_KEY = "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";
const MODEL = "google/gemini-3.1-flash-image-preview";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

async function generateImage(messages, filename) {
  console.log(`Generating: ${filename}...`);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": "https://outfitted.dev",
      "X-OpenRouter-Title": "Outfitted",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error("No message in response");

  const images = message.images;
  if (images?.length) {
    const imageUrl = images[0]?.image_url?.url;
    if (imageUrl) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const buffer = Buffer.from(match[2], "base64");
        const outPath = join(publicDir, `${filename}.png`);
        writeFileSync(outPath, buffer);
        console.log(`Saved: ${outPath} (${buffer.length} bytes)\n`);
        return outPath;
      }
    }
  }

  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) {
        const match = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const buffer = Buffer.from(match[2], "base64");
          const outPath = join(publicDir, `${filename}.png`);
          writeFileSync(outPath, buffer);
          console.log(`Saved: ${outPath} (${buffer.length} bytes)\n`);
          return outPath;
        }
      }
    }
  }

  console.log("Message keys:", Object.keys(message));
  throw new Error("No image found in response");
}

async function main() {
  // Step 1: Generate casual image
  const casualPath = await generateImage(
    [
      {
        role: "user",
        content:
          "Generate a photorealistic full-body image of a young man (early 20s, athletic build, short dark hair) standing centered facing the camera on a pure white background. Show from chin level down to feet - the chin and jawline are visible but eyes/nose are cropped out of frame. He is wearing very basic plain clothes: a plain white t-shirt with no print, basic grey sweatpants, plain white socks and slides. No accessories, no watch, no jewelry. Neutral relaxed standing pose with arms at sides. Clean studio lighting, no shadows on background. The background must be completely solid white. Portrait orientation, high quality.",
      },
    ],
    "hero-casual",
  );

  // Step 2: IMAGE EDIT - swap clothes on the existing casual photo
  const casualBase64 = readFileSync(casualPath).toString("base64");
  const fitRefBase64 = readFileSync(join(publicDir, "fit1.jpeg")).toString("base64");

  await generateImage(
    [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${casualBase64}` },
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${fitRefBase64}` },
          },
          {
            type: "text",
            text: "Edit the first image. Replace ONLY the clothes on this person with the outfit shown in the second image. The second image is a flatlay showing: a white Maison Margiela numbers t-shirt, dark pinstripe wide-leg trousers, black Chrome Hearts birkenstock clogs, a Vivienne Westwood necklace, a silver bracelet, and clear glasses. Swap his plain white tee and grey sweats for this outfit. Add a silver watch on his wrist too. Do NOT move the person, do NOT change the pose, do NOT change the background. Keep the exact same body position, framing, and white background. Only the clothing changes.",
          },
        ],
      },
    ],
    "hero-outfit",
  );

  console.log("Done! Both images generated.");
}

main();

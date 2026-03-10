import Replicate from "replicate";
import sharp from "sharp";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function segmentClothing(imageBuffer: Buffer): Promise<Buffer> {
  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const output = await replicate.run("naklecha/clothing-segmentation:501aa8488496fffc6bbee9544729dc28654649f2e3c80de0bf08fb9fe71898f8", {
    input: { image: dataUri },
  }) as unknown;

  // Output may be a URL string, FileOutput, or array — handle all cases
  const resultUrl = Array.isArray(output) ? String(output[0]) : String(output);

  const res = await fetch(resultUrl);
  if (!res.ok) throw new Error(`Failed to fetch segmentation result: ${res.status}`);
  const resultBuffer = Buffer.from(await res.arrayBuffer());

  // Check if output is already a transparent PNG (RGBA) or a mask
  const meta = await sharp(resultBuffer).metadata();

  if (meta.channels === 4) {
    // Already has alpha — it's the isolated item
    return resultBuffer;
  }

  // It's a grayscale mask — apply it as alpha to the original
  const { data: orig, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: maskData } = await sharp(resultBuffer)
    .resize(info.width, info.height)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < info.width * info.height; i++) {
    orig[i * 4 + 3] = maskData[i];
  }

  return sharp(orig, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

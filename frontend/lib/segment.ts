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

  const meta = await sharp(resultBuffer).metadata();

  // Get mask data — either the alpha channel of an RGBA result, or the grayscale mask
  let maskData: Buffer;
  let width: number;
  let height: number;

  if (meta.channels === 4) {
    // RGBA result — extract alpha as the mask
    const { data, info } = await sharp(resultBuffer)
      .extractChannel(3)
      .raw()
      .toBuffer({ resolveWithObject: true });
    maskData = Buffer.from(data);
    width = info.width;
    height = info.height;
  } else {
    // Grayscale mask
    const { data, info } = await sharp(resultBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    maskData = Buffer.from(data);
    width = info.width;
    height = info.height;
  }

  // Resize original to match mask dimensions and apply mask as alpha
  const { data: orig } = await sharp(imageBuffer)
    .resize(width, height)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Resize mask to match if needed (should already match)
  const { data: resizedMask } = await sharp(maskData, { raw: { width, height, channels: 1 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < width * height; i++) {
    // Mask is inverted: dark = clothing, light = background
    orig[i * 4 + 3] = resizedMask[i] < 128 ? 255 : 0;
  }

  return sharp(orig, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();
}

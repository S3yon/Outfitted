import Replicate from "replicate";
import sharp from "sharp";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function isolateItem(
  imageBase64: string,
  mimeType: string,
  description: string,
): Promise<Buffer> {
  const dataUri = `data:${mimeType};base64,${imageBase64}`;
  const originalBuffer = Buffer.from(imageBase64, "base64");

  // Use Grounded SAM to segment exactly the described clothing item
  // output[2] = mask.jpg — white where the item is, black elsewhere
  const output = await replicate.run("schananas/grounded_sam", {
    input: {
      image: dataUri,
      mask_prompt: description,
      negative_mask_prompt: "",
      adjustment_factor: 15,
    },
  }) as unknown[];

  const maskUrl = String(output[2]);
  const maskRes = await fetch(maskUrl);
  if (!maskRes.ok) throw new Error(`Failed to fetch mask: ${maskRes.status}`);
  const maskBuffer = Buffer.from(await maskRes.arrayBuffer());

  // Apply mask as alpha channel — keeps only the item pixels
  const { data: orig, info } = await sharp(originalBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: maskData } = await sharp(maskBuffer)
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

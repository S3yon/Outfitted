import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function isolateItem(
  imageBase64: string,
  mimeType: string,
  description: string,
): Promise<Buffer> {
  const dataUri = `data:${mimeType};base64,${imageBase64}`;

  const output = await replicate.run("openai/gpt-image-1.5", {
    input: {
      prompt: `Extract ONLY the "${description}" from this photo. Remove everything else. Output just the isolated ${description} on a completely transparent background, as a clean product photo. Keep the original item exactly as it appears - same color, same texture, same details. No other objects, no person, no background.`,
      image: dataUri,
      quality: "high",
    },
  });

  const url = (output as Array<{ url: () => string }>)[0].url();
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

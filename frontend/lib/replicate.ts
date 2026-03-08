import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function isolateItem(
  imageBase64: string,
  mimeType: string,
  _description: string,
): Promise<Buffer> {
  const dataUri = `data:${mimeType};base64,${imageBase64}`;

  const output = await replicate.run(
    "smoretalk/rembg-enhance:4067ee2a58f6c161d434a9c077cfa012820b8e076efa2772aa171e26557da919",
    { input: { image: dataUri } },
  );

  const url = typeof output === "string" ? output : String(output);
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

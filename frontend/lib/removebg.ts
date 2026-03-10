export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData();
  const arrayBuffer = imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength) as ArrayBuffer;
  formData.append("image_file", new Blob([arrayBuffer]), "image.png");
  formData.append("size", "auto");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.REMOVEBG_API_KEY!,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`remove.bg error ${res.status}: ${err}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, outfits, outfitItems, clothingItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import cloudinary from "@/lib/cloudinary";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-image-preview";

async function fetchImageBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get("content-type") ?? "image/png";
  return { base64: buffer.toString("base64"), mimeType };
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { personImage, outfitId } = await req.json();
  if (!personImage || !outfitId) {
    return NextResponse.json({ error: "personImage and outfitId required" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, session.user.sub))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify outfit belongs to user
  const [outfit] = await db
    .select()
    .from(outfits)
    .where(eq(outfits.id, outfitId))
    .limit(1);
  if (!outfit || outfit.userId !== user.id) {
    return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
  }

  // Fetch outfit items
  const joins = await db
    .select({ item: clothingItems })
    .from(outfitItems)
    .innerJoin(clothingItems, eq(outfitItems.clothingItemId, clothingItems.id))
    .where(eq(outfitItems.outfitId, outfitId));

  const items = joins.map((j) => j.item);
  if (items.length === 0) {
    return NextResponse.json({ error: "Outfit has no items" }, { status: 400 });
  }

  // Strip data URL prefix to get raw base64
  const personBase64 = personImage.replace(/^data:image\/\w+;base64,/, "");
  const personMime = personImage.match(/^data:(image\/\w+);/)?.[1] ?? "image/jpeg";

  // Download item images from Cloudinary
  const itemImages = await Promise.all(
    items.map(async (item) => {
      const img = await fetchImageBase64(item.cloudinaryUrl);
      return { ...img, description: item.notes ?? item.category };
    }),
  );

  // Build OpenRouter multimodal message
  const content: object[] = [
    {
      type: "text",
      text: "Here is a photo of a person, followed by individual clothing items. Generate a new photo of this EXACT same person wearing ALL of these clothing items together as a complete outfit. Keep the person's face, body, pose, and background identical. Only replace their clothing.",
    },
    { type: "text", text: "Person photo:" },
    {
      type: "image_url",
      image_url: { url: `data:${personMime};base64,${personBase64}` },
    },
  ];

  for (const img of itemImages) {
    content.push({ type: "text", text: `Clothing item (${img.description}):` });
    content.push({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    });
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[try-on] OpenRouter error:", err);
    return NextResponse.json({ error: `OpenRouter error ${res.status}` }, { status: 502 });
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  if (!message) {
    return NextResponse.json({ error: "No response from OpenRouter" }, { status: 502 });
  }

  // Images are returned in message.images array as base64 data URLs
  const images = message.images as { type: string; image_url: { url: string } }[] | undefined;
  const imageDataUrl = images?.[0]?.image_url?.url;

  if (!imageDataUrl) {
    console.error("[try-on] No image in response. message keys:", Object.keys(message));
    return NextResponse.json({ error: "No image in response" }, { status: 502 });
  }

  // Upload result to Cloudinary
  const uploaded = await cloudinary.uploader.upload(imageDataUrl, {
    folder: "outfitted/tryon",
    format: "png",
  });

  // Save to outfit record
  await db
    .update(outfits)
    .set({ modelImageUrl: uploaded.secure_url })
    .where(eq(outfits.id, outfitId));

  return NextResponse.json({ resultUrl: uploaded.secure_url });
}

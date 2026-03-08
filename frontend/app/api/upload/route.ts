import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, clothingItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { analyzeClothingImage } from "@/lib/openrouter";
import { isolateItem } from "@/lib/replicate";
import cloudinary from "@/lib/cloudinary";
import sharp from "sharp";

async function uploadBufferToCloudinary(
  buffer: Buffer,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "outfitted",
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const t0 = performance.now();

    let t = performance.now();
    const session = await auth0.getSession();
    console.log(`[upload] auth: ${(performance.now() - t).toFixed(0)}ms`);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const status = (formData.get("status") as string) ?? "owned";

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!["owned", "wishlisted"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'owned' or 'wishlisted'" },
        { status: 400 },
      );
    }

    t = performance.now();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);
    console.log(`[upload] db user lookup: ${(performance.now() - t).toFixed(0)}ms`);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const validCategories = new Set([
      "tops",
      "bottoms",
      "shoes",
      "outerwear",
      "accessories",
    ]);

    const allCreatedItems = [];

    for (const file of files) {
      const fileStart = performance.now();
      const arrayBuffer = await file.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "image/png";
      const imageBase64 = imageBuffer.toString("base64");
      console.log(`[upload] file read (${(imageBuffer.length / 1024).toFixed(0)}KB): ${(performance.now() - fileStart).toFixed(0)}ms`);

      t = performance.now();
      const analysis = await analyzeClothingImage(imageBase64, mimeType);
      console.log(`[upload] Gemini analysis: ${(performance.now() - t).toFixed(0)}ms — ${JSON.stringify(analysis)}`);

      if (!analysis.items || analysis.items.length === 0) {
        console.log("[upload] No items detected in file, skipping...");
        continue;
      }

      const validItems = analysis.items.filter((item) =>
        validCategories.has(item.category),
      );

      console.log(`[upload] Found ${validItems.length} valid items, isolating...`);

      const createdItems = await Promise.all(
        validItems.map(async (identified) => {
          let step = performance.now();
          const isolatedBuffer = await isolateItem(
            imageBase64,
            mimeType,
            identified.description,
          );
          console.log(`[upload] Replicate isolate "${identified.description}": ${(performance.now() - step).toFixed(0)}ms`);

          step = performance.now();
          const pngBuffer = await sharp(isolatedBuffer).png().toBuffer();
          console.log(`[upload] sharp png convert: ${(performance.now() - step).toFixed(0)}ms`);

          step = performance.now();
          const { url, publicId } = await uploadBufferToCloudinary(pngBuffer);
          console.log(`[upload] Cloudinary upload: ${(performance.now() - step).toFixed(0)}ms`);

          step = performance.now();
          const [item] = await db
            .insert(clothingItems)
            .values({
              userId: user.id,
              cloudinaryUrl: url,
              cloudinaryPublicId: publicId,
              category: identified.category,
              status: status as "owned" | "wishlisted",
              notes: identified.description,
            })
            .returning();
          console.log(`[upload] db insert: ${(performance.now() - step).toFixed(0)}ms`);

          return item;
        }),
      );

      allCreatedItems.push(...createdItems);
    }

    if (allCreatedItems.length === 0) {
      return NextResponse.json(
        { error: "No clothing items detected in any of the uploaded images" },
        { status: 400 },
      );
    }

    console.log(`[upload] TOTAL: ${(performance.now() - t0).toFixed(0)}ms — Created ${allCreatedItems.length} items`);
    return NextResponse.json(allCreatedItems, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

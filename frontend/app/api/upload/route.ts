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
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const status = (formData.get("status") as string) ?? "owned";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!["owned", "wishlisted"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'owned' or 'wishlisted'" },
        { status: 400 },
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/png";
    const imageBase64 = imageBuffer.toString("base64");

    // Step 1: Gemini 3.1 Flash identifies items in the image
    console.log("[upload] Analyzing image with Gemini 3.1 Flash...");
    const analysis = await analyzeClothingImage(imageBase64, mimeType);
    console.log("[upload] Analysis result:", JSON.stringify(analysis));

    if (!analysis.items || analysis.items.length === 0) {
      return NextResponse.json(
        { error: "No clothing items detected in the image", analysis },
        { status: 400 },
      );
    }

    const validCategories = new Set([
      "tops",
      "bottoms",
      "shoes",
      "outerwear",
      "accessories",
    ]);

    const validItems = analysis.items.filter((item) =>
      validCategories.has(item.category),
    );

    console.log(`[upload] Found ${validItems.length} valid items, isolating...`);

    // Step 2: For each item, isolate it with GPT image 1.5 then upload
    const createdItems = await Promise.all(
      validItems.map(async (identified) => {
        console.log(`[upload] Isolating: ${identified.description}`);
        const isolatedBuffer = await isolateItem(
          imageBase64,
          mimeType,
          identified.description,
        );

        const pngBuffer = await sharp(isolatedBuffer).png().toBuffer();

        console.log(`[upload] Uploading to Cloudinary: ${identified.description}`);
        const { url, publicId } = await uploadBufferToCloudinary(pngBuffer);

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

        return item;
      }),
    );

    console.log(`[upload] Done. Created ${createdItems.length} items.`);
    return NextResponse.json(createdItems, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

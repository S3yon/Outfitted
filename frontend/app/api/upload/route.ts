import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems } from "@/db/schema";
import { analyzeClothingImage } from "@/lib/openrouter";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { uploadWithBgRemoval } from "@/lib/cloudinary";
import sharp from "sharp";


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
    const user = await getOrCreateUser(session.user);
    console.log(`[upload] db user lookup: ${(performance.now() - t).toFixed(0)}ms`);

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

          // Crop to the bounding box of the identified item before background removal
          let cropBase64 = imageBase64;
          if (identified.bbox) {
            const { x1, y1, x2, y2 } = identified.bbox;
            const meta = await sharp(imageBuffer).metadata();
            const imgW = meta.width ?? 1;
            const imgH = meta.height ?? 1;
            const left = Math.floor(Math.max(0, x1) * imgW);
            const top = Math.floor(Math.max(0, y1) * imgH);
            const width = Math.floor(Math.min(1, x2) * imgW) - left;
            const height = Math.floor(Math.min(1, y2) * imgH) - top;
            if (width > 0 && height > 0) {
              const cropped = await sharp(imageBuffer)
                .extract({ left, top, width, height })
                .png()
                .toBuffer();
              cropBase64 = cropped.toString("base64");
            }
          }
          console.log(`[upload] bbox crop: ${(performance.now() - step).toFixed(0)}ms`);

          step = performance.now();
          const cropBuffer = Buffer.from(cropBase64, "base64");

          const { url, publicId } = await uploadWithBgRemoval(cropBuffer, identified.category);
          console.log(`[upload] Cloudinary upload+bgremoval "${identified.description}": ${(performance.now() - step).toFixed(0)}ms`);

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
    const cause = err instanceof Error && err.cause ? String(err.cause) : null;
    console.error("[upload] Error:", message, cause ? `| cause: ${cause}` : "");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

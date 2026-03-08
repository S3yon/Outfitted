import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, clothingItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import cloudinary from "@/lib/cloudinary";
import { replicate } from "@/lib/replicate";
import sharp from "sharp";

async function uploadBufferToCloudinary(
  buffer: Buffer,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "outfitted", resource_type: "image", format: "png" },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .end(buffer);
  });
}

async function removeBackground(
  imageUrl: string,
): Promise<{ url: string; publicId: string }> {
  const output = await replicate.run(
    "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
    { input: { image: imageUrl } },
  );

  const resultUrl = output as unknown as string;
  const resultRes = await fetch(resultUrl);
  const resultBuffer = Buffer.from(await resultRes.arrayBuffer());
  const pngBuffer = await sharp(resultBuffer).png().toBuffer();

  return uploadBufferToCloudinary(pngBuffer);
}

// PATCH /api/items/[id] — update status, notes, or wear level
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.auth0Id, session.user.sub)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [existing] = await db
    .select()
    .from(clothingItems)
    .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, user.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const body = await req.json();
  const { status, notes, wearLevel, nftMintAddress } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (wearLevel !== undefined) updates.wearLevel = wearLevel;
  if (nftMintAddress !== undefined) updates.nftMintAddress = nftMintAddress;

  // When transitioning wishlisted → owned, run background removal on the image
  if (status === "owned" && existing.status === "wishlisted") {
    console.log(`[items] Removing background for: ${existing.notes}`);
    const { url, publicId } = await removeBackground(existing.cloudinaryUrl);
    updates.cloudinaryUrl = url;
    updates.cloudinaryPublicId = publicId;

    // Delete the old Cloudinary image
    try {
      await cloudinary.uploader.destroy(existing.cloudinaryPublicId);
    } catch (err) {
      console.error("[items] Old image cleanup failed:", err);
    }
  }

  const [updated] = await db
    .update(clothingItems)
    .set(updates)
    .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, user.id)))
    .returning();

  return NextResponse.json(updated);
}

// DELETE /api/items/[id] — delete from Cloudinary and DB (outfit_items cascade automatically)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.auth0Id, session.user.sub)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Fetch item first to get the Cloudinary public ID
  const [item] = await db
    .select()
    .from(clothingItems)
    .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, user.id)))
    .limit(1);

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Delete from Cloudinary (non-fatal — don't fail if Cloudinary delete errors)
  try {
    await cloudinary.uploader.destroy(item.cloudinaryPublicId);
  } catch (err) {
    console.error("[items] Cloudinary delete failed:", err);
  }

  // Delete from DB (outfit_items rows cascade automatically via FK)
  await db
    .delete(clothingItems)
    .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, user.id)));

  return new NextResponse(null, { status: 204 });
}

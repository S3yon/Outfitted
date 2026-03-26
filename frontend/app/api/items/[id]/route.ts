import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import cloudinary, { uploadWithBgRemoval } from "@/lib/cloudinary";

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
  const user = await getOrCreateUser(session.user);

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
    try {
      const imgRes = await fetch(existing.cloudinaryUrl);
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const { url, publicId } = await uploadWithBgRemoval(buffer, existing.category);
      updates.cloudinaryUrl = url;
      updates.cloudinaryPublicId = publicId;
      try {
        await cloudinary.uploader.destroy(existing.cloudinaryPublicId);
      } catch (err) {
        console.error("[items] Old image cleanup failed:", err);
      }
    } catch (err) {
      console.error("[items] Background removal failed, keeping original:", err);
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
  const user = await getOrCreateUser(session.user);

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

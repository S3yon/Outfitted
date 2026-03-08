import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, clothingItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import cloudinary from "@/lib/cloudinary";

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

  const body = await req.json();
  const { status, notes, wearLevel, nftMintAddress } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (wearLevel !== undefined) updates.wearLevel = wearLevel;
  if (nftMintAddress !== undefined) updates.nftMintAddress = nftMintAddress;

  const [updated] = await db
    .update(clothingItems)
    .set(updates)
    .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });

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

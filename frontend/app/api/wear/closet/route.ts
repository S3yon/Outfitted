import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { readEmbedding } from "@/lib/wear/item-patch";

// GET /api/wear/closet: owned items with their embedding (null until backfilled), for
// matching outfit photos in the browser.
export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(session.user);
  const rows = await db
    .select({
      id: clothingItems.id,
      category: clothingItems.category,
      cloudinaryUrl: clothingItems.cloudinaryUrl,
      notes: clothingItems.notes,
      embedding: clothingItems.embedding,
    })
    .from(clothingItems)
    .where(and(eq(clothingItems.userId, user.id), eq(clothingItems.status, "owned")));

  const items = rows.map((row) => ({ ...row, embedding: readEmbedding(row.embedding) }));
  return NextResponse.json({ items });
}

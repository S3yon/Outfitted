import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, clothingItems, outfits, outfitItems } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/outfits — fetch all saved outfits with populated clothing items
export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, session.user.sub))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch all outfits for the user
  const userOutfits = await db
    .select()
    .from(outfits)
    .where(eq(outfits.userId, user.id))
    .orderBy(outfits.createdAt);

  // For each outfit, fetch the associated clothing items
  const populated = await Promise.all(
    userOutfits.map(async (outfit) => {
      const joins = await db
        .select({ item: clothingItems })
        .from(outfitItems)
        .innerJoin(clothingItems, eq(outfitItems.clothingItemId, clothingItems.id))
        .where(eq(outfitItems.outfitId, outfit.id));

      return {
        ...outfit,
        items: joins.map((j) => j.item),
      };
    })
  );

  return NextResponse.json(populated);
}

import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, outfits, outfitItems } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/get-or-create-user";

// GET /api/outfits — fetch all saved outfits with populated clothing items
export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(session.user);

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

// POST /api/outfits — manually create an outfit from selected item IDs
export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, itemIds } = await req.json();
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length < 2) {
    return NextResponse.json({ error: "Select at least 2 items" }, { status: 400 });
  }

  const user = await getOrCreateUser(session.user);

  // Verify all items belong to this user
  const items = await db
    .select()
    .from(clothingItems)
    .where(and(eq(clothingItems.userId, user.id), inArray(clothingItems.id, itemIds)));

  if (items.length !== itemIds.length) {
    return NextResponse.json({ error: "Some items not found" }, { status: 400 });
  }

  const [outfit] = await db
    .insert(outfits)
    .values({
      userId: user.id,
      explanation: name || "Custom Outfit",
    })
    .returning();

  await db.insert(outfitItems).values(
    itemIds.map((itemId: string) => ({
      outfitId: outfit.id,
      clothingItemId: itemId,
    })),
  );

  return NextResponse.json(
    { ...outfit, outfit_description: outfit.explanation, items },
    { status: 201 },
  );
}

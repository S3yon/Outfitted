import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/get-or-create-user";

// GET /api/wardrobe?status=owned&category=tops
// status:   "owned" | "wishlisted" (omit for all)
// category: "tops" | "bottoms" | "shoes" | "accessories" | "outerwear" (omit for all)
export async function GET(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(session.user);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const validStatuses = ["owned", "wishlisted"];
  const validCategories = ["tops", "bottoms", "shoes", "accessories", "outerwear"];

  const filters = [eq(clothingItems.userId, user.id)];

  if (status && validStatuses.includes(status)) {
    filters.push(eq(clothingItems.status, status as "owned" | "wishlisted"));
  }

  if (category && validCategories.includes(category)) {
    filters.push(
      eq(
        clothingItems.category,
        category as "tops" | "bottoms" | "shoes" | "accessories" | "outerwear"
      )
    );
  }

  const items = await db
    .select()
    .from(clothingItems)
    .where(and(...filters))
    .orderBy(clothingItems.createdAt);

  return NextResponse.json(items);
}

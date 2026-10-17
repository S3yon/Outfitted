import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, pricePoints } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { lastDropAt } from "@/lib/watch/history";

// GET /api/watch/drops: when any wishlist price last dropped (no refresh, no store reads), for
// the nav dot. The browser compares it to when the user last opened the Wishlist tab.
export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser(session.user);
  const rows = await db
    .select({ itemId: pricePoints.itemId, price: pricePoints.price, checkedAt: pricePoints.checkedAt })
    .from(pricePoints)
    .innerJoin(clothingItems, eq(pricePoints.itemId, clothingItems.id))
    .where(and(eq(clothingItems.userId, user.id), eq(clothingItems.status, "wishlisted")));

  const byItem = new Map<string, { price: number; checkedAt: string }[]>();
  for (const r of rows) byItem.set(r.itemId, [...(byItem.get(r.itemId) ?? []), r]);
  const latest = [...byItem.values()]
    .map(lastDropAt)
    .filter((t): t is string => t !== null)
    .sort()
    .at(-1);
  return NextResponse.json({ lastDropAt: latest ?? null });
}

import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, pricePoints } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { isStale, lastDropAt, summary, type PricePoint } from "@/lib/watch/history";
import { refreshItem, STALE_HOURS } from "@/lib/watch/refresh";
import type { WatchItem } from "@/lib/watch/view";
import { parseSafeUrl } from "@/lib/net/safe-url";

const REFRESH_PER_VIEW = 3;

// GET /api/watch: wishlist items with their price history. Rereads up to 3 items whose price
// is older than 12 hours first, oldest first, so opening the tab keeps prices fresh.
export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser(session.user);
  const mine = and(eq(clothingItems.userId, user.id), eq(clothingItems.status, "wishlisted"));
  const rows = await db
    .select({
      id: clothingItems.id,
      notes: clothingItems.notes,
      brand: clothingItems.brand,
      cloudinaryUrl: clothingItems.cloudinaryUrl,
      productUrl: clothingItems.productUrl,
      targetPrice: clothingItems.targetPrice,
      priceCheckedAt: clothingItems.priceCheckedAt,
    })
    .from(clothingItems)
    .where(mine);

  const now = new Date().toISOString();
  const stale = rows
    .filter((r) => r.productUrl && isStale(r.priceCheckedAt, now, STALE_HOURS))
    .sort((a, b) => (a.priceCheckedAt ?? "").localeCompare(b.priceCheckedAt ?? ""))
    .slice(0, REFRESH_PER_VIEW);
  await Promise.allSettled(stale.map((r) => refreshItem(r)));
  const refreshed = new Set(stale.map((r) => r.id));

  const points = rows.length
    ? await db
        .select({
          itemId: pricePoints.itemId,
          price: pricePoints.price,
          currency: pricePoints.currency,
          checkedAt: pricePoints.checkedAt,
        })
        .from(pricePoints)
        .where(inArray(pricePoints.itemId, rows.map((r) => r.id)))
    : [];

  const items: WatchItem[] = rows.map((r) => {
    const own = points.filter((p) => p.itemId === r.id);
    const history: PricePoint[] = own.map((p) => ({ price: p.price, checkedAt: p.checkedAt }));
    return {
      id: r.id,
      title: r.notes ?? "Wishlist item",
      imageUrl: r.cloudinaryUrl,
      store: parseSafeUrl(r.productUrl ?? "")?.hostname.replace(/^www\d?\./, "") ?? r.brand,
      productUrl: r.productUrl,
      targetPrice: r.targetPrice,
      currency: own.find((p) => p.currency)?.currency ?? null,
      checkedAt: refreshed.has(r.id) ? now : r.priceCheckedAt,
      points: history.sort((a, b) => a.checkedAt.localeCompare(b.checkedAt)),
      summary: summary(history, now),
      lastDropAt: lastDropAt(history),
    };
  });

  return NextResponse.json({ items });
}

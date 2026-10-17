import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clothingItems, pricePoints } from "@/db/schema";
import { fetchers } from "@/lib/buy/fetchers";
import { readProduct } from "@/lib/buy/read";
import { formatCents } from "@/lib/wear/price";
import { shouldStore } from "./history";

export const STALE_HOURS = 12;

// Refresh rereads the item's own page only (page, then reader). The shopping search rung is
// left out: it is paid per call and can land on a different product's price.
const refreshFetchers = { ...fetchers, search: async () => null };

// Read one watched item's price now; store a point only when it changed. Always stamps
// price_checked_at so a failing store isn't retried on every view.
export async function refreshItem(item: { id: string; productUrl: string | null }): Promise<void> {
  const now = new Date().toISOString();
  let price: number | null = null;
  let currency: string | null = null;
  let source = "page";
  if (item.productUrl) {
    try {
      const product = await readProduct(item.productUrl, refreshFetchers);
      price = product.price;
      currency = product.currency;
      source = product.via;
    } catch {
      price = null;
    }
  }

  const [last] = await db
    .select({ price: pricePoints.price })
    .from(pricePoints)
    .where(eq(pricePoints.itemId, item.id))
    .orderBy(desc(pricePoints.checkedAt))
    .limit(1);

  if (shouldStore(last?.price ?? null, price)) {
    await db.insert(pricePoints).values({ itemId: item.id, price: price!, currency, source, checkedAt: now });
  }
  await db
    .update(clothingItems)
    .set({
      priceCheckedAt: now,
      ...(price !== null ? { price: formatCents(price), updatedAt: now } : {}),
    })
    .where(eq(clothingItems.id, item.id));
}

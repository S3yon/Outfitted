import { NextResponse } from "next/server";
import { and, asc, eq, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clothingItems } from "@/db/schema";
import { refreshItem, STALE_HOURS } from "@/lib/watch/refresh";

export const maxDuration = 60;
const LIMIT = 100;
const PARALLEL = 4;
const BUDGET_MS = 50_000; // stop starting new reads before the function times out

// GET /api/cron/prices: the daily Vercel cron (vercel.json). Rereads up to 100 stale wishlist
// prices across all users. Needs `Authorization: Bearer $CRON_SECRET`; refuses without it set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_HOURS * 3_600_000).toISOString();
  const queue = await db
    .select({ id: clothingItems.id, productUrl: clothingItems.productUrl })
    .from(clothingItems)
    .where(
      and(
        eq(clothingItems.status, "wishlisted"),
        isNotNull(clothingItems.productUrl),
        or(isNull(clothingItems.priceCheckedAt), lt(clothingItems.priceCheckedAt, cutoff)),
      ),
    )
    .orderBy(sql`${clothingItems.priceCheckedAt} asc nulls first`, asc(clothingItems.id))
    .limit(LIMIT);

  const started = Date.now();
  let done = 0;
  let failed = 0;
  const worker = async () => {
    while (queue.length && Date.now() - started < BUDGET_MS) {
      const item = queue.shift()!;
      try {
        await refreshItem(item);
        done++;
      } catch (err) {
        console.error("Price refresh failed:", item.id, err);
        failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));

  return NextResponse.json({ refreshed: done, failed, left: queue.length });
}

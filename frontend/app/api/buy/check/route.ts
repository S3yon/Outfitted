import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, pricePoints, wearLogs } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { parseCheckInput } from "@/lib/buy/check-input";
import { ownedForCheck } from "@/lib/buy/owned";
import { writeReason } from "@/lib/buy/reason";
import { checkBuy } from "@/lib/buy/verdict";
import { summary } from "@/lib/watch/history";
import { formatCents } from "@/lib/wear/price";

// POST /api/buy/check { product: { title, category, price, itemId? }, embedding? }: the verdict
// against the user's own closet, worded by one free-model call (rules when it fails).
export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = parseCheckInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;
  const user = await getOrCreateUser(session.user);

  const [rows, logs, history] = await Promise.all([
    db
      .select({
        id: clothingItems.id,
        category: clothingItems.category,
        notes: clothingItems.notes,
        createdAt: clothingItems.createdAt,
        embedding: clothingItems.embedding,
        cloudinaryUrl: clothingItems.cloudinaryUrl,
      })
      .from(clothingItems)
      .where(and(eq(clothingItems.userId, user.id), eq(clothingItems.status, "owned"))),
    db
      .select({ itemId: wearLogs.clothingItemId, wornOn: wearLogs.wornOn })
      .from(wearLogs)
      .where(eq(wearLogs.userId, user.id)),
    input.itemId
      ? db
          .select({ price: pricePoints.price, checkedAt: pricePoints.checkedAt })
          .from(pricePoints)
          .innerJoin(clothingItems, eq(pricePoints.itemId, clothingItems.id))
          .where(and(eq(pricePoints.itemId, input.itemId), eq(clothingItems.userId, user.id)))
      : Promise.resolve([]),
  ]);

  const now = new Date().toISOString();
  const owned = ownedForCheck(rows, logs, now.slice(0, 10));
  const check = checkBuy({
    category: input.category,
    price: input.price,
    embedding: input.embedding,
    owned,
    low30: summary(history, now)?.low30 ?? null,
  });

  const twin = check.duplicate ? rows.find((r) => r.id === check.duplicate!.itemId) : null;
  const { reason, by } = await writeReason({
    title: input.title,
    category: input.category,
    price: input.price === null ? null : formatCents(input.price),
    verdict: check.verdict,
    added: check.outfits.added,
    before: check.outfits.before,
    missing: check.outfits.missing,
    duplicateOf: twin && check.duplicate!.score >= 0.85 ? (twin.notes ?? twin.category) : null,
    costPerWear: check.costPerWear === null ? null : formatCents(check.costPerWear),
    fallback: check.reason,
  });

  // The owned pieces the page shows: the examples and the closest look-alike.
  const shown = new Set([...check.examples.flat(), ...(check.duplicate ? [check.duplicate.itemId] : [])]);
  const items = rows
    .filter((r) => shown.has(r.id))
    .map((r) => ({ id: r.id, category: r.category, notes: r.notes, imageUrl: r.cloudinaryUrl }));

  return NextResponse.json({ check: { ...check, reason }, reasonBy: by, items });
}

import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import {
  users,
  marketListings,
  holdings,
  trades,
  priceCandles,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: listingId } = await params;

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

  const { side, quantity } = await req.json();

  if (!["buy", "sell"].includes(side) || !quantity || quantity <= 0) {
    return NextResponse.json({ error: "Invalid trade" }, { status: 400 });
  }

  const [listing] = await db
    .select()
    .from(marketListings)
    .where(eq(marketListings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // For sells, check holdings
  if (side === "sell") {
    const [holding] = await db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.userId, user.id),
          eq(holdings.listingId, listingId),
        ),
      )
      .limit(1);

    if (!holding || holding.quantity < quantity) {
      return NextResponse.json({ error: "Insufficient holdings" }, { status: 400 });
    }

    const newQty = holding.quantity - quantity;
    if (newQty === 0) {
      await db.delete(holdings).where(eq(holdings.id, holding.id));
    } else {
      await db
        .update(holdings)
        .set({ quantity: newQty })
        .where(eq(holdings.id, holding.id));
    }
  }

  // For buys, upsert holdings
  if (side === "buy") {
    const [existing] = await db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.userId, user.id),
          eq(holdings.listingId, listingId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(holdings)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(holdings.id, existing.id));
    } else {
      await db.insert(holdings).values({
        userId: user.id,
        listingId,
        quantity,
      });
    }
  }

  // Simulate price impact
  const impact = side === "buy" ? 1 : -1;
  const priceDelta = Math.max(1, Math.round(listing.currentPrice * 0.005 * quantity * impact));
  const newPrice = Math.max(1, listing.currentPrice + priceDelta);

  await db
    .update(marketListings)
    .set({
      currentPrice: newPrice,
      circulatingSupply: listing.circulatingSupply + (side === "buy" ? quantity : -quantity),
      volume24h: listing.volume24h + quantity,
    })
    .where(eq(marketListings.id, listingId));

  // Record trade
  const [trade] = await db
    .insert(trades)
    .values({
      userId: user.id,
      listingId,
      side,
      quantity,
      price: listing.currentPrice,
    })
    .returning();

  // Add a new candle — ensure timestamp is strictly after the last one
  const [lastCandle] = await db
    .select({ timestamp: priceCandles.timestamp })
    .from(priceCandles)
    .where(eq(priceCandles.listingId, listingId))
    .orderBy(sql`timestamp DESC`)
    .limit(1);

  const now = Math.floor(Date.now() / 1000);
  const candleTime = lastCandle ? Math.max(now, lastCandle.timestamp + 1) : now;

  const [newCandle] = await db.insert(priceCandles).values({
    listingId,
    timestamp: candleTime,
    open: listing.currentPrice,
    high: Math.max(listing.currentPrice, newPrice),
    low: Math.min(listing.currentPrice, newPrice),
    close: newPrice,
    volume: quantity,
  }).returning();

  return NextResponse.json({
    trade,
    newPrice,
    candle: newCandle,
  });
}

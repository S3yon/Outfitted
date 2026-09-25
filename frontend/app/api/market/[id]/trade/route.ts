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

  // whole shares only — the holdings/trades columns are integers
  if (
    !["buy", "sell"].includes(side) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return NextResponse.json({ error: "Invalid trade" }, { status: 400 });
  }

  // Every write below either lands together or not at all, and the listing
  // row is locked so two trades can't both price off the same stale value.
  const result = await db.transaction(async (tx) => {
    const [listing] = await tx
      .select()
      .from(marketListings)
      .where(eq(marketListings.id, listingId))
      .limit(1)
      .for("update");

    if (!listing) return { error: "Listing not found", status: 404 } as const;

    const [holding] = await tx
      .select()
      .from(holdings)
      .where(
        and(eq(holdings.userId, user.id), eq(holdings.listingId, listingId)),
      )
      .limit(1)
      .for("update");

    if (side === "sell") {
      if (!holding || holding.quantity < quantity) {
        return { error: "Insufficient holdings", status: 400 } as const;
      }
      const newQty = holding.quantity - quantity;
      if (newQty === 0) {
        await tx.delete(holdings).where(eq(holdings.id, holding.id));
      } else {
        await tx
          .update(holdings)
          .set({ quantity: newQty })
          .where(eq(holdings.id, holding.id));
      }
    } else {
      if (listing.circulatingSupply + quantity > listing.totalSupply) {
        return { error: "Not enough supply left", status: 400 } as const;
      }
      if (holding) {
        await tx
          .update(holdings)
          .set({ quantity: holding.quantity + quantity })
          .where(eq(holdings.id, holding.id));
      } else {
        await tx
          .insert(holdings)
          .values({ userId: user.id, listingId, quantity });
      }
    }

    // Simulate price impact
    const impact = side === "buy" ? 1 : -1;
    const priceDelta = Math.max(
      1,
      Math.round(listing.currentPrice * 0.005 * quantity * impact),
    );
    const newPrice = Math.max(1, listing.currentPrice + priceDelta);

    await tx
      .update(marketListings)
      .set({
        currentPrice: newPrice,
        circulatingSupply:
          listing.circulatingSupply + (side === "buy" ? quantity : -quantity),
        volume24h: listing.volume24h + quantity,
      })
      .where(eq(marketListings.id, listingId));

    // Record trade
    const [trade] = await tx
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
    const [lastCandle] = await tx
      .select({ timestamp: priceCandles.timestamp })
      .from(priceCandles)
      .where(eq(priceCandles.listingId, listingId))
      .orderBy(sql`timestamp DESC`)
      .limit(1);

    const now = Math.floor(Date.now() / 1000);
    const candleTime = lastCandle
      ? Math.max(now, lastCandle.timestamp + 1)
      : now;

    const [newCandle] = await tx
      .insert(priceCandles)
      .values({
        listingId,
        timestamp: candleTime,
        open: listing.currentPrice,
        high: Math.max(listing.currentPrice, newPrice),
        low: Math.min(listing.currentPrice, newPrice),
        close: newPrice,
        volume: quantity,
      })
      .returning();

    return { trade, newPrice, candle: newCandle } as const;
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  return NextResponse.json(result);
}

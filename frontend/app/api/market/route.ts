import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import {
  users,
  outfits,
  outfitItems,
  clothingItems,
  marketListings,
  priceCandles,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { generatePriceHistory, generateTicker } from "@/lib/market";

// GET: list all market listings with outfit data
export async function GET() {
  const listings = await db.select().from(marketListings);

  const populated = await Promise.all(
    listings.map(async (listing) => {
      const [outfit] = await db
        .select()
        .from(outfits)
        .where(eq(outfits.id, listing.outfitId))
        .limit(1);

      const items = outfit
        ? await db
            .select({ item: clothingItems })
            .from(outfitItems)
            .innerJoin(clothingItems, eq(outfitItems.clothingItemId, clothingItems.id))
            .where(eq(outfitItems.outfitId, outfit.id))
        : [];

      const [creator] = await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.id, listing.creatorId))
        .limit(1);

      return {
        ...listing,
        outfit: outfit
          ? { ...outfit, items: items.map((r) => r.item) }
          : null,
        creatorName: creator?.displayName ?? "Anonymous",
      };
    }),
  );

  return NextResponse.json(populated);
}

// POST: publish an outfit to the market
export async function POST(req: Request) {
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

  const { outfitId, name: customName, ticker: customTicker } = await req.json();

  const [outfit] = await db
    .select()
    .from(outfits)
    .where(eq(outfits.id, outfitId))
    .limit(1);

  if (!outfit) {
    return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
  }

  // Check not already listed
  const [existing] = await db
    .select()
    .from(marketListings)
    .where(eq(marketListings.outfitId, outfitId))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Already listed" }, { status: 409 });
  }

  const startPrice = 50 + Math.floor(Math.random() * 200); // $0.50 - $2.50
  const ticker = customTicker
    ? "$" + customTicker.replace(/[^A-Z0-9]/g, "").slice(0, 6)
    : generateTicker(outfit.explanation);
  const name = customName || outfit.explanation.slice(0, 60);

  const [listing] = await db
    .insert(marketListings)
    .values({
      outfitId,
      creatorId: user.id,
      ticker,
      name,
      currentPrice: startPrice,
    })
    .returning();

  // Generate 288 candles (24 hours of 5-min candles)
  const candles = generatePriceHistory(listing.id, startPrice, 288);
  for (const candle of candles) {
    await db.insert(priceCandles).values(candle);
  }

  // Update current price to last candle close
  const lastPrice = candles[candles.length - 1].close;
  const firstPrice = candles[0].open;
  const changeBps = Math.round(((lastPrice - firstPrice) / firstPrice) * 10000);
  const totalVolume = candles.reduce((sum, c) => sum + c.volume, 0);

  await db
    .update(marketListings)
    .set({
      currentPrice: lastPrice,
      change24h: changeBps,
      volume24h: totalVolume,
    })
    .where(eq(marketListings.id, listing.id));

  return NextResponse.json({ ...listing, currentPrice: lastPrice, change24h: changeBps }, { status: 201 });
}

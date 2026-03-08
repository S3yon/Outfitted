import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceCandles } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const candles = await db
    .select()
    .from(priceCandles)
    .where(eq(priceCandles.listingId, id))
    .orderBy(asc(priceCandles.timestamp));

  return NextResponse.json(candles);
}

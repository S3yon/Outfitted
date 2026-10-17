import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, pricePoints } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { fetchers } from "@/lib/buy/fetchers";
import { readProduct, type Product } from "@/lib/buy/read";
import { parseSafeUrl } from "@/lib/net/safe-url";
import { parsePrice } from "@/lib/wear/price";

// POST /api/buy/read { url } | { itemId }: a pasted link → product (page, reader, search, or
// manual when all fail), or a wishlist item the user already saved.
export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { url?: unknown; itemId?: unknown } | null;

  if (typeof body?.itemId === "string") {
    const user = await getOrCreateUser(session.user);
    const [item] = await db
      .select()
      .from(clothingItems)
      .where(and(eq(clothingItems.id, body.itemId), eq(clothingItems.userId, user.id)));
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [point] = await db
      .select({ currency: pricePoints.currency })
      .from(pricePoints)
      .where(eq(pricePoints.itemId, item.id))
      .limit(1);
    const product: Product & { itemId: string } = {
      itemId: item.id,
      url: item.productUrl ?? "",
      title: item.notes,
      imageUrl: item.cloudinaryUrl,
      price: parsePrice(item.price),
      currency: point?.currency ?? null,
      brand: item.brand,
      store: parseSafeUrl(item.productUrl ?? "")?.hostname.replace(/^www\d?\./, "") ?? item.brand ?? "",
      category: item.category,
      via: "page",
    };
    return NextResponse.json({ product });
  }

  const url = typeof body?.url === "string" ? parseSafeUrl(body.url.trim()) : null;
  if (!url) {
    return NextResponse.json({ error: "Paste a full http(s) product link" }, { status: 400 });
  }
  const product = await readProduct(url.href, fetchers);
  return NextResponse.json({ product });
}

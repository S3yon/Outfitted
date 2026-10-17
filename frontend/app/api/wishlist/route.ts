import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, pricePoints } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import cloudinary from "@/lib/cloudinary";
import { CATEGORIES, inferCategory } from "@/lib/buy/category";
import { EMBEDDING_SIZE } from "@/lib/import/save-input";
import { formatCents, parsePrice } from "@/lib/wear/price";

const SOURCES = ["page", "reader", "search", "manual"];
const isVector = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length === EMBEDDING_SIZE && v.every((x) => typeof x === "number" && Number.isFinite(x));

async function uploadUrlToCloudinary(
  imageUrl: string,
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: "outfitted",
    resource_type: "image",
    format: "png",
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, imageUrl, price, source, link } = body;
  // From the buy check: price in cents, how it was read, its category and image embedding.
  const { priceCents, currency, via, category: picked, embedding } = body;

  if (!title || !imageUrl) {
    return NextResponse.json(
      { error: "title and imageUrl are required" },
      { status: 400 },
    );
  }

  const user = await getOrCreateUser(session.user);

  const { url, publicId } = await uploadUrlToCloudinary(imageUrl);
  const category = CATEGORIES.includes(picked) ? picked : inferCategory(title);
  const cents =
    Number.isInteger(priceCents) && priceCents > 0 && priceCents <= 10_000_000
      ? (priceCents as number)
      : parsePrice(typeof price === "string" ? price : null);
  const now = new Date().toISOString();

  const [item] = await db
    .insert(clothingItems)
    .values({
      userId: user.id,
      cloudinaryUrl: url,
      cloudinaryPublicId: publicId,
      category,
      status: "wishlisted",
      notes: title,
      brand: source ?? null,
      price: cents !== null ? formatCents(cents) : (price ?? null),
      productUrl: link ?? null,
      embedding: isVector(embedding) ? JSON.stringify(embedding) : null,
      priceCheckedAt: cents !== null ? now : null,
    })
    .returning();

  // The first point of its price history; the watch adds one whenever the price changes.
  if (cents !== null) {
    await db.insert(pricePoints).values({
      itemId: item.id,
      price: cents,
      currency: typeof currency === "string" ? currency.slice(0, 3).toUpperCase() : null,
      source: SOURCES.includes(via) ? via : "search",
      checkedAt: now,
    });
  }

  return NextResponse.json(item, { status: 201 });
}

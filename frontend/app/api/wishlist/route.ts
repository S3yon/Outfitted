import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, clothingItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import cloudinary from "@/lib/cloudinary";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  shoes: ["shoe", "sneaker", "boot", "sandal", "loafer", "heel", "slipper", "mule", "clog", "trainer"],
  tops: ["shirt", "tee", "top", "blouse", "hoodie", "sweater", "pullover", "polo", "tank", "jersey", "knit", "cardigan", "vest"],
  bottoms: ["pant", "jean", "trouser", "short", "skirt", "legging", "jogger", "cargo", "chino", "denim"],
  outerwear: ["jacket", "coat", "blazer", "parka", "bomber", "windbreaker", "puffer", "overcoat", "trench", "anorak"],
  accessories: ["bag", "hat", "cap", "scarf", "belt", "wallet", "sunglasses", "glasses", "watch", "ring", "necklace", "bracelet", "earring", "chain", "pendant", "beanie", "glove"],
};

function inferCategory(title: string): string {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "accessories";
}

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

  if (!title || !imageUrl) {
    return NextResponse.json(
      { error: "title and imageUrl are required" },
      { status: 400 },
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, session.user.sub))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { url, publicId } = await uploadUrlToCloudinary(imageUrl);
  const category = inferCategory(title);

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
      price: price ?? null,
      productUrl: link ?? null,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

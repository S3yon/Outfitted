import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import cloudinary from "@/lib/cloudinary";
import { inferCategory } from "@/lib/buy/category";

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

  const user = await getOrCreateUser(session.user);

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

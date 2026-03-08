import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, clothingItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadWithBgRemoval } from "@/lib/cloudinary";

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse multipart form data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) ?? "tops";
  const status = (formData.get("status") as string) ?? "owned";
  const notes = (formData.get("notes") as string) ?? null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validCategories = ["tops", "bottoms", "shoes", "accessories", "outerwear"];
  const validStatuses = ["owned", "wishlisted"];

  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status. Must be 'owned' or 'wishlisted'" }, { status: 400 });
  }

  // Fetch the user's DB record
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, session.user.sub))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Convert file to buffer and upload to Cloudinary
  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, publicId } = await uploadWithBgRemoval(buffer, category);

  // Save to DB
  const [item] = await db
    .insert(clothingItems)
    .values({
      userId: user.id,
      cloudinaryUrl: url,
      cloudinaryPublicId: publicId,
      category: category as "tops" | "bottoms" | "shoes" | "accessories" | "outerwear",
      status: status as "owned" | "wishlisted",
      notes,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

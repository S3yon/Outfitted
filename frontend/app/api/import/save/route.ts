import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { uploadWithBgRemoval } from "@/lib/cloudinary";
import { parseSaveInput } from "@/lib/import/save-input";

// Camera-roll importer, step 2: save one item the user kept in review.
export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = parseSaveInput(await req.json().catch(() => null));
    if (!input.ok) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }
    const { image, category, description, embedding } = input.value;

    const user = await getOrCreateUser(session.user);
    const { url, publicId } = await uploadWithBgRemoval(image, category);

    const [item] = await db
      .insert(clothingItems)
      .values({
        userId: user.id,
        cloudinaryUrl: url,
        cloudinaryPublicId: publicId,
        category,
        status: "owned",
        notes: description,
        embedding: embedding ? JSON.stringify(embedding) : null,
      })
      .returning();

    // The client's store doesn't need the vector back.
    return NextResponse.json({ ...item, embedding: null }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[import/save] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

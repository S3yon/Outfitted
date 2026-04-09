import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { outfits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/get-or-create-user";

// PATCH /api/outfits/[id] — partial update (e.g. clear modelImageUrl)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await getOrCreateUser(session.user);
  const body = await req.json().catch(() => ({}));

  const allowed: Record<string, unknown> = {};
  if ("modelImageUrl" in body) allowed.modelImageUrl = body.modelImageUrl ?? null;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(outfits)
    .set(allowed)
    .where(and(eq(outfits.id, id), eq(outfits.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Outfit not found" }, { status: 404 });

  return NextResponse.json(updated);
}

// DELETE /api/outfits/[id] — delete an outfit (outfitItems cascade via FK)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await getOrCreateUser(session.user);

  const [deleted] = await db
    .delete(outfits)
    .where(and(eq(outfits.id, id), eq(outfits.userId, user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Outfit not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}

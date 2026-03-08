import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, outfits } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, session.user.sub))
    .limit(1);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [deleted] = await db
    .delete(outfits)
    .where(and(eq(outfits.id, id), eq(outfits.userId, user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Outfit not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}

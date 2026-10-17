import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";

// PATCH /api/watch/[id] { targetPrice: cents | null }: set or clear the target line.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { targetPrice?: unknown } | null;
  const target = body?.targetPrice ?? null;
  if (target !== null && !(Number.isInteger(target) && (target as number) > 0 && (target as number) <= 10_000_000)) {
    return NextResponse.json({ error: "Invalid target price" }, { status: 400 });
  }

  const user = await getOrCreateUser(session.user);
  const [item] = await db
    .update(clothingItems)
    .set({ targetPrice: target as number | null })
    .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, user.id)))
    .returning({ id: clothingItems.id, targetPrice: clothingItems.targetPrice });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

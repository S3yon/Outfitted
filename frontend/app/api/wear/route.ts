import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, wearLogs } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { parseLogInput } from "@/lib/wear/log-input";

// GET /api/wear: every wear the user has logged. Stats are computed in the browser.
export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(session.user);
  const logs = await db
    .select({ itemId: wearLogs.clothingItemId, wornOn: wearLogs.wornOn })
    .from(wearLogs)
    .where(eq(wearLogs.userId, user.id));

  return NextResponse.json({ logs });
}

// POST /api/wear: log wears. The same item on the same day counts once.
export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The client sends its local date; UTC tomorrow lets time zones ahead of UTC through.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const input = parseLogInput(await req.json().catch(() => null), tomorrow);
    if (!input.ok) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }
    const entries = input.value;

    const user = await getOrCreateUser(session.user);
    const itemIds = [...new Set(entries.map((e) => e.itemId))];
    const owned = await db
      .select({ id: clothingItems.id })
      .from(clothingItems)
      .where(and(eq(clothingItems.userId, user.id), inArray(clothingItems.id, itemIds)));
    if (owned.length !== itemIds.length) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const added = await db
      .insert(wearLogs)
      .values(
        entries.map((e) => ({
          userId: user.id,
          clothingItemId: e.itemId,
          wornOn: e.wornOn,
          source: e.source,
        })),
      )
      .onConflictDoNothing({ target: [wearLogs.clothingItemId, wearLogs.wornOn] })
      .returning({ id: wearLogs.id });

    return NextResponse.json({ added: added.length }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[wear] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

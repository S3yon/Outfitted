import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/get-or-create-user";

// GET /api/user — fetch current user's DB record, creating it on first login
export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(session.user);
  return NextResponse.json(user);
}

// PATCH /api/user — update style profile or display name
export async function PATCH(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { displayName, styleProfile, onboardingCompleted } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (displayName !== undefined) updates.displayName = displayName;
  if (styleProfile !== undefined) updates.styleProfile = styleProfile;
  if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted;

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.auth0Id, session.user.sub))
    .returning();

  return NextResponse.json(updated);
}

import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/user — fetch current user's DB record, creating it on first login
export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sub: auth0Id, email, name } = session.user;

  // Upsert — safe to call on every login
  const [user] = await db
    .insert(users)
    .values({
      auth0Id,
      email: email ?? "",
      displayName: name ?? null,
      onboardingCompleted: false,
    })
    .onConflictDoNothing()
    .returning();

  // If upsert returned nothing, user already existed — fetch them
  if (!user) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, auth0Id))
      .limit(1);
    return NextResponse.json(existing);
  }

  return NextResponse.json(user);
}

// PATCH /api/user — update style profile or solana wallet
export async function PATCH(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { styleProfile, solanaWalletAddress, onboardingCompleted } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (styleProfile !== undefined) updates.styleProfile = styleProfile;
  if (solanaWalletAddress !== undefined) updates.solanaWalletAddress = solanaWalletAddress;
  if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted;

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.auth0Id, session.user.sub))
    .returning();

  return NextResponse.json(updated);
}

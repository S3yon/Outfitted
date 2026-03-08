import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/onboarding — save style profile and mark onboarding complete
export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { styleProfile } = body;

  if (!styleProfile || typeof styleProfile !== "string" || styleProfile.trim().length === 0) {
    return NextResponse.json({ error: "styleProfile is required" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({
      styleProfile: styleProfile.trim(),
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(users.auth0Id, session.user.sub))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

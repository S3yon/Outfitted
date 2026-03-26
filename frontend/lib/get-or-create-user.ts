import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/db/schema";

type SessionUser = {
  sub: string;
  email?: string | null;
  name?: string | null;
};

export async function getOrCreateUser(sessionUser: SessionUser): Promise<User> {
  const { sub: auth0Id, email, name } = sessionUser;

  const [inserted] = await db
    .insert(users)
    .values({
      auth0Id,
      email: email ?? "",
      displayName: name ?? null,
      onboardingCompleted: false,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, auth0Id))
    .limit(1);

  return existing;
}

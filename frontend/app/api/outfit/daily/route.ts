import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, outfits, outfitItems, dailySuggestions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { cleanGeminiJson, type GeminiResponse } from "@/lib/gemini";

function getCurrentSeason(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "Spring";
  if (m >= 6 && m <= 8) return "Summer";
  if (m >= 9 && m <= 11) return "Fall";
  return "Winter";
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function getOccasionForTime(timeOfDay: string): string {
  if (timeOfDay === "Morning") return "Casual";
  if (timeOfDay === "Afternoon") return "Work";
  return "Night Out";
}

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(session.user);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Check if today's suggestion already exists
  const existing = await db
    .select()
    .from(dailySuggestions)
    .where(and(eq(dailySuggestions.userId, user.id), eq(dailySuggestions.date, today)))
    .limit(1);

  if (existing.length > 0) {
    const outfitId = existing[0].outfitId;
    const [outfit] = await db.select().from(outfits).where(eq(outfits.id, outfitId)).limit(1);
    if (!outfit) return NextResponse.json({ outfit: null });

    const joins = await db
      .select({ item: clothingItems })
      .from(outfitItems)
      .innerJoin(clothingItems, eq(outfitItems.clothingItemId, clothingItems.id))
      .where(eq(outfitItems.outfitId, outfitId));

    return NextResponse.json({
      outfit: { ...outfit, outfit_description: outfit.explanation, items: joins.map((j) => j.item) },
    });
  }

  // Generate a new daily suggestion
  const allItems = await db
    .select()
    .from(clothingItems)
    .where(eq(clothingItems.userId, user.id));

  const owned = allItems.filter((i) => i.status === "owned");
  if (owned.length < 3) return NextResponse.json({ outfit: null });

  const season = getCurrentSeason();
  const timeOfDay = getTimeOfDay();
  const occasion = getOccasionForTime(timeOfDay);
  const styleProfile = user.styleProfile ?? "Classic, relaxed, casual everyday style.";

  const itemsForPrompt = owned.map((i) => ({
    id: i.id,
    category: i.category,
    notes: i.notes ?? "",
  }));

  const prompt = `
You are a personal stylist AI. Study this client's style profile carefully:
"${styleProfile}"

Today's context:
- Season: ${season}
- Time of day: ${timeOfDay}
- Occasion: ${occasion}

Their wardrobe:
${JSON.stringify(itemsForPrompt, null, 2)}

Pick exactly ONE perfect outfit for this person for a ${occasion.toLowerCase()} ${timeOfDay.toLowerCase()} in ${season}. Make it feel curated and effortless — not generic.

Respond ONLY with valid JSON, no markdown:
{
  "outfits": [
    {
      "outfit_description": "Evocative outfit name (e.g. 'Sunday Morning Ease', 'Late Night Minimal')",
      "item_ids": ["uuid1", "uuid2", "uuid3"]
    }
  ]
}

Rules:
- Only use IDs from the wardrobe above. Never invent IDs.
- Must include at least one "tops" item AND one "bottoms" item.
- 2–5 items total. Add shoes, outerwear, or accessories when it makes the look complete.
- Name the outfit with personality — match it to the client's aesthetic, the occasion, and the season.
`.trim();

  let raw: string;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return NextResponse.json({ outfit: null });
    const data = await res.json();
    raw = data.choices?.[0]?.message?.content ?? "";
  } catch {
    return NextResponse.json({ outfit: null });
  }

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(cleanGeminiJson(raw));
  } catch {
    return NextResponse.json({ outfit: null });
  }

  const geminiOutfit = parsed.outfits?.[0];
  if (!geminiOutfit) return NextResponse.json({ outfit: null });

  const validIds = new Set(owned.map((i) => i.id));
  const itemCategoryMap = new Map(owned.map((i) => [i.id, i.category]));
  const safeItemIds = geminiOutfit.item_ids.filter((id) => validIds.has(id));
  const categories = safeItemIds.map((id) => itemCategoryMap.get(id));
  if (!categories.includes("tops") || !categories.includes("bottoms")) {
    return NextResponse.json({ outfit: null });
  }

  // Persist outfit
  const [outfit] = await db
    .insert(outfits)
    .values({ userId: user.id, explanation: geminiOutfit.outfit_description, season, occasion })
    .returning();

  await db.insert(outfitItems).values(
    safeItemIds.map((itemId) => ({ outfitId: outfit.id, clothingItemId: itemId }))
  );

  // Save daily suggestion record — ignore conflict if a concurrent request already saved one
  await db.insert(dailySuggestions).values({
    userId: user.id,
    outfitId: outfit.id,
    date: today,
  }).onConflictDoNothing();

  const items = owned.filter((i) => safeItemIds.includes(i.id));

  return NextResponse.json({
    outfit: { ...outfit, outfit_description: geminiOutfit.outfit_description, items },
  });
}

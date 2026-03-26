import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, outfits, outfitItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { cleanGeminiJson, type GeminiResponse } from "@/lib/gemini";

export async function POST() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user
  const user = await getOrCreateUser(session.user);

  // Only owned items — can't style with things you don't have
  const ownedItems = await db
    .select()
    .from(clothingItems)
    .where(eq(clothingItems.userId, user.id));

  const owned = ownedItems.filter((i) => i.status === "owned");

  if (owned.length < 3) {
    return NextResponse.json(
      { error: "not_enough_items", message: "Add at least 3 owned items to generate outfits." },
      { status: 400 }
    );
  }

  const styleProfile = user.styleProfile ?? "Classic, relaxed, casual everyday style.";

  // Build prompt — pass only id, category, notes to Gemini (no URLs needed)
  const itemsForPrompt = owned.map((i) => ({
    id: i.id,
    category: i.category,
    notes: i.notes ?? "",
  }));

  const prompt = `
You are a personal stylist AI. Study this client's style profile carefully:
"${styleProfile}"

Their wardrobe (JSON array — use ONLY these items):
${JSON.stringify(itemsForPrompt, null, 2)}

Generate exactly 3 outfit combinations. Each outfit should feel like it was curated specifically for this person.

Respond ONLY with valid JSON, no markdown:
{
  "outfits": [
    {
      "outfit_description": "Evocative outfit name (e.g. 'Saturday Sneaker Run', 'Late Night Minimal')",
      "item_ids": ["uuid1", "uuid2", "uuid3"]
    }
  ]
}

Rules:
- Only use item IDs from the wardrobe JSON above. Never invent IDs.
- Every outfit MUST have at least one "tops" item AND one "bottoms" item.
- Each outfit should have 2-5 items. Layer with shoes, outerwear, or accessories when available.
- Vary the outfits — each should work for a different mood or occasion from the client's profile.
- Actively respect the client's stated vibe, fit preference, color preferences, and influences when choosing items. If they listed preferred colors, prioritize items whose descriptions match those colors. If they prefer oversized fits, pick items described as oversized or relaxed. If they dress primarily for casual occasions, don't build a formal look.
- Name each outfit with personality — match the naming vibe to the client's aesthetic.
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
    if (!res.ok) {
      const err = await res.text();
      console.error("[outfits/generate] OpenRouter error:", err);
      return NextResponse.json({ error: "AI service failed. Try again." }, { status: 502 });
    }
    const data = await res.json();
    raw = data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[outfits/generate] error:", err);
    return NextResponse.json({ error: "AI service failed. Try again." }, { status: 502 });
  }
  const cleaned = cleanGeminiJson(raw);

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[outfits] Failed to parse response:", cleaned);
    return NextResponse.json({ error: "Gemini returned invalid JSON", raw: cleaned }, { status: 502 });
  }

  if (!parsed.outfits || !Array.isArray(parsed.outfits)) {
    return NextResponse.json({ error: "Unexpected response shape", raw: cleaned }, { status: 502 });
  }

  // Build a set of valid item IDs for validation
  const validIds = new Set(owned.map((i) => i.id));

  const itemCategoryMap = new Map(owned.map((i) => [i.id, i.category]));

  // Persist each outfit to DB
  const createdOutfits = await Promise.all(
    parsed.outfits.map(async (geminiOutfit) => {
      const safeItemIds = geminiOutfit.item_ids.filter((id) => validIds.has(id));

      if (safeItemIds.length === 0) return null;

      // Enforce top + bottom
      const categories = safeItemIds.map((id) => itemCategoryMap.get(id));
      if (!categories.includes("tops") || !categories.includes("bottoms")) return null;

      const [outfit] = await db
        .insert(outfits)
        .values({
          userId: user.id,
          explanation: geminiOutfit.outfit_description,
        })
        .returning();

      // Insert join rows
      await db.insert(outfitItems).values(
        safeItemIds.map((itemId) => ({
          outfitId: outfit.id,
          clothingItemId: itemId,
        }))
      );

      const items = owned.filter((i) => safeItemIds.includes(i.id));

      return {
        ...outfit,
        outfit_description: geminiOutfit.outfit_description,
        items,
      };
    })
  );

  const saved = createdOutfits.filter(Boolean);

  return NextResponse.json({ outfits: saved }, { status: 201 });
}

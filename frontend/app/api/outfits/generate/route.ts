import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { users, clothingItems, outfits, outfitItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { geminiModel, cleanGeminiJson, type GeminiResponse } from "@/lib/gemini";

export async function POST() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, session.user.sub))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

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
You are a luxury fashion stylist AI. Your client has the following style profile:
"${styleProfile}"

Their wardrobe contains these owned items (JSON):
${JSON.stringify(itemsForPrompt, null, 2)}

Generate exactly 3 outfit combinations using only items from the list above.

Respond ONLY with valid JSON in this exact format, no markdown, no explanation outside the JSON:
{
  "outfits": [
    {
      "outfit_description": "Short stylish outfit name (e.g. 'Quiet Luxury Monday')",
      "item_ids": ["uuid1", "uuid2", "uuid3"],
      "explanation": "Two sentences max. Why this outfit works for their vibe and when to wear it."
    }
  ]
}

Rules:
- Only use item IDs that exist in the wardrobe JSON above. Do not invent IDs.
- Each outfit must include 2-4 items and cover at minimum a top + bottom or a full look.
- Vary the outfits — avoid repeating the same items across all three.
- Match the user's style profile.
- The explanation must sound like a high-end personal stylist wrote it.
`.trim();

  // Call Gemini
  const result = await geminiModel.generateContent(prompt);
  const raw = result.response.text();
  const cleaned = cleanGeminiJson(raw);

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[gemini] Failed to parse response:", cleaned);
    return NextResponse.json({ error: "Gemini returned invalid JSON" }, { status: 502 });
  }

  if (!parsed.outfits || !Array.isArray(parsed.outfits)) {
    return NextResponse.json({ error: "Unexpected Gemini response shape" }, { status: 502 });
  }

  // Build a set of valid item IDs for validation
  const validIds = new Set(owned.map((i) => i.id));

  // Persist each outfit to DB
  const createdOutfits = await Promise.all(
    parsed.outfits.map(async (geminiOutfit) => {
      // Filter out any hallucinated IDs
      const safeItemIds = geminiOutfit.item_ids.filter((id) => validIds.has(id));

      if (safeItemIds.length === 0) return null;

      const [outfit] = await db
        .insert(outfits)
        .values({
          userId: user.id,
          explanation: geminiOutfit.explanation,
        })
        .returning();

      // Insert join rows
      await db.insert(outfitItems).values(
        safeItemIds.map((itemId) => ({
          outfitId: outfit.id,
          clothingItemId: itemId,
        }))
      );

      // Return outfit with full item data for the frontend
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

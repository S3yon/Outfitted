import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { recommendationCache } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { cleanGeminiJson } from "@/lib/gemini";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SERPER_URL = "https://google.serper.dev/shopping";

type SerperResult = {
  title: string;
  source: string;
  link: string;
  price: string;
  imageUrl: string;
  rating?: number;
};

async function serperSearch(query: string): Promise<SerperResult[]> {
  if (!SERPER_API_KEY) return [];
  try {
    const res = await fetch(SERPER_URL, {
      method: "POST",
      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: `${query} clothing fashion`, num: 6, gl: "us" }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.shopping ?? [];
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(session.user);
  const today = new Date().toISOString().slice(0, 10);
  const refresh = new URL(req.url).searchParams.has("refresh");

  // Delete stale cache entry if refresh requested
  if (refresh) {
    await db
      .delete(recommendationCache)
      .where(and(eq(recommendationCache.userId, user.id), eq(recommendationCache.date, today)));
  }

  // Check DB cache first — return immediately if fresh entry exists
  const cached = await db
    .select()
    .from(recommendationCache)
    .where(and(eq(recommendationCache.userId, user.id), eq(recommendationCache.date, today)))
    .limit(1);

  if (cached.length > 0) {
    return NextResponse.json(
      { products: JSON.parse(cached[0].productsJson), hasProfile: true },
      { headers: { "Cache-Control": "private, max-age=3600" } },
    );
  }

  if (!user.styleProfile) {
    return NextResponse.json({ products: [], hasProfile: false });
  }

  // Generate targeted search queries from the user's style profile
  let queries: string[] = [];
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "user",
            content: `You are a fashion stylist. Based on the user's style profile, generate exactly 5 product search queries — one per category in this exact order: tops, bottoms, shoes, outerwear, accessories.

Rules:
- Each query must be 2-5 words
- Each query must match the user's vibe, fit preference, and color palette
- Factor in their occasion needs and style influences
- One query per category — no repeating categories

Return ONLY a JSON array of 5 strings in order [tops, bottoms, shoes, outerwear, accessories]. No markdown, no explanation.
Example: ["relaxed linen shirt", "straight leg chinos", "white leather sneakers", "lightweight bomber jacket", "silver chain necklace"]

User style profile: "${user.styleProfile}"`,
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? "[]";
      const cleaned = cleanGeminiJson(raw);
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        queries = parsed.slice(0, 5).filter((q) => typeof q === "string");
      }
    }
  } catch (err) {
    console.error("[recommendations] Gemini error:", err);
  }

  if (queries.length === 0) {
    return NextResponse.json({ products: [], hasProfile: true });
  }

  // Fetch Serper results for all queries in parallel
  const results = await Promise.all(queries.map(serperSearch));
  const flat = results.flat();

  // Dedupe by title and map to product shape
  const seen = new Set<string>();
  const products = flat
    .filter((r) => {
      const key = r.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 16)
    .map((r) => ({
      title: r.title,
      source: r.source,
      link: r.link,
      price: r.price,
      imageUrl: r.imageUrl,
      rating: r.rating,
    }));

  // Persist to DB cache — ignore conflict if a concurrent request already saved
  await db.insert(recommendationCache).values({
    userId: user.id,
    date: today,
    productsJson: JSON.stringify(products),
  }).onConflictDoNothing();

  return NextResponse.json(
    { products, hasProfile: true },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}

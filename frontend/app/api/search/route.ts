import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SERPER_URL = "https://google.serper.dev/shopping";

type SerperShoppingResult = {
  title: string;
  source: string;
  link: string;
  price: string;
  imageUrl: string;
  rating?: number;
  ratingCount?: number;
  delivery?: string;
};

export async function GET(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SERPER_API_KEY) {
    return NextResponse.json(
      { error: "Search is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const BLOCKED_TERMS = [
    // weapons
    "knife", "knives", "blade", "sword", "dagger", "machete", "axe", "hatchet",
    "gun", "guns", "firearm", "pistol", "rifle", "shotgun", "revolver", "glock",
    "ammo", "ammunition", "bullet", "weapon", "weapons", "explosive", "grenade", "bomb",
    // drugs
    "drug", "drugs", "weed", "cannabis", "cocaine", "heroin", "meth",
    // adult
    "porn", "nude", "nsfw", "sex", "xxx",
    // misc non-fashion
    "food", "alcohol", "cigarette", "tobacco",
  ];
  const lowerQuery = query.toLowerCase();
  if (BLOCKED_TERMS.some((term) => lowerQuery.includes(term))) {
    return NextResponse.json(
      { error: "Search query not allowed" },
      { status: 400 },
    );
  }

  // Append clothing context so results stay fashion-relevant
  const safeQuery = `${query.trim()} clothing fashion apparel`;

  const res = await fetch(SERPER_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: safeQuery,
      num: 20,
      gl: "us",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Search provider error: ${text}` },
      { status: 502 },
    );
  }

  const data = await res.json();
  const results: SerperShoppingResult[] = data.shopping ?? [];

  const products = results.map((r) => ({
    title: r.title,
    source: r.source,
    link: r.link,
    price: r.price,
    imageUrl: r.imageUrl,
    rating: r.rating,
  }));

  return NextResponse.json({ products });
}

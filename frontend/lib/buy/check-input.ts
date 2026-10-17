import { EMBEDDING_SIZE } from "../import/save-input.ts";
import { CATEGORIES } from "./category.ts";

export type CheckInput = {
  title: string;
  category: string;
  price: number | null; // cents
  itemId: string | null; // a saved wishlist item, for its price history
  embedding: number[] | null;
};

type Result = { ok: true; value: CheckInput } | { ok: false; error: string };

const MAX_PRICE = 10_000_000; // $100,000 in cents

// Check the body of POST /api/buy/check: { product: { title, category, price, itemId? }, embedding? }.
export function parseCheckInput(body: unknown): Result {
  const { product, embedding } = (body ?? {}) as Record<string, unknown>;
  const p = (product ?? {}) as Record<string, unknown>;
  const title = typeof p.title === "string" ? p.title.trim().slice(0, 200) : "";
  if (!title) return { ok: false, error: "A title is required" };
  if (typeof p.category !== "string" || !(CATEGORIES as readonly string[]).includes(p.category)) {
    return { ok: false, error: "Unknown category" };
  }
  const price = p.price ?? null;
  if (price !== null && !(Number.isInteger(price) && (price as number) > 0 && (price as number) <= MAX_PRICE)) {
    return { ok: false, error: "Invalid price" };
  }
  let vector: number[] | null = null;
  if (embedding !== undefined && embedding !== null) {
    const ok =
      Array.isArray(embedding) &&
      embedding.length === EMBEDDING_SIZE &&
      embedding.every((v) => typeof v === "number" && Number.isFinite(v));
    if (!ok) return { ok: false, error: "Invalid embedding" };
    vector = embedding as number[];
  }
  return {
    ok: true,
    value: {
      title,
      category: p.category,
      price: price as number | null,
      itemId: typeof p.itemId === "string" ? p.itemId : null,
      embedding: vector,
    },
  };
}

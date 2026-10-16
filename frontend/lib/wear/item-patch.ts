import { EMBEDDING_SIZE } from "../import/save-input.ts";
import { formatCents, parsePrice } from "./price.ts";

export type ItemPatch = { price?: string | null; embedding?: string | null };

type Result = { ok: true; value: ItemPatch } | { ok: false; error: string };

function isVector(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === EMBEDDING_SIZE &&
    value.every((v) => typeof v === "number" && Number.isFinite(v))
  );
}

// Check the price and embedding fields of PATCH /api/items/[id]. A field left out of the body
// is left out of the patch; null (or a blank price) clears it.
export function parseItemPatch(body: unknown): Result {
  const { price, embedding } = (body ?? {}) as Record<string, unknown>;
  const value: ItemPatch = {};

  if (price !== undefined) {
    if (price === null || (typeof price === "string" && !price.trim())) value.price = null;
    else {
      const cents = typeof price === "string" ? parsePrice(price) : null;
      if (cents === null) return { ok: false, error: "Invalid price" };
      value.price = formatCents(cents);
    }
  }

  if (embedding !== undefined) {
    if (embedding === null) value.embedding = null;
    else if (isVector(embedding)) value.embedding = JSON.stringify(embedding);
    else return { ok: false, error: "Invalid embedding" };
  }

  return { ok: true, value };
}

// A stored embedding column back to a vector; null when missing or not a valid vector.
export function readEmbedding(text: string | null): number[] | null {
  if (!text) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return isVector(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

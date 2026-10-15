import { clampBox, type Box } from "./geometry.ts";

export const CATEGORIES = ["tops", "bottoms", "shoes", "outerwear", "accessories"] as const;
export type Category = (typeof CATEGORIES)[number];

export type RawDetection = {
  category: Category;
  description: string;
  color: string | null;
  bbox: Box;
};

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

// Turn the model's reply into valid detections. Throws only when the reply isn't JSON at all;
// single bad items are dropped.
export function parseDetections(text: string): RawDetection[] {
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
  const data = JSON.parse(cleaned) as { items?: unknown };
  if (!Array.isArray(data.items)) return [];

  const out: RawDetection[] = [];
  for (const raw of data.items as Record<string, unknown>[]) {
    if (!raw || typeof raw !== "object") continue;
    const category = String(raw.category ?? "").toLowerCase().trim();
    if (!isCategory(category)) continue;
    const bbox = clampBox(raw.bbox as Box);
    if (!bbox) continue;
    const description =
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : category;
    const color =
      typeof raw.color === "string" && raw.color.trim() ? raw.color.trim().toLowerCase() : null;
    out.push({ category, description, color, bbox });
  }
  return out;
}

import { cosine } from "../import/group.ts";

// Starting value, not measured. Backfilled items embed a background-removed cutout, so their
// scores against photo crops run lower than crop to crop (0.88 in the importer).
export const MATCH_THRESHOLD = 0.85;

export type Crop = { id: string; category: string; embedding?: number[] };
export type ClosetItem = { id: string; category: string; embedding: number[] | null };
export type CropMatch = { cropId: string; itemId: string | null; score: number };

// Match the crops of one photo to closet items. Same category, cosine at or above the
// threshold, and each item at most once per photo: best pairs are taken first, so a crop that
// loses its item to a closer crop falls back to its next best item.
export function matchPhoto(crops: Crop[], closet: ClosetItem[], threshold = MATCH_THRESHOLD): CropMatch[] {
  const pairs: { crop: string; item: string; score: number }[] = [];
  for (const c of crops) {
    if (!c.embedding) continue;
    for (const item of closet) {
      if (!item.embedding || item.category !== c.category) continue;
      const score = cosine(c.embedding, item.embedding);
      if (score >= threshold) pairs.push({ crop: c.id, item: item.id, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const taken = new Set<string>();
  const result = new Map<string, CropMatch>(crops.map((c) => [c.id, { cropId: c.id, itemId: null, score: 0 }]));
  for (const p of pairs) {
    const match = result.get(p.crop)!;
    if (match.itemId || taken.has(p.item)) continue;
    match.itemId = p.item;
    match.score = p.score;
    taken.add(p.item);
  }
  return [...result.values()];
}

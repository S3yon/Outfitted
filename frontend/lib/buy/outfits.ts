const CORE = ["tops", "bottoms", "shoes"] as const;

export type OutfitItem = { id: string; category: string; wears: number };
export type Unlocks = { before: number; after: number; added: number; missing: string[] };

const inCategory = (items: OutfitItem[], category: string) => items.filter((i) => i.category === category);

// An outfit is a top, a bottom and shoes; outerwear and accessories go over one.
export function countOutfits(items: OutfitItem[]): number {
  return CORE.reduce((n, c) => n * inCategory(items, c).length, 1);
}

// How many outfits a new item of this category adds to the closet, and which core categories
// the closet lacks for it to make any (a new top with no shoes owned makes none).
export function unlocks(items: OutfitItem[], category: string): Unlocks {
  const before = countOutfits(items);
  const others = CORE.filter((c) => c !== category);
  const missing = others.filter((c) => inCategory(items, c).length === 0);
  if (!(CORE as readonly string[]).includes(category)) {
    return { before, after: before, added: before, missing };
  }
  const added = others.reduce((n, c) => n * inCategory(items, c).length, 1);
  return { before, after: before + added, added: missing.length ? 0 : added, missing };
}

// Up to n outfits the item would join, as the ids of the owned pieces it pairs with, least
// worn pieces first so the examples lean on what sits idle.
export function examples(items: OutfitItem[], category: string, n: number): string[][] {
  const parts = CORE.filter((c) => c !== category).map((c) =>
    inCategory(items, c)
      .slice()
      .sort((a, b) => a.wears - b.wears)
      .slice(0, 6) // enough to rank; a big closet would otherwise make every combination
      .map((i) => i.id),
  );
  let combos: string[][] = [[]];
  for (const ids of parts) combos = combos.flatMap((combo) => ids.map((id) => [...combo, id]));
  const rank = new Map(items.map((i) => [i.id, i.wears]));
  const total = (combo: string[]) => combo.reduce((s, id) => s + (rank.get(id) ?? 0), 0);
  return combos
    .filter((c) => c.length === parts.length && c.length > 0)
    .sort((a, b) => total(a) - total(b))
    .slice(0, n);
}

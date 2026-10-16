import type { ClosetEntry } from "./closet.ts";
import type { Warmth } from "./weather.ts";

const BASE = ["tops", "bottoms", "shoes"];
const LAYER: Warmth[] = ["cold", "cool"];

// A plain outfit for a day the model left empty: the most idle item in each category, skipping
// items already used this week while any other item in that category is left.
export function pickOutfit(closet: ClosetEntry[], warmth: Warmth | null, used: Set<string>): string[] {
  const categories = warmth && LAYER.includes(warmth) ? [...BASE, "outerwear"] : BASE;
  const picks: string[] = [];
  for (const category of categories) {
    const options = closet
      .filter((c) => c.category === category)
      .sort((a, b) => b.daysIdle - a.daysIdle);
    const pick = options.find((c) => !used.has(c.id)) ?? options[0];
    if (pick) picks.push(pick.id);
  }
  return picks;
}
